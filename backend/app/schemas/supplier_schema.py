from pydantic import BaseModel, Field

class SupplierCreate(BaseModel):
    name: str
    email: str
    phone: str
    address: str
    license_number: str | None = Field(default=None, alias="licenseNumber")
    lat: float | None = None
    lng: float | None = None

    model_config = {
        "populate_by_name": True
    }

class SupplierUpdate(BaseModel):
    verified: bool | None = None
    blacklisted: bool | None = None
