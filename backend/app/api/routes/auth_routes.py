from fastapi import APIRouter, HTTPException
from app.schemas.auth_schema import UserSignup, UserLogin
from app.services.auth_service import signup_user, login_user

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
