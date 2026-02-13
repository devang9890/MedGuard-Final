"""
Batch Pattern Intelligence Service
Analyzes batch numbers for patterns, anomalies, and fake detection
"""
from bson import ObjectId
from app.db.mongodb import get_collection
from datetime import datetime, timedelta
from typing import List, Dict
import re
from collections import Counter

supply_collection = get_collection("supplies")
medicine_collection = get_collection("medicines")
supplier_collection = get_collection("suppliers")
scan_log_collection = get_collection("public_scan_logs")


async def check_batch_in_database(batch_number: str, manufacturer: str = None) -> dict:
    """
    Check if batch exists in supply database
    
    Returns match status and related data
    """
    try:
        query = {
            "batch_number": batch_number,
            "is_deleted": {"$ne": True}
        }
        
        supply = await supply_collection.find_one(query)
        
        if not supply:
            return {
                "found": False,
                "match_type": "not_found",
                "data": None,
                "confidence_boost": 0
            }
        
        # Get medicine and supplier details
        medicine = None
        supplier = None
        
        try:
            if supply.get("medicine_id") and ObjectId.is_valid(supply["medicine_id"]):
                medicine = await medicine_collection.find_one({
                    "_id": ObjectId(supply["medicine_id"]),
                    "is_deleted": {"$ne": True}
                })
        except:
            pass
        
        try:
            if supply.get("supplier_id") and ObjectId.is_valid(supply["supplier_id"]):
                supplier = await supplier_collection.find_one({
                    "_id": ObjectId(supply["supplier_id"]),
                    "is_deleted": {"$ne": True}
                })
        except:
            pass
        
        # Check manufacturer match
        manufacturer_match = True
        if manufacturer and medicine:
            manufacturer_match = medicine.get("manufacturer", "").lower() == manufacturer.lower()
        
        # Calculate confidence boost
        confidence_boost = 30  # Base boost for DB match
        
        if medicine:
            confidence_boost += 10
        if supplier:
            confidence_boost += 10
        if manufacturer_match:
            confidence_boost += 10
        
        return {
            "found": True,
            "match_type": "full_match" if manufacturer_match else "partial_match",
            "data": {
                "medicine": medicine.get("name") if medicine else None,
                "manufacturer": medicine.get("manufacturer") if medicine else None,
                "category": medicine.get("category") if medicine else None,
                "supplier": supplier.get("name") if supplier else None,
                "compliance_status": supply.get("compliance_status"),
                "risk_flags": supply.get("risk_flags", []),
                "fake_status": supply.get("fake_status"),
                "expiry_date": supply.get("expiry_date")
            },
            "confidence_boost": confidence_boost
        }
        
    except Exception as e:
        print(f"Database check error: {e}")
        return {
            "found": False,
            "match_type": "error",
            "data": None,
            "confidence_boost": 0
        }


async def analyze_batch_pattern(batch_number: str) -> dict:
    """
    Analyze batch number for suspicious patterns
    
    Uses pattern intelligence to detect anomalies
    """
    signals = []
    suspicion_score = 0
    
    if not batch_number:
        return {
            "suspicious": True,
            "signals": ["empty_batch"],
            "suspicion_score": 100
        }
    
    # Pattern 1: Sequential pattern detection
    if re.match(r'^(.)\1{5,}$', batch_number):
        signals.append("repeated_character_pattern")
        suspicion_score += 30
    
    # Pattern 2: Too generic
    generic_patterns = ['test', 'sample', 'demo', '123456', 'abc', 'fake', 'temp']
    if any(pattern in batch_number.lower() for pattern in generic_patterns):
        signals.append("generic_batch_pattern")
        suspicion_score += 40
    
    # Pattern 3: Invalid length
    if len(batch_number) < 3:
        signals.append("batch_too_short")
        suspicion_score += 20
    elif len(batch_number) > 50:
        signals.append("batch_too_long")
        suspicion_score += 20
    
    # Pattern 4: No alphanumeric mix (all letters or all numbers)
    if batch_number.isalpha():
        signals.append("only_letters")
        suspicion_score += 10
    elif batch_number.isdigit() and len(batch_number) < 8:
        signals.append("only_numbers_short")
        suspicion_score += 10
    
    # Pattern 5: Sequential numbers
    if re.match(r'^\d+$', batch_number):
        nums = [int(batch_number[i:i+1]) for i in range(min(len(batch_number), 5))]
        if all(nums[i] == nums[i-1] + 1 for i in range(1, len(nums))):
            signals.append("sequential_numbers")
            suspicion_score += 25
    
    # Pattern 6: Check for common fake patterns from scan history
    fake_pattern_match = await check_known_fake_patterns(batch_number)
    if fake_pattern_match:
        signals.append("matches_known_fake_pattern")
        suspicion_score += 50
    
    return {
        "suspicious": suspicion_score > 30,
        "signals": signals,
        "suspicion_score": min(suspicion_score, 100)
    }


async def check_known_fake_patterns(batch_number: str) -> bool:
    """
    Check if batch matches patterns of known fakes
    """
    try:
        # Check if similar batches were flagged as fake
        similar_fakes = await supply_collection.count_documents({
            "batch_number": {"$regex": f"^{batch_number[:4]}", "$options": "i"},
            "fake_status": {"$in": ["FAKE", "SUSPICIOUS"]},
            "is_deleted": {"$ne": True}
        })
        
        return similar_fakes > 0
        
    except Exception as e:
        print(f"Fake pattern check error: {e}")
        return False


async def check_duplicate_scan_pattern(batch_number: str, timeframe_hours: int = 24) -> dict:
    """
    Check if this batch has been scanned multiple times recently
    
    Frequent scans could indicate counterfeit distribution
    """
    try:
        cutoff_time = datetime.utcnow() - timedelta(hours=timeframe_hours)
        
        scan_count = await scan_log_collection.count_documents({
            "batch_number": batch_number,
            "timestamp": {"$gte": cutoff_time}
        })
        
        # Get verdicts distribution
        scans = []
        async for scan in scan_log_collection.find({
            "batch_number": batch_number,
            "timestamp": {"$gte": cutoff_time}
        }).limit(100):
            scans.append(scan)
        
        verdict_counts = Counter([s.get("verdict") for s in scans])
        
        # Analyze pattern
        signals = []
        risk_level = "low"
        
        if scan_count > 50:
            signals.append("very_high_scan_frequency")
            risk_level = "high"
        elif scan_count > 20:
            signals.append("high_scan_frequency")
            risk_level = "medium"
        elif scan_count > 10:
            signals.append("moderate_scan_frequency")
            risk_level = "medium"
        
        # If many scans returned SUSPICIOUS/FAKE
        negative_count = verdict_counts.get("SUSPICIOUS", 0) + verdict_counts.get("HIGH_RISK_FAKE", 0)
        if negative_count > scan_count * 0.3:
            signals.append("frequent_negative_verdicts")
            risk_level = "high"
        
        return {
            "scan_count": scan_count,
            "timeframe_hours": timeframe_hours,
            "verdict_distribution": dict(verdict_counts),
            "signals": signals,
            "risk_level": risk_level
        }
        
    except Exception as e:
        print(f"Duplicate scan check error: {e}")
        return {
            "scan_count": 0,
            "timeframe_hours": timeframe_hours,
            "verdict_distribution": {},
            "signals": [],
            "risk_level": "unknown"
        }


async def get_batch_intelligence(batch_number: str, manufacturer: str = None) -> dict:
    """
    Complete batch intelligence analysis
    
    Combines all batch analysis signals
    """
    # Run all checks
    db_check = await check_batch_in_database(batch_number, manufacturer)
    pattern_analysis = await analyze_batch_pattern(batch_number)
    duplicate_check = await check_duplicate_scan_pattern(batch_number)
    
    # Compile signals
    all_signals = []
    all_signals.extend(pattern_analysis.get("signals", []))
    all_signals.extend(duplicate_check.get("signals", []))
    
    if db_check["found"]:
        all_signals.append("found_in_database")
        risk_flags = db_check["data"].get("risk_flags", [])
        if "FAKE" in risk_flags or "COUNTERFEIT" in risk_flags:
            all_signals.append("flagged_as_fake_in_db")
    else:
        all_signals.append("not_in_database")
    
    # Calculate confidence impact
    confidence_modifier = 0
    confidence_modifier += db_check.get("confidence_boost", 0)
    confidence_modifier -= pattern_analysis.get("suspicion_score", 0) * 0.5
    
    if duplicate_check["risk_level"] == "high":
        confidence_modifier -= 20
    elif duplicate_check["risk_level"] == "medium":
        confidence_modifier -= 10
    
    return {
        "database_match": db_check,
        "pattern_analysis": pattern_analysis,
        "duplicate_scan_analysis": duplicate_check,
        "signals": all_signals,
        "confidence_modifier": confidence_modifier
    }
