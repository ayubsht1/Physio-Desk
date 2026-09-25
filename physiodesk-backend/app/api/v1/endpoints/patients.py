from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.appointment import Appointment
from app.models.invoice import Invoice
from app.models.patient import Patient
from app.models.therapist import Therapist
from app.models.user import User
from app.schemas import PatientCreate, PatientDetail, PatientRead, PatientUpdate

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=list[PatientRead])
def list_patients(
    search: str | None = Query(default=None),
    therapist_id: int | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    include_inactive: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Patient)

    # Hide inactive/soft-deleted patients by default
    if not include_inactive:
        query = query.filter(Patient.is_active == True)

    if search:
        query = query.filter(
            (Patient.first_name.ilike(f"%{search}%"))
            | (Patient.last_name.ilike(f"%{search}%"))
            | (Patient.phone.ilike(f"%{search}%"))
        )
    if therapist_id:
        query = query.filter(Patient.assigned_therapist_id == therapist_id)
    if status_filter:
        query = query.filter(Patient.status == status_filter)

    patients = query.order_by(Patient.id.desc()).all()
    
    results = []
    for patient in patients:
        patient_data = PatientRead.model_validate(patient)
        patient_data.therapist_name = patient.therapist.name if patient.therapist else None
        results.append(patient_data)

    return results


@router.get("/{patient_id}", response_model=PatientDetail)
def get_patient(
    patient_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_read = PatientRead.model_validate(patient)
    patient_read.therapist_name = patient.therapist.name if patient.therapist else None

    session_history = [
        {
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "therapist_id": appointment.therapist_id,
            "appointment_date": appointment.appointment_date,
            "start_time": appointment.start_time,
            "end_time": appointment.end_time,
            "status": appointment.status,
            "service_id": appointment.service_id,
            "notes": appointment.notes,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "therapist_name": appointment.therapist.name if appointment.therapist else None,
            "created_at": appointment.created_at,
        }
        for appointment in db.query(Appointment)
        .filter(Appointment.patient_id == patient.id)
        .order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc())
        .all()
    ]

    billing_history = [
        {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "patient_id": invoice.patient_id,
            "appointment_id": invoice.appointment_id,
            "service_id": invoice.service_id,
            "invoice_date": invoice.invoice_date,
            "subtotal": float(invoice.subtotal),
            "tax": float(invoice.tax),
            "total": float(invoice.total),
            "status": invoice.status,
            "discount": float(invoice.discount),
            "notes": invoice.notes,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "created_at": invoice.created_at,
        }
        for invoice in db.query(Invoice)
        .filter(Invoice.patient_id == patient.id)
        .order_by(Invoice.invoice_date.desc())
        .all()
    ]

    return {
        "patient": patient_read,
        "session_history": session_history,
        "billing_history": billing_history,
    }


@router.post("", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.assigned_therapist_id:
        therapist = db.query(Therapist).filter(Therapist.id == payload.assigned_therapist_id).first()
        if not therapist:
            raise HTTPException(status_code=400, detail="Assigned therapist not found")

    patient = Patient(**payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)

    patient_data = PatientRead.model_validate(patient)
    patient_data.therapist_name = patient.therapist.name if patient.therapist else None
    return patient_data


@router.put("/{patient_id}", response_model=PatientRead)
def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "staff")),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if payload.assigned_therapist_id is not None:
        therapist = db.query(Therapist).filter(Therapist.id == payload.assigned_therapist_id).first()
        if not therapist:
            raise HTTPException(status_code=400, detail="Assigned therapist not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    patient_data = PatientRead.model_validate(patient)
    patient_data.therapist_name = patient.therapist.name if patient.therapist else None
    return patient_data


@router.delete("/{patient_id}", status_code=status.HTTP_200_OK)
def delete_patient(
    patient_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_roles("admin"))
):
    """Soft delete a patient by setting is_active to False."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not patient.is_active:
        raise HTTPException(status_code=400, detail="Patient is already deactivated")

    patient.is_active = False
    db.commit()

    return {"message": "Patient deactivated successfully"}