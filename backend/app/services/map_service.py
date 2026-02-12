from app.db.mongodb import db
from bson import ObjectId


async def generate_risk_map():
    """Generate national risk map based on supplier supply history.
    
    Calculates risk scores based on:
    - Rejected supplies: +5 per rejection
    - Fake detections: +10 per fake
    - Risk flags/warnings: +3 per flag
    - Anomalies: detected automatically
    
    Returns:
    - List of suppliers with risk scores and zones (RED/YELLOW/GREEN)
    """
    supplier_scores = {}
    supplier_names = {}
    supplier_locations = {}
    
    # Get supplier details
    async for supplier in db.suppliers.find({"is_deleted": {"$ne": True}}):
        supplier_id = str(supplier["_id"])
        supplier_names[supplier_id] = supplier.get("name", "Unknown")
        supplier_locations[supplier_id] = {
            "address": supplier.get("address", "Unknown"),
            "lat": supplier.get("lat"),
            "lng": supplier.get("lng"),
            "verified": supplier.get("verified", False),
            "blacklisted": supplier.get("blacklisted", False)
        }
        supplier_scores[supplier_id] = 0
    
    # Analyze supply history
    async for s in db.supplies.find({"is_deleted": {"$ne": True}}):
        supplier_id = str(s.get("supplier_id"))
        
        if supplier_id not in supplier_scores:
            supplier_scores[supplier_id] = 0
        
        # Rejection penalty
        if s.get("compliance_status") == "REJECTED":
            supplier_scores[supplier_id] += 5
        
        # Fake detection penalty (very high)
        if s.get("fake_status") == "FAKE":
            supplier_scores[supplier_id] += 10
        elif s.get("fake_status") == "SUSPICIOUS":
            supplier_scores[supplier_id] += 5
        
        # Risk flags/warnings penalty
        risk_flags = s.get("risk_flags", [])
        if risk_flags and len(risk_flags) > 0:
            supplier_scores[supplier_id] += 3
    
    # Get alert counts per supplier
    alert_counts = {}
    async for alert in db.alerts.find():
        # Try to find the supply to get supplier_id
        supply_id = alert.get("supply_id")
        if supply_id:
            supply = await db.supplies.find_one({"_id": ObjectId(supply_id)})
            if supply:
                supplier_id = str(supply.get("supplier_id"))
                if supplier_id not in alert_counts:
                    alert_counts[supplier_id] = 0
                alert_counts[supplier_id] += 1
                
                # Add alert penalty
                severity = alert.get("severity", "MEDIUM")
                if severity == "HIGH":
                    supplier_scores[supplier_id] = supplier_scores.get(supplier_id, 0) + 4
                else:
                    supplier_scores[supplier_id] = supplier_scores.get(supplier_id, 0) + 2
    
    # Build results
    results = []
    
    for supplier_id, score in supplier_scores.items():
        # Adjust score based on blacklist status
        location = supplier_locations.get(supplier_id, {})
        if location.get("blacklisted"):
            score += 20  # Heavy penalty for blacklisted
        
        # Determine zone
        if score > 40:
            zone = "RED"
            risk_level = "HIGH"
        elif score > 20:
            zone = "YELLOW"
            risk_level = "MEDIUM"
        else:
            zone = "GREEN"
            risk_level = "LOW"
        
        # Only include if has location data
        if location.get("lat") and location.get("lng"):
            results.append({
                "supplier_id": supplier_id,
                "supplier_name": supplier_names.get(supplier_id, "Unknown"),
                "risk_score": score,
                "zone": zone,
                "risk_level": risk_level,
                "location": {
                    "lat": location.get("lat"),
                    "lng": location.get("lng"),
                    "address": location.get("address", "Unknown")
                },
                "verified": location.get("verified", False),
                "blacklisted": location.get("blacklisted", False),
                "alert_count": alert_counts.get(supplier_id, 0)
            })
    
    # Sort by risk score (highest first)
    results.sort(key=lambda x: x["risk_score"], reverse=True)
    
    return {
        "total_suppliers": len(results),
        "high_risk": len([r for r in results if r["zone"] == "RED"]),
        "medium_risk": len([r for r in results if r["zone"] == "YELLOW"]),
        "low_risk": len([r for r in results if r["zone"] == "GREEN"]),
        "suppliers": results
    }
