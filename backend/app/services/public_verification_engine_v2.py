"""
Dynamic Verification Engine - AI-Powered
Combines database lookup with intelligent batch analysis
Works even when batch is not in database
"""
from app.db.mongodb import get_collection
from app.services.batch_intelligence_engine import intelligence_engine
from datetime import datetime
from typing import Optional
from bson import ObjectId

# Collections
medicines_collection = get_collection("medicines")
supplies_collection = get_collection("supplies")
suppliers_collection = get_collection("suppliers")
scan_log_collection = get_collection("public_scan_logs")


def map_confidence_to_verdict(confidence: float) -> str:
    """Map confidence score to verdict"""
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


def generate_recommendation(verdict: str, confidence: float, reasoning: list) -> str:
    """Generate citizen-friendly recommendation"""
    if verdict == "SAFE":
        return "✅ Medicine verified as authentic. Safe to use."
    elif verdict == "LIKELY_AUTHENTIC":
        return "✅ Likely authentic based on analysis. Consider pharmacist verification if concerned."
    elif verdict == "UNKNOWN":
        return "⚠️ Cannot conclusively verify. Consult pharmacist or verify directly with manufacturer before use."
    elif verdict == "SUSPICIOUS":
        return "🚨 Multiple suspicious indicators detected. Do NOT use. Report to authorities immediately."
    else:
        return "🚨 HIGH RISK OF COUNTERFEIT! This batch shows strong fake indicators. DO NOT USE under any circumstances. Report immediately."


async def verify_by_batch_number_dynamic(
    batch_number: str,
    manufacturer: Optional[str] = None,
    device_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> dict:
    """
    Dynamic verification - combines DB + AI intelligence
    ALWAYS provides intelligent analysis, never just "UNKNOWN"
    """
    try:
        # ===== PHASE 1: DATABASE LOOKUP =====
        supply = await supplies_collection.find_one({
            "batch_number": batch_number,
            "$or": [
                {"deleted": {"$exists": False}},
                {"deleted": False}
            ]
        })
        
        db_found = supply is not None
        db_confidence_modifier = 0.0
        db_medicine = None
        db_supplier = None
        db_risk_flags = []
        
        if db_found:
            # Get related data
            if supply.get("medicine_id"):
                try:
                    med_id = supply["medicine_id"]
                    if isinstance(med_id, str):
                        med_id = ObjectId(med_id)
                    db_medicine = await medicines_collection.find_one({
                        "_id": med_id,
                        "$or": [
                            {"deleted": {"$exists": False}},
                            {"deleted": False}
                        ]
                    })
                except Exception as e:
                    print(f"Medicine lookup error: {e}")
            
            if supply.get("supplier_id"):
                try:
                    supp_id = supply["supplier_id"]
                    if isinstance(supp_id, str):
                        supp_id = ObjectId(supp_id)
                    db_supplier = await suppliers_collection.find_one({
                        "_id": supp_id,
                        "$or": [
                            {"deleted": {"$exists": False}},
                            {"deleted": False}
                        ]
                    })
                except Exception as e:
                    print(f"Supplier lookup error: {e}")
            
            # Calculate DB confidence modifier
            db_confidence_modifier += 35.0  # Found in DB
            
            if db_medicine:
                db_confidence_modifier += 10.0
            
            # Check supplier trust
            if db_supplier:
                trust_score = db_supplier.get("trust_score", 50)
                if trust_score >= 80:
                    db_confidence_modifier += 15.0
                elif trust_score >= 60:
                    db_confidence_modifier += 5.0
                elif trust_score < 40:
                    db_risk_flags.append("LOW_TRUST_SUPPLIER")
                    db_confidence_modifier -= 20.0
            
            # Check expiry
            expiry_date = supply.get("expiry_date")
            if expiry_date:
                try:
                    if isinstance(expiry_date, str):
                        expiry_date = datetime.fromisoformat(expiry_date.replace("Z", "+00:00"))
                    
                    if expiry_date < datetime.now():
                        db_risk_flags.append("EXPIRED")
                        db_confidence_modifier = -50.0  # Override - expired
                    elif (expiry_date - datetime.now()).days < 30:
                        db_risk_flags.append("NEAR_EXPIRY")
                        db_confidence_modifier -= 10.0
                except Exception as e:
                    print(f"Expiry check error: {e}")
            
            # Check compliance status
            compliance = supply.get("compliance_status")
            if compliance == "REJECTED":
                db_risk_flags.append("COMPLIANCE_REJECTED")
                db_confidence_modifier -= 25.0
            elif compliance == "PENDING":
                db_risk_flags.append("COMPLIANCE_PENDING")
                db_confidence_modifier -= 10.0
            
            # Check fake status
            fake_status = supply.get("fake_status")
            if fake_status == "SUSPECTED_FAKE":
                db_risk_flags.append("FLAGGED_AS_FAKE")
                db_confidence_modifier = -60.0  # Override
            elif fake_status == "CONFIRMED_FAKE":
                db_risk_flags.append("CONFIRMED_COUNTERFEIT")
                db_confidence_modifier = -80.0  # Critical override
        
        # ===== PHASE 2: AI INTELLIGENCE ANALYSIS =====
        # ALWAYS run intelligence, even if DB found
        ai_analysis = intelligence_engine.analyze_batch(batch_number, manufacturer)
        
        # ===== PHASE 3: MERGE SIGNALS =====
        # Combine DB confidence with AI confidence
        base_confidence = 50.0
        
        # Add DB modifier
        base_confidence += db_confidence_modifier
        
        # Add AI analysis (weighted)
        ai_confidence = ai_analysis["confidence_score"]
        
        if db_found:
            # DB found: AI contributes 30%, DB contributes 70%
            final_confidence = (base_confidence * 0.7) + (ai_confidence * 0.3)
        else:
            # DB NOT found: AI analysis is primary (use AI confidence directly)
            final_confidence = ai_confidence
            db_risk_flags.append("NOT_IN_DATABASE")
        
        # Clamp confidence
        final_confidence = max(0.0, min(100.0, final_confidence))
        
        # ===== PHASE 4: AGGREGATE RISK FLAGS =====
        all_risk_flags = db_risk_flags.copy()
        
        # Add AI risk flags
        if ai_analysis["fake_similarity"].get("matches_fake_pattern"):
            all_risk_flags.append("MATCHES_FAKE_PATTERN")
        
        if ai_analysis["fake_similarity"].get("risk_level") == "high":
            all_risk_flags.append("HIGH_FAKE_SIMILARITY")
        
        if ai_analysis["anomaly_signals"].get("repetition_anomaly"):
            all_risk_flags.append("REPETITION_ANOMALY")
        
        if ai_analysis["anomaly_signals"].get("length_anomaly"):
            all_risk_flags.append("LENGTH_ANOMALY")
        
        if not ai_analysis["format_analysis"].get("format_valid"):
            all_risk_flags.append("INVALID_FORMAT")
        
        # ===== PHASE 5: GENERATE VERDICT =====
        verdict = map_confidence_to_verdict(final_confidence)
        
        # ===== PHASE 6: BUILD REASONING =====
        reasoning = []
        
        # DB reasoning
        if db_found:
            reasoning.append("✓ Batch found in MedGuard database")
            if db_medicine:
                reasoning.append(f"✓ Registered product: {db_medicine.get('name')}")
            if db_supplier:
                trust = db_supplier.get("trust_score", 50)
                if trust >= 80:
                    reasoning.append(f"✓ High-trust supplier: {db_supplier.get('name')} ({trust}% trust)")
                elif trust < 40:
                    reasoning.append(f"⚠ Low-trust supplier: {db_supplier.get('name')} ({trust}% trust)")
        else:
            reasoning.append("⚠ Batch not found in MedGuard database")
        
        # Add AI reasoning
        reasoning.extend(ai_analysis["reasoning"])
        
        # ===== PHASE 7: GENERATE RECOMMENDATION =====
        recommendation = generate_recommendation(verdict, final_confidence, reasoning)
        
        # ===== PHASE 8: PREPARE MEDICINE DETAILS =====
        medicine_details = None
        if db_medicine or db_found:
            medicine_details = {
                "name": db_medicine.get("name") if db_medicine else "Unknown Medicine",
                "manufacturer": db_medicine.get("manufacturer") if db_medicine else (
                    ai_analysis["pattern_recognition"].get("recognized_manufacturer") or manufacturer or "Unknown"
                ),
                "batch_number": batch_number,
                "expiry_date": str(supply.get("expiry_date")) if db_found and supply.get("expiry_date") else None,
                "supplier": db_supplier.get("name") if db_supplier else "Unknown",
                "quantity": supply.get("quantity") if db_found else None,
                "database_match": db_found,
                "ai_confidence": round(ai_confidence, 1)
            }
        else:
            # No DB match - use AI inference
            recognized_mfg = ai_analysis["pattern_recognition"].get("recognized_manufacturer")
            medicine_details = {
                "name": "Not registered in database",
                "manufacturer": recognized_mfg or manufacturer or "Unknown",
                "batch_number": batch_number,
                "expiry_date": None,
                "supplier": "Unknown",
                "quantity": None,
                "database_match": False,
                "ai_confidence": round(ai_confidence, 1),
                "inferred_manufacturer": recognized_mfg
            }
        
        # ===== PHASE 9: LOG SCAN =====
        try:
            await scan_log_collection.insert_one({
                "input_type": "batch",
                "batch_number": batch_number,
                "manufacturer": manufacturer,
                "verdict": verdict,
                "confidence": final_confidence,
                "risk_flags": all_risk_flags,
                "reasoning": reasoning,
                "device_id": device_id,
                "ip_address": ip_address,
                "timestamp": datetime.utcnow(),
                "medicine_id": str(db_medicine["_id"]) if db_medicine else None,
                "supplier_id": str(db_supplier["_id"]) if db_supplier else None,
                "supply_id": str(supply["_id"]) if db_found else None,
                "database_match": db_found,
                "ai_analysis_summary": {
                    "format_valid": ai_analysis["format_analysis"].get("format_valid"),
                    "fake_similarity": ai_analysis["fake_similarity"].get("risk_level"),
                    "recognized_manufacturer": ai_analysis["pattern_recognition"].get("recognized_manufacturer")
                }
            })
        except Exception as e:
            print(f"Logging error (non-critical): {e}")
        
        # ===== PHASE 10: RETURN RESULT =====
        return {
            "verdict": verdict,
            "confidence": round(final_confidence, 1),
            "risk_flags": all_risk_flags,
            "recommendation": recommendation,
            "reasoning": reasoning,
            "medicine_details": medicine_details,
            "analysis_metadata": {
                "database_match": db_found,
                "ai_confidence": round(ai_confidence, 1),
                "format_valid": ai_analysis["format_analysis"].get("format_valid"),
                "recognized_manufacturer": ai_analysis["pattern_recognition"].get("recognized_manufacturer")
            }
        }
        
    except Exception as e:
        print(f"Dynamic verification error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Even on error, try to return AI analysis
        try:
            ai_analysis = intelligence_engine.analyze_batch(batch_number, manufacturer)
            return {
                "verdict": map_confidence_to_verdict(ai_analysis["confidence_score"]),
                "confidence": round(ai_analysis["confidence_score"], 1),
                "risk_flags": ["SYSTEM_ERROR"],
                "recommendation": "⚠️ System error during verification. Analysis based on pattern recognition only.",
                "reasoning": ai_analysis["reasoning"],
                "medicine_details": None
            }
        except:
            return {
                "verdict": "UNKNOWN",
                "confidence": 30.0,
                "risk_flags": ["CRITICAL_ERROR"],
                "recommendation": "⚠️ System error. Please try again or contact support.",
                "reasoning": ["System error occurred during verification"],
                "medicine_details": None
            }


async def verify_by_barcode(
    image_bytes: bytes,
    device_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> dict:
    """Verify by barcode - delegates to dynamic batch verification"""
    try:
        from app.services.barcode_service import extract_medicine_info_from_barcode
        
        barcode_result = await extract_medicine_info_from_barcode(image_bytes)
        
        if not barcode_result.get("success"):
            return {
                "verdict": "UNKNOWN",
                "confidence": 30.0,
                "risk_flags": ["BARCODE_READ_FAILED"],
                "recommendation": "❓ Could not read barcode. Try manual entry or ensure better lighting and focus.",
                "reasoning": ["Barcode could not be decoded from image"],
                "medicine_details": None
            }
        
        batch_number = barcode_result.get("batch_number")
        manufacturer = barcode_result.get("manufacturer")
        
        return await verify_by_batch_number_dynamic(batch_number, manufacturer, device_id, ip_address)
        
    except ImportError:
        return {
            "verdict": "UNKNOWN",
            "confidence": 20.0,
            "risk_flags": ["BARCODE_SERVICE_UNAVAILABLE"],
            "recommendation": "⚠️ Barcode scanning temporarily unavailable. Please use manual batch entry.",
            "reasoning": ["Barcode scanning service not available"],
            "medicine_details": None
        }
    except Exception as e:
        print(f"Barcode verification error: {str(e)}")
        return {
            "verdict": "UNKNOWN",
            "confidence": 25.0,
            "risk_flags": ["BARCODE_ERROR"],
            "recommendation": "⚠️ Error reading barcode. Try manual entry or retake photo.",
            "reasoning": ["Error occurred during barcode scanning"],
            "medicine_details": None
        }


async def verify_by_image(
    image_bytes: bytes,
    device_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> dict:
    """Verify by image - attempt barcode extraction, then batch verification"""
    try:
        from app.services.barcode_service import extract_medicine_info_from_barcode
        
        barcode_result = await extract_medicine_info_from_barcode(image_bytes)
        
        if barcode_result and barcode_result.get("success"):
            batch_number = barcode_result.get("batch_number")
            manufacturer = barcode_result.get("manufacturer")
            return await verify_by_batch_number_dynamic(batch_number, manufacturer, device_id, ip_address)
        
        return {
            "verdict": "UNKNOWN",
            "confidence": 35.0,
            "risk_flags": ["NO_BARCODE_DETECTED"],
            "recommendation": "❓ Could not detect barcode in package image. Please scan the barcode directly or enter batch number manually.",
            "reasoning": ["No barcode detected in image"],
            "medicine_details": None
        }
        
    except Exception as e:
        print(f"Image verification error: {str(e)}")
        return {
            "verdict": "UNKNOWN",
            "confidence": 30.0,
            "risk_flags": ["IMAGE_ANALYSIS_FAILED"],
            "recommendation": "⚠️ Could not analyze image. Try scanning barcode directly or use manual entry.",
            "reasoning": ["Error occurred during image analysis"],
            "medicine_details": None
        }


# Maintain backward compatibility
verify_by_batch_number = verify_by_batch_number_dynamic
