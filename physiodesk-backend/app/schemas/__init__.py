from __future__ import annotations

import re
from datetime import date, datetime
from typing import Literal

from pydantic import (BaseModel, Field, field_validator, model_validator,ConfigDict, EmailStr)


class TokenPayload(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=80,
    )

    email: EmailStr

    first_name: str = Field(
        min_length=1,
        max_length=80,
    )

    middle_name: str | None = Field(
        default=None,
        max_length=80,
    )

    last_name: str = Field(
        min_length=1,
        max_length=80,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    role: Literal["admin", "staff"] = "staff"

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        value = value.strip()

        if " " in value:
            raise ValueError("Username cannot contain spaces")

        return value.lower()

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_required_names(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("First and last names cannot be empty")
        return value.strip()

    @field_validator("middle_name")
    @classmethod
    def validate_middle_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        
        value = value.strip()
        # Converts blank or empty strings ("") to None automatically
        return value if value else None

class UserUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    middle_name: str | None = Field(default=None, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    email: EmailStr | None = None
    role: Literal["admin", "staff"] | None = None
    is_active: bool | None = None
    notes: str | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_optional_names(cls, value: str | None) -> str | None:
        if value is not None:
            if not value.strip():
                raise ValueError("Names cannot be empty")
            return value.strip()
        return value

    @field_validator("middle_name")
    @classmethod
    def validate_middle_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value if value else None


class AdminPasswordReset(BaseModel):
    new_password: str = Field(
        min_length=8,
        max_length=128,
    )


class UserPasswordChange(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(
        min_length=8,
        max_length=128,
    )
    
class UserPublic(BaseModel):
    id: int
    username: str
    email: EmailStr
    first_name: str
    middle_name: str | None = None
    last_name: str
    full_name: str | None = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class PatientCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    date_of_birth: date | None = None
    gender: str = Field(min_length=1, max_length=30)
    phone: str = Field(min_length=7, max_length=20)
    email: str | None = None
    address: str | None = None
    blood_group: str | None = Field(default=None, max_length=10)
    allergies: str | None = None
    medical_notes: str | None = None
    assigned_therapist_id: int | None = None
    status: Literal["Active", "Completed", "On hold"] = "Active"
    is_active: bool = True

class PatientUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    date_of_birth: date | None = None
    gender: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    blood_group: str | None = None
    allergies: str | None = None
    medical_notes: str | None = None
    assigned_therapist_id: int | None = None
    status: Literal["Active", "Completed", "On hold"] | None = None
    is_active: bool | None = None

class PatientRead(PatientCreate):
    id: int
    name: str | None = None
    age: int | None = None
    therapist_name: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TherapistCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    specialty: str = Field(min_length=1, max_length=120)

    license_number: str | None = None

    phone: str | None = None
    email: str | None = None

    working_days: str = "Mon,Tue,Wed,Thu,Fri"

    start_time: str = "09:00"
    end_time: str = "17:00"

    slot_duration: int = 30

    is_active: bool = True
    notes: str | None = None

    @field_validator("slot_duration")
    @classmethod
    def validate_slot_duration(cls, value: int) -> int:
        if value <= 0:
            raise ValueError(
                "Slot duration must be greater than zero"
            )

        if value > 480:
            raise ValueError(
                "Slot duration cannot exceed 8 hours"
            )

        return value

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        if not re.fullmatch(r"\d{2}:\d{2}", value):
            raise ValueError("Time must use HH:MM format")

        try:
            datetime.strptime(value, "%H:%M")
        except ValueError as exc:
            raise ValueError("Time must use HH:MM format") from exc

        return value

    @model_validator(mode="after")
    def validate_working_hours(self):
        start = datetime.strptime(
            self.start_time,
            "%H:%M",
        )

        end = datetime.strptime(
            self.end_time,
            "%H:%M",
        )

        if start >= end:
            raise ValueError(
                "End time must be after start time"
            )

        return self

class TherapistUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    specialty: str | None = Field(default=None, min_length=1, max_length=120)
    license_number: str | None = None
    phone: str | None = None
    email: str | None = None
    working_days: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    slot_duration: int | None = None
    is_active: bool | None = None
    notes: str | None = None

    # (Keep your existing validators, or apply them optionally if fields are provided)
    
class TherapistRead(TherapistCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class AppointmentCreate(BaseModel):
    patient_id: int
    therapist_id: int

    appointment_date: date

    start_time: str
    end_time: str

    reason: str | None = None
    notes: str | None = None

    status: Literal[
        "Scheduled",
        "Confirmed",
        "Completed",
        "Cancelled",
        "No-show",
    ] = "Scheduled"

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        if not re.fullmatch(r"\d{2}:\d{2}", value):
            raise ValueError("Time must use HH:MM format")

        try:
            datetime.strptime(value, "%H:%M")
        except ValueError as exc:
            raise ValueError("Time must use HH:MM format") from exc

        return value

    @model_validator(mode="after")
    def validate_time_range(self):
        start = datetime.strptime(
            self.start_time,
            "%H:%M",
        )

        end = datetime.strptime(
            self.end_time,
            "%H:%M",
        )

        if start >= end:
            raise ValueError(
                "End time must be after start time"
            )

        return self

class AppointmentUpdate(BaseModel):
    patient_id: int | None = None
    therapist_id: int | None = None
    appointment_date: date | None = None
    start_time: str | None = None
    end_time: str | None = None
    reason: str | None = None
    notes: str | None = None
    status: Literal[
        "Scheduled",
        "Confirmed",
        "Completed",
        "Cancelled",
        "No-show",
    ] | None = None

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, value: str | None) -> str | None:
        if value is None:
            return value

        if not re.fullmatch(r"\d{2}:\d{2}", value):
            raise ValueError("Time must use HH:MM format")

        try:
            datetime.strptime(value, "%H:%M")
        except ValueError as exc:
            raise ValueError("Time must use HH:MM format") from exc
        return value

class AppointmentRead(BaseModel):
    id: int

    patient_id: int
    therapist_id: int

    appointment_date: date

    start_time: str
    end_time: str

    reason: str | None = None
    notes: str | None = None

    status: str

    patient_name: str | None = None
    therapist_name: str | None = None

    created_by: int | None = None
    created_at: datetime


class InvoiceCreate(BaseModel):
    patient_id: int
    appointment_id: int | None = None
    invoice_number: str | None = None
    invoice_date: date
    subtotal: float
    discount: float = 0.0
    tax: float = 0.0
    total: float | None = None
    status: Literal["Paid", "Due", "Void", "Pending"] = "Due"
    notes: str | None = None

    @field_validator("subtotal", "discount", "tax")
    @classmethod
    def validate_money(cls, value: float) -> float:
        if value < 0:
            raise ValueError("Monetary values cannot be negative")
        return value


class InvoiceUpdate(BaseModel):
    patient_id: int | None = None
    appointment_id: int | None = None
    invoice_date: date | None = None
    subtotal: float | None = None
    discount: float | None = None
    tax: float | None = None
    total: float | None = None
    status: Literal["Paid", "Due", "Void", "Pending"] | None = None
    notes: str | None = None


class InvoiceRead(BaseModel):
    id: int
    invoice_number: str
    patient_id: int
    appointment_id: int | None = None
    invoice_date: date
    subtotal: float
    discount: float = 0.0
    tax: float = 0.0
    total: float
    status: str
    notes: str | None = None
    patient_name: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class DashboardStats(BaseModel):
    patients_seen_today: int
    therapists_on_duty_today: int
    revenue_collected_today: float
    open_slots_remaining_today: int
    total_patients: int = 0
    pending_requests: int = 0
    completed_count: int = 0
    cancelled_count: int = 0
    recent_patients: list[PatientRead] = Field(default_factory=list)
    therapist_capacity: list[dict] = Field(default_factory=list)



class PatientDetail(BaseModel):
    patient: PatientRead
    session_history: list[AppointmentRead] = Field(default_factory=list)
    billing_history: list[InvoiceRead] = Field(default_factory=list)
