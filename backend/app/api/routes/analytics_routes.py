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
    # Run counts in a single aggregation pipeline using $facet to avoid multiple round-trips
    facet_pipeline = [
        {
            "$facet": {
                "total": [{"$count": "count"}],
                "accepted": [
                    {"$match": {"compliance_status": "ACCEPTED"}},
                    {"$count": "count"}
                ],
                "rejected": [
                    {"$match": {"compliance_status": "REJECTED"}},
                    {"$count": "count"}
                ],
                "warnings": [
                    {"$match": {"risk_flags": {"$exists": True, "$ne": []}}},
                    {"$count": "count"}
                ]
            }
        }
    ]
    
    facet_results = await db.supplies.aggregate(facet_pipeline).to_list(length=1)
    facet_data = facet_results[0] if facet_results else {}
    
    total = facet_data.get("total", [{}])[0].get("count", 0) if facet_data.get("total") else 0
    accepted = facet_data.get("accepted", [{}])[0].get("count", 0) if facet_data.get("accepted") else 0
    rejected = facet_data.get("rejected", [{}])[0].get("count", 0) if facet_data.get("rejected") else 0
    warnings = facet_data.get("warnings", [{}])[0].get("count", 0) if facet_data.get("warnings") else 0

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
    from collections import defaultdict
    
    # 1. Fetch all datasets into memory once to prevent N+1 database queries
    suppliers_list = await db.suppliers.find().to_list(length=None)
    supplies_list = await db.supplies.find().to_list(length=None)
    medicines_list = await db.medicines.find().to_list(length=None)
    
    # Create fast in-memory lookup tables
    suppliers_dict = {str(s["_id"]): s for s in suppliers_list}
    medicines_dict = {str(m["_id"]): m for m in medicines_list}
    
    # Group supplies by supplier_id for in-memory score calculation
    supplies_by_supplier = defaultdict(list)
    for s in supplies_list:
        if s.get("is_deleted") is not True:
            supplies_by_supplier[str(s.get("supplier_id"))].append(s)
            
    # Helper to compute supplier score in memory
    def compute_supplier_score_in_memory(supplies):
        total = len(supplies)
        rejected = sum(1 for s in supplies if s.get("compliance_status") == "REJECTED")
        warnings = sum(1 for s in supplies if s.get("risk_flags"))
        fake = sum(1 for s in supplies if s.get("fake_status") == "FAKE")
        
        if total == 0:
            return {
                "score": 100,
                "risk_level": "LOW",
                "rejection_rate": 0,
                "warning_rate": 0,
                "fake_item_rate": 0
            }
            
        rejection_rate = rejected / total
        warning_rate = warnings / total
        fake_rate = fake / total
        
        score = 100 - (
            rejection_rate * 40 +
            warning_rate * 30 +
            fake_rate * 30
        ) * 100
        score = max(0, int(score))
        
        if score > 75:
            risk = "LOW"
        elif score > 40:
            risk = "MEDIUM"
        else:
            risk = "HIGH"
            
        return {
            "score": score,
            "risk_level": risk,
            "rejection_rate": round(rejection_rate * 100, 1),
            "warning_rate": round(warning_rate * 100, 1),
            "fake_item_rate": round(fake_rate * 100, 1)
        }

    # 1. Get high-risk suppliers with trust scores (calculated in memory)
    high_risk_suppliers = []
    for supplier in suppliers_list:
        s_id = str(supplier["_id"])
        supplier_supplies = supplies_by_supplier.get(s_id, [])
        score = compute_supplier_score_in_memory(supplier_supplies)
        if score.get("risk_level") in ["MEDIUM", "HIGH"]:
            high_risk_suppliers.append({
                "supplier_id": s_id,
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
    
    # 2. Get fake medicine detections (filtered in memory)
    fake_medicines = []
    fake_supplies = [s for s in supplies_list if s.get("is_fake") is True and s.get("is_deleted") is not True]
    for supply in fake_supplies:
        med_id = str(supply.get("medicine_id", ""))
        sup_id = str(supply.get("supplier_id", ""))
        medicine_doc = medicines_dict.get(med_id)
        supplier_doc = suppliers_dict.get(sup_id)
        
        fake_medicines.append({
            "supply_id": str(supply["_id"]),
            "medicine_name": medicine_doc.get("name", "Unknown") if medicine_doc else "Unknown",
            "supplier_name": supplier_doc.get("name", "Unknown") if supplier_doc else "Unknown",
            "detected_at": supply.get("created_at", datetime.utcnow()).isoformat(),
            "batch_number": supply.get("batch_number", ""),
            "severity": "CRITICAL"
        })
    
    fake_medicines = fake_medicines[:10]  # Top 10
    
    # 3. Get anomalies (calculated using in-memory list)
    anomaly_result = await run_anomaly_detection(supplies_list)
    anomalies = []
    if anomaly_result.get("anomalies"):
        # Create a fast lookup for supplies
        supplies_dict = {str(s["_id"]): s for s in supplies_list}
        for anomaly_id in anomaly_result["anomalies"][:10]:
            supply = supplies_dict.get(anomaly_id)
            if supply:
                med_id = str(supply.get("medicine_id", ""))
                medicine_doc = medicines_dict.get(med_id)
                anomalies.append({
                    "supply_id": anomaly_id,
                    "medicine": medicine_doc.get("name", "Unknown") if medicine_doc else "Unknown",
                    "temperature": supply.get("temperature", "N/A"),
                    "quantity": supply.get("quantity", "N/A"),
                    "detected_at": supply.get("created_at", datetime.utcnow()).isoformat(),
                    "severity": "WARNING"
                })
    
    # 4. Get corruption flags (calculated in memory)
    corruption_result = await detect_corruption_patterns(supplies_list, suppliers_list)
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
    
    # 5. Get priority usage recommendations (calculated in memory)
    priority_result = await calculate_priority(supplies_list)
    priority_usage = []
    for item in priority_result[:15]:  # Top 15
        if item.get("recommendation") in ["USE_IMMEDIATELY", "USE_SOON"]:
            med_id = str(item.get("medicine_id", ""))
            medicine_doc = medicines_dict.get(med_id)
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
