from datetime import datetime, timedelta

from fastapi import APIRouter
from app.db.mongodb import db

router = APIRouter()


@router.get("/dashboard")
async def dashboard_analytics():
    total = await db.supplies.count_documents({})
    accepted = await db.supplies.count_documents({"compliance_status": "ACCEPTED"})
    rejected = await db.supplies.count_documents({"compliance_status": "REJECTED"})
    warnings = await db.supplies.count_documents({
        "risk_flags": {"$exists": True, "$ne": []}
    })

    near_expiry_date = datetime.utcnow() + timedelta(days=30)

    near_expiry = []
    near_expiry_pipeline = [
        {"$match": {"expiry_date": {"$lte": near_expiry_date}}},
        {
            "$lookup": {
                "from": "medicines",
                "localField": "medicine_id",
                "foreignField": "_id",
                "as": "medicine"
            }
        },
        {
            "$lookup": {
                "from": "suppliers",
                "localField": "supplier_id",
                "foreignField": "_id",
                "as": "supplier"
            }
        },
        {
            "$addFields": {
                "medicine_name": {
                    "$ifNull": [{"$arrayElemAt": ["$medicine.name", 0]}, "Unknown"]
                },
                "supplier_name": {
                    "$ifNull": [{"$arrayElemAt": ["$supplier.name", 0]}, "Unknown"]
                }
            }
        },
        {"$project": {"medicine": 0, "supplier": 0}}
    ]

    async for supply in db.supplies.aggregate(near_expiry_pipeline):
        supply["_id"] = str(supply["_id"])
        supply["medicine_id"] = str(supply["medicine_id"])
        supply["supplier_id"] = str(supply["supplier_id"])
        near_expiry.append(supply)

    supplier_risk = []
    pipeline = [
        {
            "$group": {
                "_id": "$supplier_id",
                "rejected": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$compliance_status", "REJECTED"]},
                            1,
                            0
                        ]
                    }
                },
                "warnings": {
                    "$sum": {
                        "$cond": [
                            {
                                "$gt": [
                                    {"$size": {"$ifNull": ["$risk_flags", []]}},
                                    0
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            "$addFields": {
                "riskScore": {"$add": ["$rejected", "$warnings"]}
            }
        },
        {
            "$lookup": {
                "from": "suppliers",
                "localField": "_id",
                "foreignField": "_id",
                "as": "supplier"
            }
        },
        {
            "$addFields": {
                "supplier_name": {
                    "$ifNull": [{"$arrayElemAt": ["$supplier.name", 0]}, "Unknown"]
                }
            }
        },
        {"$project": {"supplier": 0}}
    ]

    async for row in db.supplies.aggregate(pipeline):
        supplier_risk.append({
            "supplier": row["supplier_name"],
            "supplier_id": str(row["_id"]),
            "riskScore": row["riskScore"],
            "rejected": row["rejected"],
            "warnings": row["warnings"]
        })

    return {
        "total_supplies": total,
        "accepted": accepted,
        "warnings": warnings,
        "rejected": rejected,
        "near_expiry": near_expiry,
        "supplier_risk": supplier_risk
    }
