from datetime import datetime, timedelta
from bson import ObjectId

from fastapi import APIRouter
from app.db.mongodb import db
from app.services.anomaly_service import run_anomaly_detection
from app.services.corruption_engine import detect_corruption_patterns
from app.services.predictive_service import calculate_priority
from app.services.trust_score_service import calculate_supplier_score

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


@router.get("/ai-insights")
async def get_ai_insights():
    """Aggregate all AI intelligence signals into single dashboard view."""
    
    # 1. Get high-risk suppliers with trust scores
    high_risk_suppliers = []
    async for supplier in db.suppliers.find():
        score = await calculate_supplier_score(str(supplier["_id"]))
        if score.get("risk_level") in ["MEDIUM", "HIGH"]:
            high_risk_suppliers.append({
                "supplier_id": str(supplier["_id"]),
                "name": supplier.get("name", "Unknown"),
                "email": supplier.get("email", ""),
                "trust_score": score.get("score", 0),
                "risk_level": score.get("risk_level"),
                "rejection_rate": score.get("rejection_rate", 0),
                "warning_rate": score.get("warning_rate", 0),
                "fake_item_rate": score.get("fake_item_rate", 0)
            })
    
    # Sort by risk level (HIGH first)
    high_risk_suppliers.sort(key=lambda x: (x["risk_level"] != "HIGH", -x["trust_score"]))
    high_risk_suppliers = high_risk_suppliers[:10]  # Top 10
    
    # 2. Get fake medicine detections
    fake_medicines = []
    async for supply in db.supplies.find({"is_fake": True, "is_deleted": {"$ne": True}}):
        medicine_doc = await db.medicines.find_one({"_id": supply.get("medicine_id")})
        supplier_doc = await db.suppliers.find_one({"_id": supply.get("supplier_id")})
        
        fake_medicines.append({
            "supply_id": str(supply["_id"]),
            "medicine_name": medicine_doc.get("name", "Unknown") if medicine_doc else "Unknown",
            "supplier_name": supplier_doc.get("name", "Unknown") if supplier_doc else "Unknown",
            "detected_at": supply.get("created_at", datetime.utcnow()).isoformat(),
            "batch_number": supply.get("batch_number", ""),
            "severity": "CRITICAL"
        })
    
    fake_medicines = fake_medicines[:10]  # Top 10
    
    # 3. Get anomalies
    anomaly_result = await run_anomaly_detection()
    anomalies = []
    if anomaly_result.get("anomalies"):
        for anomaly_id in anomaly_result["anomalies"][:10]:
            try:
                supply = await db.supplies.find_one({"_id": ObjectId(anomaly_id)})
                if supply:
                    medicine_doc = await db.medicines.find_one({"_id": supply.get("medicine_id")})
                    anomalies.append({
                        "supply_id": str(supply["_id"]),
                        "medicine": medicine_doc.get("name", "Unknown") if medicine_doc else "Unknown",
                        "temperature": supply.get("temperature", "N/A"),
                        "quantity": supply.get("quantity", "N/A"),
                        "detected_at": supply.get("created_at", datetime.utcnow()).isoformat(),
                        "severity": "WARNING"
                    })
            except:
                pass
    
    # 4. Get corruption flags
    corruption_result = await detect_corruption_patterns()
    corruption_flags = []
    flags_list = corruption_result.get("flags", []) if isinstance(corruption_result, dict) else corruption_result
    for flag in flags_list[:10]:  # Top 10
        corruption_flags.append({
            "supplier_id": flag.get("supplier_id", ""),
            "supplier_name": flag.get("supplier_name", "Unknown"),
            "type": flag.get("type", ""),
            "detail": flag.get("detail", ""),
            "severity": flag.get("severity", "MEDIUM")
        })
    
    # 5. Get priority usage recommendations
    priority_result = await calculate_priority()
    priority_usage = []
    for item in priority_result[:15]:  # Top 15
        if item.get("recommendation") in ["USE_IMMEDIATELY", "USE_SOON"]:
            try:
                medicine_doc = await db.medicines.find_one({"_id": ObjectId(item.get("medicine_id"))}) if item.get("medicine_id") else None
            except:
                medicine_doc = None
            priority_usage.append({
                "supply_id": str(item.get("supply_id", "")),
                "medicine": medicine_doc.get("name", "Unknown") if medicine_doc else "Unknown",
                "priority": item.get("recommendation", "NORMAL"),
                "score": item.get("priority_score", 0),
                "days_to_expiry": item.get("days_to_expiry"),
                "reason": f"Priority: {item.get('recommendation')}"
            })
    
    # 6. Get live alerts
    alerts = []
    async for alert in db.alerts.find().sort("created_at", -1).limit(20):
        alerts.append({
            "alert_id": str(alert["_id"]),
            "message": alert.get("message", ""),
            "severity": alert.get("severity", "INFO"),
            "created_at": alert.get("created_at", datetime.utcnow()).isoformat()
        })
    
    return {
        "high_risk_suppliers": high_risk_suppliers,
        "fake_medicines": fake_medicines,
        "anomalies": anomalies,
        "corruption_flags": corruption_flags,
        "priority_usage": priority_usage,
        "alerts": alerts,
        "summary": {
            "total_high_risk": len(high_risk_suppliers),
            "total_fake": len(fake_medicines),
            "total_anomalies": len(anomalies),
            "total_corruption": len(corruption_flags),
            "total_priority": len(priority_usage),
            "total_alerts": len(alerts)
        }
    }
