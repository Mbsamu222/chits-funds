"""
Password Reset Token Model
Used for secure password reset flow with expiry and single-use tokens.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from database import Base
import secrets


class PasswordResetToken(Base):
    """
    Password Reset Token - For secure password recovery.
    
    Flow:
    1. User requests reset via phone/email
    2. System generates secure token with 30-min expiry
    3. Token sent to user (via SMS/email in production)
    4. User uses token to reset password
    5. Token marked as used, cannot be reused
    
    Security:
    - Tokens are cryptographically secure (secrets.token_urlsafe)
    - 30-minute expiry
    - Single-use (marked as used after reset)
    - All existing JWTs effectively invalidated on password change
    """
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False, index=True)
    
    # Secure token - 32 bytes of randomness, URL-safe encoding
    token = Column(String(255), unique=True, nullable=False, index=True)
    
    # Expiry - default 30 minutes from creation
    expires_at = Column(DateTime, nullable=False)
    
    # Single-use flag
    used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    
    # Relationships
    staff = relationship("Staff", backref="reset_tokens")
    
    @staticmethod
    def generate_token() -> str:
        """Generate a cryptographically secure token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def get_expiry(minutes: int = 30) -> datetime:
        """Get expiry datetime (default 30 minutes from now)"""
        return datetime.utcnow() + timedelta(minutes=minutes)
    
    def is_valid(self) -> bool:
        """Check if token is valid (not used and not expired)"""
        if self.used:
            return False
        if datetime.utcnow() > self.expires_at:
            return False
        return True
    
    def mark_used(self):
        """Mark token as used"""
        self.used = True
        self.used_at = datetime.utcnow()
    
    def __repr__(self):
        return f"<PasswordResetToken(staff_id={self.staff_id}, expires={self.expires_at}, used={self.used})>"
