from bson import ObjectId
from app.db.mongodb import get_collection
from datetime import datetime
import cv2
import numpy as np
try:
    from pyzbar import pyzbar
    PYZBAR_AVAILABLE = True
except Exception as e:
    print(f"Warning: pyzbar not available - {e}")
    PYZBAR_AVAILABLE = False
from PIL import Image
import io
import base64

medicine_collection = get_collection("medicines")
supply_collection = get_collection("supplies")
supplier_collection = get_collection("suppliers")

async def decode_barcode_from_image(image_data: bytes):
    """
    Decode QR code or barcode from image bytes.
    Returns decoded data or None.
    """
    if not PYZBAR_AVAILABLE:
        return {
            "error": "Barcode decoder not available. Please install ZBar library.",
            "data": None,
            "type": None
        }
    
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None
        
        # Decode barcodes/QR codes
        decoded_objects = pyzbar.decode(img)
        
        if not decoded_objects:
            return None
        
        # Return first decoded barcode data
        barcode_data = decoded_objects[0].data.decode('utf-8')
        barcode_type = decoded_objects[0].type
        
        return {
            "data": barcode_data,
            "type": barcode_type
        }
    except Exception as e:
        print(f"Barcode decode error: {e}")
        return None

async def parse_barcode_data(barcode_string: str):
    """
    Parse barcode string to extract:
    - batch_number
    - manufacturer (optional)
    - product_code (optional)
    
    Expected format: BATCH_NUMBER|MANUFACTURER|PRODUCT_CODE
    Or simple: BATCH_NUMBER
    """
    try:
        parts = barcode_string.split('|')
        
        result = {
            "batch_number": parts[0].strip() if len(parts) > 0 else None,
            "manufacturer": parts[1].strip() if len(parts) > 1 else None,
            "product_code": parts[2].strip() if len(parts) > 2 else None
        }
        
        return result
    except Exception as e:
        print(f"Parse error: {e}")
        return {"batch_number": barcode_string}

async def verify_medicine_authenticity(batch_number: str, manufacturer: str = None):
    """
    Verify medicine authenticity by checking:
    1. Supply exists with batch number
    2. Medicine exists
    3. Supplier is registered and trusted
    4. No fake flags
    
    Returns verdict: AUTHENTIC, SUSPICIOUS, FAKE, or UNKNOWN
    """
    try:
        # Step 1: Find supply by batch number
        query = {"batch_number": batch_number, "is_deleted": {"$ne": True}}
        supply = await supply_collection.find_one(query)
        
        if not supply:
            return {
                "verdict": "UNKNOWN",
                "message": "Batch number not found in database",
                "batch_number": batch_number,
                "details": None
            }
        
        # Step 2: Get medicine details
        medicine = None
        try:
            if supply.get("medicine_id") and ObjectId.is_valid(supply["medicine_id"]):
                medicine = await medicine_collection.find_one({
                    "_id": ObjectId(supply["medicine_id"]),
                    "is_deleted": {"$ne": True}
                })
        except Exception as e:
            print(f"Error fetching medicine: {e}")
        
        if not medicine:
            return {
                "verdict": "SUSPICIOUS",
                "message": "Medicine information not found for this batch",
                "batch_number": batch_number,
                "details": {
                    "batch_supply_found": True,
                    "expiry_date": supply.get("expiry_date"),
                    "quantity": supply.get("quantity")
                }
            }
        
        # Step 3: Get supplier details
        supplier = None
        try:
            if supply.get("supplier_id") and ObjectId.is_valid(supply["supplier_id"]):
                supplier = await supplier_collection.find_one({
                    "_id": ObjectId(supply["supplier_id"]),
                    "is_deleted": {"$ne": True}
                })
        except Exception as e:
            print(f"Error fetching supplier: {e}")
        
        if not supplier:
            return {
                "verdict": "SUSPICIOUS",
                "message": "Supplier not registered",
                "batch_number": batch_number,
                "details": {
                    "medicine": medicine.get("name"),
                    "supply": supply
                }
            }
        
        # Step 4: Check manufacturer match (if provided)
        if manufacturer and medicine.get("manufacturer") != manufacturer:
            return {
                "verdict": "SUSPICIOUS",
                "message": "Manufacturer mismatch detected",
                "batch_number": batch_number,
                "details": {
                    "medicine": medicine.get("name"),
                    "expected_manufacturer": medicine.get("manufacturer"),
                    "scanned_manufacturer": manufacturer,
                    "supplier": supplier.get("name")
                }
            }
        
        # Step 5: Check risk flags
        risk_flags = supply.get("risk_flags", [])
        if "FAKE" in risk_flags or "COUNTERFEIT" in risk_flags:
            return {
                "verdict": "FAKE",
                "message": "This batch has been flagged as fake",
                "batch_number": batch_number,
                "details": {
                    "medicine": medicine.get("name"),
                    "manufacturer": medicine.get("manufacturer"),
                    "supplier": supplier.get("name"),
                    "warning_flags": risk_flags,
                    "expiry_date": supply.get("expiry_date")
                }
            }
        
        # Step 6: Check compliance status
        compliance_status = supply.get("compliance_status", "PENDING")
        
        # Check if suspicious flags exist
        suspicious_flags = ["HIGH_RISK", "TEMP_BREACH", "UNVERIFIED", "SUSPICIOUS"]
        has_suspicious_flag = any(flag in risk_flags for flag in suspicious_flags)
        
        if compliance_status != "APPROVED" or has_suspicious_flag:
            return {
                "verdict": "SUSPICIOUS",
                "message": "Medicine requires additional verification",
                "batch_number": batch_number,
                "details": {
                    "medicine": medicine.get("name"),
                    "manufacturer": medicine.get("manufacturer"),
                    "supplier": supplier.get("name"),
                    "compliance_status": compliance_status,
                    "warning_flags": risk_flags,
                    "expiry_date": supply.get("expiry_date")
                }
            }
        
        # Step 7: Check expiry date
        expiry_date = supply.get("expiry_date")
        if expiry_date and isinstance(expiry_date, datetime):
            if expiry_date < datetime.utcnow():
                return {
                    "verdict": "SUSPICIOUS",
                    "message": "Medicine has expired",
                    "batch_number": batch_number,
                    "details": {
                        "medicine": medicine.get("name"),
                        "manufacturer": medicine.get("manufacturer"),
                        "supplier": supplier.get("name"),
                        "expiry_date": expiry_date,
                        "warning_flags": ["EXPIRED"]
                    }
                }
        
        # All checks passed - AUTHENTIC
        return {
            "verdict": "AUTHENTIC",
            "message": "Medicine verified successfully",
            "batch_number": batch_number,
            "details": {
                "medicine": medicine.get("name"),
                "manufacturer": medicine.get("manufacturer"),
                "supplier": supplier.get("name"),
                "compliance_status": compliance_status,
                "expiry_date": expiry_date,
                "quantity": supply.get("quantity"),
                "category": medicine.get("category")
            }
        }
        
    except Exception as e:
        print(f"Verification error: {e}")
        return {
            "verdict": "UNKNOWN",
            "message": f"Error during verification: {str(e)}",
            "batch_number": batch_number,
            "details": None
        }

async def scan_medicine(image_data: bytes):
    """
    Main scan function:
    1. Decode barcode/QR from image
    2. Parse data
    3. Verify against database
    4. Return result
    """
    # Step 1: Decode barcode
    decoded = await decode_barcode_from_image(image_data)
    
    if decoded and decoded.get("error"):
        return {
            "success": False,
            "verdict": "ERROR",
            "message": decoded["error"],
            "details": None
        }
    
    if not decoded:
        return {
            "success": False,
            "verdict": "UNKNOWN",
            "message": "No barcode or QR code detected in image",
            "details": None
        }
    
    # Step 2: Parse barcode data
    parsed = await parse_barcode_data(decoded["data"])
    
    if not parsed.get("batch_number"):
        return {
            "success": False,
            "verdict": "UNKNOWN",
            "message": "Unable to extract batch number from barcode",
            "details": {
                "barcode_type": decoded["type"],
                "raw_data": decoded["data"]
            }
        }
    
    # Step 3: Verify authenticity
    result = await verify_medicine_authenticity(
        batch_number=parsed["batch_number"],
        manufacturer=parsed.get("manufacturer")
    )
    
    # Add barcode info to result
    result["success"] = True
    result["barcode_type"] = decoded["type"]
    result["raw_barcode_data"] = decoded["data"]
    
    return result
