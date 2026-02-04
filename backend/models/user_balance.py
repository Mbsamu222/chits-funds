"""
User Balance Model - Cached balance per user per chit
This is a denormalized cache for fast lookups. The source of truth is always the account_ledger.
"""
from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class UserBalance(Base):
    """
    User Balance Cache - Stores computed balances for fast access.
    
    Updated whenever:
    - A new ledger entry is created
    - Monthly dues are generated
    - Payments are recorded
    
    To recalculate from ledger:
    total_due = SUM(amount) WHERE entry_type = 'debit'
    total_paid = SUM(amount) WHERE entry_type = 'credit'
    pending = total_due - total_paid
    advance = MAX(0, total_paid - total_due)
    """
    __tablename__ = "user_balances"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Unique combination of user + chit
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    chit_id = Column(Integer, ForeignKey("chits.id"), nullable=False, index=True)
    
    # Calculated fields (cached from ledger)
    total_due = Column(Numeric(12, 2), default=0)     # Sum of all DEBIT entries
    total_paid = Column(Numeric(12, 2), default=0)    # Sum of all CREDIT entries
    pending = Column(Numeric(12, 2), default=0)       # total_due - total_paid (if positive)
    advance = Column(Numeric(12, 2), default=0)       # Overpayment (if total_paid > total_due)
    
    # Month tracking
    months_due = Column(Integer, default=0)           # Number of months with dues
    months_paid = Column(Integer, default=0)          # Number of fully paid months
    months_partial = Column(Integer, default=0)       # Number of partially paid months
    
    # Last update timestamp
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="balances")
    chit = relationship("Chit", backref="member_balances")
    
    # Ensure one balance record per user per chit
    __table_args__ = (
        UniqueConstraint('user_id', 'chit_id', name='unique_user_chit_balance'),
    )
    
    def recalculate(self, db):
        """Recalculate balance from ledger entries"""
        from sqlalchemy import func
        from models.account_ledger import AccountLedger, EntryType
        
        # Get sum of debits
        debit_sum = db.query(func.sum(AccountLedger.amount)).filter(
            AccountLedger.user_id == self.user_id,
            AccountLedger.chit_id == self.chit_id,
            AccountLedger.entry_type == EntryType.DEBIT
        ).scalar() or 0
        
        # Get sum of credits
        credit_sum = db.query(func.sum(AccountLedger.amount)).filter(
            AccountLedger.user_id == self.user_id,
            AccountLedger.chit_id == self.chit_id,
            AccountLedger.entry_type == EntryType.CREDIT
        ).scalar() or 0
        
        self.total_due = float(debit_sum)
        self.total_paid = float(credit_sum)
        
        balance = float(debit_sum) - float(credit_sum)
        if balance > 0:
            self.pending = balance
            self.advance = 0
        else:
            self.pending = 0
            self.advance = abs(balance)
        
        self.updated_at = datetime.utcnow()
    
    def __repr__(self):
        return f"<UserBalance(user={self.user_id}, chit={self.chit_id}, pending={self.pending}, advance={self.advance})>"
