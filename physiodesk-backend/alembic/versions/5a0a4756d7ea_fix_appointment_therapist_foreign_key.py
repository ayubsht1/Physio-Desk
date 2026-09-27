"""fix appointment therapist foreign key

Revision ID: 5a0a4756d7ea
Revises: 42c0994894e1
Create Date: 2026-09-27 22:11:31.619710

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "5a0a4756d7ea"
down_revision = "42c0994894e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add booking_id as nullable first because appointments
    # may already contain existing rows.
    op.add_column(
        "appointments",
        sa.Column(
            "booking_id",
            sa.String(length=20),
            nullable=True,
        ),
    )

    # Generate booking IDs for existing appointments.
    connection = op.get_bind()

    connection.execute(
        sa.text("""
            UPDATE appointments
            SET booking_id = 'PHY-NEP-' || printf('%06d', id)
            WHERE booking_id IS NULL
        """)
    )

    # SQLite requires batch mode for altering constraints/columns.
    with op.batch_alter_table("appointments") as batch_op:
        batch_op.alter_column(
            "booking_id",
            existing_type=sa.String(length=20),
            nullable=False,
        )

        batch_op.create_index(
            "ix_appointments_booking_id",
            ["booking_id"],
            unique=True,
        )


def downgrade() -> None:
    with op.batch_alter_table("appointments") as batch_op:
        batch_op.drop_index("ix_appointments_booking_id")
        batch_op.drop_column("booking_id")