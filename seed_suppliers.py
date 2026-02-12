import asyncio
import sys
import random
sys.path.insert(0, 'C:/Users/ACER/Desktop/medd/backend')

from app.db.mongodb import db

# Major Indian cities with coordinates
DEMO_SUPPLIERS = [
    {"name": "Delhi Medical Supplies", "email": "delhi@med.com", "phone": "9811223344", "address": "New Delhi", "lat": 28.6139, "lng": 77.2090},
    {"name": "Mumbai Pharma Corp", "email": "mumbai@pharma.com", "phone": "9822334455", "address": "Mumbai", "lat": 19.0760, "lng": 72.8777},
    {"name": "Bangalore Bio Tech", "email": "bangalore@bio.com", "phone": "9833445566", "address": "Bangalore", "lat": 12.9716, "lng": 77.5946},
    {"name": "Chennai Medicines", "email": "chennai@med.com", "phone": "9844556677", "address": "Chennai", "lat": 13.0827, "lng": 80.2707},
    {"name": "Kolkata Drug House", "email": "kolkata@drug.com", "phone": "9855667788", "address": "Kolkata", "lat": 22.5726, "lng": 88.3639},
    {"name": "Hyderabad Pharma", "email": "hyderabad@pharma.com", "phone": "9866778899", "address": "Hyderabad", "lat": 17.3850, "lng": 78.4867},
    {"name": "Ahmedabad Med Co", "email": "ahmedabad@med.com", "phone": "9877889900", "address": "Ahmedabad", "lat": 23.0225, "lng": 72.5714},
    {"name": "Pune Healthcare", "email": "pune@health.com", "phone": "9888990011", "address": "Pune", "lat": 18.5204, "lng": 73.8567},
    {"name": "Jaipur Medical", "email": "jaipur@med.com", "phone": "9899001122", "address": "Jaipur", "lat": 26.9124, "lng": 75.7873},
    {"name": "Lucknow Suppliers", "email": "lucknow@supply.com", "phone": "9800112233", "address": "Lucknow", "lat": 26.8467, "lng": 80.9462},
]

async def seed_suppliers():
    # Check existing count
    existing_count = await db.suppliers.count_documents({})
    print(f"Existing suppliers: {existing_count}")
    
    if existing_count >= 5:
        print("Suppliers already exist. Updating coordinates...")
        # Update existing suppliers with coordinates
        async for supplier in db.suppliers.find({}):
            if not supplier.get("lat") or not supplier.get("lng"):
                lat = random.uniform(8.4, 35.5)
                lng = random.uniform(68.7, 97.4)
                await db.suppliers.update_one(
                    {"_id": supplier["_id"]},
                    {"$set": {"lat": lat, "lng": lng}}
                )
                print(f"Updated {supplier.get('name', 'Unknown')} with coordinates")
    else:
        print("Creating demo suppliers...")
        for supplier in DEMO_SUPPLIERS:
            supplier["verified"] = random.choice([True, False])
            supplier["blacklisted"] = random.choice([False, False, False, True])  # 25% chance
            supplier["is_deleted"] = False
            
            # Check if already exists
            existing = await db.suppliers.find_one({"email": supplier["email"]})
            if not existing:
                result = await db.suppliers.insert_one(supplier)
                print(f"Created supplier: {supplier['name']}")
            else:
                print(f"Supplier already exists: {supplier['name']}")
    
    final_count = await db.suppliers.count_documents({})
    print(f"\nTotal suppliers in database: {final_count}")

asyncio.run(seed_suppliers())
