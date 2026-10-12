from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.deps import get_current_user, get_telegram_auth_data
from app.core.security import TelegramInitData
from app.models.user import User
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables in dev environment if configured
    if settings.DEBUG:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        except Exception as e:
            print(f"Database table sync notice: {e}")
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Telegram Mini App 'MomPulse' (МамаТрекер)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router)


@app.get("/health", tags=["System"])
async def health_check():
    """Service health check."""
    return {"status": "ok", "app": settings.PROJECT_NAME, "env": settings.ENVIRONMENT}


@app.get("/api/v1/auth/me", tags=["Auth"])
async def auth_me(
    user: User = Depends(get_current_user),
    auth_data: TelegramInitData = Depends(get_telegram_auth_data),
):
    """
    Validates Telegram initData and returns authenticated user details.
    """
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "language_code": user.language_code,
            "created_at": user.created_at,
        },
        "auth_date": auth_data.auth_date,
    }
