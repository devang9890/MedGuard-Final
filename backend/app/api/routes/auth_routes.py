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
    try:
        token = await login_user(user)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection error: {str(e)}. Please check MongoDB connectivity."
        )
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return token

@router.post("/seed-admin")
async def seed_admin():
    """Create default admin users for testing"""
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
    
    try:
        created_count = 0
        for user in admin_users:
            existing = await db.users.find_one({"email": user["email"]})
            if not existing:
                await db.users.insert_one(user)
                created_count += 1
                
        return {"message": f"{created_count} admin user(s) created successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database connection error: {str(e)}"
        )
