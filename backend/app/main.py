from fastapi import FastAPI
from app.api.routes import auth_routes
from app.api.routes.supplier_routes import router as supplier_router
from app.api.routes.medicine_routes import router as medicine_router
from app.api.routes.supply_routes import router as supply_router

app = FastAPI(title="MedGuard AI Backend")
app.include_router(supplier_router, prefix="/supplier", tags=["Supplier"])

@app.get("/")
async def root():
    return {"message": "MedGuard Backend Running"}

app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(medicine_router, prefix="/medicine", tags=["Medicine"])
app.include_router(supply_router, prefix="/supply", tags=["Supply"])
