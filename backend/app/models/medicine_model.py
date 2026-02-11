from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Medicine(BaseModel):
    name: str
    manufacturer: str
    category: str
    description: str | None = None

    is_deleted: bool = False
    deleted_at: Optional[datetime] = None

    created_at: datetime = datetime.utcnow()
