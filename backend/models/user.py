from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    """
    User model - represents a chit fund member/customer
    Each user can join multiple chits and has address/phone for contact
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    
    # Relationships
    creator = relationship("Staff", back_populates="created_users", foreign_keys=[created_by])
    staff_assignments = relationship("StaffUser", back_populates="user")
    chit_memberships = relationship("ChitMember", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    won_months = relationship("ChitMonth", back_populates="winner")
    
    def __repr__(self):
        return f"<User(id={self.id}, name={self.name}, phone={self.phone})>"
