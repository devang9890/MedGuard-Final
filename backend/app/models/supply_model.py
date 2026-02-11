from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Supply(BaseModel):
    medicine_id: str
    supplier_id: str

    batch_number: str
    expiry_date: datetime

    temperature: float
    quantity: int

    compliance_status: str = "PENDING"
    risk_flags: list[str] = []

    is_deleted: bool = False
    deleted_at: Optional[datetime] = None

    created_at: datetime = datetime.utcnow()
