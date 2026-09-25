from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Table, Text, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


therapist_services = Table(
    "therapist_services",
    Base.metadata,
    Column("therapist_id", ForeignKey("therapists.id"), primary_key=True),
    Column("service_id", ForeignKey("services.id"), primary_key=True),
)


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    duration: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    therapists: Mapped[list["Therapist"]] = relationship(
        secondary=therapist_services,
        back_populates="services",
    )

    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="service",
    )

    invoices: Mapped[list["Invoice"]] = relationship(
        back_populates="service",
    )

    @property
    def is_available(self) -> bool:
        return self.is_active and not self.is_deleted