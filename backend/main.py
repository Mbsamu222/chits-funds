from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import engine, Base
from models import (
    User, Staff, StaffUser, Chit, ChitMember, ChitMonth, Payment, 
    AccountLedger, UserBalance, PasswordResetToken, AuditLog
)
from routers import (
    auth_router,
    users_router,
    staff_router,
    chits_router,
    payments_router,
    reports_router,
    accounts_router
)
from config import settings

# Create all tables
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create default admin
    from sqlalchemy.orm import Session
    from database import SessionLocal
    from auth.jwt_handler import get_password_hash
    from models.staff import Staff, StaffRole
    
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(Staff).filter(Staff.role == StaffRole.ADMIN).first()
        if not admin:
            # Create default admin
            admin = Staff(
                name="Admin",
                phone="9999999999",
                email="admin@chitfunds.com",
                password_hash=get_password_hash("admin123"),
                role=StaffRole.ADMIN
            )
            db.add(admin)
            db.commit()
            print("✅ Default admin created: phone=9999999999, password=admin123")
        else:
            print("✅ Admin already exists")
    finally:
        db.close()
    
    yield
    # Shutdown logic (none for now)

# Create FastAPI app
app = FastAPI(
    title="Chit Fund Management System",
    description="Complete chit fund management with role-based access",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware (comment out for development if needed)
# from middleware.rate_limit import RateLimitMiddleware
# app.add_middleware(RateLimitMiddleware)

# Mount static files for screenshots
upload_dir = os.path.abspath(settings.UPLOAD_DIR)
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=os.path.dirname(upload_dir)), name="uploads")

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(staff_router)
app.include_router(chits_router)
app.include_router(payments_router)
app.include_router(reports_router)
app.include_router(accounts_router)


@app.get("/")
async def root():
    return {
        "message": "Chit Fund Management System API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
