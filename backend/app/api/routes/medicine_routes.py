from fastapi import APIRouter
from app.schemas.medicine_schema import MedicineCreate
from app.services.medicine_service import add_medicine, get_medicines

router = APIRouter()

@router.post("/add")
async def create_medicine(data: MedicineCreate):
    return await add_medicine(data)

@router.get("/all")
async def list_medicines():
    return await get_medicines()
