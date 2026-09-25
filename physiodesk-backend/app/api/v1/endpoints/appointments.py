from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.scheduling import DAY_NAMES, ensure_no_overlap, parse_time, validate_appointment_schedule
from app.core.security import get_current_user, require_roles, get_current_user_optional
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.service import Service
from app.models.therapist import Therapist
from app.models.user import User
from app.schemas import AppointmentCreate, AppointmentRead, AppointmentUpdate

router = APIRouter(prefix="/appointments", tags=["Appointments"])


def format_appointment(item: Appointment) -> dict:
    return {
        "id": item.id,
        "patient_id": item.patient_id,
        "therapist_id": item.therapist_id,
        "service_id": item.service_id,
        "appointment_date": item.appointment_date,
        "start_time": item.start_time,
        "end_time": item.end_time,
        "status": item.status,
        "reason": item.reason,
        "notes": item.notes,
        "patient_name": item.patient.name if item.patient else None,
        "therapist_name": item.therapist.name if item.therapist else None,
        "created_by": item.created_by,
        "created_at": item.created_at,
    }


@router.get("", response_model=list[AppointmentRead])
def list_appointments(
    date_filter: date | None = Query(default=None, alias="date"),
    therapist_id: int | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user),
):
    query = db.query(Appointment).filter(Appointment.is_deleted == False)

    if date_filter:
        query = query.filter(Appointment.appointment_date == date_filter)
    if therapist_id:
        query = query.filter(Appointment.therapist_id == therapist_id)
    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    appointments = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.asc()).all()
    return [format_appointment(item) for item in appointments]


@router.get("/available-slots")
def get_available_slots(
    therapist_id: int = Query(...),
    date_val: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
):
    therapist = db.query(Therapist).filter(Therapist.id == therapist_id, Therapist.is_active == True).first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found or inactive")

    # Check if therapist works on this day
    day_name = DAY_NAMES[date_val.weekday()]
    allowed_days = {d.strip() for d in therapist.working_days.split(",") if d.strip()}
    if day_name not in allowed_days:
        return {"therapist_id": therapist_id, "date": str(date_val), "slots": []}

    # Fetch existing booked appointments for the day
    existing = db.query(Appointment).filter(
        Appointment.therapist_id == therapist_id,
        Appointment.appointment_date == date_val,
        Appointment.status != "Cancelled",
        Appointment.is_deleted == False,
    ).all()

    existing_ranges = []
    for appt in existing:
        try:
            st = parse_time(appt.start_time)
            et = parse_time(appt.end_time)
            existing_ranges.append((st, et))
        except Exception:
            pass

    # Generate potential slots
    start_dt = parse_time(therapist.start_time)
    end_dt = parse_time(therapist.end_time)
    duration = timedelta(minutes=therapist.slot_duration)

    slots = []
    curr = start_dt
    while curr + duration <= end_dt:
        slot_end = curr + duration
        overlaps = False
        for ex_start, ex_end in existing_ranges:
            if curr < ex_end and slot_end > ex_start:
                overlaps = True
                break
        if not overlaps:
            slots.append(curr.strftime("%H:%M"))
        curr = slot_end

    return {"therapist_id": therapist_id, "date": str(date_val), "slots": slots}


@router.post("", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    therapist = db.query(Therapist).filter(Therapist.id == payload.therapist_id).first()

    if not patient or not therapist:
        raise HTTPException(
            status_code=400,
            detail="Patient or therapist not found",
        )

    if not therapist.is_active:
        raise HTTPException(
            status_code=400,
            detail="Therapist is inactive",
        )

    if payload.service_id is not None:
        service = db.query(Service).filter(
            Service.id == payload.service_id,
            Service.is_active == True,
            Service.is_deleted == False,
        ).first()
        if not service:
            raise HTTPException(status_code=400, detail="Service not found or inactive")
        if service not in therapist.services:
            raise HTTPException(status_code=400, detail="Therapist does not offer this service")

    validate_appointment_schedule(
        therapist,
        payload.appointment_date,
        payload.start_time,
        payload.end_time,
    )

    active_appointments_query = db.query(Appointment).filter(
        Appointment.is_deleted == False
    )

    ensure_no_overlap(
        active_appointments_query,
        payload.therapist_id,
        payload.appointment_date,
        payload.start_time,
        payload.end_time,
    )

    data = payload.model_dump()

    # Only associate the appointment with a user when authenticated
    if current_user:
        data["created_by"] = current_user.id

    data["is_deleted"] = False

    item = Appointment(**data)

    db.add(item)
    db.commit()
    db.refresh(item)

    return format_appointment(item)


@router.put("/{appointment_id}", response_model=AppointmentRead)
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.is_deleted == False).first()
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

    if payload.service_id is not None:
        service = db.query(Service).filter(
            Service.id == payload.service_id,
            Service.is_active == True,
            Service.is_deleted == False,
        ).first()
        if not service:
            raise HTTPException(status_code=400, detail="Service not found or inactive")
        if service not in therapist.services:
            raise HTTPException(status_code=400, detail="Therapist does not offer this service")

    status_val = payload.status if payload.status is not None else appointment.status
    if not therapist.is_active and status_val != "Cancelled":
        raise HTTPException(status_code=400, detail="Therapist is inactive")

    validate_appointment_schedule(therapist, target_date, target_start, target_end)

    active_appointments_query = db.query(Appointment).filter(Appointment.is_deleted == False)
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

    return format_appointment(appointment)


@router.delete("/{appointment_id}", status_code=status.HTTP_200_OK)
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.is_deleted = True
    db.commit()
    return {"message": "Appointment soft-deleted successfully"}