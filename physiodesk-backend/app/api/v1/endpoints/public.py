import random
import re
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.scheduling import DAY_NAMES, parse_time, validate_appointment_schedule, ensure_no_overlap
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.service import Service
from app.models.therapist import Therapist

router = APIRouter(prefix="/public", tags=["Public Portal"])


class PublicTherapist(BaseModel):
    id: int
    name: str
    specialty: str
    working_days: str
    start_time: str
    end_time: str
    slot_duration: int
    is_active: bool


class PublicAppointmentRequest(BaseModel):
    patient_name: str
    patient_phone: str
    patient_email: str | None = None
    therapist_id: int
    service_id: int | None = None
    appointment_date: date
    start_time: str
    reason: str | None = None
    condition: str | None = None


class PublicAppointmentResponse(BaseModel):
    reference_number: str
    patient_name: str
    therapist_name: str
    specialty: str
    appointment_date: str
    start_time: str
    end_time: str
    status: str
    clinic_phone: str
    clinic_address: str


class PublicLookupResponse(BaseModel):
    reference_number: str
    patient_masked_name: str
    therapist_name: str
    therapist_specialty: str
    appointment_date: str
    start_time: str
    end_time: str
    status: str
    appointment_type: str
    clinic_name: str
    clinic_phone: str
    clinic_address: str
    check_in_instructions: str


CLINIC_NAME = "Physio Desk Rehabilitation & Performance Clinic"
CLINIC_PHONE = "+1 (555) 019-2834"
CLINIC_ADDRESS = "Suite 400, Medical Plaza, 100 Health Blvd"


@router.get("/therapists", response_model=list[PublicTherapist])
def list_public_therapists(db: Session = Depends(get_db)):
    therapists = db.query(Therapist).filter(Therapist.is_active == True).order_by(Therapist.name.asc()).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "specialty": t.specialty,
            "working_days": t.working_days,
            "start_time": t.start_time,
            "end_time": t.end_time,
            "slot_duration": t.slot_duration,
            "is_active": t.is_active,
        }
        for t in therapists
    ]


@router.get("/available-slots")
def get_public_available_slots(
    therapist_id: int = Query(...),
    date_val: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
):
    therapist = db.query(Therapist).filter(Therapist.id == therapist_id, Therapist.is_active == True).first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found or inactive")

    day_name = DAY_NAMES[date_val.weekday()]
    allowed_days = {d.strip() for d in therapist.working_days.split(",") if d.strip()}
    if day_name not in allowed_days:
        return {"therapist_id": therapist_id, "date": str(date_val), "slots": []}

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


@router.post("/appointments", response_model=PublicAppointmentResponse, status_code=status.HTTP_201_CREATED)
def request_public_appointment(payload: PublicAppointmentRequest, db: Session = Depends(get_db)):
    therapist = db.query(Therapist).filter(Therapist.id == payload.therapist_id, Therapist.is_active == True).first()
    if not therapist:
        raise HTTPException(status_code=404, detail="Selected therapist is not found or unavailable")

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

    # Calculate end time based on slot duration
    start_dt = parse_time(payload.start_time)
    end_dt = start_dt + timedelta(minutes=therapist.slot_duration)
    end_time = end_dt.strftime("%H:%M")

    validate_appointment_schedule(therapist, payload.appointment_date, payload.start_time, end_time)

    active_appointments_query = db.query(Appointment).filter(Appointment.is_deleted == False)
    ensure_no_overlap(active_appointments_query, payload.therapist_id, payload.appointment_date, payload.start_time, end_time)

    # Find or create patient
    clean_phone = payload.patient_phone.strip()
    patient = db.query(Patient).filter(Patient.phone == clean_phone).first()

    name_parts = payload.patient_name.strip().split(maxsplit=1)
    first_name = name_parts[0] if name_parts else "Patient"
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    if not patient:
        patient = Patient(
            first_name=first_name,
            last_name=last_name or "Guest",
            phone=clean_phone,
            email=payload.patient_email.strip() if payload.patient_email else None,
            gender="Unspecified",
            assigned_therapist_id=therapist.id,
            status="Active",
            medical_notes=f"Initial complaint: {payload.condition}" if payload.condition else None,
            is_active=True,
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

    ref_number = f"PHY-{random.randint(100000, 999999)}"
    note_text = f"Ref: {ref_number}. "
    if payload.condition:
        note_text += f"Condition: {payload.condition}. "
    if payload.reason:
        note_text += f"Notes: {payload.reason}"

    appointment = Appointment(
        patient_id=patient.id,
        therapist_id=therapist.id,
        service_id=payload.service_id,
        appointment_date=payload.appointment_date,
        start_time=payload.start_time,
        end_time=end_time,
        status="Scheduled",
        reason=payload.reason or payload.condition or "Online consultation",
        notes=note_text.strip(),
        is_deleted=False,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return {
        "reference_number": ref_number,
        "patient_name": patient.name,
        "therapist_name": therapist.name,
        "specialty": therapist.specialty,
        "appointment_date": str(payload.appointment_date),
        "start_time": payload.start_time,
        "end_time": end_time,
        "status": "Scheduled",
        "clinic_phone": CLINIC_PHONE,
        "clinic_address": CLINIC_ADDRESS,
    }


@router.get("/appointments/lookup", response_model=PublicLookupResponse)
def lookup_public_appointment(
    reference: str = Query(...),
    identifier: str = Query(...),
    db: Session = Depends(get_db),
):
    ref = reference.strip().upper()
    ident = identifier.strip().lower()

    # Search in notes or appointment id
    query = db.query(Appointment).filter(Appointment.is_deleted == False)
    appointments = query.all()

    matched_appt = None
    for appt in appointments:
        notes = (appt.notes or "").upper()
        if ref in notes or f"#{appt.id}" == ref or str(appt.id) == ref:
            # Check identifier against patient phone or email
            patient = appt.patient
            if patient:
                p_phone = (patient.phone or "").lower()
                p_email = (patient.email or "").lower()
                if ident in p_phone or ident in p_email or ident == patient.first_name.lower():
                    matched_appt = appt
                    break

    if not matched_appt:
        raise HTTPException(status_code=404, detail="Appointment not found. Please verify your reference number and contact info.")

    patient = matched_appt.patient
    # Mask patient name for privacy: e.g. "J*** D**"
    p_name = patient.name if patient else "Patient"
    words = p_name.split()
    masked_words = [f"{w[0]}{'*' * (len(w) - 1)}" if len(w) > 1 else w for w in words]
    masked_name = " ".join(masked_words)

    therapist = matched_appt.therapist
    return {
        "reference_number": ref,
        "patient_masked_name": masked_name,
        "therapist_name": therapist.name if therapist else "Physiotherapist",
        "therapist_specialty": therapist.specialty if therapist else "Physical Therapy",
        "appointment_date": str(matched_appt.appointment_date),
        "start_time": matched_appt.start_time,
        "end_time": matched_appt.end_time,
        "status": matched_appt.status,
        "appointment_type": matched_appt.reason or "Clinical Assessment",
        "clinic_name": CLINIC_NAME,
        "clinic_phone": CLINIC_PHONE,
        "clinic_address": CLINIC_ADDRESS,
        "check_in_instructions": "Please arrive 10 minutes prior to your appointment time. Bring comfortable athletic wear and any relevant medical imaging reports or prescriptions.",
    }
