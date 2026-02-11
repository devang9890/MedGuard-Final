from fastapi import APIRouter
from app.schemas.medicine_schema import MedicineCreate
from app.services.medicine_service import add_medicine, get_medicines
from app.services.recycle_service import (
    soft_delete,
    restore,
    permanent_delete,
    get_deleted
)

router = APIRouter()

@router.post("/add")
async def create_medicine(data: MedicineCreate):
    return await add_medicine(data)

@router.get("/all")
async def list_medicines():
    return await get_medicines()

@router.delete("/{medicine_id}")
async def delete_medicine(medicine_id: str):
    return await soft_delete("medicines", medicine_id)

@router.get("/recycle/bin")
async def recycle_bin():
    return await get_deleted("medicines")

@router.post("/restore/{medicine_id}")
async def restore_medicine(medicine_id: str):
    return await restore("medicines", medicine_id)

@router.delete("/permanent/{medicine_id}")
async def permanent_delete_medicine(medicine_id: str):
    return await permanent_delete("medicines", medicine_id)
