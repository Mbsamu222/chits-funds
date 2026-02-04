"""
Account Ledger Model - The financial truth layer
Every rupee movement (dues and payments) is recorded here as DEBIT/CREDIT entries.

CRITICAL: Ledger entries are IMMUTABLE - never update or delete once created.
For corrections, create adjustment entries.
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum


class EntryType(str, enum.Enum):
    """Type of ledger entry"""
    DEBIT = "debit"    # Amount owed (dues) - increases what user owes
    CREDIT = "credit"  # Amount paid (payments) - decreases what user owes


class LedgerSource(str, enum.Enum):
    """Source/reason for the ledger entry"""
    MONTHLY_DUE = "monthly_due"      # Regular monthly subscription due
    PAYMENT = "payment"              # Payment made by user
    ADJUSTMENT = "adjustment"        # Manual adjustment by admin
    AUCTION = "auction"              # Auction-related entry
    ADVANCE = "advance"              # Advance payment credit
    REFUND = "refund"                # Refund issued


class AccountLedger(Base):
    """
    Account Ledger - Records every financial transaction.
    
    Key Principles:
    1. Never modify or delete entries - append only
    2. DEBIT = user owes money (dues)
    3. CREDIT = user paid money (payments)
    4. Balance = Sum(DEBIT) - Sum(CREDIT)
    5. Negative balance = advance/overpayment
    
    Example Flow:
    - Month starts → DEBIT entry for monthly_due
    - User pays → CREDIT entry for payment
    - User overpays → CREDIT entry marked as advance
    """
    __tablename__ = "account_ledger"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Who and which chit
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    chit_id = Column(Integer, ForeignKey("chits.id"), nullable=False, index=True)
    
    # Which month (nullable for advance payments)
    chit_month_id = Column(Integer, ForeignKey("chit_months.id"), nullable=True, index=True)
    
    # Entry details
    entry_type = Column(SQLEnum(EntryType), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)  # Always positive
    source = Column(SQLEnum(LedgerSource), nullable=False)
    
    # Reference to original record (payment_id for credits, month_id for debits)
    reference_id = Column(Integer, nullable=True)
    reference_type = Column(String(50), nullable=True)  # 'payment', 'chit_month', etc.
    
    # Additional info
    notes = Column(Text, nullable=True)
    
    # Tracking
    created_by = Column(Integer, ForeignKey("staff.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", backref="ledger_entries")
    chit = relationship("Chit", backref="ledger_entries")
    chit_month = relationship("ChitMonth", backref="ledger_entries")
    created_by_staff = relationship("Staff", backref="created_ledger_entries")
    
    def __repr__(self):
        return f"<AccountLedger(id={self.id}, user={self.user_id}, type={self.entry_type}, amount={self.amount})>"
