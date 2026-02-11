from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class SupplyIntake(BaseModel):
    medicine_id: str
    supplier_id: str
    batch_number: str
    expiry_date: datetime
    quantity: int
    temperature: float

class Supply(SupplyIntake):
    id: Optional[str] = None
    compliance_status: Optional[str] = None
    risk_flags: Optional[List[str]] = None
    fake_status: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
