from pydantic_settings import BaseSettings
from functools import lru_cache
import os


def _detect_serverless() -> bool:
    """Detect if running on Vercel/serverless (read-only filesystem)."""
    # Check Vercel-specific env vars (fast path)
    if os.getenv("VERCEL", "").lower() in ("1", "true"):
        return True
    if os.getenv("VERCEL_ENV"):  # set to 'production', 'preview', or 'development'
        return True
    if os.getenv("AWS_LAMBDA_FUNCTION_NAME"):  # Vercel runs on AWS Lambda
        return True
    # Ultimate fallback: check if the filesystem is read-only
    try:
        test_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_probe_rw")
        os.makedirs(test_path, exist_ok=True)
        os.rmdir(test_path)
        return False  # project root is writable → not serverless
    except Exception:
        return True   # project root is read-only → serverless


IS_VERCEL = _detect_serverless()


class Settings(BaseSettings):
    # Database — Vercel uses /tmp (ephemeral), normal server uses local path
    DATABASE_URL: str = (
        "sqlite:////tmp/Popular Traders Chits.db" if IS_VERCEL 
        else "sqlite:///./Popular Traders Chits.db"
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
    
    # CORS — Comma-separated allowed origins (read from .env)
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"
    
    # Swagger/OpenAPI docs — set to true to show /docs and /redoc
    SHOW_DOCS: bool = True
    
    @property
    def cors_origins_list(self) -> list:
        """Parse CORS_ORIGINS string into a list of origins."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
