from database import SessionLocal, engine, Base
from models import User
from auth import get_password_hash
import os
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

db = SessionLocal()

SUPERADMIN_EMAIL = os.getenv("SUPERADMIN_EMAIL", "adminharshita12@gmail.com")
SUPERADMIN_PASSWORD = os.getenv("SUPERADMIN_PASSWORD", "harshita@123")
SUPERADMIN_NAME = os.getenv("SUPERADMIN_NAME", "Harshita Admin")
SUPERADMIN_COMPANY = os.getenv("SUPERADMIN_COMPANY", "ViewPulse HQ")

super_admin = db.query(User).filter(User.is_super_admin == True).first()
if not super_admin:
    super_admin = User(
        id="super1",
        company_name=SUPERADMIN_COMPANY,
        name=SUPERADMIN_NAME,
        email=SUPERADMIN_EMAIL,
        hashed_password=get_password_hash(SUPERADMIN_PASSWORD),
        role="Super Admin",
        status="Active",
        is_super_admin=True,
    )
    db.add(super_admin)
    db.commit()
    print(f"[OK] Super Admin created: {SUPERADMIN_EMAIL}")
else:
    super_admin.company_name = SUPERADMIN_COMPANY
    super_admin.name = SUPERADMIN_NAME
    super_admin.email = SUPERADMIN_EMAIL
    super_admin.hashed_password = get_password_hash(SUPERADMIN_PASSWORD)
    super_admin.role = "Super Admin"
    super_admin.status = "Active"
    super_admin.is_super_admin = True
    db.commit()
    print(f"[OK] Super Admin updated: {SUPERADMIN_EMAIL}")

db.close()
print("[DONE] Database seeded successfully.")
print(f"\nSuper Admin Credentials:")
print(f"  Email:    {SUPERADMIN_EMAIL}")
print(f"  Password: {SUPERADMIN_PASSWORD}")
