from bson import ObjectId
from app.db.mongodb import get_collection
from app.schemas.supplier_schema import SupplierCreate
import random

supplier_collection = get_collection("suppliers")

async def add_supplier(supplier_data: SupplierCreate):
    supplier_dict = supplier_data.model_dump()
    supplier_dict["verified"] = False
    supplier_dict["blacklisted"] = False
    
    # Add default coordinates within India if not provided (for demo)
    if not supplier_dict.get("lat") or not supplier_dict.get("lng"):
        # Random coordinates within India boundaries
        supplier_dict["lat"] = random.uniform(8.4, 35.5)  # India latitude range
        supplier_dict["lng"] = random.uniform(68.7, 97.4)  # India longitude range
    
    result = await supplier_collection.insert_one(supplier_dict)
    new_supplier = await supplier_collection.find_one({"_id": result.inserted_id})
    new_supplier["_id"] = str(new_supplier["_id"])
    new_supplier["id"] = new_supplier["_id"]
    return new_supplier

async def verify_supplier(supplier_id: str):
    await supplier_collection.update_one(
        {"_id": ObjectId(supplier_id)},
        {"$set": {"verified": True, "blacklisted": False}}
    )
    updated_supplier = await supplier_collection.find_one({"_id": ObjectId(supplier_id)})
    if updated_supplier:
        updated_supplier["_id"] = str(updated_supplier["_id"])
        updated_supplier["id"] = updated_supplier["_id"]
    return updated_supplier

async def blacklist_supplier(supplier_id: str):
    await supplier_collection.update_one(
        {"_id": ObjectId(supplier_id)},
        {"$set": {"blacklisted": True, "verified": False}}
    )
    updated_supplier = await supplier_collection.find_one({"_id": ObjectId(supplier_id)})
    if updated_supplier:
        updated_supplier["_id"] = str(updated_supplier["_id"])
        updated_supplier["id"] = updated_supplier["_id"]
    return updated_supplier

async def get_all_suppliers():
    suppliers = []
    cursor = supplier_collection.find({"is_deleted": {"$ne": True}})
    async for supplier in cursor:
        supplier["_id"] = str(supplier["_id"])
        supplier["id"] = supplier["_id"]
        
        # Add default coordinates if missing (for existing data)
        if not supplier.get("lat") or not supplier.get("lng"):
            supplier["lat"] = random.uniform(8.4, 35.5)
            supplier["lng"] = random.uniform(68.7, 97.4)
            # Optionally update in DB
            await supplier_collection.update_one(
                {"_id": ObjectId(supplier["_id"])},
                {"$set": {"lat": supplier["lat"], "lng": supplier["lng"]}}
            )
        
        suppliers.append(supplier)
    return suppliers
