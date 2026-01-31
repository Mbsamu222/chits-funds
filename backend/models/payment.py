from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum


class PaymentMode(str, enum.Enum):
    CASH = "cash"
    GPAY = "gpay"


class Payment(Base):
    """
    Payment model - records all payments made by users
    Supports cash and GPay with screenshot upload
    Tracks which staff collected the payment
    """
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    chit_id = Column(Integer, ForeignKey("chits.id"), nullable=False, index=True)
    chit_month_id = Column(Integer, ForeignKey("chit_months.id"), nullable=True, index=True)
    amount_paid = Column(Numeric(10, 2), nullable=False)
    payment_mode = Column(SQLEnum(PaymentMode), default=PaymentMode.CASH)
    screenshot_url = Column(String(500), nullable=True)  # For GPay payments
    collected_by_staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="payments")
    chit = relationship("Chit", back_populates="payments")
    chit_month = relationship("ChitMonth", back_populates="payments")
    collected_by = relationship("Staff", back_populates="collected_payments")
    
    def __repr__(self):
        return f"<Payment(id={self.id}, user_id={self.user_id}, amount={self.amount_paid}, mode={self.payment_mode})>"
