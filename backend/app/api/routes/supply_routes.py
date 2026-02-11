from fastapi import APIRouter, HTTPException
from app.schemas.supply_schema import SupplyCreate
from app.services.supply_service import intake_supply, list_supplies
from app.db.mongodb import db
from bson import ObjectId

router = APIRouter()


# 🚀 Intake new supply batch
@router.post("/intake")
async def intake(data: SupplyCreate):
    return await intake_supply(data)


# 📋 List all supply records
@router.get("/all")
async def get_all():
    return await list_supplies()


# 🔎 Get single supply by ID
@router.get("/{supply_id}")
async def get_supply(supply_id: str):
    supply = await db.supplies.find_one({"_id": ObjectId(supply_id)})
    
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    
    supply["_id"] = str(supply["_id"])
    return supply
