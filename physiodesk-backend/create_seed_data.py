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

        print("Seeding Nepal-based clinic data...")

        # 1. Users
        admin = User(
            username="admin",
            email="admin@physiodesk.com",
            first_name="Prakash",
            middle_name="Raj",
            last_name="Shrestha",
            password_hash=pwd_context.hash("admin123"),
            role="admin",
            is_active=True,
            notes="Clinic Administrator & Senior Physiotherapist",
        )

        staff = User(
            username="reception",
            email="reception@physiodesk.com",
            first_name="Sushmita",
            last_name="Adhikari",
            password_hash=pwd_context.hash("staff123"),
            role="staff",
            is_active=True,
            notes="Reception & Patient Coordinator",
        )

        session.add_all([admin, staff])
        session.flush()

        # 2. Services
        services = [
            Service(
                name="Sports Injury & ACL Rehabilitation",
                description=(
                    "Rehabilitation for sports injuries, ligament recovery, "
                    "ACL rehabilitation, strength training, and return-to-sport programs."
                ),
                duration=45,
                price=1800,
                is_active=True,
                is_deleted=False,
            ),
            Service(
                name="Back, Neck & Posture Rehabilitation",
                description=(
                    "Physiotherapy for back pain, neck pain, sciatica, "
                    "postural problems, and work-related musculoskeletal conditions."
                ),
                duration=45,
                price=1500,
                is_active=True,
                is_deleted=False,
            ),
            Service(
                name="Neurological & Stroke Rehabilitation",
                description=(
                    "Individualized rehabilitation for stroke recovery, "
                    "balance problems, gait training, and neurological conditions."
                ),
                duration=45,
                price=2000,
                is_active=True,
                is_deleted=False,
            ),
            Service(
                name="Manual Therapy & Joint Rehabilitation",
                description=(
                    "Hands-on physiotherapy including joint mobilization, "
                    "soft tissue therapy, stretching, and orthopedic rehabilitation."
                ),
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
                name="Dr. Sagar Koirala, PT",
                specialty="Sports Rehabilitation & Musculoskeletal",
                license_number="PT-NPL-10241",
                phone="+977 9841234567",
                email="sagar.koirala@physiodesk.com",
                working_days="Mon,Tue,Wed,Thu,Fri",
                start_time="09:00",
                end_time="17:00",
                slot_duration=30,
                is_active=True,
                notes=(
                    "Specializes in sports injuries, ACL rehabilitation, "
                    "shoulder injuries, strength training, and return-to-sport programs."
                ),
            ),
            Therapist(
                name="Dr. Anisha Thapa, PT",
                specialty="Neurological Rehabilitation",
                license_number="PT-NPL-10873",
                phone="+977 9851023456",
                email="anisha.thapa@physiodesk.com",
                working_days="Mon,Tue,Wed,Fri",
                start_time="08:30",
                end_time="16:30",
                slot_duration=45,
                is_active=True,
                notes=(
                    "Experienced in stroke rehabilitation, neurological conditions, "
                    "balance training, gait retraining, and functional recovery."
                ),
            ),
            Therapist(
                name="Dr. Rojina Gurung, MPT",
                specialty="Spine, Posture & Mobility",
                license_number="PT-NPL-11452",
                phone="+977 9860123789",
                email="rojina.gurung@physiodesk.com",
                working_days="Tue,Wed,Thu,Fri,Sat",
                start_time="10:00",
                end_time="18:00",
                slot_duration=30,
                is_active=True,
                notes=(
                    "Focuses on back and neck pain, posture correction, "
                    "ergonomics, mobility training, and chronic pain management."
                ),
            ),
            Therapist(
                name="Dr. Bibek Poudel, PT",
                specialty="Manual Therapy & Orthopedic Rehabilitation",
                license_number="PT-NPL-11908",
                phone="+977 9818456723",
                email="bibek.poudel@physiodesk.com",
                working_days="Mon,Wed,Fri",
                start_time="12:00",
                end_time="18:00",
                slot_duration=60,
                is_active=True,
                notes=(
                    "Specializes in manual therapy, joint mobilization, "
                    "soft tissue treatment, and post-operative rehabilitation."
                ),
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
                first_name="Aayush",
                last_name="Sharma",
                date_of_birth=date(1998, 4, 12),
                gender="Male",
                phone="+977 9801234567",
                email="aayush.sharma@example.com",
                address="Baneshwor, Kathmandu",
                blood_group="O+",
                allergies="None reported",
                medical_notes=(
                    "Grade II ACL injury from football. Currently undergoing "
                    "strengthening, mobility, and progressive return-to-sport rehabilitation."
                ),
                assigned_therapist_id=therapists[0].id,
                status="Active",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=12),
            ),
            Patient(
                first_name="Mina",
                last_name="Gurung",
                date_of_birth=date(1982, 9, 23),
                gender="Female",
                phone="+977 9812345678",
                email="mina.gurung@example.com",
                address="Lalitpur, Bagmati",
                blood_group="A+",
                allergies="None reported",
                medical_notes=(
                    "Chronic lower back pain with L4-L5 disc-related symptoms. "
                    "Following core stabilization, mobility, and posture program."
                ),
                assigned_therapist_id=therapists[1].id,
                status="Completed",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=35),
            ),
            Patient(
                first_name="Bikash",
                last_name="Tamang",
                date_of_birth=date(1989, 11, 5),
                gender="Male",
                phone="+977 9823456789",
                email="bikash.tamang@example.com",
                address="Kirtipur, Kathmandu",
                blood_group="B+",
                allergies="Ibuprofen",
                medical_notes=(
                    "Right shoulder pain and rotator cuff tendinopathy. "
                    "Receiving mobility exercises, strengthening, and manual therapy."
                ),
                assigned_therapist_id=therapists[2].id,
                status="Active",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=8),
            ),
            Patient(
                first_name="Sarita",
                last_name="KC",
                date_of_birth=date(1973, 2, 18),
                gender="Female",
                phone="+977 9834567890",
                email="sarita.kc@example.com",
                address="Boudha, Kathmandu",
                blood_group="AB+",
                allergies="Sulfa drugs",
                medical_notes=(
                    "Bilateral hip pain with early osteoarthritis. "
                    "Working on mobility, hip strengthening, and functional exercises."
                ),
                assigned_therapist_id=therapists[0].id,
                status="On hold",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=22),
            ),
            Patient(
                first_name="Hari",
                last_name="Bhandari",
                date_of_birth=date(1962, 7, 30),
                gender="Male",
                phone="+977 9845678901",
                email="hari.bhandari@example.com",
                address="Maharajgunj, Kathmandu",
                blood_group="O-",
                allergies="None reported",
                medical_notes=(
                    "Post-operative rehabilitation following left total knee replacement. "
                    "Working on range of motion, gait training, and lower-limb strength."
                ),
                assigned_therapist_id=therapists[3].id,
                status="Active",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=19),
            ),
            Patient(
                first_name="Nischal",
                last_name="Rai",
                date_of_birth=date(1997, 6, 14),
                gender="Male",
                phone="+977 9856789012",
                email="nischal.rai@example.com",
                address="Koteshwor, Kathmandu",
                blood_group="A-",
                allergies="Aspirin",
                medical_notes=(
                    "High ankle sprain following recreational football. "
                    "Currently progressing through balance, proprioception, and strengthening exercises."
                ),
                assigned_therapist_id=therapists[1].id,
                status="Active",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=15),
            ),
            Patient(
                first_name="Pratiksha",
                last_name="Magar",
                date_of_birth=date(1991, 1, 8),
                gender="Female",
                phone="+977 9867890123",
                email="pratiksha.magar@example.com",
                address="Bhaktapur, Bagmati",
                blood_group="B-",
                allergies="None reported",
                medical_notes=(
                    "Postural neck and upper-back stiffness associated with prolonged "
                    "computer work. Following posture correction and strengthening program."
                ),
                assigned_therapist_id=therapists[2].id,
                status="Completed",
                is_active=True,
                created_at=datetime.utcnow() - timedelta(days=40),
            ),
            Patient(
                first_name="Ramesh",
                last_name="Adhikari",
                date_of_birth=date(1966, 10, 19),
                gender="Male",
                phone="+977 9878901234",
                email="ramesh.adhikari@example.com",
                address="Chabahil, Kathmandu",
                blood_group="O+",
                allergies="Dust, Pollen",
                medical_notes=(
                    "Cervical radiculopathy with intermittent numbness in the left arm. "
                    "Receiving gentle manual therapy, mobility exercises, and postural education."
                ),
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
                reason="ACL Rehabilitation Session 4",
                notes=(
                    "Ref: PHY-NEP-829101. Good quadriceps activation. "
                    "Patient reports reduced swelling and improved walking tolerance."
                ),
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
                reason="Shoulder Mobility & Rotator Cuff Rehabilitation",
                notes=(
                    "Ref: PHY-NEP-829102. Patient reports pain reduced "
                    "from 7/10 to 3/10 after previous sessions."
                ),
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
                reason="Post-operative Knee Rehabilitation",
                notes=(
                    "Ref: PHY-NEP-829103. Focus on knee flexion, "
                    "quadriceps activation, and gait training."
                ),
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
                reason="Ankle Proprioception & Rehabilitation",
                notes=(
                    "Ref: PHY-NEP-829104. Patient progressing well "
                    "and preparing to return to recreational football."
                ),
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
                reason="Cervical Radiculopathy Follow-up",
                notes=(
                    "Ref: PHY-NEP-829105. Review arm symptoms, "
                    "cervical mobility, and neurological signs."
                ),
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
                reason="ACL Strength Progress Assessment",
                notes=(
                    "Ref: PHY-NEP-829106. Assess lower-limb strength "
                    "and progress rehabilitation exercises."
                ),
                created_by=admin.id,
                is_deleted=False,
            ),

            # Past appointment
            Appointment(
                patient_id=patients[1].id,
                therapist_id=therapists[1].id,
                appointment_date=today - timedelta(days=3),
                start_time="11:00",
                end_time="11:45",
                status="Completed",
                reason="Final Lower Back Rehabilitation Assessment",
                notes=(
                    "Ref: PHY-NEP-829100. Patient completed the rehabilitation "
                    "program and was provided with a home exercise plan."
                ),
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
                subtotal=1800.00,
                discount=200.00,
                tax=0.00,
                total=1600.00,
                status="Paid",
                notes=(
                    "Sports rehabilitation session including ACL exercises, "
                    "manual therapy, and strengthening."
                ),
            ),
            Invoice(
                invoice_number="INV-20260925-1002",
                patient_id=patients[2].id,
                appointment_id=appointments[1].id,
                invoice_date=today,
                subtotal=1500.00,
                discount=0.00,
                tax=0.00,
                total=1500.00,
                status="Due",
                notes=(
                    "Shoulder rehabilitation including manual therapy, "
                    "mobility exercises, and therapeutic exercise."
                ),
            ),
            Invoice(
                invoice_number="INV-20260924-1003",
                patient_id=patients[4].id,
                appointment_id=None,
                invoice_date=today - timedelta(days=1),
                subtotal=2200.00,
                discount=200.00,
                tax=0.00,
                total=2000.00,
                status="Paid",
                notes=(
                    "Post-operative knee rehabilitation including mobility, "
                    "strengthening, and gait training."
                ),
            ),
            Invoice(
                invoice_number="INV-20260922-1004",
                patient_id=patients[1].id,
                appointment_id=appointments[6].id,
                invoice_date=today - timedelta(days=3),
                subtotal=1500.00,
                discount=100.00,
                tax=0.00,
                total=1400.00,
                status="Paid",
                notes=(
                    "Final clinical assessment, lumbar mobility work, "
                    "and discharge exercise program."
                ),
            ),
            Invoice(
                invoice_number="INV-20260920-1005",
                patient_id=patients[5].id,
                appointment_id=None,
                invoice_date=today - timedelta(days=5),
                subtotal=1500.00,
                discount=0.00,
                tax=0.00,
                total=1500.00,
                status="Due",
                notes=(
                    "Ankle rehabilitation assessment, proprioception training, "
                    "and therapeutic taping."
                ),
            ),
        ]

        session.add_all(invoices)
        session.commit()

        print("Database successfully seeded with realistic Nepal clinic data!")


if __name__ == "__main__":
    seed()