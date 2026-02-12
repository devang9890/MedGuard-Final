from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth_routes
from app.api.routes.supplier_routes import router as supplier_router
from app.api.routes.medicine_routes import router as medicine_router
from app.api.routes.supply_routes import router as supply_router
from app.api.routes.analytics_routes import router as analytics_router
from app.api.routes.alerts_routes import router as alerts_router
from app.api.routes.trust_routes import router as trust_router

app = FastAPI(title="MedGuard AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(supplier_router, prefix="/supplier", tags=["Supplier"])

@app.get("/")
async def root():
    return {"message": "MedGuard Backend Running"}

app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(medicine_router, prefix="/medicine", tags=["Medicine"])
app.include_router(supply_router, prefix="/supply", tags=["Supply"])
app.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(trust_router, prefix="/trust", tags=["Trust Score"])
