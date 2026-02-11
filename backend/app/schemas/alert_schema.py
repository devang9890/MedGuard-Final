from pydantic import BaseModel

class AlertCreate(BaseModel):
    supply_id: str
    message: str
    severity: str
