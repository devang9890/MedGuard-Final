"""
Barcode Service Module
Handles QR code and barcode decoding for public verification
"""
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
import re


async def decode_barcode_from_bytes(image_data: bytes) -> dict:
    """
    Decode QR code or barcode from image bytes
    
    Returns:
        dict with 'success', 'data', 'type', 'error'
    """
    if not PYZBAR_AVAILABLE:
        return {
            "success": False,
            "error": "Barcode decoder not available",
            "data": None,
            "type": None
        }
    
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {
                "success": False,
                "error": "Invalid image format",
                "data": None,
                "type": None
            }
        
        # Preprocess image for better detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Try multiple preprocessing techniques
        images_to_try = [
            gray,
            cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
            cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        ]
        
        decoded_objects = []
        for processed_img in images_to_try:
            decoded = pyzbar.decode(processed_img)
            if decoded:
                decoded_objects = decoded
                break
        
        if not decoded_objects:
            return {
                "success": False,
                "error": "No barcode detected in image",
                "data": None,
                "type": None
            }
        
        # Get first barcode
        barcode_obj = decoded_objects[0]
        barcode_data = barcode_obj.data.decode('utf-8')
        barcode_type = barcode_obj.type
        
        return {
            "success": True,
            "data": barcode_data,
            "type": barcode_type,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Barcode decode error: {str(e)}",
            "data": None,
            "type": None
        }


def parse_barcode_intelligently(barcode_string: str) -> dict:
    """
    Intelligently parse barcode string to extract medicine info
    
    Supports formats:
    - BATCH|MANUFACTURER|PRODUCT
    - BATCH_MANUFACTURER_PRODUCT
    - Just BATCH
    - EAN/UPC codes
    """
    result = {
        "batch_number": None,
        "manufacturer": None,
        "product_code": None,
        "format": "unknown"
    }
    
    try:
        # Format 1: Pipe-separated
        if '|' in barcode_string:
            parts = barcode_string.split('|')
            result["batch_number"] = parts[0].strip() if len(parts) > 0 else None
            result["manufacturer"] = parts[1].strip() if len(parts) > 1 else None
            result["product_code"] = parts[2].strip() if len(parts) > 2 else None
            result["format"] = "pipe_separated"
            return result
        
        # Format 2: Underscore-separated
        if '_' in barcode_string and len(barcode_string.split('_')) >= 2:
            parts = barcode_string.split('_')
            result["batch_number"] = parts[0].strip()
            result["manufacturer"] = parts[1].strip() if len(parts) > 1 else None
            result["product_code"] = parts[2].strip() if len(parts) > 2 else None
            result["format"] = "underscore_separated"
            return result
        
        # Format 3: Dash-separated
        if '-' in barcode_string and len(barcode_string.split('-')) >= 2:
            parts = barcode_string.split('-')
            result["batch_number"] = parts[0].strip()
            result["manufacturer"] = parts[1].strip() if len(parts) > 1 else None
            result["product_code"] = parts[2].strip() if len(parts) > 2 else None
            result["format"] = "dash_separated"
            return result
        
        # Format 4: EAN-13 or UPC (numeric only, 8-13 digits)
        if barcode_string.isdigit() and 8 <= len(barcode_string) <= 13:
            result["product_code"] = barcode_string
            result["format"] = "ean_upc"
            return result
        
        # Format 5: Just batch number (default)
        result["batch_number"] = barcode_string.strip()
        result["format"] = "simple_batch"
        return result
        
    except Exception as e:
        print(f"Barcode parse error: {e}")
        result["batch_number"] = barcode_string
        result["format"] = "raw"
        return result


def validate_batch_format(batch_number: str) -> dict:
    """
    Validate batch number format and detect suspicious patterns
    
    Returns signals about batch format quality
    """
    if not batch_number:
        return {
            "valid": False,
            "suspicious": True,
            "signals": ["empty_batch"]
        }
    
    signals = []
    suspicious = False
    
    # Check length
    batch_len = len(batch_number)
    if batch_len < 3:
        signals.append("too_short")
        suspicious = True
    elif batch_len > 50:
        signals.append("too_long")
        suspicious = True
    
    # Check for valid characters
    if not re.match(r'^[A-Z0-9\-_]+$', batch_number, re.IGNORECASE):
        signals.append("invalid_characters")
        suspicious = True
    
    # Check for suspicious patterns
    if batch_number.lower() in ['test', 'sample', 'demo', 'fake', 'temp']:
        signals.append("test_batch")
        suspicious = True
    
    # Check for repeated characters
    if len(set(batch_number)) <= 2 and batch_len > 5:
        signals.append("repeated_pattern")
        suspicious = True
    
    # Check for common patterns (usually valid)
    if re.match(r'^BATCH\d+$', batch_number, re.IGNORECASE):
        signals.append("standard_format")
    
    if re.match(r'^[A-Z]{2,4}\-\d{4,8}$', batch_number):
        signals.append("professional_format")
    
    return {
        "valid": not suspicious,
        "suspicious": suspicious,
        "signals": signals,
        "length": batch_len
    }


async def extract_medicine_info_from_barcode(image_bytes: bytes) -> dict:
    """
    Complete barcode extraction pipeline
    
    Returns all extracted information and quality signals
    """
    # Step 1: Decode barcode
    decode_result = await decode_barcode_from_bytes(image_bytes)
    
    if not decode_result["success"]:
        return {
            "success": False,
            "error": decode_result["error"],
            "extracted_data": None,
            "quality_signals": []
        }
    
    # Step 2: Parse barcode data
    parsed_data = parse_barcode_intelligently(decode_result["data"])
    
    # Step 3: Validate batch format
    validation = {}
    if parsed_data["batch_number"]:
        validation = validate_batch_format(parsed_data["batch_number"])
    
    # Step 4: Compile results
    return {
        "success": True,
        "barcode_type": decode_result["type"],
        "raw_data": decode_result["data"],
        "batch_number": parsed_data["batch_number"],
        "manufacturer": parsed_data["manufacturer"],
        "product_code": parsed_data["product_code"],
        "format": parsed_data["format"],
        "validation": validation,
        "quality_signals": validation.get("signals", []),
        "error": None
    }
