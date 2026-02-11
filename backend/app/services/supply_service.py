from app.db.mongodb import db
from datetime import datetime
from bson import ObjectId
from app.services.compliance_engine import run_compliance_check


async def intake_supply(data):
    supply = data.dict()

    # convert to ObjectId for DB linking
    supply["medicine_id"] = ObjectId(supply["medicine_id"])
    supply["supplier_id"] = ObjectId(supply["supplier_id"])

    supply["created_at"] = datetime.utcnow()

    status, flags = await run_compliance_check(supply)

    supply["compliance_status"] = status
    supply["risk_flags"] = flags

    result = await db.supplies.insert_one(supply)

    return {
        "message": "Supply recorded",
        "status": status,
        "flags": flags,
        "id": str(result.inserted_id)
    }
