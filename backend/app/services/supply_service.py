from app.db.mongodb import db
from datetime import datetime
from bson import ObjectId
from app.services.compliance_engine import run_compliance_check
from app.services.alert_service import create_alert
from app.services.fake_detection_engine import detect_fake_medicine

async def intake_supply(supply_data):
    supply = supply_data.dict()

    supply["medicine_id"] = ObjectId(supply["medicine_id"])
    supply["supplier_id"] = ObjectId(supply["supplier_id"])
    supply["created_at"] = datetime.utcnow()

    # compliance check
    status, flags = await run_compliance_check(supply)

    # fake detection
    fake_verdict, fake_flags = await detect_fake_medicine(supply)

    supply["compliance_status"] = status
    supply["risk_flags"] = flags + fake_flags
    supply["fake_status"] = fake_verdict

    result = await db.supplies.insert_one(supply)
    supply_id = str(result.inserted_id)

    # 🚨 AUTO ALERT GENERATION
    for flag in supply["risk_flags"]:
        severity = "HIGH" if status == "REJECTED" else "MEDIUM"
        await create_alert(supply_id, flag, severity)

    supply["id"] = supply_id
    supply["medicine_id"] = str(supply["medicine_id"])
    supply["supplier_id"] = str(supply["supplier_id"])
    return supply

async def list_supplies():
    supplies = []
    async for s in db.supplies.find({"is_deleted": {"$ne": True}}):
        s["id"] = str(s["_id"])
        s["medicine_id"] = str(s["medicine_id"])
        s["supplier_id"] = str(s["supplier_id"])
        supplies.append(s)
    return supplies

async def get_supply_by_id(supply_id: str):
    supply = await db.supplies.find_one({"_id": ObjectId(supply_id)})
    if supply:
        supply["_id"] = str(supply["_id"])
        supply["medicine_id"] = str(supply["medicine_id"])
        supply["supplier_id"] = str(supply["supplier_id"])
    return supply
