from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = AsyncIOMotorClient(settings.mongo_url)
db = client[settings.database_name]

def get_collection(collection_name: str):
    """
    Get a MongoDB collection by name.
    """
    return db[collection_name]
