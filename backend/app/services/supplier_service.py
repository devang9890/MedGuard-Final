from app.db.mongodb import db
from datetime import datetime

async def add_supplier(data):
    supplier = data.dict()
    supplier["verified"] = False
    supplier["blacklisted"] = False
    supplier["created_at"] = datetime.utcnow()

    result = await db.suppliers.insert_one(supplier)
    return {"message": "Supplier added", "id": str(result.inserted_id)}


async def verify_supplier(supplier_id):
    await db.suppliers.update_one(
        {"_id": supplier_id},
        {"$set": {"verified": True}}
    )
    return {"message": "Supplier verified"}


async def blacklist_supplier(supplier_id):
    await db.suppliers.update_one(
        {"_id": supplier_id},
        {"$set": {"blacklisted": True}}
    )
    return {"message": "Supplier blacklisted"}


async def get_suppliers():
    suppliers = []
    async for s in db.suppliers.find():
        s["_id"] = str(s["_id"])
        suppliers.append(s)
    return suppliers
