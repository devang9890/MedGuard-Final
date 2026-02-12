from fastapi import APIRouter
from app.services.anomaly_service import run_anomaly_detection

router = APIRouter()

@router.get("/anomaly")
async def detect_anomalies():
    """Detect anomalies in supply data using Isolation Forest."""
    return await run_anomaly_detection()
