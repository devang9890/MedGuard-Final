from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.supply_schema import SupplyIntake, Supply
from app.services.supply_service import intake_supply, list_supplies, get_supply_by_id
from app.services.recycle_service import (
    soft_delete,
    restore,
    permanent_delete,
    get_deleted
)
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


@router.delete("/{supply_id}")
async def delete_supply(supply_id: str):
    return await soft_delete("supplies", supply_id)


@router.get("/recycle/bin")
async def recycle_bin():
    return await get_deleted("supplies")


@router.post("/restore/{supply_id}")
async def restore_supply(supply_id: str):
    return await restore("supplies", supply_id)


@router.delete("/permanent/{supply_id}")
async def permanent_delete_supply(supply_id: str):
    return await permanent_delete("supplies", supply_id)
