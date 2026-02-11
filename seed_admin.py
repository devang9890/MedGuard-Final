import asyncio
import sys
sys.path.insert(0, '/mnt/c/Users/ACER/Desktop/medd/backend')

from app.db.mongodb import db
from app.core.security import hash_password

async def seed():
    admin_user = {
        "name": "Admin",
        "email": "admin@gmail.com",
        "hashed_password": hash_password("123456"),
        "role": "admin",
        "is_active": True
    }
    
    existing = await db.users.find_one({"email": admin_user["email"]})
    if existing:
        print("Admin user already exists")
        return
    
    result = await db.users.insert_one(admin_user)
    print(f"Admin user created: {result.inserted_id}")

asyncio.run(seed())
