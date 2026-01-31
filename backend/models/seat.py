from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Seat(Base):
    """
    Seat model - represents a chit group/kuri
    Example: 20 members, 20 months, ₹5,00,000 or ₹10,00,000 total
    Monthly amount = total_amount / total_months
    """
    __tablename__ = "seats"
    
    id = Column(Integer, primary_key=True, index=True)
    seat_name = Column(String(100), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)  # e.g., 500000.00 or 1000000.00
    total_months = Column(Integer, default=20)
    monthly_amount = Column(Numeric(10, 2), nullable=False)  # total_amount / total_months
    start_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = relationship("Staff", back_populates="created_seats")
    members = relationship("SeatMember", back_populates="seat")
    months = relationship("SeatMonth", back_populates="seat")
    payments = relationship("Payment", back_populates="seat")
    
    @property
    def member_count(self) -> int:
        return len(self.members) if self.members else 0
    
    def __repr__(self):
        return f"<Seat(id={self.id}, name={self.seat_name}, amount={self.total_amount})>"
