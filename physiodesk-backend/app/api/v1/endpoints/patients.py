from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.patient import Patient
from app.models.therapist import Therapist
from app.models.user import User
from app.schemas import PatientCreate, PatientRead, PatientUpdate

router = APIRouter(prefix="/patients")


@router.get("", response_model=list[PatientRead])
def list_patients(
    search: str | None = Query(default=None),
    therapist_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Patient)
    if search:
        query = query.filter((Patient.name.ilike(f"%{search}%")) | (Patient.phone.ilike(f"%{search}%")))
    if therapist_id:
        query = query.filter(Patient.assigned_therapist_id == therapist_id)
    if status:
        query = query.filter(Patient.status == status)
    patients = query.order_by(Patient.id.desc()).all()
    return [
        {
            "id": patient.id,
            "name": patient.name,
            "phone": patient.phone,
            "age": patient.age,
            "gender": patient.gender,
            "address": patient.address,
            "condition": patient.condition,
            "assigned_therapist_id": patient.assigned_therapist_id,
            "package": patient.package,
            "status": patient.status,
            "created_at": patient.created_at,
            "therapist_name": patient.therapist.name if patient.therapist else None,
        }
        for patient in patients
    ]


@router.get("/{patient_id}", response_model=dict)
def get_patient(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "phone": patient.phone,
            "age": patient.age,
            "gender": patient.gender,
            "address": patient.address,
            "condition": patient.condition,
            "assigned_therapist_id": patient.assigned_therapist_id,
            "package": patient.package,
            "status": patient.status,
            "created_at": patient.created_at,
            "therapist_name": patient.therapist.name if patient.therapist else None,
        },
        "session_history": [],
        "billing_history": [],
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
    patient.created_at = payload.created_at or __import__("datetime").date.today()
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return {
        "id": patient.id,
        "name": patient.name,
        "phone": patient.phone,
        "age": patient.age,
        "gender": patient.gender,
        "address": patient.address,
        "condition": patient.condition,
        "assigned_therapist_id": patient.assigned_therapist_id,
        "package": patient.package,
        "status": patient.status,
        "created_at": patient.created_at,
        "therapist_name": therapist.name if payload.assigned_therapist_id else None,
    }


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
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    patient.created_at = payload.created_at or patient.created_at
    db.commit()
    db.refresh(patient)
    return {
        "id": patient.id,
        "name": patient.name,
        "phone": patient.phone,
        "age": patient.age,
        "gender": patient.gender,
        "address": patient.address,
        "condition": patient.condition,
        "assigned_therapist_id": patient.assigned_therapist_id,
        "package": patient.package,
        "status": patient.status,
        "created_at": patient.created_at,
        "therapist_name": patient.therapist.name if patient.therapist else None,
    }


@router.delete("/{patient_id}")
def delete_patient(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("admin"))):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return {"message": "Patient deleted successfully"}
