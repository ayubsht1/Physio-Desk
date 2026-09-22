from datetime import date, timedelta

from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Appointment, Invoice, Patient, Therapist, User
from app.core.database import Base

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
engine = create_engine(settings.database_url)


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        existing_users = session.query(User).count()
        if existing_users:
            return

        admin = User(
            username="admin",
            email="admin@physiodesk.com",
            full_name="Dr. Aisha Patel",
            password_hash=pwd_context.hash("admin123"),
            role="admin",
        )
        staff = User(
            username="staff",
            email="reception@physiodesk.com",
            full_name="Sam Rivera",
            password_hash=pwd_context.hash("staff123"),
            role="staff",
        )
        session.add_all([admin, staff])

        therapists = [
            Therapist(name="Maya Chen", specialty="Sports Rehab", working_days="Mon,Tue,Wed,Thu,Fri", start_time="09:00", end_time="17:00", slot_duration=30, is_active=True),
            Therapist(name="Daniel Brooks", specialty="Neurological Recovery", working_days="Mon,Tue,Wed,Fri", start_time="08:30", end_time="16:30", slot_duration=45, is_active=True),
            Therapist(name="Priya Shah", specialty="Posture & Mobility", working_days="Tue,Wed,Thu,Fri", start_time="10:00", end_time="18:00", slot_duration=30, is_active=True),
            Therapist(name="Lucas Martin", specialty="Manual Therapy", working_days="Mon,Wed,Fri", start_time="12:00", end_time="18:00", slot_duration=60, is_active=True),
        ]
        session.add_all(therapists)
        session.flush()

        patients = [
            Patient(name="Nina Foster", phone="555-1001", age=29, gender="Female", address="12 Oak Ave", condition="Knee strain", assigned_therapist_id=therapists[0].id, package="Starter Plan", status="Active", created_at=date.today() - timedelta(days=3)),
            Patient(name="Omar Lee", phone="555-1002", age=42, gender="Male", address="44 Pine St", condition="Lower back pain", assigned_therapist_id=therapists[1].id, package="Recovery Plus", status="Completed", created_at=date.today() - timedelta(days=10)),
            Patient(name="Sara Nguyen", phone="555-1003", age=35, gender="Female", address="78 Cedar Rd", condition="Shoulder mobility", assigned_therapist_id=therapists[2].id, package="Core Therapy", status="Active", created_at=date.today() - timedelta(days=5)),
            Patient(name="Hugo Perez", phone="555-1004", age=51, gender="Male", address="19 Palm Blvd", condition="Hip stiffness", assigned_therapist_id=therapists[0].id, package="Performance Plan", status="On hold", created_at=date.today() - timedelta(days=14)),
            Patient(name="Alicia Ford", phone="555-1005", age=62, gender="Female", address="91 Elm Ln", condition="Balance retraining", assigned_therapist_id=therapists[3].id, package="Senior Care", status="Active", created_at=date.today() - timedelta(days=20)),
            Patient(name="Mason Reed", phone="555-1006", age=27, gender="Male", address="31 Birch Way", condition="Ankle rehab", assigned_therapist_id=therapists[1].id, package="Quick Fix", status="Active", created_at=date.today() - timedelta(days=7)),
            Patient(name="Zoe Kim", phone="555-1007", age=33, gender="Female", address="66 Willow St", condition="Posture correction", assigned_therapist_id=therapists[2].id, package="Core Therapy", status="Completed", created_at=date.today() - timedelta(days=11)),
            Patient(name="Isaac Moore", phone="555-1008", age=48, gender="Male", address="8 Maple Dr", condition="Rotator cuff pain", assigned_therapist_id=therapists[3].id, package="Recovery Plus", status="Active", created_at=date.today() - timedelta(days=2)),
            Patient(name="Leah Johnson", phone="555-1009", age=41, gender="Female", address="15 Laurel Ct", condition="Neck strain", assigned_therapist_id=therapists[0].id, package="Starter Plan", status="Active", created_at=date.today() - timedelta(days=1)),
            Patient(name="Ethan Ross", phone="555-1010", age=58, gender="Male", address="55 Juniper Loop", condition="Mobility assessment", assigned_therapist_id=therapists[1].id, package="Assessment", status="On hold", created_at=date.today() - timedelta(days=4)),
        ]
        session.add_all(patients)
        session.flush()

        session.add_all([
            Appointment(patient_id=patients[0].id, therapist_id=therapists[0].id, appointment_date=date.today(), start_time="09:00", end_time="09:45", status="Booked", payment_method="Card", notes="Mobility warmup"),
            Appointment(patient_id=patients[1].id, therapist_id=therapists[1].id, appointment_date=date.today(), start_time="11:30", end_time="12:15", status="Booked", payment_method="Cash", notes="Core strengthening"),
            Appointment(patient_id=patients[2].id, therapist_id=therapists[2].id, appointment_date=date.today(), start_time="13:00", end_time="13:45", status="Booked", payment_method="Card", notes="Shoulder stability"),
            Appointment(patient_id=patients[3].id, therapist_id=therapists[0].id, appointment_date=date.today() + timedelta(days=1), start_time="09:30", end_time="10:15", status="Booked", payment_method="Card", notes="Follow-up"),
            Appointment(patient_id=patients[4].id, therapist_id=therapists[3].id, appointment_date=date.today() - timedelta(days=2), start_time="14:00", end_time="14:45", status="Completed", payment_method="Bank Transfer", notes="Balance work"),
        ])

        session.add_all([
            Invoice(patient_id=patients[0].id, service="Initial Assessment", invoice_date=date.today() - timedelta(days=1), amount=180.00, status="Paid", payment_method="Card", discount=0.0),
            Invoice(patient_id=patients[1].id, service="Manual Therapy", invoice_date=date.today() - timedelta(days=3), amount=260.00, status="Paid", payment_method="Bank Transfer", discount=20.00),
            Invoice(patient_id=patients[2].id, service="Sports Rehab", invoice_date=date.today() - timedelta(days=4), amount=310.00, status="Due", payment_method="Card", discount=10.00),
            Invoice(patient_id=patients[5].id, service="Recovery Session", invoice_date=date.today() - timedelta(days=2), amount=150.00, status="Paid", payment_method="Cash", discount=0.0),
            Invoice(patient_id=patients[8].id, service="Posture Session", invoice_date=date.today(), amount=210.00, status="Due", payment_method="Card", discount=0.0),
        ])
        session.commit()


if __name__ == "__main__":
    seed()
    print("Seed data created.")
