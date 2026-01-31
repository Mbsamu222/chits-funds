from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum


class StaffRole(str, enum.Enum):
    ADMIN = "admin"
    STAFF = "staff"


class Staff(Base):
    """
    Staff model - represents admin or staff users who manage the system
    Admin: Full access to all data
    Staff: Can only see assigned members
    """
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(StaffRole), default=StaffRole.STAFF)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    created_users = relationship("User", back_populates="creator", foreign_keys="User.created_by")
    user_assignments = relationship("StaffUser", back_populates="staff")
    collected_payments = relationship("Payment", back_populates="collected_by")
    created_seats = relationship("Seat", back_populates="creator")
    
    def is_admin(self) -> bool:
        return self.role == StaffRole.ADMIN
    
    def __repr__(self):
        return f"<Staff(id={self.id}, name={self.name}, role={self.role})>"
