from app.db.mongodb import db
from datetime import datetime

async def add_medicine(data):
    med = data.dict()
    med["created_at"] = datetime.utcnow()

    result = await db.medicines.insert_one(med)
    return {"message": "Medicine registered", "id": str(result.inserted_id)}

async def get_medicines():
    medicines = []
    async for m in db.medicines.find():
        m["_id"] = str(m["_id"])
        medicines.append(m)
    return medicines
