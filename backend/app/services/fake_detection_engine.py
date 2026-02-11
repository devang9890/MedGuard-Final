from app.db.mongodb import db
from bson import ObjectId


async def detect_fake_medicine(supply):
    flags = []
    verdict = "AUTHENTIC"

    # 1) Duplicate batch check across suppliers
    duplicate = await db.supplies.find_one(
        {
            "batch_number": supply["batch_number"],
            "supplier_id": {"$ne": supply["supplier_id"]},
        }
    )

    if duplicate:
        verdict = "SUSPICIOUS"
        flags.append("DUPLICATE_BATCH_DIFFERENT_SUPPLIER")

    # 2) Manufacturer mismatch
    medicine = await db.medicines.find_one({"_id": ObjectId(supply["medicine_id"])})

    if not medicine:
        verdict = "FAKE"
        flags.append("MEDICINE_NOT_REGISTERED")

    # 3) Unknown batch pattern (first time batch)
    existing_batch = await db.supplies.find_one({"batch_number": supply["batch_number"]})

    if not existing_batch:
        flags.append("NEW_BATCH")

    return verdict, flags
