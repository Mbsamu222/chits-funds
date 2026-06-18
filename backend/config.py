from pydantic_settings import BaseSettings
from functools import lru_cache
import os


# Detect if running on Vercel (serverless)
IS_VERCEL = os.getenv("VERCEL", "").lower() in ("1", "true")


class Settings(BaseSettings):
    # Database — Vercel uses /tmp (ephemeral), normal server uses local path
    DATABASE_URL: str = (
        "sqlite:////tmp/chitfunds.db" if IS_VERCEL 
        else "sqlite:///./chitfunds.db"
    )
    
    # JWT
    SECRET_KEY: str = "Chits"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # Upload — Vercel uses /tmp, normal server uses project-relative path
    UPLOAD_DIR: str = (
        "/tmp/uploads/screenshots" if IS_VERCEL 
        else "../uploads/screenshots"
    )
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
