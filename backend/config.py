from pydantic_settings import BaseSettings
from functools import lru_cache
import os


# ---------------------------------------------------------------------------
# Vercel / serverless detection
# ---------------------------------------------------------------------------

def _detect_serverless() -> bool:
    """Detect if running on Vercel/serverless (read-only filesystem)."""
    if os.getenv("VERCEL", "").lower() in ("1", "true"):
        return True
    if os.getenv("VERCEL_ENV"):
        return True
    if os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return True
    try:
        test_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_probe_rw")
        os.makedirs(test_path, exist_ok=True)
        os.rmdir(test_path)
        return False
    except Exception:
        return True


IS_VERCEL = _detect_serverless()


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

class Settings(BaseSettings):
    # Database — PostgreSQL (Supabase) for both local and production.
    # SQLAlchemy requires "postgresql://" not "postgres://".
    DATABASE_URL: str = "postgresql://postgres.dljaapgoynxxbjiywqby:23iftX8mBgtAIBfr@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

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
    s = Settings()

    # Fix common Supabase/Heroku "postgres://" → "postgresql://"
    if s.DATABASE_URL.startswith("postgres://"):
        object.__setattr__(s, "DATABASE_URL", s.DATABASE_URL.replace("postgres://", "postgresql://", 1))

    print(f"[DB] Using: {s.DATABASE_URL[:40]}...")
    return s


settings = get_settings()
