"""
Simplified Public Verification Engine
Works reliably without complex dependencies
"""
from app.db.mongodb import get_collection
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


def generate_recommendation(verdict: str, confidence: float, risk_flags: list) -> str:
    """Generate citizen-friendly recommendation"""
    if verdict == "SAFE":
        return "✅ Medicine verified safe. You can use it."
    elif verdict == "LIKELY_AUTHENTIC":
        return "✅ Likely authentic. Consider verifying with pharmacist if unsure."
    elif verdict == "UNKNOWN":
        return "⚠️ Cannot verify authenticity. Consult pharmacist before use."
    elif verdict == "SUSPICIOUS":
        return "🚨 Suspicious medicine detected. Do NOT use. Report to authorities."
    else:
        return "🚨 HIGH RISK! This appears to be FAKE. Do NOT use under any circumstances!"


async def verify_by_batch_number(
    batch_number: str,
    manufacturer: Optional[str] = None,
    device_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> dict:
    """
    Verify medicine by batch number - simplified reliable version
    """
    try:
        # Search in supplies collection (check if deleted field exists and is not True)
        supply = await supplies_collection.find_one({
            "batch_number": batch_number,
            "$or": [
                {"deleted": {"$exists": False}},
                {"deleted": False}
            ]
        })
        
        if not supply:
            return {
                "verdict": "UNKNOWN",
                "confidence": 30.0,
                "risk_flags": ["BATCH_NOT_FOUND"],
                "recommendation": "❓ Batch number not found in our database. This might be a fake product or not registered yet. Please verify with the manufacturer or pharmacist.",
                "medicine_details": None
            }
        
        # Get medicine details
        medicine = None
        if supply.get("medicine_id"):
            try:
                med_id = supply["medicine_id"]
                if isinstance(med_id, str):
                    med_id = ObjectId(med_id)
                medicine = await medicines_collection.find_one({
                    "_id": med_id,
                    "$or": [
                        {"deleted": {"$exists": False}},
                        {"deleted": False}
                    ]
                })
            except Exception as e:
                print(f"Medicine lookup error: {e}")
        
        # Get supplier details
        supplier = None
        if supply.get("supplier_id"):
            try:
                supp_id = supply["supplier_id"]
                if isinstance(supp_id, str):
                    supp_id = ObjectId(supp_id)
                supplier = await suppliers_collection.find_one({
                    "_id": supp_id,
                    "$or": [
                        {"deleted": {"$exists": False}},
                        {"deleted": False}
                    ]
                })
            except Exception as e:
                print(f"Supplier lookup error: {e}")
        
        # Calculate confidence
        confidence = 50.0
        risk_flags = []
        
        # Database match found (+30)
        confidence += 30.0
        
        # Check medicine info
        if medicine:
            confidence += 15.0
        else:
            risk_flags.append("MEDICINE_INFO_MISSING")
            confidence -= 5.0
        
        # Check supplier trust
        if supplier:
            trust_score = supplier.get("trust_score", 50)
            if trust_score >= 80:
                confidence += 10.0
            elif trust_score >= 60:
                confidence += 5.0
            elif trust_score < 40:
                risk_flags.append("LOW_TRUST_SUPPLIER")
                confidence -= 15.0
        
        # Check expiry date
        expiry_date = supply.get("expiry_date")
        if expiry_date:
            try:
                if isinstance(expiry_date, str):
                    expiry_date = datetime.fromisoformat(expiry_date.replace("Z", "+00:00"))
                
                if expiry_date < datetime.now():
                    risk_flags.append("EXPIRED")
                    confidence = min(confidence, 25.0)
                elif (expiry_date - datetime.now()).days < 30:
                    risk_flags.append("NEAR_EXPIRY")
                    confidence -= 5.0
            except Exception as e:
                print(f"Expiry check error: {e}")
        
        # Clamp confidence
        confidence = max(0.0, min(100.0, confidence))
        
        # Map to verdict
        verdict = map_confidence_to_verdict(confidence)
        
        # Generate recommendation
        recommendation = generate_recommendation(verdict, confidence, risk_flags)
        
        # Prepare medicine details
        medicine_details = None
        if medicine or supply:
            medicine_details = {
                "name": medicine.get("name") if medicine else "Unknown Medicine",
                "manufacturer": medicine.get("manufacturer") if medicine else (manufacturer or "Unknown"),
                "batch_number": batch_number,
                "expiry_date": str(expiry_date) if expiry_date else None,
                "supplier": supplier.get("name") if supplier else "Unknown Supplier",
                "quantity": supply.get("quantity")
            }
        
        # Log scan (non-blocking)
        try:
            await scan_log_collection.insert_one({
                "input_type": "batch",
                "batch_number": batch_number,
                "manufacturer": manufacturer,
                "verdict": verdict,
                "confidence": confidence,
                "risk_flags": risk_flags,
                "device_id": device_id,
                "ip_address": ip_address,
                "timestamp": datetime.utcnow(),
                "medicine_id": str(medicine["_id"]) if medicine else None,
                "supplier_id": str(supplier["_id"]) if supplier else None,
                "supply_id": str(supply["_id"])
            })
        except Exception as e:
            print(f"Logging error (non-critical): {e}")
        
        return {
            "verdict": verdict,
            "confidence": round(confidence, 1),
            "risk_flags": risk_flags,
            "recommendation": recommendation,
            "medicine_details": medicine_details
        }
        
    except Exception as e:
        print(f"Batch verification error: {str(e)}")
        return {
            "verdict": "UNKNOWN",
            "confidence": 30.0,
            "risk_flags": ["VERIFICATION_ERROR"],
            "recommendation": "⚠️ System error during verification. Please try again or contact support.",
            "medicine_details": None
        }


async def verify_by_barcode(
    image_bytes: bytes,
    device_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> dict:
    """
    Verify medicine by scanning barcode
    """
    try:
        # Try to import and use barcode service
        from app.services.barcode_service import extract_medicine_info_from_barcode
        
        barcode_result = await extract_medicine_info_from_barcode(image_bytes)
        
        if not barcode_result.get("success"):
            return {
                "verdict": "UNKNOWN",
                "confidence": 30.0,
                "risk_flags": ["BARCODE_READ_FAILED"],
                "recommendation": "❓ Could not read barcode. Try manual entry or ensure better lighting and focus.",
                "medicine_details": None
            }
        
        batch_number = barcode_result.get("batch_number")
        manufacturer = barcode_result.get("manufacturer")
        
        # Use batch verification
        return await verify_by_batch_number(batch_number, manufacturer, device_id, ip_address)
        
    except ImportError:
        return {
            "verdict": "UNKNOWN",
            "confidence": 20.0,
            "risk_flags": ["BARCODE_SERVICE_UNAVAILABLE"],
            "recommendation": "⚠️ Barcode scanning temporarily unavailable. Please use manual batch entry.",
            "medicine_details": None
        }
    except Exception as e:
        print(f"Barcode verification error: {str(e)}")
        return {
            "verdict": "UNKNOWN",
            "confidence": 25.0,
            "risk_flags": ["BARCODE_ERROR"],
            "recommendation": "⚠️ Error reading barcode. Try manual entry or retake photo.",
            "medicine_details": None
        }


async def verify_by_image(
    image_bytes: bytes,
    device_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> dict:
    """
    Verify medicine by analyzing package image
    """
    try:
        # Try barcode extraction first
        from app.services.barcode_service import extract_medicine_info_from_barcode
        
        barcode_result = await extract_medicine_info_from_barcode(image_bytes)
        
        if barcode_result and barcode_result.get("success"):
            batch_number = barcode_result.get("batch_number")
            manufacturer = barcode_result.get("manufacturer")
            return await verify_by_batch_number(batch_number, manufacturer, device_id, ip_address)
        
        # No barcode found
        return {
            "verdict": "UNKNOWN",
            "confidence": 35.0,
            "risk_flags": ["NO_BARCODE_DETECTED"],
            "recommendation": "❓ Could not detect barcode in package image. Please scan the barcode directly or enter batch number manually.",
            "medicine_details": None
        }
        
    except Exception as e:
        print(f"Image verification error: {str(e)}")
        return {
            "verdict": "UNKNOWN",
            "confidence": 30.0,
            "risk_flags": ["IMAGE_ANALYSIS_FAILED"],
            "recommendation": "⚠️ Could not analyze image. Try scanning barcode directly or use manual entry.",
            "medicine_details": None
        }
