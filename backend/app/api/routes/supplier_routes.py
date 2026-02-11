from fastapi import APIRouter
from app.schemas.supplier_schema import SupplierCreate
from app.services.supplier_service import (
    add_supplier,
    verify_supplier,
    blacklist_supplier,
    get_all_suppliers
)

router = APIRouter()

@router.post("/add")
async def create_supplier(data: SupplierCreate):
    return await add_supplier(data)

@router.put("/verify/{supplier_id}")
async def verify(supplier_id: str):
    return await verify_supplier(supplier_id)

@router.put("/blacklist/{supplier_id}")
async def blacklist(supplier_id: str):
    return await blacklist_supplier(supplier_id)

@router.get("/all")
async def list_suppliers():
    return await get_all_suppliers()
