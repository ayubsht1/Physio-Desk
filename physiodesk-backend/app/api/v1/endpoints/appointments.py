from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.scheduling import ensure_no_overlap, validate_appointment_schedule
from app.core.security import get_current_user, require_roles
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.therapist import Therapist
from app.models.user import User
from app.schemas import AppointmentCreate, AppointmentRead, AppointmentUpdate

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.get("", response_model=list[AppointmentRead])
def list_appointments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Filter out soft-deleted appointments
    appointments = (
        db.query(Appointment)
        .filter(Appointment.is_active == True)  # Adjust to Appointment.is_deleted == False if using is_deleted
        .order_by(Appointment.appointment_date.desc(), Appointment.start_time.asc())
        .all()
    )
    return [
        {
            "id": item.id,
            "patient_id": item.patient_id,
            "therapist_id": item.therapist_id,
            "appointment_date": item.appointment_date,
            "start_time": item.start_time,
            "end_time": item.end_time,
            "status": item.status,
            "reason": item.reason,
            "notes": item.notes,
            "patient_name": f"{item.patient.first_name} {item.patient.last_name}" if hasattr(item.patient, 'first_name') else getattr(item.patient, 'name', None),
            "therapist_name": item.therapist.name,
            "created_by": item.created_by,
            "created_at": item.created_at,
        }
        for item in appointments
    ]


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    therapist = db.query(Therapist).filter(Therapist.id == payload.therapist_id).first()
    if not patient or not therapist:
        raise HTTPException(status_code=400, detail="Patient or therapist not found")
    if not therapist.is_active:
        raise HTTPException(status_code=400, detail="Therapist is inactive")
        
    validate_appointment_schedule(therapist, payload.appointment_date, payload.start_time, payload.end_time)
    
    # Exclude soft-deleted appointments from overlap check calculations
    active_appointments_query = db.query(Appointment).filter(Appointment.is_active == True)
    ensure_no_overlap(active_appointments_query, payload.therapist_id, payload.appointment_date, payload.start_time, payload.end_time)
    
    data = payload.model_dump()
    data["created_by"] = current_user.id
    data["is_active"] = True  # Ensure new appointments start active
    
    item = Appointment(**data)
    db.add(item)
    db.commit()
    db.refresh(item)
    
    return {
        "id": item.id,
        "patient_id": item.patient_id,
        "therapist_id": item.therapist_id,
        "appointment_date": item.appointment_date,
        "start_time": item.start_time,
        "end_time": item.end_time,
        "status": item.status,
        "reason": item.reason,
        "notes": item.notes,
        "patient_name": f"{patient.first_name} {patient.last_name}" if hasattr(patient, 'first_name') else getattr(patient, 'name', None),
        "therapist_name": therapist.name,
        "created_by": item.created_by,
        "created_at": item.created_at,
    }


@router.put("/{appointment_id}", response_model=AppointmentRead)
def update_appointment(appointment_id: int, payload: AppointmentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.is_active == True).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    target_patient_id = payload.patient_id if payload.patient_id is not None else appointment.patient_id
    target_therapist_id = payload.therapist_id if payload.therapist_id is not None else appointment.therapist_id
    target_date = payload.appointment_date if payload.appointment_date is not None else appointment.appointment_date
    target_start = payload.start_time if payload.start_time is not None else appointment.start_time
    target_end = payload.end_time if payload.end_time is not None else appointment.end_time

    patient = db.query(Patient).filter(Patient.id == target_patient_id).first()
    therapist = db.query(Therapist).filter(Therapist.id == target_therapist_id).first()
    if not patient or not therapist:
        raise HTTPException(status_code=400, detail="Patient or therapist not found")
        
    status_val = payload.status if payload.status is not None else appointment.status
    if not therapist.is_active and status_val != "Cancelled":
        raise HTTPException(status_code=400, detail="Therapist is inactive")
        
    validate_appointment_schedule(therapist, target_date, target_start, target_end)
    
    active_appointments_query = db.query(Appointment).filter(Appointment.is_active == True)
    ensure_no_overlap(
        active_appointments_query,
        target_therapist_id,
        target_date,
        target_start,
        target_end,
        appointment.id,
    )
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
        
    db.commit()
    db.refresh(appointment)
    
    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "therapist_id": appointment.therapist_id,
        "appointment_date": appointment.appointment_date,
        "start_time": appointment.start_time,
        "end_time": appointment.end_time,
        "status": appointment.status,
        "reason": appointment.reason,
        "notes": appointment.notes,
        "patient_name": f"{appointment.patient.first_name} {appointment.patient.last_name}" if hasattr(appointment.patient, 'first_name') else getattr(appointment.patient, 'name', None),
        "therapist_name": appointment.therapist.name,
        "created_by": appointment.created_by,
        "created_at": appointment.created_at,
    }


@router.delete("/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("admin"))):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Soft delete instead of hard delete
    appointment.is_active = False  # Or appointment.is_deleted = True
    db.commit()
    return {"message": "Appointment soft-deleted successfully"}