from datetime import datetime
from app.db.mongodb import get_collection
from bson import ObjectId

supplier_collection = get_collection("suppliers")


async def run_compliance_check(supply):
    flags = []
    status = "ACCEPTED"

    # 1️⃣ Expiry check
    if supply["expiry_date"] < datetime.utcnow():
        status = "REJECTED"
        flags.append("EXPIRED")

    # 2️⃣ Supplier checks
    supplier = await supplier_collection.find_one(
        {"_id": ObjectId(supply["supplier_id"])}
    )

    if supplier:
        if supplier.get("blacklisted"):
            status = "REJECTED"
            flags.append("BLACKLISTED_SUPPLIER")

        if not supplier.get("verified"):
            flags.append("UNVERIFIED_SUPPLIER")

    else:
        flags.append("SUPPLIER_NOT_FOUND")

    # 3️⃣ Temperature check
    if supply["temperature"] > 8:
        flags.append("TEMPERATURE_ALERT")

    return status, flags
