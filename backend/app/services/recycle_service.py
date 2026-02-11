from datetime import datetime
from bson import ObjectId
from app.db.mongodb import db


async def soft_delete(collection_name: str, doc_id: str):
    """Soft delete a document by setting is_deleted flag."""
    collection = db[collection_name]
    await collection.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {"is_deleted": True, "deleted_at": datetime.utcnow()}}
    )
    return {"message": "Record moved to recycle bin"}


async def restore(collection_name: str, doc_id: str):
    """Restore a soft-deleted document."""
    collection = db[collection_name]
    await collection.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {"is_deleted": False, "deleted_at": None}}
    )
    return {"message": "Record restored"}


async def permanent_delete(collection_name: str, doc_id: str):
    """Permanently delete a document from the database."""
    collection = db[collection_name]
    result = await collection.delete_one({"_id": ObjectId(doc_id)})
    if result.deleted_count == 0:
        return {"message": "Record not found"}
    return {"message": "Record permanently deleted"}


async def get_deleted(collection_name: str):
    """Get all soft-deleted documents from a collection."""
    collection = db[collection_name]
    deleted = []
    async for doc in collection.find({"is_deleted": True}):
        doc["_id"] = str(doc["_id"])
        # Serialize ObjectId fields if present
        if "medicine_id" in doc and isinstance(doc["medicine_id"], ObjectId):
            doc["medicine_id"] = str(doc["medicine_id"])
        if "supplier_id" in doc and isinstance(doc["supplier_id"], ObjectId):
            doc["supplier_id"] = str(doc["supplier_id"])
        deleted.append(doc)
    return deleted
