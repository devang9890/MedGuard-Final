from pydantic import BaseModel
from datetime import datetime

class SupplyCreate(BaseModel):
    medicine_id: str
    supplier_id: str
    batch_number: str
    expiry_date: datetime
    temperature: float
    quantity: int
