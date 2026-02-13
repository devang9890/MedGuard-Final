"""
Public Verification Engine
Core intelligence module for national medicine verification
Combines all signals to provide citizen-friendly verification
"""
from app.db.mongodb import get_collection
from datetime import datetime
from typing import Dict, List, Optional

# Collections
medicines_collection = get_collection("medicines")
supplies_collection = get_collection("supplies")
suppliers_collection = get_collection("suppliers")
scan_log_collection = get_collection("public_scan_logs")


def calculate_confidence_score(signals: Dict) -> float:
    """
    Calculate overall confidence score (0-100)
    
    Inputs:
    - database_signals
    - pattern_signals  
    - image_signals
    - trust_signals
    - anomaly_signals
    """
    base_score = 50.0  # Neutral starting point
    
    # Database match signals (+30 to +60)
    db_modifier = signals.get("database_match", {}).get("confidence_modifier", 0)
    base_score += db_modifier
    
    # Pattern analysis (-50 to +10)
    pattern_modifier = signals.get("pattern_analysis", {}).get("confidence_modifier", 0)
    base_score += pattern_modifier
    
    # Image analysis (-30 to +10)
    image_modifier = signals.get("image_analysis", {}).get("confidence_modifier", 0)
    base_score += image_modifier
    
    # Trust signals (-20 to +20)
    trust_modifier = signals.get("trust_signals", {}).get("confidence_modifier", 0)
    base_score += trust_modifier
    
    # Anomaly signals (-30 to 0)
    anomaly_modifier = signals.get("anomaly_signals", {}).get("confidence_modifier", 0)
    base_score += anomaly_modifier
    
    # Clamp to 0-100
    return max(0.0, min(100.0, base_score))


def map_confidence_to_verdict(confidence: float, risk_flags: List[str]) -> str:
    """
    Map confidence score and risk flags to final verdict
    
    Verdicts:
    - SAFE (80-100)
    - LIKELY_AUTHENTIC (60-80)
    - UNKNOWN (40-60)
    - SUSPICIOUS (20-40)
    - HIGH_RISK_FAKE (<20)
    """
    # Override based on critical flags
    critical_flags = ["flagged_as_fake_in_db", "matches_known_fake_pattern", "counterfeit_detected"]
    if any(flag in risk_flags for flag in critical_flags):
        return "HIGH_RISK_FAKE"
    
    # Standard confidence mapping
    if confidence >= 80:
        return "SAFE"
    elif confidence >= 60:
        return "LIKELY_AUTHENTIC"
    elif confidence >= 40:
        return "UNKNOWN"
    elif confidence >= 20:
        return "SUSPICIOUS"
    else:
        return "HIGH_RISK_FAKE"


def generate_recommendation(verdict: str, risk_flags: List[str], has_prescription: bool = False) -> str:
    """
    Generate citizen-friendly recommendation
    """
    recommendations = {
        "SAFE": "✅ This medicine appears to be authentic and safe. You may proceed with confidence.",
        
        "LIKELY_AUTHENTIC": "✔️ This medicine is likely authentic. Minor verification signals are unclear. If possible, verify with your pharmacist.",
        
        "UNKNOWN": "⚠️ Unable to verify this medicine with confidence. We recommend:\n• Purchase from licensed pharmacies only\n• Ask for original receipts\n• Verify supplier credentials",
        
        "SUSPICIOUS": "⚠️ WARNING: This medicine shows suspicious characteristics. We strongly recommend:\n• DO NOT consume without verification\n• Report to local drug authority\n• Get verification from healthcare professional\n• Check with manufacturer directly",
        
        "HIGH_RISK_FAKE": "🚨 DANGER: This medicine shows strong indicators of being FAKE or COUNTERFEIT.\n• DO NOT CONSUME\n• Report immediately to authorities\n• Return to point of purchase\n• Seek alternative from verified source"
    }
    
    base_recommendation = recommendations.get(verdict, recommendations["UNKNOWN"])
    
    # Add specific warnings for critical flags
    if "expired" in risk_flags:
        base_recommendation += "\n\n⚠️ EXPIRED: This medicine has passed its expiry date."
    
    if "temperature_breach" in risk_flags or "TEMPERATURE_ALERT" in risk_flags:
        base_recommendation += "\n\n⚠️ Storage concerns: This batch may have been stored improperly."
    
    return base_recommendation


async def verify_by_barcode(image_bytes: bytes, device_id: Optional[str] = None, ip_address: Optional[str] = None) -> dict:
    """
    Verify medicine by scanning barcode image
    
    Full pipeline: decode → batch intelligence → verdict
    """
    try:
        # Step 1: Extract barcode data
        barcode_result = await extract_medicine_info_from_barcode(image_bytes)
        
        if not barcode_result["success"]:
            return {
                "success": False,
                "verdict": "UNKNOWN",
                "confidence": 0.0,
                "risk_flags": ["barcode_decode_failed"],
                "recommendation": "Unable to read barcode. Please try:\n• Better lighting\n• Clearer image\n• Different angle\n• Manual batch entry",
                "details": {"error": barcode_result.get("error")}
            }
        
        batch_number = barcode_result["batch_number"]
        manufacturer = barcode_result.get("manufacturer")
        
        # Step 2: Get batch intelligence
        batch_intel = await get_batch_intelligence(batch_number, manufacturer)
        
        # Step 3: Get trust signals if supplier found
        trust_signals = {}
        if batch_intel["database_match"]["found"]:
            supply_data = batch_intel["database_match"]["data"]
            if supply_data and supply_data.get("supplier"):
                # Trust score would be calculated here
                trust_signals = {"confidence_modifier": 5}
        
        # Step 4: Calculate confidence
        all_signals = {
            "database_match": batch_intel["database_match"],
            "pattern_analysis": batch_intel["pattern_analysis"],
            "trust_signals": trust_signals
        }
        
        confidence = calculate_confidence_score(all_signals)
        
        # Step 5: Compile risk flags
        risk_flags = batch_intel["signals"]
        if batch_intel["database_match"]["found"]:
            db_risk_flags = batch_intel["database_match"]["data"].get("risk_flags", [])
            risk_flags.extend(db_risk_flags)
        
        # Step 6: Determine verdict
        verdict = map_confidence_to_verdict(confidence, risk_flags)
        
        # Step 7: Generate recommendation
        recommendation = generate_recommendation(verdict, risk_flags)
        
        # Step 8: Log scan
        await log_public_scan({
            "input_type": "barcode",
            "batch_number": batch_number,
            "manufacturer": manufacturer,
            "verdict": verdict,
            "confidence": confidence,
            "risk_flags": risk_flags,
            "device_id": device_id,
            "ip_address": ip_address
        })
        
        return {
            "success": True,
            "verdict": verdict,
            "confidence": round(confidence, 2),
            "risk_flags": risk_flags,
            "recommendation": recommendation,
            "details": {
                "batch_number": batch_number,
                "manufacturer": manufacturer,
                "medicine": batch_intel["database_match"]["data"].get("medicine") if batch_intel["database_match"]["found"] else None,
                "barcode_type": barcode_result.get("barcode_type"),
                "database_found": batch_intel["database_match"]["found"]
            }
        }
        
    except Exception as e:
        print(f"Barcode verification error: {e}")
        return {
            "success": False,
            "verdict": "UNKNOWN",
            "confidence": 0.0,
            "risk_flags": ["verification_error"],
            "recommendation": "System error during verification. Please try again or contact support.",
            "details": {"error": str(e)}
        }


async def verify_by_batch_number(batch_number: str, manufacturer: Optional[str] = None, device_id: Optional[str] = None, ip_address: Optional[str] = None) -> dict:
    """
    Verify medicine by manually entered batch number
    """
    try:
        if not batch_number or not batch_number.strip():
            return {
                "success": False,
                "verdict": "UNKNOWN",
                "confidence": 0.0,
                "risk_flags": ["empty_batch_number"],
                "recommendation": "Please enter a valid batch number.",
                "details": {}
            }
        
        batch_number = batch_number.strip().upper()
        
        # Step 1: Get batch intelligence
        batch_intel = await get_batch_intelligence(batch_number, manufacturer)
        
        # Step 2: Get trust signals
        trust_signals = {}
        if batch_intel["database_match"]["found"]:
            trust_signals = {"confidence_modifier": 5}
        
        # Step 3: Calculate confidence
        all_signals = {
            "database_match": batch_intel["database_match"],
            "pattern_analysis": batch_intel["pattern_analysis"],
            "trust_signals": trust_signals
        }
        
        confidence = calculate_confidence_score(all_signals)
        
        # Step 4: Compile risk flags
        risk_flags = batch_intel["signals"]
        if batch_intel["database_match"]["found"]:
            db_risk_flags = batch_intel["database_match"]["data"].get("risk_flags", [])
            risk_flags.extend(db_risk_flags)
        
        # Step 5: Determine verdict
        verdict = map_confidence_to_verdict(confidence, risk_flags)
        
        # Step 6: Generate recommendation
        recommendation = generate_recommendation(verdict, risk_flags)
        
        # Step 7: Log scan
        await log_public_scan({
            "input_type": "batch",
            "batch_number": batch_number,
            "manufacturer": manufacturer,
            "verdict": verdict,
            "confidence": confidence,
            "risk_flags": risk_flags,
            "device_id": device_id,
            "ip_address": ip_address
        })
        
        return {
            "success": True,
            "verdict": verdict,
            "confidence": round(confidence, 2),
            "risk_flags": risk_flags,
            "recommendation": recommendation,
            "details": {
                "batch_number": batch_number,
                "manufacturer": manufacturer,
                "medicine": batch_intel["database_match"]["data"].get("medicine") if batch_intel["database_match"]["found"] else None,
                "supplier": batch_intel["database_match"]["data"].get("supplier") if batch_intel["database_match"]["found"] else None,
                "database_found": batch_intel["database_match"]["found"],
                "scan_history": batch_intel["duplicate_scan_analysis"]
            }
        }
        
    except Exception as e:
        print(f"Batch verification error: {e}")
        return {
            "success": False,
            "verdict": "UNKNOWN",
            "confidence": 0.0,
            "risk_flags": ["verification_error"],
            "recommendation": "System error during verification. Please try again.",
            "details": {"error": str(e)}
        }


async def verify_by_image(image_bytes: bytes, device_id: Optional[str] = None, ip_address: Optional[str] = None) -> dict:
    """
    Verify medicine by uploaded image
    
    Combines image analysis + barcode extraction (if present) + pattern intelligence
    """
    try:
        # Step 1: Analyze image quality and features
        image_analysis = await analyze_medicine_image(image_bytes)
        
        # Step 2: Try to extract barcode from image
        barcode_result = await extract_medicine_info_from_barcode(image_bytes)
        
        batch_number = None
        manufacturer = None
        batch_intel = None
        
        if barcode_result["success"]:
            batch_number = barcode_result["batch_number"]
            manufacturer = barcode_result.get("manufacturer")
            
            # Step 3: Get batch intelligence
            batch_intel = await get_batch_intelligence(batch_number, manufacturer)
        
        # Step 4: Calculate confidence
        all_signals = {
            "image_analysis": image_analysis
        }
        
        if batch_intel:
            all_signals["database_match"] = batch_intel["database_match"]
            all_signals["pattern_analysis"] = batch_intel["pattern_analysis"]
        
        confidence = calculate_confidence_score(all_signals)
        
        # Step 5: Compile risk flags
        risk_flags = image_analysis["signals"]
        if batch_intel:
            risk_flags.extend(batch_intel["signals"])
        
        # Step 6: Determine verdict
        verdict = map_confidence_to_verdict(confidence, risk_flags)
        
        # Step 7: Generate recommendation
        recommendation = generate_recommendation(verdict, risk_flags)
        
        # Step 8: Log scan
        await log_public_scan({
            "input_type": "image",
            "batch_number": batch_number,
            "manufacturer": manufacturer,
            "verdict": verdict,
            "confidence": confidence,
            "risk_flags": risk_flags,
            "device_id": device_id,
            "ip_address": ip_address
        })
        
        return {
            "success": True,
            "verdict": verdict,
            "confidence": round(confidence, 2),
            "risk_flags": risk_flags,
            "recommendation": recommendation,
            "details": {
                "batch_number": batch_number,
                "manufacturer": manufacturer,
                "barcode_detected": barcode_result["success"],
                "image_quality": image_analysis["quality_analysis"]["quality_score"],
                "medicine": batch_intel["database_match"]["data"].get("medicine") if batch_intel and batch_intel["database_match"]["found"] else None
            }
        }
        
    except Exception as e:
        print(f"Image verification error: {e}")
        return {
            "success": False,
            "verdict": "UNKNOWN",
            "confidence": 0.0,
            "risk_flags": ["verification_error"],
            "recommendation": "System error during verification. Please try again.",
            "details": {"error": str(e)}
        }


async def log_public_scan(scan_data: dict) -> str:
    """
    Log public scan to database for learning and analytics
    
    Returns scan_id
    """
    try:
        scan_log = {
            "input_type": scan_data.get("input_type"),
            "batch_number": scan_data.get("batch_number"),
            "manufacturer": scan_data.get("manufacturer"),
            "verdict": scan_data.get("verdict"),
            "confidence": scan_data.get("confidence"),
            "risk_flags": scan_data.get("risk_flags", []),
            "device_id": scan_data.get("device_id"),
            "ip_address": scan_data.get("ip_address"),
            "timestamp": datetime.utcnow(),
            "was_reported": False
        }
        
        result = await scan_log_collection.insert_one(scan_log)
        return str(result.inserted_id)
        
    except Exception as e:
        print(f"Scan logging error: {e}")
        return None
