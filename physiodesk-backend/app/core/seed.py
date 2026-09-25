from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def seed_database():
    db = SessionLocal()
    try:
        # 1. Check/Create Admin User
        admin_email = "admin@physiodesk.com"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        
        if not existing_admin:
            admin_user = User(
                username="admin",
                email=admin_email,
                first_name="Admin",
                last_name="User",
                password_hash=get_password_hash("Admin#123"),
                role="admin",
                is_active=True,
            )
            db.add(admin_user)
            print("Creating default admin user...")
        else:
            print("Admin user already exists.")

        # 2. Check/Create Staff User
        staff_email = "staff@physiodesk.com"
        existing_staff = db.query(User).filter(User.email == staff_email).first()
        
        if not existing_staff:
            staff_user = User(
                username="staff",
                email=staff_email,
                first_name="Staff",
                last_name="Receptionist",
                password_hash=get_password_hash("Staff#123"),
                role="staff",
                is_active=True,
            )
            db.add(staff_user)
            print("Creating default staff user...")
        else:
            print("Staff user already exists.")

        db.commit()
        print("Database seeding completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()