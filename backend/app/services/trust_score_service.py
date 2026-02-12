from app.db.mongodb import db


async def calculate_supplier_score(supplier_id):
    supplies = db.supplies.find({"supplier_id": supplier_id})

    total = 0
    rejected = 0
    warnings = 0
    fake = 0

    async for s in supplies:
        total += 1

        if s.get("compliance_status") == "REJECTED":
            rejected += 1

        if s.get("risk_flags"):
            warnings += 1

        if s.get("fake_status") == "FAKE":
            fake += 1

    if total == 0:
        return {"score": 100, "risk": "LOW"}

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

    return {"score": score, "risk": risk}
