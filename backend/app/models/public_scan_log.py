from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PublicScanLog(BaseModel):
    """Model for logging public medicine verification scans"""
    scan_id: Optional[str] = None
    input_type: str  # "barcode", "batch", "image"
    batch_number: Optional[str] = None
    manufacturer: Optional[str] = None
    image_url: Optional[str] = None
    
    # Verification results
    verdict: str  # SAFE, LIKELY_AUTHENTIC, UNKNOWN, SUSPICIOUS, HIGH_RISK_FAKE
    confidence: float  # 0-100
    risk_flags: List[str] = []
    
    # Metadata
    timestamp: datetime = datetime.utcnow()
    device_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    geo_location: Optional[dict] = None
    
    # Linked data
    medicine_id: Optional[str] = None
    supplier_id: Optional[str] = None
    supply_id: Optional[str] = None
    
    # Learning signals
    was_reported: bool = False
    user_feedback: Optional[str] = None
    
    created_at: datetime = datetime.utcnow()

class PublicVerificationRequest(BaseModel):
    """Request model for public verification"""
    input_type: str  # "barcode", "batch", "image"
    batch_number: Optional[str] = None
    manufacturer: Optional[str] = None
    barcode_data: Optional[str] = None
    device_id: Optional[str] = None

class PublicVerificationResponse(BaseModel):
    """Response model for public verification"""
    verdict: str
    confidence: float
    risk_flags: List[str]
    recommendation: str
    details: Optional[dict] = None
    scan_id: Optional[str] = None
    timestamp: datetime = datetime.utcnow()
