from fastapi import APIRouter
from app.db.mongodb import db

router = APIRouter()


@router.get("/all")
async def get_alerts():
    alerts = []
    async for a in db.alerts.find():
        a["_id"] = str(a["_id"])
        alerts.append(a)
    return alerts
