from pydantic import BaseModel
from typing import List

class SupplyItem(BaseModel):
    medicine_id: str
    quantity: int
    location: str

class SupplyIntake(BaseModel):
    supplier_id: str
    items: List[SupplyItem]

class Supply(SupplyIntake):
    id: str
    timestamp: str

    class Config:
        from_attributes = True
