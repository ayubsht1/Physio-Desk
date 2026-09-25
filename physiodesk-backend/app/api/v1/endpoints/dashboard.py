from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.scheduling import DAY_NAMES, parse_time
from app.core.security import get_current_user
from app.models.appointment import Appointment
from app.models.invoice import Invoice
from app.models.patient import Patient
from app.models.therapist import Therapist
from app.models.user import User
from app.schemas import DashboardStats, PatientRead

router = APIRouter(prefix="/dashboard")


@router.get("", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()

    patients_seen_today = (
        db.query(Appointment)
        .filter(Appointment.appointment_date == today, Appointment.status == "Completed", Appointment.is_deleted == False)
        .count()
    )

    today_name = DAY_NAMES[today.weekday()]
    therapists = db.query(Therapist).filter(Therapist.is_active.is_(True)).all()
    therapists_on_duty_today = sum(today_name in {day.strip() for day in therapist.working_days.split(",")} for therapist in therapists)

    revenue_collected_today = float(
        db.query(func.coalesce(func.sum(Invoice.total), 0))
        .filter(Invoice.invoice_date == today, Invoice.status == "Paid")
        .scalar() or 0
    )

    total_slots = 0
    for therapist in therapists:
        if today_name in {day.strip() for day in therapist.working_days.split(",")}:
            minutes = (parse_time(therapist.end_time) - parse_time(therapist.start_time)).seconds // 60
            total_slots += minutes // therapist.slot_duration
    booked_slots = db.query(Appointment).filter(
        Appointment.appointment_date == today,
        Appointment.status != "Cancelled",
        Appointment.is_deleted == False,
    ).count()
    open_slots_remaining_today = max(total_slots - booked_slots, 0)

    recent_patients = db.query(Patient).filter(Patient.is_active == True).order_by(Patient.created_at.desc()).limit(5).all()
    recent_payload = []
    for patient in recent_patients:
        p_data = PatientRead.model_validate(patient)
        p_data.therapist_name = patient.therapist.name if patient.therapist else None
        p_data.name = patient.name
        p_data.age = patient.age
        recent_payload.append(p_data)

    therapist_capacity = []
    for therapist in therapists:
        if today_name not in {day.strip() for day in therapist.working_days.split(",")}:
            continue
        minutes = (parse_time(therapist.end_time) - parse_time(therapist.start_time)).seconds // 60
        capacity = minutes // therapist.slot_duration
        day_bookings = db.query(Appointment).filter(
            Appointment.therapist_id == therapist.id,
            Appointment.appointment_date == today,
            Appointment.status != "Cancelled",
            Appointment.is_deleted == False,
        ).count()
        therapist_capacity.append({
            "therapist_name": therapist.name,
            "specialty": therapist.specialty,
            "booked": day_bookings,
            "free": max(capacity - day_bookings, 0),
        })

    total_patients = db.query(Patient).filter(Patient.is_active == True).count()
    pending_requests = db.query(Appointment).filter(Appointment.is_deleted == False, Appointment.status.in_(["Scheduled", "Booked"])).count()
    completed_count = db.query(Appointment).filter(Appointment.is_deleted == False, Appointment.status == "Completed").count()
    cancelled_count = db.query(Appointment).filter(Appointment.is_deleted == False, Appointment.status == "Cancelled").count()

    return {
        "patients_seen_today": patients_seen_today,
        "therapists_on_duty_today": therapists_on_duty_today,
        "revenue_collected_today": revenue_collected_today,
        "open_slots_remaining_today": open_slots_remaining_today,
        "total_patients": total_patients,
        "pending_requests": pending_requests,
        "completed_count": completed_count,
        "cancelled_count": cancelled_count,
        "recent_patients": recent_payload,
        "therapist_capacity": therapist_capacity,
    }
