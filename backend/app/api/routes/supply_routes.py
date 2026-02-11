from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.supply_schema import SupplyIntake, Supply
from app.services.supply_service import intake_supply, list_supplies, get_supply_by_id
from bson import ObjectId

router = APIRouter()


# 🚀 Intake new supply batch
@router.post("/intake", response_model=Supply)
async def intake_supply_route(supply: SupplyIntake):
    """
    Record a new supply intake.
    """
    new_supply = await intake_supply(supply)
    return new_supply


# 📋 List all supply records
@router.get("/all", response_model=List[Supply])
async def list_supplies_route():
    """
    List all supply records.
    """
    supplies = await list_supplies()
    return supplies


# 🔎 Get single supply by ID
@router.get("/{supply_id}")
async def get_supply(supply_id: str):
    supply = await get_supply_by_id(supply_id)
    
    if not supply:
        raise HTTPException(status_code=404, detail="Supply not found")
    
    return supply
