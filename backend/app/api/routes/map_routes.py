from fastapi import APIRouter
from app.services.map_service import generate_risk_map

router = APIRouter()

@router.get("/national")
async def national_risk_map():
    """Generate national risk intelligence map.
    
    Returns risk scores and zones for all suppliers based on:
    - Compliance failures (rejections)
    - Fake medicine detections
    - Risk flags and warnings
    - Alert history
    - Blacklist status
    
    Zones:
    - RED: High risk (score > 40)
    - YELLOW: Medium risk (score 20-40)
    - GREEN: Low risk (score < 20)
    """
    return await generate_risk_map()
