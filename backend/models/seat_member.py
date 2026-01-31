from sqlalchemy import Column, Integer, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class SeatMember(Base):
    """
    SeatMember model - links users to seats they've joined
    One user can join MULTIPLE seats (important!)
    Each member has a slot number (1-20) in the seat
    """
    __tablename__ = "seat_members"
    
    id = Column(Integer, primary_key=True, index=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    slot_number = Column(Integer, nullable=False)  # 1-20, position in the chit
    join_date = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Unique constraint: one user can only have one slot per seat
    __table_args__ = (
        UniqueConstraint('seat_id', 'user_id', name='uq_seat_member'),
        UniqueConstraint('seat_id', 'slot_number', name='uq_seat_slot'),
    )
    
    # Relationships
    seat = relationship("Seat", back_populates="members")
    user = relationship("User", back_populates="seat_memberships")
    
    def __repr__(self):
        return f"<SeatMember(seat_id={self.seat_id}, user_id={self.user_id}, slot={self.slot_number})>"
