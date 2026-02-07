from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base


class AuctionStatus(enum.Enum):
    SCHEDULED = "scheduled"
    OPEN = "open"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class Auction(Base):
    __tablename__ = "auctions"

    id = Column(Integer, primary_key=True, index=True)
    chit_month_id = Column(Integer, ForeignKey("chit_months.id"), nullable=False)
    auction_date = Column(DateTime, nullable=False)
    status = Column(SQLEnum(AuctionStatus), default=AuctionStatus.SCHEDULED, nullable=False)
    winning_bid_amount = Column(Numeric(12, 2), nullable=True)
    winner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    dividend_per_member = Column(Numeric(12, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    chit_month = relationship("ChitMonth", back_populates="auctions")
    winner = relationship("User", foreign_keys=[winner_user_id])
    bids = relationship("Bid", back_populates="auction", cascade="all, delete-orphan")


class BidStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bid_amount = Column(Numeric(12, 2), nullable=False)
    bid_time = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLEnum(BidStatus), default=BidStatus.PENDING, nullable=False)
    notes = Column(String(500), nullable=True)

    # Relationships
    auction = relationship("Auction", back_populates="bids")
    user = relationship("User")
