from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.scheduling import ensure_no_overlap, validate_appointment_schedule
from app.core.security import get_current_user, require_roles
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.therapist import Therapist
from app.models.user import User
from app.schemas import AppointmentCreate, AppointmentRead

router = APIRouter(prefix="/appointments")


@router.get("", response_model=list[AppointmentRead])
def list_appointments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    appointments = db.query(Appointment).order_by(Appointment.appointment_date.desc(), Appointment.start_time.asc()).all()
    return [
        {
            "id": item.id,
            "patient_id": item.patient_id,
            "therapist_id": item.therapist_id,
            "appointment_date": item.appointment_date,
            "start_time": item.start_time,
            "end_time": item.end_time,
            "status": item.status,
            "payment_method": item.payment_method,
            "notes": item.notes,
            "patient_name": item.patient.name,
            "therapist_name": item.therapist.name,
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
    ensure_no_overlap(db.query(Appointment), payload.therapist_id, payload.appointment_date, payload.start_time, payload.end_time)
    item = Appointment(**payload.model_dump())
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
        "payment_method": item.payment_method,
        "notes": item.notes,
        "patient_name": patient.name,
        "therapist_name": therapist.name,
        "created_at": item.created_at,
    }


@router.put("/{appointment_id}", response_model=AppointmentRead)
def update_appointment(appointment_id: int, payload: AppointmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    therapist = db.query(Therapist).filter(Therapist.id == payload.therapist_id).first()
    if not patient or not therapist:
        raise HTTPException(status_code=400, detail="Patient or therapist not found")
    if not therapist.is_active and payload.status != "Cancelled":
        raise HTTPException(status_code=400, detail="Therapist is inactive")
    validate_appointment_schedule(therapist, payload.appointment_date, payload.start_time, payload.end_time)
    ensure_no_overlap(
        db.query(Appointment),
        payload.therapist_id,
        payload.appointment_date,
        payload.start_time,
        payload.end_time,
        appointment.id,
    )
    for field, value in payload.model_dump().items():
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
        "payment_method": appointment.payment_method,
        "notes": appointment.notes,
        "patient_name": appointment.patient.name,
        "therapist_name": appointment.therapist.name,
        "created_at": appointment.created_at,
    }


@router.delete("/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(appointment)
    db.commit()
    return {"message": "Appointment removed"}
