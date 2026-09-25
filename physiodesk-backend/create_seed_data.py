import random
from datetime import date, datetime, timedelta

from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Appointment, Invoice, Patient, Service, Therapist, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
engine = create_engine(settings.database_url)


def seed() -> None:
    with Session(engine) as session:
        existing_users = session.query(User).count()
        if existing_users > 0:
            print("Database already contains user records. Skipping seed.")
            return

        print("Seeding fresh production-grade data...")

        # 1. Users (Admin and Staff)
        admin = User(
            username="admin",
            email="admin@physiodesk.com",
            first_name="Aisha",
            middle_name="K.",
            last_name="Patel",
            password_hash=pwd_context.hash("admin123"),
            role="admin",
            is_active=True,
            notes="Clinical Director & Lead Physical Therapist",
        )
        staff = User(
            username="staff",
            email="reception@physiodesk.com",
            first_name="Sam",
            last_name="Rivera",
            password_hash=pwd_context.hash("staff123"),
            role="staff",
            is_active=True,
            notes="Senior Desk Coordinator & Patient Concierge",
        )
        session.add_all([admin, staff])
        session.flush()

        # 2. Services
        services = [
            Service(
                name="Sports Injury & ACL Rehabilitation",
                description="Targeted rehabilitation for acute joint sprains, ligament recovery, and return-to-play testing.",
                duration=45,
                price=1800,
                is_active=True,
                is_deleted=False,
            ),
            Service(
                name="Spine, Posture & Cervical Decompression",
                description="Evidence-based care for lumbar pain, ergonomic stiffness, sciatica, and cervical symptoms.",
                duration=45,
                price=1500,
                is_active=True,
                is_deleted=False,
            ),
            Service(
                name="Neurological & Stroke Rehabilitation",
                description="Gait retraining, balance work, vestibular therapy, and post-stroke functional recovery.",
                duration=45,
                price=2000,
                is_active=True,
                is_deleted=False,
            ),
            Service(
                name="Manual Therapy & Joint Mobilization",
                description="Hands-on joint mobilization, myofascial release, and orthopedic rehabilitation.",
                duration=60,
                price=2200,
                is_active=True,
                is_deleted=False,
            ),
        ]
        session.add_all(services)
        session.flush()

        # 3. Therapists
        therapists = [
            Therapist(
                name="Dr. Maya Chen, DPT",
                specialty="Sports Rehab & Musculoskeletal",
                license_number="PT-88214",
                phone="+1 (555) 012-3401",
                email="m.chen@physiodesk.com",
                working_days="Mon,Tue,Wed,Thu,Fri",
                start_time="09:00",
                end_time="17:00",
                slot_duration=30,
                is_active=True,
                notes="Specialist in athletic recovery, rotator cuff repairs, and ACL post-op protocols.",
            ),
            Therapist(
                name="Dr. Daniel Brooks, PT",
                specialty="Neurological Rehabilitation",
                license_number="PT-77142",
                phone="+1 (555) 012-3402",
                email="d.brooks@physiodesk.com",
                working_days="Mon,Tue,Wed,Fri",
                start_time="08:30",
                end_time="16:30",
                slot_duration=45,
                is_active=True,
                notes="Experienced in stroke recovery, vestibular therapy, and gait retraining.",
            ),
            Therapist(
                name="Dr. Priya Shah, MPT",
                specialty="Posture, Spine & Mobility",
                license_number="PT-93401",
                phone="+1 (555) 012-3403",
                email="p.shah@physiodesk.com",
                working_days="Tue,Wed,Thu,Fri,Sat",
                start_time="10:00",
                end_time="18:00",
                slot_duration=30,
                is_active=True,
                notes="Ergonomics specialist, cervical spine decompression, and pelvic floor conditioning.",
            ),
            Therapist(
                name="Dr. Lucas Martin, PT",
                specialty="Manual Therapy & Joint Orthopedics",
                license_number="PT-65239",
                phone="+1 (555) 012-3404",
                email="l.martin@physiodesk.com",
                working_days="Mon,Wed,Fri",
                start_time="12:00",
                end_time="18:00",
                slot_duration=60,
                is_active=True,
                notes="Deep tissue mobilization, myofascial trigger point release, and joint manipulation.",
            ),
        ]
        therapists[0].services = [services[0], services[1]]
        therapists[1].services = [services[1], services[2]]
        therapists[2].services = [services[1]]
        therapists[3].services = [services[3]]
        session.add_all(therapists)
        session.flush()

        # 4. Patients
        today = date.today()
        patients = [
            Patient(
                first_name="Nina",
                last_name="Foster",
                date_of_birth=date(1995, 4, 12),
                gender="Female",
                phone="+1 (555) 234-1001",
                email="nina.foster@example.com",
                address="12 Oak Avenue, Metro City",
                blood_group="O+",
                allergies="Latex, Penicillin",
                medical_notes="Acute grade II ACL sprain from tennis. Prescribed isometric quad activation and cryotherapy.",
                assigned_therapist_id=therapists[0].id,
                status="Active",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=12),
            ),
            Patient(
                first_name="Omar",
                last_name="Lee",
                date_of_birth=date(1982, 9, 23),
                gender="Male",
                phone="+1 (555) 234-1002",
                email="omar.lee@example.com",
                address="44 Pine Street, Apt 3B, Metro City",
                blood_group="A+",
                allergies="None reported",
                medical_notes="Chronic lower lumbar disc herniation (L4-L5). Core stabilization and spinal traction protocol.",
                assigned_therapist_id=therapists[1].id,
                status="Completed",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=35),
            ),
            Patient(
                first_name="Sara",
                last_name="Nguyen",
                date_of_birth=date(1989, 11, 5),
                gender="Female",
                phone="+1 (555) 234-1003",
                email="sara.n@example.com",
                address="78 Cedar Road, Highlands",
                blood_group="B+",
                allergies="Ibuprofen",
                medical_notes="Right rotator cuff tendinitis and impingement syndrome. Active release therapy and banded external rotations.",
                assigned_therapist_id=therapists[2].id,
                status="Active",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=8),
            ),
            Patient(
                first_name="Hugo",
                last_name="Perez",
                date_of_birth=date(1973, 2, 18),
                gender="Male",
                phone="+1 (555) 234-1004",
                email="hugo.perez@example.com",
                address="19 Palm Boulevard, Westside",
                blood_group="AB+",
                allergies="Sulfa drugs",
                medical_notes="Bilateral hip labral tear with early osteoarthritis. Hydrotherapy and glute strengthening.",
                assigned_therapist_id=therapists[0].id,
                status="On hold",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=22),
            ),
            Patient(
                first_name="Alicia",
                last_name="Ford",
                date_of_birth=date(1962, 7, 30),
                gender="Female",
                phone="+1 (555) 234-1005",
                email="alicia.ford@example.com",
                address="91 Elm Lane, Greenfield",
                blood_group="O-",
                allergies="None",
                medical_notes="Post-total knee arthroplasty (left). Range of motion recovery currently at 105 degrees flexion.",
                assigned_therapist_id=therapists[3].id,
                status="Active",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=19),
            ),
            Patient(
                first_name="Mason",
                last_name="Reed",
                date_of_birth=date(1997, 6, 14),
                gender="Male",
                phone="+1 (555) 234-1006",
                email="mason.reed@example.com",
                address="31 Birch Way, Midtown",
                blood_group="A-",
                allergies="Aspirin",
                medical_notes="High ankle syndesmosis sprain. Proprioception drills and wobble board balance progression.",
                assigned_therapist_id=therapists[1].id,
                status="Active",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=15),
            ),
            Patient(
                first_name="Zoe",
                last_name="Kim",
                date_of_birth=date(1991, 1, 8),
                gender="Female",
                phone="+1 (555) 234-1007",
                email="zoe.kim@example.com",
                address="66 Willow Street, Downtown",
                blood_group="B-",
                allergies="None",
                medical_notes="Postural kyphosis and thoracic spine stiffness from prolonged desk work. Scapular retractors conditioning.",
                assigned_therapist_id=therapists[2].id,
                status="Completed",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=40),
            ),
            Patient(
                first_name="Ethan",
                last_name="Ross",
                date_of_birth=date(1966, 10, 19),
                gender="Male",
                phone="+1 (555) 234-1008",
                email="ethan.ross@example.com",
                address="55 Juniper Loop, Riverdale",
                blood_group="O+",
                allergies="Dust, Pollen",
                medical_notes="Cervical radiculopathy with numbness radiating down left C6 dermatome. Gentle manual traction and postural coaching.",
                assigned_therapist_id=therapists[3].id,
                status="Active",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=5),
            ),
        ]
        session.add_all(patients)
        session.flush()

        # 5. Appointments
        appointments = [
            # Today's appointments
            Appointment(
                patient_id=patients[0].id,
                therapist_id=therapists[0].id,
                appointment_date=today,
                start_time="09:00",
                end_time="09:30",
                status="Completed",
                reason="ACL Rehab Session 4",
                notes="Ref: PHY-829101. Excellent quadriceps activation today. Swelling subsided.",
                created_by=admin.id,
                is_deleted=False,
            ),
            Appointment(
                patient_id=patients[2].id,
                therapist_id=therapists[2].id,
                appointment_date=today,
                start_time="10:00",
                end_time="10:30",
                status="Confirmed",
                reason="Rotator cuff ultrasound & mobility",
                notes="Ref: PHY-829102. Patient reports pain decreased from 7/10 to 3/10.",
                created_by=staff.id,
                is_deleted=False,
            ),
            Appointment(
                patient_id=patients[4].id,
                therapist_id=therapists[3].id,
                appointment_date=today,
                start_time="12:00",
                end_time="13:00",
                status="Scheduled",
                reason="Knee post-op mobilization",
                notes="Ref: PHY-829103. Focus on achieving 115 degree flexion target.",
                created_by=admin.id,
                is_deleted=False,
            ),
            Appointment(
                patient_id=patients[5].id,
                therapist_id=therapists[1].id,
                appointment_date=today,
                start_time="14:00",
                end_time="14:45",
                status="Confirmed",
                reason="Ankle proprioception & taping",
                notes="Ref: PHY-829104. Patient clearing for light jogging.",
                created_by=staff.id,
                is_deleted=False,
            ),
            # Tomorrow's appointments
            Appointment(
                patient_id=patients[7].id,
                therapist_id=therapists[3].id,
                appointment_date=today + timedelta(days=1),
                start_time="13:00",
                end_time="14:00",
                status="Scheduled",
                reason="Cervical traction follow-up",
                notes="Ref: PHY-829105. Check dermatome sensation status.",
                created_by=staff.id,
                is_deleted=False,
            ),
            Appointment(
                patient_id=patients[0].id,
                therapist_id=therapists[0].id,
                appointment_date=today + timedelta(days=2),
                start_time="10:00",
                end_time="10:30",
                status="Scheduled",
                reason="Strength progress assessment",
                notes="Ref: PHY-829106. Biodex dynamometer testing.",
                created_by=admin.id,
                is_deleted=False,
            ),
            # Past appointments
            Appointment(
                patient_id=patients[1].id,
                therapist_id=therapists[1].id,
                appointment_date=today - timedelta(days=3),
                start_time="11:00",
                end_time="11:45",
                status="Completed",
                reason="Final lumbar discharge evaluation",
                notes="Ref: PHY-829100. Discharged with home maintenance routine.",
                created_by=admin.id,
                is_deleted=False,
            ),
        ]
        session.add_all(appointments)
        session.flush()

        # 6. Invoices
        invoices = [
            Invoice(
                invoice_number="INV-20260925-1001",
                patient_id=patients[0].id,
                appointment_id=appointments[0].id,
                invoice_date=today,
                subtotal=150.00,
                discount=15.00,
                tax=10.80,
                total=145.80,
                status="Paid",
                notes="Comprehensive sports rehab session with cryotherapy treatment.",
            ),
            Invoice(
                invoice_number="INV-20260925-1002",
                patient_id=patients[2].id,
                appointment_id=appointments[1].id,
                invoice_date=today,
                subtotal=180.00,
                discount=0.00,
                tax=14.40,
                total=194.40,
                status="Due",
                notes="Rotator cuff manual therapy and therapeutic therapeutic ultrasound.",
            ),
            Invoice(
                invoice_number="INV-20260924-1003",
                patient_id=patients[4].id,
                appointment_id=None,
                invoice_date=today - timedelta(days=1),
                subtotal=220.00,
                discount=20.00,
                tax=16.00,
                total=216.00,
                status="Paid",
                notes="Post-surgical knee rehabilitation and neuromuscular stimulation.",
            ),
            Invoice(
                invoice_number="INV-20260922-1004",
                patient_id=patients[1].id,
                appointment_id=appointments[6].id,
                invoice_date=today - timedelta(days=3),
                subtotal=190.00,
                discount=10.00,
                tax=14.40,
                total=194.40,
                status="Paid",
                notes="Final clinical assessment, lumbar mobility testing and discharge pack.",
            ),
            Invoice(
                invoice_number="INV-20260920-1005",
                patient_id=patients[5].id,
                appointment_id=None,
                invoice_date=today - timedelta(days=5),
                subtotal=140.00,
                discount=0.00,
                tax=11.20,
                total=151.20,
                status="Due",
                notes="Ankle biomechanical assessment and therapeutic taping supply.",
            ),
        ]
        session.add_all(invoices)
        session.commit()

        print("Database successfully seeded with realistic production data!")


if __name__ == "__main__":
    seed()
