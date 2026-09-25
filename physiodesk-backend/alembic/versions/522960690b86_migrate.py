"""migrate

Revision ID: 522960690b86
Revises: 001_initial_schema
Create Date: 2026-09-25 11:49:40.425010

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '522960690b86'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Appointments
    op.add_column(
        "appointments",
        sa.Column("reason", sa.Text(), nullable=True),
    )
    op.add_column(
        "appointments",
        sa.Column("created_by", sa.Integer(), nullable=True),
    )
    op.add_column(
        "appointments",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.create_index(
        op.f("ix_appointments_appointment_date"),
        "appointments",
        ["appointment_date"],
        unique=False,
    )
    op.create_index(
        op.f("ix_appointments_patient_id"),
        "appointments",
        ["patient_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_appointments_therapist_id"),
        "appointments",
        ["therapist_id"],
        unique=False,
    )

    with op.batch_alter_table("appointments") as batch_op:
        batch_op.create_foreign_key(
            None,
            "users",
            ["created_by"],
            ["id"],
        )
        batch_op.drop_column("payment_method")

    # Invoices
    op.add_column(
        "invoices",
        sa.Column("invoice_number", sa.String(length=50), nullable=False),
    )
    op.add_column(
        "invoices",
        sa.Column("appointment_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "invoices",
        sa.Column(
            "subtotal",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "invoices",
        sa.Column(
            "tax",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
            server_default="0",
        ),
    )
    op.add_column(
        "invoices",
        sa.Column(
            "total",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
            server_default="0",
        ),
    )

    op.create_index(
        op.f("ix_invoices_invoice_number"),
        "invoices",
        ["invoice_number"],
        unique=True,
    )
    op.create_index(
        op.f("ix_invoices_patient_id"),
        "invoices",
        ["patient_id"],
        unique=False,
    )

    with op.batch_alter_table("invoices") as batch_op:
        batch_op.create_foreign_key(
            None,
            "appointments",
            ["appointment_id"],
            ["id"],
        )
        batch_op.drop_column("service")
        batch_op.drop_column("payment_method")
        batch_op.drop_column("amount")

    # Patients
    op.add_column(
        "patients",
        sa.Column("first_name", sa.String(length=80), nullable=False, server_default=""),
    )
    op.add_column(
        "patients",
        sa.Column("last_name", sa.String(length=80), nullable=False, server_default=""),
    )
    op.add_column(
        "patients",
        sa.Column("date_of_birth", sa.Date(), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("email", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("blood_group", sa.String(length=10), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("allergies", sa.Text(), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("medical_notes", sa.Text(), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )

    with op.batch_alter_table("patients") as batch_op:
        batch_op.alter_column(
            "address",
            existing_type=sa.TEXT(),
            nullable=True,
        )
        batch_op.alter_column(
            "created_at",
            existing_type=sa.DATE(),
            type_=sa.DateTime(),
            existing_nullable=False,
        )
        batch_op.drop_column("condition")
        batch_op.drop_column("package")
        batch_op.drop_column("name")
        batch_op.drop_column("age")

    # Therapists
    op.add_column(
        "therapists",
        sa.Column("license_number", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "therapists",
        sa.Column("phone", sa.String(length=20), nullable=True),
    )
    op.add_column(
        "therapists",
        sa.Column("email", sa.String(length=120), nullable=True),
    )

    with op.batch_alter_table("therapists") as batch_op:
        batch_op.create_unique_constraint(
            None,
            ["license_number"],
        )

    # Users
    op.add_column(
        "users",
        sa.Column("first_name", sa.String(length=80), nullable=False, server_default=""),
    )
    op.add_column(
        "users",
        sa.Column("middle_name", sa.String(length=80), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("last_name", sa.String(length=80), nullable=False, server_default=""),
    )
    op.add_column(
        "users",
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.add_column(
        "users",
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_constraint("users_email_key", type_="unique")
        batch_op.drop_constraint("users_username_key", type_="unique")
        batch_op.drop_column("full_name")