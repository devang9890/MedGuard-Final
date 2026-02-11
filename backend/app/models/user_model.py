from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    name: str
    email: str
    hashed_password: str
    role: str
    is_active: bool = True
