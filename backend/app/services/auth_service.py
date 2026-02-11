from app.db.mongodb import db
from app.core.security import hash_password, verify_password
from app.core.jwt_handler import create_access_token


async def signup_user(user):
    user_dict = user.dict()
    user_dict["hashed_password"] = hash_password(user_dict.pop("password"))

    await db.users.insert_one(user_dict)
    return {"message": "User created"}


async def login_user(user):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user:
        return None

    if not verify_password(user.password, db_user["hashed_password"]):
        return None

    token = create_access_token({
        "sub": db_user["email"],
        "role": db_user["role"]
    })

    return {"access_token": token}
