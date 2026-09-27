"""connect services to therapists, appointments, and invoices

Revision ID: 8b8e3e5a7c21
Revises: 522960690b86
"""

from alembic import op
import sqlalchemy as sa


revision = "8b8e3e5a7c21"
down_revision = "522960690b86"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "services",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("duration", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_services_id", "services", ["id"])
    op.create_index("ix_services_name", "services", ["name"], unique=True)
    op.create_table(
        "therapist_services",
        sa.Column("therapist_id", sa.Integer(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["therapist_id"], ["therapists.id"]),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"]),
        sa.PrimaryKeyConstraint("therapist_id", "service_id"),
    )
    op.add_column("appointments", sa.Column("service_id", sa.Integer(), nullable=True))
    op.create_index("ix_appointments_service_id", "appointments", ["service_id"])
    op.create_foreign_key("fk_appointments_service_id", "appointments", "services", ["service_id"], ["id"])
    op.add_column("invoices", sa.Column("service_id", sa.Integer(), nullable=True))
    op.create_index("ix_invoices_service_id", "invoices", ["service_id"])
    op.create_foreign_key("fk_invoices_service_id", "invoices", "services", ["service_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_invoices_service_id", "invoices", type_="foreignkey")
    op.drop_index("ix_invoices_service_id", table_name="invoices")
    op.drop_column("invoices", "service_id")
    op.drop_constraint("fk_appointments_service_id", "appointments", type_="foreignkey")
    op.drop_index("ix_appointments_service_id", table_name="appointments")
    op.drop_column("appointments", "service_id")
    op.drop_table("therapist_services")
    op.drop_index("ix_services_name", table_name="services")
    op.drop_index("ix_services_id", table_name="services")
    op.drop_table("services")