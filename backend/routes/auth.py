from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import LoginRequest, Token, UserCreate, UserUpdate, UserResponse
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    require_super_admin,
    encrypt_company_password,
    decrypt_company_password,
)
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if user.status == "Inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact your admin.",
        )
    token = create_access_token(data={"sub": user.id, "is_super_admin": user.is_super_admin})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/super-admin/companies", status_code=status.HTTP_201_CREATED)
def create_company(
    company_data: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    existing = db.query(User).filter(User.email == company_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = User(
        id=str(uuid.uuid4()),
        company_name=company_data.company_name,
        name=company_data.name,
        email=company_data.email,
        hashed_password=get_password_hash(company_data.password),
        encrypted_company_password=encrypt_company_password(company_data.password),
        role=company_data.role,
        status=company_data.status,
        is_super_admin=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Company access created", "user_id": new_user.id}


@router.get("/super-admin/companies", response_model=list[UserResponse])
def get_all_companies(db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    companies = db.query(User).filter(User.is_super_admin == False).all()
    return companies


@router.get("/super-admin/companies/{company_id}", response_model=UserResponse)
def get_company(company_id: str, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    user = db.query(User).filter(User.id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Company not found")
    return user


@router.put("/super-admin/companies/{company_id}")
def update_company(
    company_id: str,
    updates: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    user = db.query(User).filter(User.id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Company not found")

    update_data = updates.model_dump(exclude_unset=True)
    if "password" in update_data:
        new_password = update_data.pop("password")
        update_data["hashed_password"] = get_password_hash(new_password)
        update_data["encrypted_company_password"] = encrypt_company_password(new_password)
    if "company_name" in update_data:
        update_data["company_name"] = update_data.pop("company_name")

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return {"message": "Company updated"}


@router.get("/super-admin/companies/{company_id}/password")
def get_company_password(
    company_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    user = db.query(User).filter(User.id == company_id, User.is_super_admin == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="Company not found")
    if not user.encrypted_company_password:
        raise HTTPException(status_code=404, detail="No saved password for this company")
    try:
        plain = decrypt_company_password(user.encrypted_company_password)
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to decrypt company password")
    return {
        "company_id": user.id,
        "company_name": user.company_name,
        "email": user.email,
        "password": plain,
    }


@router.delete("/super-admin/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    user = db.query(User).filter(User.id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(user)
    db.commit()
    return None


@router.put("/me")
def update_profile(
    updates: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = updates.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    if "company_name" in update_data and not current_user.is_super_admin:
        update_data["company_name"] = update_data.pop("company_name")
    if "email" in update_data and not current_user.is_super_admin:
        existing = db.query(User).filter(User.email == update_data["email"], User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

    for key, value in update_data.items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated"}
