from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Therapist(Base):
    __tablename__ = "therapists"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    specialty: Mapped[str] = mapped_column(String(120), nullable=False)

    license_number: Mapped[str | None] = mapped_column(
        String(100),
        unique=True,
        nullable=True,
    )
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(120), nullable=True)

    working_days: Mapped[str] = mapped_column(
        String(120),
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

    slot_duration: Mapped[int] = mapped_column(
        default=30,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    patients: Mapped[list["Patient"]] = relationship(
        back_populates="therapist"
    )

    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="therapist"
    )

    consultations: Mapped[list["Consultation"]] = relationship(
        back_populates="therapist"
    )

    services: Mapped[list["Service"]] = relationship(
        secondary="therapist_services",
        back_populates="therapists",
    )