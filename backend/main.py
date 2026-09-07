import os
import sys
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

from backend.app.database import init_db, SessionLocal
from backend.app.models import Handover
from backend.services.data_generator import DataGenerator

from backend.app.api.handovers import router as handovers_router
from backend.app.api.sensors import router as sensors_router
from backend.app.api.alerts import router as alerts_router
from backend.app.api.audit import router as audit_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.settings import router as settings_router
from backend.app.api.simulation import router as simulation_router
from backend.app.api.experiments import router as experiments_router

app = FastAPI(
    title="Dairy Cold-Chain Sensor Gap Reconstruction & Handover Confidence System",
    description="End-to-end prototype for dairy sensor gap reconstruction, uncertain exposure calculation, and audit trail.",
    version="1.0.0"
)

# CORS middleware for seamless local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(dashboard_router)
app.include_router(handovers_router)
app.include_router(sensors_router)
app.include_router(alerts_router)
app.include_router(audit_router)
app.include_router(settings_router)
app.include_router(simulation_router)
app.include_router(experiments_router)

@app.on_event("startup")
def startup_event():
    init_db()
    db = SessionLocal()
    try:
        # Check if database already has handovers seeded
        ho_count = db.query(Handover).count()
        if ho_count == 0:
            print("[INFO] Initializing and seeding 7-day realistic dairy cold-chain dataset...")
            DataGenerator.generate_full_dataset(db, days=7)
            print("[INFO] Seeding completed successfully.")
        else:
            print(f"[INFO] Database ready with {ho_count} handovers.")
    finally:
        db.close()

# Frontend Static Files Mount (if built)
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
