from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Supplier(BaseModel):
    name: str
    email: str
    phone: str
    address: str

    verified: bool = False
    blacklisted: bool = False

    is_deleted: bool = False
    deleted_at: Optional[datetime] = None

    created_at: datetime = datetime.utcnow()
