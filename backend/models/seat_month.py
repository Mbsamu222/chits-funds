from sqlalchemy import Column, Integer, Date, Numeric, DateTime, String, ForeignKey, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum


class MonthStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class SeatMonth(Base):
    """
    SeatMonth model - tracks monthly auctions and winners
    Each month one person takes the amount (wins the auction)
    This tracks: which month, who won, payout, admin profit
    """
    __tablename__ = "seat_months"
    
    id = Column(Integer, primary_key=True, index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False, index=True)
    month_number = Column(Integer, nullable=False)  # 1-20
    auction_date = Column(Date, nullable=True)
    winner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    payout_amount = Column(Numeric(12, 2), nullable=True)  # Amount given to winner
    admin_profit = Column(Numeric(10, 2), nullable=True)  # Calculated profit
    status = Column(SQLEnum(MonthStatus), default=MonthStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Unique constraint: one entry per month per seat
    __table_args__ = (
        UniqueConstraint('seat_id', 'month_number', name='uq_seat_month'),
    )
    
    # Relationships
    seat = relationship("Seat", back_populates="months")
    winner = relationship("User", back_populates="won_months")
    payments = relationship("Payment", back_populates="seat_month")
    
    def __repr__(self):
        return f"<SeatMonth(seat_id={self.seat_id}, month={self.month_number}, status={self.status})>"
