from fastapi import APIRouter
from app.schemas.supplier_schema import SupplierCreate
from app.services.supplier_service import (
    add_supplier,
    verify_supplier,
    blacklist_supplier,
    get_all_suppliers
)
from app.services.recycle_service import (
    soft_delete,
    restore,
    permanent_delete,
    get_deleted
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

@router.delete("/{supplier_id}")
async def delete_supplier(supplier_id: str):
    return await soft_delete("suppliers", supplier_id)

@router.get("/recycle/bin")
async def recycle_bin():
    return await get_deleted("suppliers")

@router.post("/restore/{supplier_id}")
async def restore_supplier(supplier_id: str):
    return await restore("suppliers", supplier_id)

@router.delete("/permanent/{supplier_id}")
async def permanent_delete_supplier(supplier_id: str):
    return await permanent_delete("suppliers", supplier_id)
