import asyncio
import sys
sys.path.insert(0, r'c:\Users\ACER\Desktop\MATERIAL\medd')
from backend.app.db.mongodb import supplies_collection

async def test():
    # Find a batch that exists
    result = await supplies_collection.find_one({})
    if result:
        batch = result.get('batch_number')
        med = result.get('medicine')
        print(f"Sample batch: {batch}")
        print(f"Sample medicine: {med}")
    else:
        print("No samples found in database")

asyncio.run(test())
