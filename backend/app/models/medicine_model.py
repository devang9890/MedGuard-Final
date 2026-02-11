from pydantic import BaseModel
from datetime import datetime

class Medicine(BaseModel):
    name: str
    manufacturer: str
    category: str
    description: str | None = None

    created_at: datetime = datetime.utcnow()
