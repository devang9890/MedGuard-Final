from app.db.mongodb import db
from app.core.security import hash_password, verify_password
from app.core.jwt_handler import create_access_token


async def signup_user(user):
    user_dict = user.dict()
    user_dict["hashed_password"] = hash_password(user_dict.pop("password"))

    await db.users.insert_one(user_dict)
    return {"message": "User created"}


async def login_user(user):
    try:
        print(f"Attempting login for: {user.email}")
        db_user = await db.users.find_one({"email": user.email})
        if not db_user:
            print("User not found in DB")
            return None

        # Support both 'hashed_password' (new) and 'password' (old/Node) fields
        stored_password = db_user.get("hashed_password") or db_user.get("password")
        
        if not stored_password:
            print("No password hash found for user")
            print(f"User keys: {db_user.keys()}")
            return None

        if not verify_password(user.password, stored_password):
            print("Password verification failed")
            return None

        token = create_access_token({
            "sub": db_user["email"],
            "role": db_user.get("role", "user")
        })
        
        print("Login successful, token generated")
        return {"access_token": token}
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
