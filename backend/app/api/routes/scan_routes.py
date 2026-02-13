from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.scan_service import scan_medicine, verify_medicine_authenticity
from app.schemas.scan_schema import ManualBatchVerify
from typing import Optional

router = APIRouter()

@router.post("/medicine")
async def scan_medicine_barcode(file: UploadFile = File(...)):
    """
    Scan medicine QR code or barcode.
    
    Accepts:
    - Image file (JPEG, PNG, etc.)
    
    Returns:
    - verdict: AUTHENTIC, SUSPICIOUS, FAKE, or UNKNOWN
    - medicine details
    - batch information
    - warning flags (if any)
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an image file."
            )
        
        # Read image data
        image_data = await file.read()
        
        if not image_data:
            raise HTTPException(
                status_code=400,
                detail="Empty file uploaded"
            )
        
        # Process scan
        result = await scan_medicine(image_data)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing scan: {str(e)}"
        )

@router.get("/test")
async def test_scan():
    """
    Test endpoint to verify scan service is running.
    """
    return {
        "message": "Scan service is active",
        "supported_formats": ["QR Code", "EAN-13", "Code-128", "Code-39"],
        "expected_barcode_format": "BATCH_NUMBER|MANUFACTURER|PRODUCT_CODE"
    }

@router.post("/verify-batch")
async def verify_batch_manual(data: ManualBatchVerify):
    """
    Manually verify a medicine by batch number.
    Use this when barcode scanning is not available.
    
    Accepts:
    - batch_number (required)
    - manufacturer (optional)
    
    Returns:
    - verdict: AUTHENTIC, SUSPICIOUS, FAKE, or UNKNOWN
    - medicine details
    - batch information
    - warning flags (if any)
    """
    try:
        result = await verify_medicine_authenticity(
            batch_number=data.batch_number,
            manufacturer=data.manufacturer
        )
        
        result["success"] = True
        result["scan_method"] = "manual_entry"
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during verification: {str(e)}"
        )
