from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "MomPulse API"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Telegram Bot Token
    BOT_TOKEN: str = "mock_bot_token"
    INIT_DATA_MAX_AGE_SECONDS: int = 86400  # 24 hours

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/mompulse_db"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    # Dev auth switch: allows X-Dev-User-Id header if True and in development
    ALLOW_DEV_AUTH_BYPASS: bool = True

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
