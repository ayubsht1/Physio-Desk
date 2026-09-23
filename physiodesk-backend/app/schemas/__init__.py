from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class TokenPayload(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str = "staff"


class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: Literal["admin", "staff"] = "staff"


class UserPublic(UserBase):
    id: int


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class PatientCreate(BaseModel):
    name: str
    phone: str
    age: int
    gender: str
    address: str
    condition: str
    assigned_therapist_id: int | None = None
    package: str
    status: Literal["Active", "Completed", "On hold"] = "Active"
    created_at: date | None = None

    @field_validator("age")
    @classmethod
    def validate_age(cls, value: int) -> int:
        if not 0 <= value <= 130:
            raise ValueError("Age must be between 0 and 130")
        return value


class PatientUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    age: int | None = None
    gender: str | None = None
    address: str | None = None
    condition: str | None = None
    assigned_therapist_id: int | None = None
    package: str | None = None
    status: Literal["Active", "Completed", "On hold"] | None = None
    created_at: date | None = None

    @field_validator("age")
    @classmethod
    def validate_age(cls, value: int | None) -> int | None:
        if value is not None and not 0 <= value <= 130:
            raise ValueError("Age must be between 0 and 130")
        return value


class PatientRead(PatientCreate):
    id: int
    therapist_name: str | None = None


class TherapistCreate(BaseModel):
    name: str
    specialty: str
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
            raise ValueError("Slot duration must be greater than zero")
        return value

    @model_validator(mode="after")
    def validate_working_hours(self):
        from datetime import datetime

        try:
            start = datetime.strptime(self.start_time, "%H:%M")
            end = datetime.strptime(self.end_time, "%H:%M")
        except ValueError as exc:
            raise ValueError("Working hours must use HH:MM format") from exc
        if start >= end:
            raise ValueError("End time must be after start time")
        return self


class TherapistRead(TherapistCreate):
    id: int


class AppointmentCreate(BaseModel):
    patient_id: int
    therapist_id: int
    appointment_date: date
    start_time: str
    end_time: str
    payment_method: str | None = None
    notes: str | None = None
    status: Literal["Booked", "Completed", "Cancelled", "No-show"] = "Booked"

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, value: str) -> str:
        from datetime import datetime

        try:
            if len(value) != 5 or value[2] != ":":
                raise ValueError
            datetime.strptime(value, "%H:%M")
        except ValueError as exc:
            raise ValueError("Time must use HH:MM format") from exc
        return value


class AppointmentRead(AppointmentCreate):
    id: int
    patient_name: str | None = None
    therapist_name: str | None = None
    created_at: datetime | None = None


class InvoiceCreate(BaseModel):
    patient_id: int
    service: str
    invoice_date: date
    amount: float
    status: Literal["Paid", "Due", "Void"] = "Due"
    payment_method: str | None = None
    discount: float = 0.0
    notes: str | None = None

    @field_validator("amount", "discount")
    @classmethod
    def validate_money(cls, value: float) -> float:
        if value < 0:
            raise ValueError("Amount and discount cannot be negative")
        return value


class InvoiceRead(InvoiceCreate):
    id: int
    patient_name: str | None = None


class DashboardStats(BaseModel):
    patients_seen_today: int
    therapists_on_duty_today: int
    revenue_collected_today: float
    open_slots_remaining_today: int
    recent_patients: list[PatientRead] = Field(default_factory=list)
    therapist_capacity: list[dict] = Field(default_factory=list)


class PatientDetail(BaseModel):
    patient: PatientRead
    session_history: list[AppointmentRead] = Field(default_factory=list)
    billing_history: list[InvoiceRead] = Field(default_factory=list)
