import secrets
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

def generate_booking_id() -> str:
    return f"PHY-NEP-{secrets.randbelow(900000) + 100000}"


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    booking_id: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        default=generate_booking_id,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"),
        nullable=False,
        index=True,
    )

    patient: Mapped["Patient"] = relationship(
        back_populates="appointments"
    )

    therapist_id: Mapped[int] = mapped_column(
        ForeignKey("therapists.id"),
        nullable=False,
        index=True,
    )

    therapist: Mapped["Therapist"] = relationship(
        back_populates="appointments"
    )

    appointment_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    start_time: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    end_time: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Scheduled",
        nullable=False,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    service_id: Mapped[int | None] = mapped_column(
        ForeignKey("services.id"),
        nullable=True,
        index=True,
    )

    service: Mapped["Service | None"] = relationship(
        back_populates="appointments"
    )

    invoices: Mapped[list["Invoice"]] = relationship(
        back_populates="appointment",
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_by_user: Mapped["User | None"] = relationship()

    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    @property
    def is_active(self) -> bool:
        return not self.is_deleted

    @is_active.setter
    def is_active(self, value: bool) -> None:
        self.is_deleted = not value
