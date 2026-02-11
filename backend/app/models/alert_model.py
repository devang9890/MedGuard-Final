from pydantic import BaseModel
from datetime import datetime

class Alert(BaseModel):
    supply_id: str
    message: str
    severity: str
    created_at: datetime = datetime.utcnow()
