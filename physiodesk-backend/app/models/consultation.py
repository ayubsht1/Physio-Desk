from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Consultation(Base):
    __tablename__ = "consultations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id"),
        nullable=False,
        unique=True,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id"),
        nullable=False,
        index=True,
    )

    therapist_id: Mapped[int] = mapped_column(
        ForeignKey("therapists.id"),
        nullable=False,
        index=True,
    )

    symptoms: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    diagnosis: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    clinical_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    treatment_plan: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    follow_up_date: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    appointment: Mapped["Appointment"] = relationship()

    patient: Mapped["Patient"] = relationship(
        back_populates="consultations"
    )

    therapist: Mapped["Therapist"] = relationship(
        back_populates="consultations"
    )

    prescriptions: Mapped[list["Prescription"]] = relationship(
        back_populates="consultation",
        cascade="all, delete-orphan",
    )