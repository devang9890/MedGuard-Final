from fastapi import APIRouter, HTTPException
from app.schemas.auth_schema import UserSignup, UserLogin
from app.services.auth_service import signup_user, login_user
from app.db.mongodb import db
from app.core.security import hash_password

router = APIRouter()

@router.post("/signup")
async def signup(user: UserSignup):
    return await signup_user(user)

@router.post("/login")
async def login(user: UserLogin):
    token = await login_user(user)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return token

@router.post("/seed-admin")
async def seed_admin():
    """Create a default admin user for testing"""
    admin_user = {
        "name": "Admin",
        "email": "admin@gmail.com",
        "hashed_password": hash_password("123456"),
        "role": "admin",
        "is_active": True
    }
    
    existing = await db.users.find_one({"email": admin_user["email"]})
    if existing:
        return {"message": "Admin user already exists"}
    
    await db.users.insert_one(admin_user)
    return {"message": "Admin user created successfully"}
