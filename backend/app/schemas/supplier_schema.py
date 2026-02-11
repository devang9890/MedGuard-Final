from pydantic import BaseModel

class SupplierCreate(BaseModel):
    name: str
    email: str
    phone: str
    address: str

class SupplierUpdate(BaseModel):
    verified: bool | None = None
    blacklisted: bool | None = None
