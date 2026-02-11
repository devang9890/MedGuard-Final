from bson import ObjectId
from app.db.mongodb import get_collection
from datetime import datetime

medicine_collection = get_collection("medicines")

async def add_medicine(data):
    med = data.dict()
    med["created_at"] = datetime.utcnow()

    result = await medicine_collection.insert_one(med)
    return {"message": "Medicine registered", "id": str(result.inserted_id)}

async def get_medicines():
    medicines = []
    async for m in medicine_collection.find({"is_deleted": {"$ne": True}}):
        m["_id"] = str(m["_id"])
        medicines.append(m)
    return medicines
