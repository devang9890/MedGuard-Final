from app.db.mongodb import db
from datetime import datetime


async def calculate_priority():
    """Calculate priority scores for all supplies.
    
    Scoring factors:
    - Expiry close: +50 if <7 days, +30 if <30 days
    - Temperature alert: +20
    - Unverified supplier: +15
    - Fake suspicion: +10
    - Large quantity: +5
    
    Recommendations:
    - >=70: USE_IMMEDIATELY
    - >=40: USE_SOON
    - >=20: NORMAL
    - <20: HOLD
    """
    results = []

    async for s in db.supplies.find({"is_deleted": {"$ne": True}}):
        score = 0

        # Expiry factor
        expiry = s.get("expiry_date")
        days_to_expiry = None
        if expiry:
            days_left = (expiry - datetime.utcnow()).days
            days_to_expiry = days_left

            if days_left < 0:
                # Already expired - mark as expired regardless of other factors
                score = 100  # High score but marked as expired
            elif days_left < 7:
                score += 50
            elif days_left < 30:
                score += 30
            elif days_left < 60:
                score += 15

        # Risk flags
        flags = s.get("risk_flags", [])
        if any("TEMPERATURE" in flag.upper() for flag in flags):
            score += 20
        if any("UNVERIFIED" in flag.upper() or "VERIFY" in flag.upper() for flag in flags):
            score += 15

        # Compliance status
        status = s.get("compliance_status")
        if status == "REJECTED":
            score += 25  # High priority to handle rejected items
        elif status == "PENDING":
            score += 10

        # Fake suspicion
        fake_status = s.get("fake_status", "")
        if fake_status in ["SUSPICIOUS", "FAKE"]:
            score += 10

        # Quantity impact
        qty = s.get("quantity", 0)
        if qty > 500:
            score += 5

        # Recommendation
        if days_to_expiry is not None and days_to_expiry < 0:
            rec = "EXPIRED"
        elif score >= 70:
            rec = "USE_IMMEDIATELY"
        elif score >= 40:
            rec = "USE_SOON"
        elif score >= 20:
            rec = "NORMAL"
        else:
            rec = "HOLD"

        # Calculate days to expiry for display
        results.append({
            "supply_id": str(s["_id"]),
            "batch_number": s.get("batch_number", "N/A"),
            "medicine_id": str(s.get("medicine_id", "")),
            "quantity": qty,
            "priority_score": score,
            "recommendation": rec,
            "days_to_expiry": days_to_expiry,
            "risk_flags": flags,
            "compliance_status": status,
            "fake_status": fake_status
        })

    # Sort by priority score (highest first)
    results.sort(key=lambda x: x["priority_score"], reverse=True)

    return results
