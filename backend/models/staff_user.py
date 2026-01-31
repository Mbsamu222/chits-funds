from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class StaffUser(Base):
    """
    StaffUser mapping - links staff to their assigned users
    Each staff can have 50-400 users assigned
    This controls visibility: staff can only see their assigned users
    """
    __tablename__ = "staff_users"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    
    # Unique constraint: one user can only be assigned to one staff
    __table_args__ = (
        UniqueConstraint('user_id', name='uq_staff_user_user'),
    )
    
    # Relationships
    staff = relationship("Staff", back_populates="staff_assignments")
    user = relationship("User", back_populates="staff_assignments")
    
    def __repr__(self):
        return f"<StaffUser(staff_id={self.staff_id}, user_id={self.user_id})>"
