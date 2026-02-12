from fastapi import APIRouter
from app.services.predictive_service import calculate_priority

router = APIRouter()

@router.get("/usage")
async def predictive_usage():
    """Get usage priority recommendations for all supplies.
    
    Returns list of supplies with priority scores and recommendations:
    - USE_IMMEDIATELY: High priority (score >= 70)
    - USE_SOON: Medium priority (score >= 40)
    - NORMAL: Standard priority (score >= 20)
    - HOLD: Low priority (score < 20)
    """
    return await calculate_priority()
