#!/usr/bin/env python3
"""
Seed script: set password and profile fields on the existing demo-user-001.
Run once after applying the c1a2b3d4e5f6 migration.

Usage:
    python scripts/seed_demo_user.py
"""
import sys
import os

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from passlib.context import CryptContext
from app.core.database import SessionLocal
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_USER_ID = "demo-user-001"
DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo123"
DEMO_DISPLAY_NAME = "EchoMind Demo"


def seed() -> None:
    db = SessionLocal()
    try:
        user = db.get(User, DEMO_USER_ID)
        if not user:
            print(f"[seed] demo-user-001 not found, creating...")
            user = User(
                id=DEMO_USER_ID,
                username=DEMO_USERNAME,
                display_name=DEMO_DISPLAY_NAME,
                password_hash=pwd_context.hash(DEMO_PASSWORD),
            )
            db.add(user)
        else:
            print(f"[seed] Updating demo-user-001...")
            user.username = DEMO_USERNAME
            user.display_name = DEMO_DISPLAY_NAME
            if not user.password_hash:
                user.password_hash = pwd_context.hash(DEMO_PASSWORD)
            db.add(user)

        db.commit()
        print(f"[seed] Done! Login: username={DEMO_USERNAME}  password={DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
