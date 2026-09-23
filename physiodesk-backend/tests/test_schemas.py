import pytest
from pydantic import ValidationError

from app.schemas import AppointmentCreate, PatientCreate, TherapistCreate


def test_patient_age_must_be_realistic() -> None:
    with pytest.raises(ValidationError):
        PatientCreate(
            name="Test Patient",
            phone="555-0000",
            age=200,
            gender="Other",
            address="Address",
            condition="Condition",
            package="Package",
        )


def test_therapist_hours_must_be_ordered() -> None:
    with pytest.raises(ValidationError):
        TherapistCreate(name="Test", specialty="General", start_time="17:00", end_time="09:00")


def test_appointment_time_format_is_strict() -> None:
    with pytest.raises(ValidationError):
        AppointmentCreate(
            patient_id=1,
            therapist_id=1,
            appointment_date="2026-09-23",
            start_time="9:00",
            end_time="10:00",
        )