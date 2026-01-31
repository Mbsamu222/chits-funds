from sqlalchemy import Column, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class ChitMember(Base):
    """
    ChitMember model - maps Users to Chits
    Tracks which slot number user has taken
    """
    __tablename__ = "chit_members"
    
    id = Column(Integer, primary_key=True, index=True)
    chit_id = Column(Integer, ForeignKey("chits.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    slot_number = Column(Integer, nullable=False)  # e.g., 1 to 20
    join_date = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    chit = relationship("Chit", back_populates="members")
    user = relationship("User", back_populates="chit_memberships")
    
    def __repr__(self):
        return f"<ChitMember(chit_id={self.chit_id}, user_id={self.user_id}, slot={self.slot_number})>"
