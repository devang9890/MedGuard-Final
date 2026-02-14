"""
CDSCO Verification Service
National Central Drugs Standard Control Organisation Registry Verification
Validates manufacturers against official CDSCO database
"""
import json
from pathlib import Path
from typing import Dict, Optional

# Load CDSCO dataset once at startup
DATA_PATH = Path(__file__).parent.parent / "data" / "cdsco_manufacturers.json"

try:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        CDSCO_DATA = json.load(f)
except FileNotFoundError:
    print(f"Warning: CDSCO data file not found at {DATA_PATH}")
    CDSCO_DATA = []


async def verify_manufacturer(manufacturer_name: str) -> Dict:
    """
    Verify if a manufacturer is registered with CDSCO
    
    Args:
        manufacturer_name: Name of the manufacturer to verify
        
    Returns:
        {
            "cdsco_match": bool,
            "manufacturer_verified": bool,
            "details": {...} or None,
            "confidence_modifier": int (-30 to +30),
            "risk_flag": str or None
        }
    """
    if not manufacturer_name or not manufacturer_name.strip():
        return {
            "cdsco_match": False,
            "manufacturer_verified": False,
            "details": None,
            "confidence_modifier": 0,
            "risk_flag": None
        }

    manufacturer_name_lower = manufacturer_name.lower().strip()

    # Search through CDSCO registry
    for entry in CDSCO_DATA:
        entry_name_lower = entry["manufacturer_name"].lower()
        
        # Exact or partial match
        if (manufacturer_name_lower == entry_name_lower or 
            manufacturer_name_lower in entry_name_lower or
            entry_name_lower in manufacturer_name_lower):
            
            # Determine confidence modifier based on status
            status = entry.get("status", "Approved")
            
            if status == "Approved":
                confidence_modifier = +35  # Core signal: Approved manufacturers
                risk_flag = None
            elif status == "Provisional":
                confidence_modifier = +10  # Under review by CDSCO
                risk_flag = "CDSCO_PROVISIONAL_STATUS"
            else:
                confidence_modifier = -30  # Critical: Not in registry
                risk_flag = "CDSCO_UNAPPROVED_STATUS"
            
            return {
                "cdsco_match": True,
                "manufacturer_verified": True,
                "details": entry,
                "confidence_modifier": confidence_modifier,
                "risk_flag": risk_flag
            }

    # No match found in CDSCO registry
    return {
        "cdsco_match": False,
        "manufacturer_verified": False,
        "details": None,
        "confidence_modifier": -30,  # Major penalty for manufacturer not in registry
        "risk_flag": "MANUFACTURER_NOT_IN_CDSCO_REGISTRY"
    }


async def get_manufacturer_details(manufacturer_name: str) -> Optional[Dict]:
    """
    Get detailed information about a manufacturer from CDSCO registry
    """
    if not manufacturer_name:
        return None
    
    manufacturer_name_lower = manufacturer_name.lower().strip()
    
    for entry in CDSCO_DATA:
        if manufacturer_name_lower in entry["manufacturer_name"].lower():
            return entry
    
    return None


async def get_manufacturers_by_state(state: str) -> list:
    """
    Get all manufacturers registered in a particular state
    """
    if not state:
        return []
    
    state_lower = state.lower().strip()
    return [m for m in CDSCO_DATA if m["state"].lower() == state_lower]


async def get_manufacturers_by_category(category: str) -> list:
    """
    Get all manufacturers of a particular category
    (Allopathic, Ayurvedic, Homeopathic)
    """
    if not category:
        return []
    
    category_lower = category.lower().strip()
    return [m for m in CDSCO_DATA if m["category"].lower() == category_lower]


async def get_cdsco_statistics() -> Dict:
    """
    Get statistical overview of CDSCO registry
    """
    total = len(CDSCO_DATA)
    
    approved = len([m for m in CDSCO_DATA if m["status"] == "Approved"])
    provisional = len([m for m in CDSCO_DATA if m["status"] == "Provisional"])
    
    categories = {}
    for m in CDSCO_DATA:
        cat = m["category"]
        categories[cat] = categories.get(cat, 0) + 1
    
    states = {}
    for m in CDSCO_DATA:
        state = m["state"]
        states[state] = states.get(state, 0) + 1
    
    return {
        "total_manufacturers": total,
        "approved": approved,
        "provisional": provisional,
        "by_category": categories,
        "by_state": states
    }


async def validate_batch_manufacturer(batch_number: str, manufacturer_name: str) -> Dict:
    """
    Cross-check if batch number + manufacturer combination makes sense
    
    Returns verification result with CDSCO validation
    """
    manufacturer_result = await verify_manufacturer(manufacturer_name)
    
    result = {
        "batch_number": batch_number,
        "manufacturer_name": manufacturer_name,
        "cdsco_verified": manufacturer_result["cdsco_match"],
        "manufacturer_verified": manufacturer_result["manufacturer_verified"],
        "confidence_impact": manufacturer_result["confidence_modifier"],
        "cdsco_details": manufacturer_result["details"]
    }
    
    # Add risk flag if applicable
    if manufacturer_result["risk_flag"]:
        result["warning"] = manufacturer_result["risk_flag"]
    
    return result
