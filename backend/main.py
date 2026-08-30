"""
================================================================================
MPLADS AI RISK DETECTION & SURPLUS WELFARE REALLOCATION BACKEND (FastAPI)
================================================================================
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.dashboard import router as dashboard_router
from backend.routes.projects import router as projects_router
from backend.routes.upload import router as upload_router
from backend.routes.welfare import router as welfare_router

app = FastAPI(
    title="MPLADS AI Risk & Welfare Reallocation API",
    description="High-performance backend engine for national expenditure risk audits and surplus welfare reallocation.",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(dashboard_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(welfare_router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "MPLADS FastAPI Engine",
        "version": "3.0.0",
        "database": "Supabase PostgreSQL Active",
        "ml_engine": "Isolation Forest + Local Outlier Factor (LOF) Ready"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
