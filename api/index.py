import sys
import os
from pathlib import Path

# Add backend directory to path so we can import modules
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import the app from backend
try:
    from main import app as backend_app
    app = backend_app
except ImportError as e:
    logger.warning(f"Could not import backend app: {e}. Creating minimal app.")
    
    # Fallback: Create a minimal app if imports fail
    app = FastAPI(title="TherapyAI Backend", version="1.0.0")
    
    # CORS middleware
    allowed_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins if allowed_origins != ["*"] else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.get("/")
    async def root():
        return {"message": "TherapyAI Backend API", "version": "1.0.0", "status": "minimal"}
    
    @app.get("/health")
    async def health():
        return {"status": "ok", "mode": "fallback"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "therapyai-backend",
        "environment": "production"
    }

# For Vercel, the app must be the last statement
export = app
