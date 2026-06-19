"""
AccountNote model - stores customer credit/debit notes.
These are manual entries by admin to track customer transactions
outside the chit ledger system.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class AccountNote(Base):
    __tablename__ = "account_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(200), nullable=False, index=True)
    credit = Column(Float, default=0.0)
    debit = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    
    # Relationships
    creator = relationship("Staff", backref="created_notes", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<AccountNote(id={self.id}, customer={self.customer_name}, credit={self.credit}, debit={self.debit})>"
