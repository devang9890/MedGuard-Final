from bson import ObjectId
from app.db.mongodb import get_collection
from app.schemas.supplier_schema import SupplierCreate

supplier_collection = get_collection("suppliers")

async def add_supplier(supplier_data: SupplierCreate):
    supplier_dict = supplier_data.model_dump()
    supplier_dict["is_verified"] = False
    supplier_dict["is_blacklisted"] = False
    result = await supplier_collection.insert_one(supplier_dict)
    new_supplier = await supplier_collection.find_one({"_id": result.inserted_id})
    new_supplier["id"] = str(new_supplier["_id"])
    return new_supplier

async def verify_supplier(supplier_id: str):
    await supplier_collection.update_one(
        {"_id": ObjectId(supplier_id)},
        {"$set": {"is_verified": True, "is_blacklisted": False}}
    )
    updated_supplier = await supplier_collection.find_one({"_id": ObjectId(supplier_id)})
    if updated_supplier:
        updated_supplier["id"] = str(updated_supplier["_id"])
    return updated_supplier

async def blacklist_supplier(supplier_id: str):
    await supplier_collection.update_one(
        {"_id": ObjectId(supplier_id)},
        {"$set": {"is_blacklisted": True, "is_verified": False}}
    )
    updated_supplier = await supplier_collection.find_one({"_id": ObjectId(supplier_id)})
    if updated_supplier:
        updated_supplier["id"] = str(updated_supplier["_id"])
    return updated_supplier

async def get_all_suppliers():
    suppliers = []
    cursor = supplier_collection.find({})
    async for supplier in cursor:
        supplier["id"] = str(supplier["_id"])
        suppliers.append(supplier)
    return suppliers
