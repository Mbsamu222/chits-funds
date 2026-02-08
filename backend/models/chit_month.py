from sqlalchemy import Column, Integer, Date, DateTime, Boolean, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum

class MonthStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"

class ChitMonth(Base):
    """
    ChitMonth model - tracks metrics for each month of a chit group
    Includes auction details: winner, payout amount, admin profit
    """
    __tablename__ = "chit_months"
    
    id = Column(Integer, primary_key=True, index=True)
    chit_id = Column(Integer, ForeignKey("chits.id"), nullable=False, index=True)
    month_number = Column(Integer, nullable=False)  # 1 to 20
    
    # Auction details
    auction_date = Column(Date, nullable=True)
    winner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    payout_amount = Column(Numeric(12, 2), nullable=True)  # Amount winner takes home
    admin_profit = Column(Numeric(10, 2), nullable=True)   # Commission/Profit for admin
    
    status = Column(SQLEnum(MonthStatus), default=MonthStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    chit = relationship("Chit", back_populates="months")
    winner = relationship("User", back_populates="won_months")
    payments = relationship("Payment", back_populates="chit_month")
    auctions = relationship("Auction", back_populates="chit_month")
    
    def __repr__(self):
        return f"<ChitMonth(chit_id={self.chit_id}, month={self.month_number}, status={self.status})>"
