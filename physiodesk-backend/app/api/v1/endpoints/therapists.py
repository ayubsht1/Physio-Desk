from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.therapist import Therapist
from app.models.service import Service
from app.models.user import User
from app.schemas import TherapistCreate, TherapistRead

router = APIRouter(prefix="/therapists", tags=["Therapists"])


def set_therapist_services(therapist: Therapist, service_ids: list[int], db: Session) -> None:
    if not service_ids:
        therapist.services = []
        return
    services = db.query(Service).filter(
        Service.id.in_(service_ids),
        Service.is_active == True,
        Service.is_deleted == False,
    ).all()
    if len(services) != len(set(service_ids)):
        raise HTTPException(status_code=400, detail="One or more services were not found or are inactive")
    therapist.services = services


@router.get("", response_model=list[TherapistRead])
def list_therapists(
    include_inactive: bool = Query(default=True, description="Filter to include or exclude deactivated therapists"),
    db: Session = Depends(get_db), 
    # current_user: User = Depends(get_current_user)
):
    """
    List all therapists. Admins or staff can view active or all (including inactive) therapists.
    """
    query = db.query(Therapist)
    if not include_inactive:
        query = query.filter(Therapist.is_active == True)

    therapists = query.order_by(Therapist.id.asc()).all()
    
    return [
        {
            "id": t.id,
            "name": t.name,
            "specialty": t.specialty,
            "license_number": t.license_number,
            "phone": t.phone,
            "email": t.email,
            "working_days": t.working_days,
            "start_time": t.start_time,
            "end_time": t.end_time,
            "slot_duration": t.slot_duration,
            "is_active": t.is_active,
            "notes": t.notes,
            "service_ids": [service.id for service in t.services],
        }
        for t in therapists
    ]


@router.post("", response_model=TherapistRead, status_code=status.HTTP_201_CREATED)
def create_therapist(
    payload: TherapistCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_roles("admin"))
):
    therapist = Therapist(**payload.model_dump(exclude={"service_ids"}))
    service_ids = payload.service_ids
    set_therapist_services(therapist, service_ids, db)
    db.add(therapist)
    db.commit()
    db.refresh(therapist)
    
    return {
        "id": therapist.id,
        "name": therapist.name,
        "specialty": therapist.specialty,
        "license_number": therapist.license_number,
        "phone": therapist.phone,
        "email": therapist.email,
        "working_days": therapist.working_days,
        "start_time": therapist.start_time,
        "end_time": therapist.end_time,
        "slot_duration": therapist.slot_duration,
        "is_active": therapist.is_active,
        "notes": therapist.notes,
        "service_ids": [service.id for service in therapist.services],
    }


@router.put("/{therapist_id}", response_model=TherapistRead)
def update_therapist(
    therapist_id: int, 
    payload: TherapistCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_roles("admin"))
):
    therapist = db.query(Therapist).filter(Therapist.id == therapist_id).first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")

    update_data = payload.model_dump(exclude={"service_ids"})
    for field, value in update_data.items():
        setattr(therapist, field, value)
    set_therapist_services(therapist, payload.service_ids, db)

    db.commit()
    db.refresh(therapist)
    
    return {
        "id": therapist.id,
        "name": therapist.name,
        "specialty": therapist.specialty,
        "license_number": therapist.license_number,
        "phone": therapist.phone,
        "email": therapist.email,
        "working_days": therapist.working_days,
        "start_time": therapist.start_time,
        "end_time": therapist.end_time,
        "slot_duration": therapist.slot_duration,
        "is_active": therapist.is_active,
        "notes": therapist.notes,
        "service_ids": [service.id for service in therapist.services],
    }


@router.patch("/{therapist_id}/status", response_model=TherapistRead)
def toggle_therapist_status(
    therapist_id: int, 
    is_active: bool = Query(..., description="Set active status to true or false"),
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_roles("admin"))
):
    """
    Soft-delete or reactivate a therapist by updating their is_active flag.
    Preserves all historical appointments, patient relations, and consultation notes.
    """
    therapist = db.query(Therapist).filter(Therapist.id == therapist_id).first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")

    therapist.is_active = is_active
    db.commit()
    db.refresh(therapist)

    return {
        "id": therapist.id,
        "name": therapist.name,
        "specialty": therapist.specialty,
        "license_number": therapist.license_number,
        "phone": therapist.phone,
        "email": therapist.email,
        "working_days": therapist.working_days,
        "start_time": therapist.start_time,
        "end_time": therapist.end_time,
        "slot_duration": therapist.slot_duration,
        "is_active": therapist.is_active,
        "notes": therapist.notes,
        "service_ids": [service.id for service in therapist.services],
    }