from app.db.mongodb import get_collection
from app.schemas.supply_schema import SupplyIntake
from datetime import datetime
from bson import ObjectId

supply_collection = get_collection("supplies")

async def intake_supply(supply_data):
    supply_dict = supply_data.dict()
    supply_dict["timestamp"] = datetime.utcnow()
    
    result = await supply_collection.insert_one(supply_dict)
    
    # Return document with ID
    # We might want to return the full document to match response_model=Supply
    new_supply = await supply_collection.find_one({"_id": result.inserted_id})
    if new_supply:
        new_supply["id"] = str(new_supply["_id"])
        # Format timestamp if needed, but schema might handle datetime object -> str if Config allows
        if isinstance(new_supply["timestamp"], datetime):
             new_supply["timestamp"] = new_supply["timestamp"].isoformat()
             
    return new_supply

async def list_supplies():
    supplies = []
    async for s in supply_collection.find():
        s["id"] = str(s["_id"])
        if "timestamp" in s and isinstance(s["timestamp"], datetime):
             s["timestamp"] = s["timestamp"].isoformat()
        supplies.append(s)
    return supplies

async def get_supply_by_id(supply_id: str):
    supply = await supply_collection.find_one({"_id": ObjectId(supply_id)})
    if supply:
        supply["id"] = str(supply["_id"])
        if "timestamp" in supply and isinstance(supply["timestamp"], datetime):
             supply["timestamp"] = supply["timestamp"].isoformat()
    return supply
