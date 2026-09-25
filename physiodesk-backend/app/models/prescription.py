from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    consultation_id: Mapped[int] = mapped_column(
        ForeignKey("consultations.id"),
        nullable=False,
        index=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    consultation: Mapped["Consultation"] = relationship(
        back_populates="prescriptions"
    )

    items: Mapped[list["PrescriptionItem"]] = relationship(
        back_populates="prescription",
        cascade="all, delete-orphan",
    )


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    prescription_id: Mapped[int] = mapped_column(
        ForeignKey("prescriptions.id"),
        nullable=False,
        index=True,
    )

    medicine_name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    dosage: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    frequency: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    duration: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    instructions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    prescription: Mapped["Prescription"] = relationship(
        back_populates="items"
    )