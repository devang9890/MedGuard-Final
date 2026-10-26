import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth_routes
from app.api.routes.supplier_routes import router as supplier_router
from app.api.routes.medicine_routes import router as medicine_router
from app.api.routes.supply_routes import router as supply_router
from app.api.routes.analytics_routes import router as analytics_router
from app.api.routes.alerts_routes import router as alerts_router
from app.api.routes.trust_routes import router as trust_router
from app.api.routes.ai_routes import router as ai_router
from app.api.routes.corruption_routes import router as corruption_router
from app.api.routes.predictive_routes import router as predictive_router
from app.api.routes.map_routes import router as map_router
from app.api.routes.scan_routes import router as scan_router
from app.api.routes.public_verify_routes import router as public_verify_router

app = FastAPI(title="MedGuard AI Backend")

@app.on_event("startup")
async def startup_db_client():
    from app.db.mongodb import db
    try:
        await db.supplies.create_index("supplier_id")
        await db.supplies.create_index("medicine_id")
        await db.supplies.create_index("compliance_status")
        await db.supplies.create_index("expiry_date")
        await db.supplies.create_index("is_fake")
        await db.supplies.create_index("is_deleted")
        print("Database indexes created successfully.")
    except Exception as e:
        print(f"Error creating indexes: {e}")

# Explicit origins for CORS support in production and local development
default_origins = [
    "https://medguard-final.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
]

env_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
cors_origins = default_origins + [o for o in env_origins if o not in default_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(supplier_router, prefix="/supplier", tags=["Supplier"])

@app.get("/")
async def root():
    return {"message": "MedGuard Backend Running"}

@app.get("/health")
async def health():
    from app.db.mongodb import client
    db_status = "connected"
    try:
        await client.admin.command("ping")
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "backend": "online",
        "database": db_status
    }

app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(medicine_router, prefix="/medicine", tags=["Medicine"])
app.include_router(supply_router, prefix="/supply", tags=["Supply"])
app.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(trust_router, prefix="/trust", tags=["Trust Score"])
app.include_router(ai_router, prefix="/ai", tags=["AI"])
app.include_router(corruption_router, prefix="/corruption", tags=["Corruption"])
app.include_router(predictive_router, prefix="/predictive", tags=["Predictive"])
app.include_router(map_router, prefix="/map", tags=["National Map"])
app.include_router(scan_router, prefix="/scan", tags=["Medicine Scan"])
app.include_router(public_verify_router, prefix="/public", tags=["Public Verification"])
