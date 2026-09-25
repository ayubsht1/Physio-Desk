"""migrate

Revision ID: 522960690b86
Revises: 001_initial_schema
Create Date: 2026-09-25 11:49:40.425010

"""

from alembic import op
import sqlalchemy as sa


revision = "522960690b86"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---------------------------------------------------------
    # Appointments
    # ---------------------------------------------------------
    with op.batch_alter_table("appointments") as batch_op:
        batch_op.add_column(
            sa.Column(
                "reason",
                sa.Text(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "created_by",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "is_deleted",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )

        batch_op.create_index(
            "ix_appointments_appointment_date",
            ["appointment_date"],
        )

        batch_op.create_index(
            "ix_appointments_patient_id",
            ["patient_id"],
        )

        batch_op.create_index(
            "ix_appointments_therapist_id",
            ["therapist_id"],
        )

        batch_op.create_foreign_key(
            "fk_appointments_created_by",
            "users",
            ["created_by"],
            ["id"],
        )

        batch_op.drop_column("payment_method")

    # ---------------------------------------------------------
    # Invoices
    # ---------------------------------------------------------
    with op.batch_alter_table("invoices") as batch_op:
        batch_op.add_column(
            sa.Column(
                "invoice_number",
                sa.String(length=50),
                nullable=False,
                server_default="",
            )
        )

        batch_op.add_column(
            sa.Column(
                "appointment_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "subtotal",
                sa.Numeric(precision=10, scale=2),
                nullable=False,
                server_default="0",
            )
        )

        batch_op.add_column(
            sa.Column(
                "tax",
                sa.Numeric(precision=10, scale=2),
                nullable=False,
                server_default="0",
            )
        )

        batch_op.add_column(
            sa.Column(
                "total",
                sa.Numeric(precision=10, scale=2),
                nullable=False,
                server_default="0",
            )
        )

        batch_op.create_index(
            "ix_invoices_invoice_number",
            ["invoice_number"],
            unique=True,
        )

        batch_op.create_index(
            "ix_invoices_patient_id",
            ["patient_id"],
        )

        batch_op.create_foreign_key(
            "fk_invoices_appointment_id",
            "appointments",
            ["appointment_id"],
            ["id"],
        )

        batch_op.drop_column("service")
        batch_op.drop_column("payment_method")
        batch_op.drop_column("amount")

    # ---------------------------------------------------------
    # Patients
    # ---------------------------------------------------------
    with op.batch_alter_table("patients") as batch_op:
        batch_op.add_column(
            sa.Column(
                "first_name",
                sa.String(length=80),
                nullable=False,
                server_default="",
            )
        )

        batch_op.add_column(
            sa.Column(
                "last_name",
                sa.String(length=80),
                nullable=False,
                server_default="",
            )
        )

        batch_op.add_column(
            sa.Column(
                "date_of_birth",
                sa.Date(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "email",
                sa.String(length=120),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "blood_group",
                sa.String(length=10),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "allergies",
                sa.Text(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "medical_notes",
                sa.Text(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "is_active",
                sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            )
        )

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

    # ---------------------------------------------------------
    # Therapists
    # ---------------------------------------------------------
    with op.batch_alter_table("therapists") as batch_op:
        batch_op.add_column(
            sa.Column(
                "license_number",
                sa.String(length=100),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "phone",
                sa.String(length=20),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "email",
                sa.String(length=120),
                nullable=True,
            )
        )

        batch_op.create_unique_constraint(
            "uq_therapists_license_number",
            ["license_number"],
        )

    # ---------------------------------------------------------
    # Users
    # ---------------------------------------------------------
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column(
                "first_name",
                sa.String(length=80),
                nullable=False,
                server_default="",
            )
        )

        batch_op.add_column(
            sa.Column(
                "middle_name",
                sa.String(length=80),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "last_name",
                sa.String(length=80),
                nullable=False,
                server_default="",
            )
        )

        batch_op.add_column(
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.now(),
            )
        )

        batch_op.add_column(
            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.now(),
            )
        )

        batch_op.drop_constraint(
            "users_email_key",
            type_="unique",
        )

        batch_op.drop_constraint(
            "users_username_key",
            type_="unique",
        )

        batch_op.drop_column("full_name")


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrade is not implemented for this migration."
    )