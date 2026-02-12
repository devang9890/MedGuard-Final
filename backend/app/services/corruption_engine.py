from app.db.mongodb import db
from collections import defaultdict
from bson import ObjectId


async def detect_corruption_patterns():
    """Detect corruption patterns in supply chain data.
    
    Returns:
        List of corruption flags with details
    """
    supplier_approvals = defaultdict(int)
    supplier_rejections = defaultdict(int)
    batch_counts = defaultdict(int)
    supplier_names = {}
    blacklisted_suppliers = set()

    flags = []

    # Get blacklisted suppliers
    async for supplier in db.suppliers.find({"blacklisted": True}):
        blacklisted_suppliers.add(str(supplier["_id"]))
        supplier_names[str(supplier["_id"])] = supplier.get("name", "Unknown")

    # Get all supplier names
    async for supplier in db.suppliers.find():
        supplier_names[str(supplier["_id"])] = supplier.get("name", "Unknown")

    # Analyze supply patterns
    async for s in db.supplies.find({"is_deleted": {"$ne": True}}):
        supplier_id = str(s.get("supplier_id"))
        batch = s.get("batch_number")
        status = s.get("compliance_status")

        if status == "ACCEPTED" or status == "APPROVED":
            supplier_approvals[supplier_id] += 1
            
            # Check if blacklisted supplier is being accepted
            if supplier_id in blacklisted_suppliers:
                flags.append({
                    "type": "BLACKLIST_ACCEPTED",
                    "supplier_id": supplier_id,
                    "supplier_name": supplier_names.get(supplier_id, "Unknown"),
                    "detail": "Blacklisted supplier's supplies are being accepted",
                    "severity": "CRITICAL"
                })

        if status == "REJECTED":
            supplier_rejections[supplier_id] += 1

        if batch:
            batch_counts[batch] += 1

    # 🚩 FAVORITISM DETECTION
    # One supplier approved far more than others
    if supplier_approvals:
        avg_approvals = sum(supplier_approvals.values()) / len(supplier_approvals)
        for supplier, count in supplier_approvals.items():
            if count > 20 and count > avg_approvals * 2:  # More than 20 and 2x average
                flags.append({
                    "type": "FAVORITISM_DETECTED",
                    "supplier_id": supplier,
                    "supplier_name": supplier_names.get(supplier, "Unknown"),
                    "count": count,
                    "detail": f"Supplier has {count} approvals (avg: {int(avg_approvals)})",
                    "severity": "HIGH"
                })

    # 🚩 REPEATED BATCH APPROVAL
    # Same batch number appears multiple times (possible fraud)
    for batch, count in batch_counts.items():
        if count > 5:
            flags.append({
                "type": "REPEATED_BATCH_APPROVAL",
                "batch": batch,
                "count": count,
                "detail": f"Batch {batch} approved {count} times",
                "severity": "MEDIUM"
            })

    # 🚩 TARGETED REJECTION
    # One supplier consistently rejected (possible bias)
    if supplier_rejections:
        for supplier, count in supplier_rejections.items():
            total_supplies = supplier_approvals[supplier] + supplier_rejections[supplier]
            rejection_rate = (count / total_supplies * 100) if total_supplies > 0 else 0
            
            if count > 15 or (total_supplies > 10 and rejection_rate > 80):
                flags.append({
                    "type": "TARGETED_REJECTION",
                    "supplier_id": supplier,
                    "supplier_name": supplier_names.get(supplier, "Unknown"),
                    "count": count,
                    "rejection_rate": round(rejection_rate, 1),
                    "detail": f"Supplier has {count} rejections ({rejection_rate:.1f}% rate)",
                    "severity": "MEDIUM"
                })

    # 🚩 BIAS APPROVAL PATTERN
    # Supplier with 100% approval rate (suspicious if many supplies)
    for supplier, count in supplier_approvals.items():
        rejection_count = supplier_rejections.get(supplier, 0)
        total = count + rejection_count
        
        if total > 10 and rejection_count == 0:
            flags.append({
                "type": "BIAS_APPROVAL_PATTERN",
                "supplier_id": supplier,
                "supplier_name": supplier_names.get(supplier, "Unknown"),
                "count": count,
                "detail": f"100% approval rate over {total} supplies",
                "severity": "MEDIUM"
            })

    return {
        "total_flags": len(flags),
        "flags": flags,
        "summary": {
            "total_suppliers": len(supplier_approvals) + len(supplier_rejections),
            "total_approvals": sum(supplier_approvals.values()),
            "total_rejections": sum(supplier_rejections.values())
        }
    }
