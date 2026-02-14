"""
Public Verification Engine (REWRITTEN)
National medicine verification with CDSCO as core scoring layer
Pipeline: DB → CDSCO → Pattern → Anomaly → Trust → Verdict
"""
from app.db.mongodb import get_collection
from app.services.cdsco_verification_service import verify_manufacturer
from datetime import datetime
from typing import Dict, List, Optional

# Collections
medicines_collection = get_collection("medicines")
supplies_collection = get_collection("supplies")
suppliers_collection = get_collection("suppliers")
scan_log_collection = get_collection("public_scan_logs")


def map_confidence_to_verdict(confidence: float, risk_flags: List[str]) -> str:
    """
    Map confidence score and risk flags to final verdict
    
    Verdicts:
    - SAFE (80-100)
    - LIKELY_AUTHENTIC (60-79)
    - UNKNOWN (40-59)
    - SUSPICIOUS (20-39)
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


def generate_recommendation(verdict: str, risk_flags: List[str]) -> str:
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
    
    # Add specific warnings
    if "expired" in risk_flags:
        base_recommendation += "\n\n⚠️ EXPIRED: This medicine has passed its expiry date."
    
    if "temperature_breach" in risk_flags or "TEMPERATURE_ALERT" in risk_flags:
        base_recommendation += "\n\n⚠️ Storage concerns: This batch may have been stored improperly."
    
    if "MANUFACTURER_NOT_IN_CDSCO_REGISTRY" in risk_flags:
        base_recommendation += "\n\n⚠️ CDSCO ALERT: This manufacturer is NOT registered in the CDSCO registry. Exercise extreme caution."
    
    if "CDSCO_PROVISIONAL_STATUS" in risk_flags:
        base_recommendation += "\n\n⚠️ NOTE: This manufacturer has provisional CDSCO status (under approval process)."
    
    return base_recommendation


async def verify_by_batch_number(batch_number: str, manufacturer: Optional[str] = None, device_id: Optional[str] = None, ip_address: Optional[str] = None) -> dict:
    """
    Verify medicine by manually entered batch number
    
    PIPELINE (in order):
    1. Initialize confidence = 0
    2. DB lookup
    3. CDSCO manufacturer verification (+35 if approved)
    4. Pattern intelligence
    5. Anomaly signals
    6. Trust score
    7. Final aggregation
    8. Verdict mapping
    """
    try:
        if not batch_number or not batch_number.strip():
            return {
                "success": False,
                "verdict": "UNKNOWN",
                "confidence": 0,
                "risk_flags": ["empty_batch_number"],
                "recommendation": "Please enter a valid batch number.",
                "sources": [],
                "warnings": [],
                "details": {}
            }
        
        batch_number = batch_number.strip().upper()
        
        # ===== STEP 1: Initialize confidence =====
        confidence = 0
        sources = []
        warnings = []
        risk_flags = []
        
        print(f"\n🔍 VERIFICATION START: Batch={batch_number}, Manufacturer={manufacturer}")
        print(f"Initial confidence: {confidence}")
        
        # ===== STEP 2: Database lookup =====
        print(f"\n[STEP 2] Database Lookup...")
        try:
            db_batch = await supplies_collection.find_one({"batch_number": batch_number})
            if db_batch:
                confidence += 25
                sources.append("INTERNAL_DATABASE")
                print(f"✅ DB Match found. Confidence += 25 → {confidence}")
            else:
                warnings.append("BATCH_NOT_IN_DATABASE")
                print(f"⚠️ Batch not in database")
        except Exception as e:
            print(f"❌ DB lookup error: {e}")
        
        # ===== STEP 3: CDSCO Manufacturer Verification =====
        print(f"\n[STEP 3] CDSCO Manufacturer Verification...")
        cdsco_result = {}
        if manufacturer:
            cdsco_result = await verify_manufacturer(manufacturer)
            print(f"🔍 CDSCO RESULT: {cdsco_result}")
            
            # Apply confidence modifier from CDSCO
            confidence_modifier = cdsco_result.get("confidence_modifier", 0)
            confidence += confidence_modifier
            
            # Track source
            if cdsco_result["cdsco_match"]:
                sources.append("CDSCO_VERIFIED")
                print(f"✅ CDSCO Match found. Confidence += {confidence_modifier} → {confidence}")
            else:
                warnings.append("MANUFACTURER_NOT_IN_CDSCO_REGISTRY")
                print(f"⚠️ CDSCO No Match. Confidence {confidence_modifier} → {confidence}")
            
            # Add risk flag if applicable
            if cdsco_result.get("risk_flag"):
                risk_flags.append(cdsco_result["risk_flag"])
                print(f"⚠️ Risk flag added: {cdsco_result['risk_flag']}")
        else:
            print("⚠️ No manufacturer provided - CDSCO verification skipped")
            cdsco_result = {
                "cdsco_match": False,
                "manufacturer_verified": False,
                "details": None,
                "confidence_modifier": 0,
                "risk_flag": "NO_MANUFACTURER_PROVIDED"
            }
        
        # ===== STEP 4: Pattern Intelligence =====
        print(f"\n[STEP 4] Pattern Intelligence...")
        try:
            if db_batch and db_batch.get("is_flagged_fake"):
                # Check for suspicious patterns
                confidence -= 40
                risk_flags.append("matches_known_fake_pattern")
                print(f"❌ Known fake pattern detected. Confidence -= 40 → {confidence}")
            else:
                # Default to normal pattern (benefit of doubt for new batches)
                confidence += 10
                print(f"✅ Normal pattern (default). Confidence += 10 → {confidence}")
        except Exception as e:
            print(f"❌ Pattern analysis error: {e}")
        
        # ===== STEP 5: Anomaly Signals =====
        print(f"\n[STEP 5] Anomaly Signals...")
        try:
            if db_batch:
                anomaly_count = db_batch.get("anomaly_count", 0)
                if anomaly_count > 0:
                    anomaly_penalty = min(anomaly_count * 5, 30)
                    confidence -= anomaly_penalty
                    risk_flags.append(f"anomalies_detected_{anomaly_count}")
                    print(f"⚠️ {anomaly_count} anomalies detected. Confidence -= {anomaly_penalty} → {confidence}")
                else:
                    print(f"✅ No anomalies")
            else:
                print("ℹ️ No anomaly data available")
        except Exception as e:
            print(f"❌ Anomaly analysis error: {e}")
        
        # ===== STEP 6: Trust Score =====
        print(f"\n[STEP 6] Trust Score (Supplier)...")
        try:
            if db_batch and db_batch.get("supplier"):
                supplier_doc = await suppliers_collection.find_one({"_id": db_batch["supplier"]})
                if supplier_doc:
                    trust_score = supplier_doc.get("trust_score", 0)
                    if trust_score > 80:
                        confidence += 15
                        sources.append("TRUSTED_SUPPLIER")
                        print(f"✅ Trusted supplier (score: {trust_score}). Confidence += 15 → {confidence}")
                    elif trust_score < 40:
                        confidence -= 20
                        warnings.append("LOW_TRUST_SUPPLIER")
                        print(f"⚠️ Low trust supplier (score: {trust_score}). Confidence -= 20 → {confidence}")
                    else:
                        print(f"ℹ️ Moderate supplier trust: {trust_score}")
            elif cdsco_result.get("cdsco_match"):
                # CDSCO-verified manufacturers get trust bonus
                confidence += 15
                sources.append("CDSCO_TRUSTED_MANUFACTURER")
                print(f"✅ CDSCO-verified manufacturer. Confidence += 15 → {confidence}")
            else:
                print("ℹ️ No supplier data")
        except Exception as e:
            print(f"❌ Trust score error: {e}")
        
        # ===== STEP 7: Clamp confidence to 0-100 =====
        print(f"\n[STEP 7] Final Confidence Aggregation...")
        confidence = max(0, min(100, confidence))
        print(f"✅ FINAL CONFIDENCE: {confidence}")
        
        # ===== STEP 8: Verdict Mapping =====
        print(f"\n[STEP 8] Verdict Mapping...")
        if confidence >= 80:
            verdict = "SAFE"
        elif confidence >= 60:
            verdict = "LIKELY_AUTHENTIC"
        elif confidence >= 40:
            verdict = "UNKNOWN"
        elif confidence >= 20:
            verdict = "SUSPICIOUS"
        else:
            verdict = "HIGH_RISK_FAKE"

        print(f"✅ VERDICT: {verdict} (Confidence: {confidence}%)")
        
        # Generate recommendation
        recommendation = generate_recommendation(verdict, risk_flags)
        
        # Log scan
        await log_public_scan({
            "input_type": "batch",
            "batch_number": batch_number,
            "manufacturer": manufacturer,
            "verdict": verdict,
            "confidence": confidence,
            "risk_flags": risk_flags,
            "sources": sources,
            "device_id": device_id,
            "ip_address": ip_address
        })
        
        return {
            "success": True,
            "verdict": verdict,
            "confidence": confidence,
            "sources": sources,
            "warnings": warnings,
            "risk_flags": risk_flags,
            "cdsco": cdsco_result,
            "recommendation": recommendation,
            "details": {
                "batch_number": batch_number,
                "manufacturer": manufacturer,
                "database_match": bool(db_batch),
                "cdsco_verified": cdsco_result.get("cdsco_match", False)
            }
        }
        
    except Exception as e:
        print(f"❌ Batch verification error: {e}")
        return {
            "success": False,
            "verdict": "UNKNOWN",
            "confidence": 0,
            "risk_flags": ["verification_error"],
            "recommendation": "System error during verification. Please try again.",
            "sources": [],
            "warnings": ["system_error"],
            "details": {"error": str(e)}
        }


async def verify_by_barcode(image_bytes: bytes, device_id: Optional[str] = None, ip_address: Optional[str] = None) -> dict:
    """
    Verify medicine by scanning barcode image
    
    PIPELINE:
    1. Extract barcode → get batch & manufacturer
    2. verify_by_batch_number() with extracted data
    """
    try:
        # Step 1: Extract barcode data
        barcode_result = await extract_medicine_info_from_barcode(image_bytes)
        
        if not barcode_result["success"]:
            return {
                "success": False,
                "verdict": "UNKNOWN",
                "confidence": 0,
                "risk_flags": ["barcode_decode_failed"],
                "recommendation": "Unable to read barcode. Please try:\n• Better lighting\n• Clearer image\n• Different angle\n• Manual batch entry",
                "sources": [],
                "warnings": ["barcode_unreadable"],
                "details": {"error": barcode_result.get("error")}
            }
        
        batch_number = barcode_result["batch_number"]
        manufacturer = barcode_result.get("manufacturer")
        
        print(f"\n📦 BARCODE SCAN: {batch_number} from {manufacturer}")
        
        # Step 2: Use batch verification with extracted data
        result = await verify_by_batch_number(batch_number, manufacturer, device_id, ip_address)
        result["details"]["barcode_type"] = barcode_result.get("barcode_type")
        
        return result
        
    except Exception as e:
        print(f"❌ Barcode verification error: {e}")
        return {
            "success": False,
            "verdict": "UNKNOWN",
            "confidence": 0,
            "risk_flags": ["verification_error"],
            "recommendation": "System error during verification. Please try again or contact support.",
            "sources": [],
            "warnings": ["system_error"],
            "details": {"error": str(e)}
        }


async def verify_by_image(image_bytes: bytes, device_id: Optional[str] = None, ip_address: Optional[str] = None) -> dict:
    """
    Verify medicine by uploaded image
    
    1. Extract barcode from image (if present)
    2. Run verification on extracted data
    3. Fallback to image quality analysis if no barcode
    """
    try:
        # Step 1: Try to extract barcode from image
        barcode_result = await extract_medicine_info_from_barcode(image_bytes)
        
        if barcode_result["success"]:
            # Use barcode verification
            batch_number = barcode_result["batch_number"]
            manufacturer = barcode_result.get("manufacturer")
            
            print(f"\n🖼️ IMAGE SCAN: Barcode detected - {batch_number}")
            
            result = await verify_by_batch_number(batch_number, manufacturer, device_id, ip_address)
            result["details"]["image_analysis"] = "barcode_extracted"
            
            return result
        else:
            # Fallback to image quality analysis
            print(f"\n🖼️ IMAGE SCAN: No barcode detected, analyzing image quality")
            
            image_analysis = await analyze_medicine_image(image_bytes)
            
            return {
                "success": True,
                "verdict": "UNKNOWN",
                "confidence": image_analysis.get("quality_analysis", {}).get("quality_score", 0),
                "risk_flags": image_analysis.get("signals", []),
                "recommendation": "Image does not contain readable barcode. Please provide barcode or batch number manually.",
                "sources": ["IMAGE_ANALYSIS"],
                "warnings": ["no_barcode_detected"],
                "details": {
                    "image_quality": image_analysis.get("quality_analysis", {}),
                    "detected_features": image_analysis.get("detected_features", [])
                }
            }
        
    except Exception as e:
        print(f"❌ Image verification error: {e}")
        return {
            "success": False,
            "verdict": "UNKNOWN",
            "confidence": 0,
            "risk_flags": ["verification_error"],
            "recommendation": "System error during verification. Please try again.",
            "sources": [],
            "warnings": ["system_error"],
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
            "sources": scan_data.get("sources", []),
            "device_id": scan_data.get("device_id"),
            "ip_address": scan_data.get("ip_address"),
            "timestamp": datetime.utcnow(),
            "was_reported": False
        }
        
        result = await scan_log_collection.insert_one(scan_log)
        print(f"✅ Scan logged: {result.inserted_id}")
        return str(result.inserted_id)
        
    except Exception as e:
        print(f"❌ Scan logging error: {e}")
        return None


# ===== STUB FUNCTIONS (to be implemented) =====
async def extract_medicine_info_from_barcode(image_bytes: bytes) -> dict:
    """
    Extract batch number and manufacturer from barcode image
    TO BE IMPLEMENTED
    """
    return {
        "success": False,
        "error": "Barcode service not implemented yet"
    }


async def analyze_medicine_image(image_bytes: bytes) -> dict:
    """
    Analyze medicine image for quality and features
    TO BE IMPLEMENTED
    """
    return {
        "signals": [],
        "quality_analysis": {"quality_score": 0},
        "detected_features": []
    }
