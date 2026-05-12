from database import SessionLocal, engine, Base
from models import User
from auth import get_password_hash
import os
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

db = SessionLocal()

SUPERADMIN_EMAIL = os.getenv("SUPERADMIN_EMAIL", "admin@viewpulse.com")
SUPERADMIN_PASSWORD = os.getenv("SUPERADMIN_PASSWORD", "V!ewPulse#2024Admin")

super_admin = db.query(User).filter(User.email == SUPERADMIN_EMAIL).first()
if not super_admin:
    super_admin = User(
        id="super1",
        company_name="ViewPulse HQ",
        name="Alex Rivera",
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
    print(f"[SKIP] Super Admin already exists: {SUPERADMIN_EMAIL}")

db.close()
print("[DONE] Database seeded successfully.")
print(f"\nSuper Admin Credentials:")
print(f"  Email:    {SUPERADMIN_EMAIL}")
print(f"  Password: {SUPERADMIN_PASSWORD}")
