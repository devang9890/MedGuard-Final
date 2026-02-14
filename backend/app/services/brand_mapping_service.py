"""
Brand Mapping Service
Maps medicine brand names to manufacturers
Enables medicine-name-first verification workflow
"""
from pathlib import Path
from typing import Dict, List, Optional
import json

# Load medicine brand mapping dataset
DATA_PATH = Path(__file__).parent.parent / "data" / "medicine_brand_mapping.json"

def _load_brand_data():
    """Load brand data from JSON file"""
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f).get("medicine_brands", [])
        return data
    except FileNotFoundError:
        print(f"⚠️ Brand mapping file not found at {DATA_PATH}")
        return []
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing brand mapping JSON: {e}")
        return []


async def find_manufacturer_by_brand(brand_name: str) -> Dict:
    """
    Find manufacturer(s) for a medicine brand name
    
    Args:
        brand_name: Medicine brand name (e.g., "Aspirin", "Crocin")
        
    Returns:
        {
            "success": bool,
            "found": bool,
            "brand_name": str,
            "manufacturers": [str],  # All known manufacturers
            "primary_manufacturer": str,  # Recommended primary
            "category": str,
            "confidence": float  # Match confidence (0-100)
        }
    """
    # Reload data each time to catch changes
    BRAND_DATA = _load_brand_data()
    
    if not brand_name or not brand_name.strip():
        return {
            "success": False,
            "found": False,
            "brand_name": None,
            "manufacturers": [],
            "primary_manufacturer": None,
            "category": None,
            "confidence": 0
        }
    
    brand_lower = brand_name.lower().strip()
    
    # Exact match
    for entry in BRAND_DATA:
        if entry["brand_name"].lower() == brand_lower:
            return {
                "success": True,
                "found": True,
                "brand_name": entry["brand_name"],
                "manufacturers": entry.get("manufacturers", []),
                "primary_manufacturer": entry.get("primary_manufacturer"),
                "category": entry.get("category", "Unknown"),
                "confidence": 100.0
            }
    
    # Partial match (contains)
    for entry in BRAND_DATA:
        if brand_lower in entry["brand_name"].lower():
            return {
                "success": True,
                "found": True,
                "brand_name": entry["brand_name"],
                "manufacturers": entry.get("manufacturers", []),
                "primary_manufacturer": entry.get("primary_manufacturer"),
                "category": entry.get("category", "Unknown"),
                "confidence": 85.0  # Partial match
            }
    
    # Reverse partial match
    for entry in BRAND_DATA:
        if entry["brand_name"].lower() in brand_lower:
            return {
                "success": True,
                "found": True,
                "brand_name": entry["brand_name"],
                "manufacturers": entry.get("manufacturers", []),
                "primary_manufacturer": entry.get("primary_manufacturer"),
                "category": entry.get("category", "Unknown"),
                "confidence": 80.0  # Reverse partial match
            }
    
    # Not found
    return {
        "success": True,
        "found": False,
        "brand_name": brand_name,
        "manufacturers": [],
        "primary_manufacturer": None,
        "category": None,
        "confidence": 0
    }


async def get_all_brands() -> List[str]:
    """Get list of all known medicine brands"""
    BRAND_DATA = _load_brand_data()
    return [entry["brand_name"] for entry in BRAND_DATA]


async def get_brands_by_category(category: str) -> List[Dict]:
    """Get all brands in a specific category"""
    BRAND_DATA = _load_brand_data()
    category_lower = category.lower().strip()
    return [
        entry for entry in BRAND_DATA
        if entry.get("category", "").lower() == category_lower
    ]


async def get_brand_categories() -> Dict[str, int]:
    """Get count of brands per category"""
    BRAND_DATA = _load_brand_data()
    categories = {}
    for entry in BRAND_DATA:
        cat = entry.get("category", "Unknown")
        categories[cat] = categories.get(cat, 0) + 1
    return categories


async def get_brand_info(brand_name: str) -> Optional[Dict]:
    """Get complete information for a brand"""
    BRAND_DATA = _load_brand_data()
    brand_lower = brand_name.lower().strip()
    
    for entry in BRAND_DATA:
        if entry["brand_name"].lower() == brand_lower:
            return entry
    
    return None


async def get_manufacturers_by_brand(brand_name: str) -> List[str]:
    """Quick lookup: get manufacturers for a brand"""
    result = await find_manufacturer_by_brand(brand_name)
    return result.get("manufacturers", []) if result.get("found") else []


async def get_primary_manufacturer(brand_name: str) -> Optional[str]:
    """Quick lookup: get primary manufacturer for a brand"""
    result = await find_manufacturer_by_brand(brand_name)
    return result.get("primary_manufacturer") if result.get("found") else None
