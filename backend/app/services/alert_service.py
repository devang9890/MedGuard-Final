from app.db.mongodb import db
from datetime import datetime


async def create_alert(supply_id: str, message: str, severity: str):
    alert = {
        "supply_id": supply_id,
        "message": message,
        "severity": severity,
        "created_at": datetime.utcnow()
    }

    await db.alerts.insert_one(alert)
