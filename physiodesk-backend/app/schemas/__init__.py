from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


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


class PatientUpdate(PatientCreate):
    pass


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
    status: str = "Booked"


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
    status: Literal["Paid", "Due"] = "Due"
    payment_method: str | None = None
    discount: float = 0.0
    notes: str | None = None


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
