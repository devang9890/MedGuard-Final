import asyncio
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongodb import db
from app.core.security import hash_password

async def seed():
    admin_users = [
        {
            "name": "Admin",
            "email": "admin@gmail.com",
            "hashed_password": hash_password("123456"),
            "role": "admin",
            "is_active": True
        },
        {
            "name": "MedGuard Admin",
            "email": "admin@medguard.com",
            "hashed_password": hash_password("admin123"),
            "role": "admin",
            "is_active": True
        }
    ]
    
    for user in admin_users:
        existing = await db.users.find_one({"email": user["email"]})
        if not existing:
            result = await db.users.insert_one(user)
            print(f"Admin user created ({user['email']}): {result.inserted_id}")
        else:
            print(f"Admin user already exists ({user['email']})")

asyncio.run(seed())
