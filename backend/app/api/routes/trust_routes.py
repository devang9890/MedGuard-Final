from fastapi import APIRouter
from app.services.trust_score_service import calculate_supplier_score
from bson import ObjectId

router = APIRouter()

@router.get("/{supplier_id}")
async def get_trust_score(supplier_id: str):
    return await calculate_supplier_score(ObjectId(supplier_id))
