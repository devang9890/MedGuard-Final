"""
Dynamic Verification Engine - AI-Powered
Combines database lookup with intelligent batch analysis
Works even when batch is not in database
"""
from app.db.mongodb import get_collection
from app.services.batch_intelligence_engine import intelligence_engine
from app.services.cdsco_verification_service import verify_manufacturer
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
        
        # ===== PHASE 2B: CDSCO MANUFACTURER VERIFICATION =====
        cdsco_result = {"cdsco_match": False, "confidence_modifier": 0, "risk_flag": None}
        if manufacturer:
            cdsco_result = await verify_manufacturer(manufacturer)
            print(f"🔍 CDSCO RESULT for {manufacturer}: {cdsco_result}")
        
        # ===== PHASE 3: MERGE SIGNALS =====
        # Combine DB confidence with AI confidence and CDSCO
        base_confidence = 0.0
        
        # Start with DB modifier if found
        if db_found:
            base_confidence += 35.0  # Found in DB
            base_confidence += db_confidence_modifier
        else:
            db_risk_flags.append("NOT_IN_DATABASE")
        
        # Add CDSCO manufacturer verification (CORE SIGNAL)
        if cdsco_result.get("cdsco_match"):
            cdsco_mod = cdsco_result.get("confidence_modifier", 0)
            base_confidence += cdsco_mod
            print(f"✅ CDSCO Match: +{cdsco_mod} → {base_confidence}")
            if cdsco_result.get("risk_flag"):
                db_risk_flags.append(cdsco_result["risk_flag"])
        elif manufacturer:
            # CDSCO lookup happened but no match
            cdsco_penalty = cdsco_result.get("confidence_modifier", -30)
            base_confidence += cdsco_penalty
            print(f"⚠️ CDSCO No Match: {cdsco_penalty} → {base_confidence}")
            if cdsco_result.get("risk_flag"):
                db_risk_flags.append(cdsco_result["risk_flag"])
        
        # Add AI analysis (weighted based on DB/CDSCO availability)
        ai_confidence = ai_analysis["confidence_score"]
        
        if db_found or cdsco_result.get("cdsco_match"):
            # DB found OR CDSCO verified: weight towards confirmed sources (65% base, 35% AI)
            final_confidence = (base_confidence * 0.65) + (ai_confidence * 0.35)
        else:
            # No DB and no CDSCO match: weight AI heavily (40% base, 60% AI)
            final_confidence = (base_confidence * 0.4) + (ai_confidence * 0.6)
        
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
        
        # CDSCO reasoning
        if cdsco_result.get("cdsco_match"):
            status = cdsco_result.get("details", {}).get("status", "Approved")
            reasoning.append(f"✓ Manufacturer verified in CDSCO registry ({status})")
        elif manufacturer:
            reasoning.append("⚠ Manufacturer not found in CDSCO registry")
        
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
            "cdsco": {
                "cdsco_match": cdsco_result.get("cdsco_match", False),
                "manufacturer_verified": cdsco_result.get("manufacturer_verified", False),
                "details": cdsco_result.get("details"),
                "confidence_modifier": cdsco_result.get("confidence_modifier", 0)
            },
            "analysis_metadata": {
                "database_match": db_found,
                "cdsco_verified": cdsco_result.get("cdsco_match", False),
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


async def verify_by_medicine_name(
    medicine_name: str,
    batch_number: Optional[str] = None,
    device_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> dict:
    """
    MEDICINE-NAME-FIRST VERIFICATION
    
    Primary workflow for public users (like Google search for medicines)
    
    Pipeline:
    1. Resolve medicine name → manufacturer(s) using brand mapping
    2. CDSCO verification on inferred manufacturer (CORE)
    3. If batch provided: batch intelligence
    4. Compute confidence without batch if needed
    5. Return verdict + recommendation
    
    Works even without batch (but more accurate with it)
    """
    try:
        from app.services.brand_mapping_service import find_manufacturer_by_brand
        
        if not medicine_name or not medicine_name.strip():
            return {
                "verdict": "UNKNOWN",
                "confidence": 20.0,
                "risk_flags": ["EMPTY_MEDICINE_NAME"],
                "recommendation": "❓ Please enter a medicine name to verify.",
                "reasoning": ["No medicine name provided"],
                "medicine_details": None,
                "cdsco": {"cdsco_match": False, "manufacturer_verified": False}
            }
        
        medicine_name = medicine_name.strip()
        
        print(f"\n🔍 MEDICINE-NAME VERIFICATION: {medicine_name}")
        
        # ===== STEP 1: Brand Mapping - Map medicine name to manufacturer =====
        print(f"\n[STEP 1] Brand Mapping: Resolving '{medicine_name}' to manufacturer...")
        brand_result = await find_manufacturer_by_brand(medicine_name)
        
        if not brand_result.get("found"):
            print(f"⚠️ Medicine brand not found in mapping database")
            recommendation = f"❌ Medicine '{medicine_name}' not found in MedGuard database. \n\nThis could mean:\n• Brand name is spelled incorrectly\n• It's not a registered medicine\n• It's a very new product\n\nPlease verify the spelling or consult a pharmacist."
            
            return {
                "verdict": "UNKNOWN",
                "confidence": 15.0,
                "risk_flags": ["MEDICINE_NOT_IN_BRAND_MAPPING"],
                "recommendation": recommendation,
                "reasoning": ["Medicine brand not found in database"],
                "medicine_details": {
                    "name": medicine_name,
                    "database_match": False,
                    "brand_found": False
                },
                "cdsco": {"cdsco_match": False, "manufacturer_verified": False}
            }
        
        inferred_manufacturers = brand_result.get("manufacturers", [])
        primary_manufacturer = brand_result.get("primary_manufacturer")
        brand_confidence_match = brand_result.get("confidence", 100.0)
        
        print(f"✅ Brand found: {brand_result['brand_name']}")
        print(f"   Category: {brand_result['category']}")
        print(f"   Manufacturers: {inferred_manufacturers}")
        print(f"   Primary: {primary_manufacturer}")
        
        # ===== STEP 2: CDSCO Verification on Inferred Manufacturer =====
        print(f"\n[STEP 2] CDSCO Verification on manufacturer '{primary_manufacturer}'...")
        
        cdsco_result = {}
        if primary_manufacturer:
            cdsco_result = await verify_manufacturer(primary_manufacturer)
            print(f"🔍 CDSCO RESULT: Match={cdsco_result.get('cdsco_match')}, Modifier={cdsco_result.get('confidence_modifier')}")
        else:
            cdsco_result = {
                "cdsco_match": False,
                "confidence_modifier": 0,
                "risk_flag": "NO_MANUFACTURER_INFERRED"
            }
        
        # ===== STEP 3: Calculate Base Confidence from Brand + CDSCO =====
        print(f"\n[STEP 3] Base Confidence Calculation...")
        
        base_confidence = 0.0
        reasoning = []
        risk_flags = []
        sources = []
        
        # Brand mapping confidence
        brand_bonus = (brand_confidence_match / 100.0) * 40.0  # Up to 40 points
        base_confidence += brand_bonus
        print(f"✅ Brand mapping: +{round(brand_bonus, 1)} (match quality: {brand_confidence_match}%)")
        reasoning.append(f"✓ Medicine '{medicine_name}' recognized in database")
        
        # CDSCO manufacturer verification (CORE)
        if cdsco_result.get("cdsco_match"):
            cdsco_mod = cdsco_result.get("confidence_modifier", 0)
            # CDSCO-verified manufacturers get +50 points (core verification layer)
            cdsco_mod = max(cdsco_mod, 50)  # Ensure at least 50 for approved
            base_confidence += cdsco_mod
            print(f"✅ CDSCO verified: +{cdsco_mod}")
            reasoning.append(f"✓ Manufacturer '{primary_manufacturer}' verified in CDSCO registry")
            sources.append("BRAND_MAPPING")
            sources.append("CDSCO_VERIFIED")
        else:
            cdsco_penalty = cdsco_result.get("confidence_modifier", -20)
            base_confidence += cdsco_penalty
            print(f"⚠️ CDSCO not found: {cdsco_penalty}")
            reasoning.append(f"⚠ Manufacturer not verified in CDSCO registry")
            risk_flags.append("MANUFACTURER_NOT_IN_CDSCO")
            if cdsco_result.get("risk_flag"):
                risk_flags.append(cdsco_result["risk_flag"])
        
        # Clamp to reasonable starting point
        base_confidence = max(10.0, min(90.0, base_confidence))
        
        # ===== STEP 4: Optional Batch Intelligence (if batch provided) =====
        print(f"\n[STEP 4] Optional Batch Intelligence...")
        
        if batch_number and batch_number.strip():
            print(f"   Batch provided: {batch_number}")
            batch_number = batch_number.strip().upper()
            
            try:
                supply = await supplies_collection.find_one({
                    "batch_number": batch_number,
                    "$or": [{"deleted": {"$exists": False}}, {"deleted": False}]
                })
                
                if supply:
                    print(f"   ✅ Batch found in database")
                    base_confidence += 15.0
                    reasoning.append(f"✓ Batch number verified in database")
                    sources.append("BATCH_VERIFIED")
                    
                    # Check expiry
                    if supply.get("expiry_date"):
                        try:
                            expiry = supply["expiry_date"]
                            if isinstance(expiry, str):
                                from datetime import datetime
                                expiry = datetime.fromisoformat(expiry.replace("Z", "+00:00"))
                            
                            if expiry < datetime.now():
                                base_confidence = -100.0  # Critical failure
                                risk_flags.append("BATCH_EXPIRED")
                                reasoning.append("⚠ Batch has EXPIRED")
                        except:
                            pass
                else:
                    print(f"   ⚠️ Batch not found in database")
                    reasoning.append("⚠ Batch number not found in database")
                    # No penalty for optional batch - confidence stays the same
            except Exception as e:
                print(f"   ❌ Batch lookup error: {e}")
        else:
            print(f"   ℹ️ No batch provided - verification based on medicine name only")
            reasoning.append("ℹ Medicine name verified; batch number not provided")
        
        # ===== STEP 5: Final Confidence Aggregation =====
        print(f"\n[STEP 5] Final Confidence Aggregation...")
        final_confidence = max(0.0, min(100.0, base_confidence))
        print(f"✅ FINAL CONFIDENCE: {round(final_confidence, 1)}%")
        
        # ===== STEP 6: Verdict Determination =====
        print(f"\n[STEP 6] Verdict Determination...")
        verdict = map_confidence_to_verdict(final_confidence)
        recommendation = generate_recommendation(verdict, final_confidence, reasoning)
        
        print(f"✅ VERDICT: {verdict}")
        
        # ===== STEP 7: Log Scan =====
        try:
            await scan_log_collection.insert_one({
                "input_type": "medicine_name",
                "medicine_name": medicine_name,
                "batch_number": batch_number,
                "manufacturer": primary_manufacturer,
                "verdict": verdict,
                "confidence": final_confidence,
                "risk_flags": risk_flags,
                "sources": sources,
                "reasoning": reasoning,
                "device_id": device_id,
                "ip_address": ip_address,
                "timestamp": datetime.utcnow(),
                "brand_confidence": brand_confidence_match,
                "cdsco_verified": cdsco_result.get("cdsco_match", False)
            })
        except Exception as e:
            print(f"⚠️ Logging error (non-critical): {e}")
        
        # ===== STEP 8: Return Result =====
        return {
            "verdict": verdict,
            "confidence": round(final_confidence, 1),
            "risk_flags": risk_flags,
            "sources": sources,
            "recommendation": recommendation,
            "reasoning": reasoning,
            "medicine_details": {
                "name": medicine_name,
                "brand_name": brand_result["brand_name"],
                "category": brand_result.get("category", "Unknown"),
                "inferred_manufacturer": primary_manufacturer,
                "all_manufacturers": inferred_manufacturers,
                "batch_number": batch_number,
                "database_match": True,
                "brand_found": True
            },
            "cdsco": {
                "cdsco_match": cdsco_result.get("cdsco_match", False),
                "manufacturer_verified": cdsco_result.get("manufacturer_verified", False),
                "details": cdsco_result.get("details"),
                "confidence_modifier": cdsco_result.get("confidence_modifier", 0),
                "status": cdsco_result.get("details", {}).get("status") if cdsco_result.get("details") else None
            },
            "analysis_metadata": {
                "input_method": "medicine_name",
                "batch_provided": bool(batch_number),
                "brand_confidence": brand_confidence_match,
                "cdsco_verified": cdsco_result.get("cdsco_match", False)
            }
        }
    
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        return {
            "verdict": "UNKNOWN",
            "confidence": 20.0,
            "risk_flags": ["SERVICE_UNAVAILABLE"],
            "recommendation": "⚠️ Verification service temporarily unavailable. Please try again.",
            "reasoning": ["Service dependency not available"],
            "medicine_details": None,
            "cdsco": {"cdsco_match": False}
        }
    except Exception as e:
        print(f"❌ Medicine verification error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "verdict": "UNKNOWN",
            "confidence": 15.0,
            "risk_flags": ["SYSTEM_ERROR"],
            "recommendation": "⚠️ System error during verification. Please try again or contact support.",
            "reasoning": ["System error occurred"],
            "medicine_details": None,
            "cdsco": {"cdsco_match": False}
        }

