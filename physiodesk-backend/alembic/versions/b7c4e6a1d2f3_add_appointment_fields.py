"""add appointment fields used by the current API

Revision ID: b7c4e6a1d2f3
Revises: 73102378f180
"""

from alembic import op
import sqlalchemy as sa


revision = "b7c4e6a1d2f3"
down_revision = "73102378f180"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "appointments",
        sa.Column("appointment_date", sa.Date(), nullable=False, server_default=sa.text("CURRENT_DATE")),
    )
    op.add_column(
        "appointments",
        sa.Column("start_time", sa.String(length=20), nullable=False, server_default="09:00"),
    )
    op.add_column(
        "appointments",
        sa.Column("end_time", sa.String(length=20), nullable=False, server_default="09:30"),
    )
    op.add_column(
        "appointments",
        sa.Column("status", sa.String(length=30), nullable=False, server_default="Scheduled"),
    )
    op.add_column("appointments", sa.Column("reason", sa.Text(), nullable=True))
    op.add_column("appointments", sa.Column("notes", sa.Text(), nullable=True))
    op.add_column(
        "appointments",
        sa.Column("created_by", sa.Integer(), nullable=True),
    )
    op.add_column(
        "appointments",
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.add_column("appointments", sa.Column("service_id", sa.Integer(), nullable=True))
    op.create_index("ix_appointments_service_id", "appointments", ["service_id"])
    with op.batch_alter_table("appointments", recreate="always") as batch_op:
        batch_op.create_foreign_key(
            "fk_appointments_created_by",
            "users",
            ["created_by"],
            ["id"],
        )
        batch_op.create_foreign_key(
            "fk_appointments_service_id",
            "services",
            ["service_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("appointments", recreate="always") as batch_op:
        batch_op.drop_constraint("fk_appointments_service_id", type_="foreignkey")
        batch_op.drop_constraint("fk_appointments_created_by", type_="foreignkey")
    op.drop_index("ix_appointments_service_id", table_name="appointments")
    op.drop_column("appointments", "service_id")
    op.drop_column("appointments", "created_at")
    op.drop_column("appointments", "created_by")
    op.drop_column("appointments", "notes")
    op.drop_column("appointments", "reason")
    op.drop_column("appointments", "status")
    op.drop_column("appointments", "end_time")
    op.drop_column("appointments", "start_time")
    op.drop_column("appointments", "appointment_date")