from fastapi import APIRouter
from app.services.corruption_engine import detect_corruption_patterns

router = APIRouter()

@router.get("/detect")
async def detect_corruption():
    """Detect corruption patterns in supply chain.
    
    Returns corruption flags including:
    - FAVORITISM_DETECTED: One supplier approved far more than others
    - BIAS_APPROVAL_PATTERN: 100% approval rate for a supplier
    - REPEATED_BATCH_APPROVAL: Same batch approved multiple times
    - BLACKLIST_ACCEPTED: Blacklisted supplier still getting approved
    - TARGETED_REJECTION: One supplier consistently rejected
    """
    return await detect_corruption_patterns()
