from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.appointment import Appointment
from app.models.invoice import Invoice
from app.models.patient import Patient
from app.models.therapist import Therapist
from app.models.user import User
from app.schemas import DashboardStats

router = APIRouter(prefix="/dashboard")


@router.get("", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()

    patients_seen_today = (
        db.query(Appointment)
        .filter(Appointment.appointment_date == today)
        .count()
    )

    therapists_on_duty_today = db.query(Therapist).filter(Therapist.is_active.is_(True)).count()

    revenue_collected_today = float(
        db.query(func.coalesce(func.sum(Invoice.amount), 0))
        .filter(Invoice.invoice_date == today, Invoice.status == "Paid")
        .scalar() or 0
    )

    total_slots = db.query(Therapist).filter(Therapist.is_active.is_(True)).count() * 8
    booked_slots = db.query(Appointment).filter(Appointment.appointment_date == today).count()
    open_slots_remaining_today = max(total_slots - booked_slots, 0)

    recent_patients = db.query(Patient).order_by(Patient.created_at.desc()).limit(5).all()
    recent_payload = [
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
        for patient in recent_patients
    ]

    therapist_capacity = []
    therapists = db.query(Therapist).filter(Therapist.is_active.is_(True)).all()
    for therapist in therapists:
        day_bookings = db.query(Appointment).filter(Appointment.therapist_id == therapist.id, Appointment.appointment_date == today).count()
        therapist_capacity.append({
            "therapist_name": therapist.name,
            "specialty": therapist.specialty,
            "booked": day_bookings,
            "free": max(8 - day_bookings, 0),
        })

    return {
        "patients_seen_today": patients_seen_today,
        "therapists_on_duty_today": therapists_on_duty_today,
        "revenue_collected_today": revenue_collected_today,
        "open_slots_remaining_today": open_slots_remaining_today,
        "recent_patients": recent_payload,
        "therapist_capacity": therapist_capacity,
    }
