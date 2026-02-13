"""
Public Verification API Routes
Citizen-facing medicine verification endpoints
Uses AI-powered dynamic verification engine
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from app.models.public_scan_log import PublicVerificationRequest, PublicVerificationResponse
from app.services.public_verification_engine_v2 import (
    verify_by_barcode,
    verify_by_batch_number,
    verify_by_image
)
from typing import Optional

router = APIRouter()


def get_client_info(request: Request) -> dict:
    """Extract client information for logging"""
    return {
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent")
    }


@router.post("/verify/barcode")
async def verify_medicine_by_barcode(
    file: UploadFile = File(...),
    device_id: Optional[str] = None,
    request: Request = None
):
    """
    Verify medicine by scanning barcode image
    
    Upload image containing QR code or barcode
    Returns verification verdict with confidence score
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an image."
            )
        
        # Read image
        image_data = await file.read()
        
        if not image_data or len(image_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty image file"
            )
        
        # Get client info
        client_info = get_client_info(request)
        
        # Run verification
        result = await verify_by_barcode(
            image_bytes=image_data,
            device_id=device_id,
            ip_address=client_info.get("ip_address")
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )


@router.post("/verify/batch")
async def verify_medicine_by_batch(
    batch_number: str,
    manufacturer: Optional[str] = None,
    device_id: Optional[str] = None,
    request: Request = None
):
    """
    Verify medicine by batch number
    
    Manual entry mode for citizens who can read batch number
    """
    try:
        if not batch_number or not batch_number.strip():
            raise HTTPException(
                status_code=400,
                detail="Batch number is required"
            )
        
        # Get client info
        client_info = get_client_info(request)
        
        # Run verification
        result = await verify_by_batch_number(
            batch_number=batch_number.strip(),
            manufacturer=manufacturer.strip() if manufacturer else None,
            device_id=device_id,
            ip_address=client_info.get("ip_address")
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )


@router.post("/verify/image")
async def verify_medicine_by_image(
    file: UploadFile = File(...),
    device_id: Optional[str] = None,
    request: Request = None
):
    """
    Verify medicine by medicine package image
    
    Analyzes packaging, attempts barcode detection, validates authenticity
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an image."
            )
        
        # Read image
        image_data = await file.read()
        
        if not image_data or len(image_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty image file"
            )
        
        # File size check (max 10MB)
        if len(image_data) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Image file too large. Maximum 10MB allowed."
            )
        
        # Get client info
        client_info = get_client_info(request)
        
        # Run verification
        result = await verify_by_image(
            image_bytes=image_data,
            device_id=device_id,
            ip_address=client_info.get("ip_address")
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(e)}"
        )


@router.get("/test")
async def test_public_verification():
    """
    Test endpoint to verify public verification system is running
    """
    return {
        "status": "active",
        "service": "MedGuard Public Verification Engine",
        "version": "1.0.0",
        "modes": ["barcode", "batch", "image"],
        "verdicts": ["SAFE", "LIKELY_AUTHENTIC", "UNKNOWN", "SUSPICIOUS", "HIGH_RISK_FAKE"]
    }
