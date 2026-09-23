from datetime import date, datetime

from fastapi import HTTPException

from app.models.therapist import Therapist


DAY_NAMES = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")


def parse_time(value: str) -> datetime:
    try:
        return datetime.strptime(value, "%H:%M")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Time must use HH:MM format") from exc


def validate_appointment_schedule(therapist: Therapist, appointment_date: date, start_time: str, end_time: str) -> None:
    start = parse_time(start_time)
    end = parse_time(end_time)
    therapist_start = parse_time(therapist.start_time)
    therapist_end = parse_time(therapist.end_time)

    if start >= end:
        raise HTTPException(status_code=422, detail="Appointment end time must be after start time")
    if DAY_NAMES[appointment_date.weekday()] not in {day.strip() for day in therapist.working_days.split(",") if day.strip()}:
        raise HTTPException(status_code=422, detail="Therapist does not work on this day")
    if start < therapist_start or end > therapist_end:
        raise HTTPException(status_code=422, detail="Appointment is outside the therapist's working hours")


def ensure_no_overlap(query, therapist_id: int, appointment_date: date, start_time: str, end_time: str, appointment_id: int | None = None) -> None:
    from app.models.appointment import Appointment

    start = parse_time(start_time)
    end = parse_time(end_time)
    query = query.filter(
        Appointment.therapist_id == therapist_id,
        Appointment.appointment_date == appointment_date,
        Appointment.status != "Cancelled",
    )
    if appointment_id is not None:
        query = query.filter(Appointment.id != appointment_id)

    for appointment in query.all():
        existing_start = parse_time(appointment.start_time)
        existing_end = parse_time(appointment.end_time)
        if start < existing_end and end > existing_start:
            raise HTTPException(status_code=409, detail="This therapist has an overlapping appointment")