from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.therapist import Therapist
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.user import User
from app.schemas import TherapistCreate, TherapistRead

router = APIRouter(prefix="/therapists")


@router.get("", response_model=list[TherapistRead])
def list_therapists(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    therapists = db.query(Therapist).order_by(Therapist.id.asc()).all()
    return [
        {
            "id": therapist.id,
            "name": therapist.name,
            "specialty": therapist.specialty,
            "working_days": therapist.working_days,
            "start_time": therapist.start_time,
            "end_time": therapist.end_time,
            "slot_duration": therapist.slot_duration,
            "is_active": therapist.is_active,
            "notes": therapist.notes,
        }
        for therapist in therapists
    ]


@router.post("", response_model=TherapistRead, status_code=status.HTTP_201_CREATED)
def create_therapist(payload: TherapistCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles("admin"))):
    therapist = Therapist(**payload.model_dump())
    db.add(therapist)
    db.commit()
    db.refresh(therapist)
    return {
        "id": therapist.id,
        "name": therapist.name,
        "specialty": therapist.specialty,
        "working_days": therapist.working_days,
        "start_time": therapist.start_time,
        "end_time": therapist.end_time,
        "slot_duration": therapist.slot_duration,
        "is_active": therapist.is_active,
        "notes": therapist.notes,
    }


@router.put("/{therapist_id}", response_model=TherapistRead)
def update_therapist(therapist_id: int, payload: TherapistCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles("admin"))):
    therapist = db.query(Therapist).filter(Therapist.id == therapist_id).first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")
    for field, value in payload.model_dump().items():
        setattr(therapist, field, value)
    db.commit()
    db.refresh(therapist)
    return {
        "id": therapist.id,
        "name": therapist.name,
        "specialty": therapist.specialty,
        "working_days": therapist.working_days,
        "start_time": therapist.start_time,
        "end_time": therapist.end_time,
        "slot_duration": therapist.slot_duration,
        "is_active": therapist.is_active,
        "notes": therapist.notes,
    }


@router.delete("/{therapist_id}")
def delete_therapist(therapist_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_roles("admin"))):
    therapist = db.query(Therapist).filter(Therapist.id == therapist_id).first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")
    if db.query(Appointment).filter(Appointment.therapist_id == therapist.id).first() or db.query(Patient).filter(Patient.assigned_therapist_id == therapist.id).first():
        raise HTTPException(status_code=409, detail="Therapist has related records and cannot be deleted")
    db.delete(therapist)
    db.commit()
    return {"message": "Therapist removed"}
