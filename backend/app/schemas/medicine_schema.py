from pydantic import BaseModel

class MedicineCreate(BaseModel):
    name: str
    manufacturer: str
    category: str
    description: str | None = None
