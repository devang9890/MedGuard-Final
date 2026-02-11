from fastapi import FastAPI
from app.api.routes import auth_routes
from app.api.routes.supplier_routes import router as supplier_router

app = FastAPI(title="MedGuard AI Backend")
app.include_router(supplier_router, prefix="/supplier", tags=["Supplier"])

@app.get("/")
async def root():
    return {"message": "MedGuard Backend Running"}

app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
