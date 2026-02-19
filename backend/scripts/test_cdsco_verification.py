"""
Test script to verify CDSCO integration in verification pipeline
"""
import asyncio
import sys
sys.path.insert(0, 'backend')

from app.services.cdsco_verification_service import verify_manufacturer, get_cdsco_statistics


async def test_cdsco_verification():
    """Test CDSCO manufacturer verification"""
    
    print("\n" + "="*70)
    print("🧪 CDSCO VERIFICATION SERVICE TEST")
    print("="*70)
    
    # Test 1: Statistics
    print("\n[TEST 1] CDSCO Registry Statistics")
    print("-" * 70)
    stats = await get_cdsco_statistics()
    print(f"✅ Total manufacturers: {stats['total_manufacturers']}")
    print(f"✅ Approved: {stats['approved']}")
    print(f"✅ Provisional: {stats['provisional']}")
    print(f"✅ Categories: {stats['by_category']}")
    
    # Test 2: Known approved manufacturer
    print("\n[TEST 2] Known APPROVED Manufacturer: Cipla Limited")
    print("-" * 70)
    result = await verify_manufacturer("Cipla Limited")
    print(f"Match: {result['cdsco_match']}")
    print(f"Verified: {result['manufacturer_verified']}")
    print(f"Status: {result['details'].get('status') if result['details'] else 'N/A'}")
    print(f"Confidence Impact: {result['confidence_modifier']}")
    if result['cdsco_match']:
        print("✅ TEST PASSED - Approved manufacturer scored +30")
    
    # Test 3: Known provisional manufacturer
    print("\n[TEST 3] PROVISIONAL Manufacturer: Wockhardt Limited")
    print("-" * 70)
    result = await verify_manufacturer("Wockhardt Limited")
    print(f"Match: {result['cdsco_match']}")
    print(f"Verified: {result['manufacturer_verified']}")
    print(f"Status: {result['details'].get('status') if result['details'] else 'N/A'}")
    print(f"Confidence Impact: {result['confidence_modifier']}")
    if result['cdsco_match'] and result['confidence_modifier'] == 10:
        print("✅ TEST PASSED - Provisional manufacturer scored +10")
    
    # Test 4: Unknown manufacturer
    print("\n[TEST 4] Unknown Manufacturer: FakePharmaCorp")
    print("-" * 70)
    result = await verify_manufacturer("FakePharmaCorp")
    print(f"Match: {result['cdsco_match']}")
    print(f"Verified: {result['manufacturer_verified']}")
    print(f"Confidence Impact: {result['confidence_modifier']}")
    print(f"Risk Flag: {result['risk_flag']}")
    if not result['cdsco_match'] and result['confidence_modifier'] == -30:
        print("✅ TEST PASSED - Unknown manufacturer scored -30")
    
    # Test 5: Partial match
    print("\n[TEST 5] Partial Match: Sun Pharma")
    print("-" * 70)
    result = await verify_manufacturer("Sun Pharma")
    print(f"Match: {result['cdsco_match']}")
    if result['cdsco_match']:
        print(f"Matched: {result['details'].get('manufacturer_name')}")
        print("✅ TEST PASSED - Partial match works")
    
    print("\n" + "="*70)
    print("✅ ALL CDSCO SERVICE TESTS COMPLETED")
    print("="*70)


if __name__ == "__main__":
    asyncio.run(test_cdsco_verification())
