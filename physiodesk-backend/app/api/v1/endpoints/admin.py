from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, require_roles
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.therapist import Therapist
from app.models.user import User
from app.schemas import (
    AdminPasswordReset,
    PatientCreate,
    PatientRead,
    PatientUpdate,
    UserCreate,
    UserPublic,
    UserUpdate,
    TherapistCreate,
    TherapistRead,
    TherapistUpdate,
    AppointmentRead,
    AppointmentUpdate,
    AppointmentCreate,
)

# Prefix everything here with /admin
router = APIRouter(prefix="/admin", tags=["Admin"])


# ==================== USER MANAGEMENT ====================

@router.post(
    "/users",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    existing_username = db.query(User).filter(User.username == payload.username).first()
    if existing_username:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        first_name=payload.first_name,
        middle_name=payload.middle_name,
        last_name=payload.last_name,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users", response_model=List[UserPublic])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    return db.query(User).offset(skip).limit(limit).all()


@router.patch("/users/{user_id}", response_model=UserPublic)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_admin.id and payload.is_active is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own admin account.")

    update_data = payload.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] != user.email:
        if db.query(User).filter(User.email == update_data["email"]).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already taken")

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/reset-password", status_code=status.HTTP_200_OK)
def admin_reset_password(
    user_id: int,
    payload: AdminPasswordReset,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return {"message": f"Password for user '{user.username}' has been successfully reset."}


# ==================== PATIENT MANAGEMENT (ADMIN) ====================

@router.post("/patients", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
def admin_create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    """
    Directly create a new patient profile as an admin.
    """
    if payload.assigned_therapist_id:
        therapist = db.query(Therapist).filter(Therapist.id == payload.assigned_therapist_id).first()
        if not therapist:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned therapist not found")

    patient = Patient(**payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)

    patient_data = PatientRead.model_validate(patient)
    patient_data.therapist_name = patient.therapist.name if patient.therapist else None
    return patient_data


@router.get("/patients", response_model=List[PatientRead])
def admin_list_patients(
    skip: int = 0,
    limit: int = 100,
    include_inactive: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    query = db.query(Patient)
    if not include_inactive:
        query = query.filter(Patient.is_active == True)

    patients = query.offset(skip).limit(limit).order_by(Patient.id.desc()).all()
    results = []
    for patient in patients:
        patient_data = PatientRead.model_validate(patient)
        patient_data.therapist_name = patient.therapist.name if patient.therapist else None
        results.append(patient_data)

    return results


@router.patch("/patients/{patient_id}", response_model=PatientRead)
def admin_update_patient(
    patient_id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    if payload.assigned_therapist_id is not None:
        therapist = db.query(Therapist).filter(Therapist.id == payload.assigned_therapist_id).first()
        if not therapist:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned therapist not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    patient_data = PatientRead.model_validate(patient)
    patient_data.therapist_name = patient.therapist.name if patient.therapist else None
    return patient_data


# ==================== THERAPIST MANAGEMENT (ADMIN) ====================

@router.post("/therapists", response_model=TherapistRead, status_code=status.HTTP_201_CREATED)
def admin_create_therapist(
    payload: TherapistCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    """
    Directly create a new therapist profile as an admin.
    """
    therapist = Therapist(**payload.model_dump())
    db.add(therapist)
    db.commit()
    db.refresh(therapist)
    return TherapistRead.model_validate(therapist)


@router.get("/therapists", response_model=List[TherapistRead])
def admin_list_therapists(
    include_inactive: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    query = db.query(Therapist)
    if not include_inactive:
        query = query.filter(Therapist.is_active == True)

    therapists = query.order_by(Therapist.id.desc()).all()
    return [TherapistRead.model_validate(t) for t in therapists]


@router.patch("/therapists/{therapist_id}", response_model=TherapistRead)
def admin_update_therapist(
    therapist_id: int,
    payload: TherapistUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    therapist = db.query(Therapist).filter(Therapist.id == therapist_id).first()
    if not therapist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Therapist not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(therapist, field, value)

    db.commit()
    db.refresh(therapist)
    return TherapistRead.model_validate(therapist)


@router.post("/therapists/reassign-patients", status_code=status.HTTP_200_OK)
def admin_reassign_therapist_patients(
    old_therapist_id: int,
    new_therapist_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    old_therapist = db.query(Therapist).filter(Therapist.id == old_therapist_id).first()
    new_therapist = db.query(Therapist).filter(Therapist.id == new_therapist_id).first()

    if not old_therapist or not new_therapist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both therapists not found")

    if not new_therapist.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot reassign patients to an inactive therapist")

    updated_count = (
        db.query(Patient)
        .filter(Patient.assigned_therapist_id == old_therapist_id)
        .update({Patient.assigned_therapist_id: new_therapist_id}, synchronize_session=False)
    )

    db.commit()
    return {"message": f"Successfully reassigned {updated_count} patients from '{old_therapist.name}' to '{new_therapist.name}'."}


# ==================== APPOINTMENT MANAGEMENT (ADMIN) ====================

@router.delete("/appointments/{appointment_id}", status_code=status.HTTP_200_OK)
def admin_delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Soft delete instead of hard delete
    appointment.is_active = False
    db.commit()
    return {"message": f"Appointment #{appointment_id} soft-deleted by admin."}


@router.post("/appointments", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
def admin_create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    therapist = db.query(Therapist).filter(Therapist.id == payload.therapist_id).first()

    if not patient or not therapist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient or therapist not found")

    data = payload.model_dump()
    data["created_by"] = current_admin.id
    data["is_active"] = True

    appointment = Appointment(**data)
    db.add(appointment)
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
        "patient_name": f"{patient.first_name} {patient.last_name}" if hasattr(patient, 'first_name') else getattr(patient, 'name', None),
        "therapist_name": therapist.name,
        "created_by": appointment.created_by,
        "created_at": appointment.created_at,
    }


@router.get("/appointments", response_model=List[AppointmentRead])
def admin_list_all_appointments(
    status_filter: Optional[str] = Query(None, alias="status"),
    therapist_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    include_inactive: bool = Query(default=False, description="Include soft-deleted appointments"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    query = db.query(Appointment)

    if not include_inactive:
        query = query.filter(Appointment.is_active == True)

    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    if therapist_id:
        query = query.filter(Appointment.therapist_id == therapist_id)
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if from_date:
        query = query.filter(Appointment.appointment_date >= from_date)
    if to_date:
        query = query.filter(Appointment.appointment_date <= to_date)

    appointments = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.asc()).all()

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
            "therapist_name": item.therapist.name if item.therapist else None,
            "created_by": item.created_by,
            "created_at": item.created_at,
        }
        for item in appointments
    ]


@router.patch("/appointments/{appointment_id}/override", response_model=AppointmentRead)
def admin_override_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles("admin")),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

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
        "therapist_name": appointment.therapist.name if appointment.therapist else None,
        "created_by": appointment.created_by,
        "created_at": appointment.created_at,
    }