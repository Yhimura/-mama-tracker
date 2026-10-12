from fastapi import APIRouter
from app.api.v1.endpoints import profile, logs, export

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(profile.router)
api_router.include_router(logs.router)
api_router.include_router(export.router)
