"""
KrishiMane Auth Module
- Database-backed user store (SQLAlchemy)
- JWT generation/validation with python-jose
- Password hashing with passlib[bcrypt]
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import jwt, JWTError
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User

load_dotenv()

# ─── Config ───────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "krishimane-super-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── Password Helpers ─────────────────────────────────────────
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


# ─── JWT Helpers ──────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# ─── Auth Operations ──────────────────────────────────────────
def register_user(name: str, email: str, phone: str, password: str) -> dict:
    """Register a new customer. Returns error dict or success dict."""
    email = email.lower().strip()
    if len(password) < 6:
        return {"error": "Password must be at least 6 characters."}

    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return {"error": "Email already registered. Please login instead."}

        user = User(
            name=name.strip(),
            email=email,
            phone=phone.strip(),
            hashed_password=hash_password(password),
            role="customer",
        )
        db.add(user)
        db.commit()

        token = create_access_token({"sub": email, "name": name.strip(), "role": "customer"})
        return {"token": token, "name": name.strip(), "role": "customer"}
    finally:
        db.close()


def login_user(email: str, password: str) -> dict:
    """Authenticate user. Returns error dict or success dict with JWT."""
    email = email.lower().strip()

    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return {"error": "No account found with this email."}
        if not verify_password(password, user.hashed_password):
            return {"error": "Incorrect password."}

        token = create_access_token({"sub": email, "name": user.name, "role": user.role})
        return {"token": token, "name": user.name, "role": user.role}
    finally:
        db.close()


def get_current_user(token: str) -> Optional[dict]:
    """Validate JWT and return user info."""
    payload = decode_token(token)
    if not payload:
        return None
    return {
        "email": payload.get("sub"),
        "name": payload.get("name"),
        "role": payload.get("role"),
    }
