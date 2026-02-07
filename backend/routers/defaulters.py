from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from database import get_db
from models import User, Chit, ChitMonth, Payment, ChitMember, AccountLedger, EntryType, Staff
from auth.dependencies import get_current_staff

router = APIRouter(prefix="/defaulters", tags=["Defaulters"])


@router.get("")
async def list_defaulters(
    chit_id: Optional[int] = None,
    days_overdue: int = 0,  # Show users overdue by X days
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """
    List defaulters - members who have pending payments
    
    Parameters:
    - chit_id: Filter by specific chit group
    - days_overdue: Show only users overdue by this many days (0 = all with pending)
    """
    
    from models.user_balance import UserBalance
    
    # Query all users with pending balances
    query = db.query(UserBalance).filter(UserBalance.pending > 0)
    
    if chit_id:
        query = query.filter(UserBalance.chit_id == chit_id)
    
    pending_balances = query.all()
    
    defaulters = []
    
    for balance in pending_balances:
        user = db.query(User).filter(User.id == balance.user_id).first()
        chit = db.query(Chit).filter(Chit.id == balance.chit_id).first()
        
        if not user or not chit:
            continue
        
        # Get last payment date
        last_payment = db.query(Payment).filter(
            Payment.user_id == balance.user_id,
            Payment.chit_id == balance.chit_id
        ).order_by(Payment.payment_date.desc()).first()
        
        last_payment_date = last_payment.payment_date if last_payment else None
        
        # Calculate days since last payment
        days_since_last_payment = 0
        if last_payment_date:
            days_since_last_payment = (datetime.now() - last_payment_date).days
        else:
            # No payment ever made - calculate from chit start date
            if chit.start_date:
                days_since_last_payment = (datetime.now().date() - chit.start_date).days
        
        # Filter by days overdue if specified
        if days_overdue > 0 and days_since_last_payment < days_overdue:
            continue
        
        # Get pending month details
        pending_months = []
        chit_months = db.query(ChitMonth).filter(
            ChitMonth.chit_id == balance.chit_id
        ).order_by(ChitMonth.month_number).all()
        
        for month in chit_months:
            month_debit = db.query(func.sum(AccountLedger.amount)).filter(
                AccountLedger.user_id == balance.user_id,
                AccountLedger.chit_id == balance.chit_id,
                AccountLedger.chit_month_id == month.id,
                AccountLedger.entry_type == EntryType.DEBIT
            ).scalar() or Decimal('0')
            
            month_credit = db.query(func.sum(AccountLedger.amount)).filter(
                AccountLedger.user_id == balance.user_id,
                AccountLedger.chit_id == balance.chit_id,
                AccountLedger.chit_month_id == month.id,
                AccountLedger.entry_type == EntryType.CREDIT
            ).scalar() or Decimal('0')
            
            month_pending = month_debit - month_credit
            
            if month_pending > 0:
                pending_months.append({
                    "month_number": month.month_number,
                    "due_amount": float(month_pending),
                    "auction_date": month.auction_date.isoformat() if month.auction_date else None
                })
        
        # Determine severity
        severity = "low"
        if balance.pending > chit.monthly_amount * 2:
            severity = "high"
        elif balance.pending > chit.monthly_amount:
            severity = "medium"
        
        defaulters.append({
            "user_id": user.id,
            "user_name": user.name,
            "user_phone": user.phone,
            "chit_id": chit.id,
            "chit_name": chit.chit_name,
            "total_pending": float(balance.pending),
            "pending_months": len(pending_months),
            "pending_month_details": pending_months,
            "last_payment_date": last_payment_date.isoformat() if last_payment_date else None,
            "days_since_last_payment": days_since_last_payment,
            "severity": severity,
            "monthly_amount": float(chit.monthly_amount)
        })
    
    # Sort by pending amount (highest first)
    defaulters.sort(key=lambda x: x['total_pending'], reverse=True)
    
    return {
        "total_defaulters": len(defaulters),
        "total_pending_amount": sum(d['total_pending'] for d in defaulters),
        "defaulters": defaulters
    }


@router.get("/stats")
async def defaulter_stats(
    chit_id: Optional[int] = None,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get defaulter statistics"""
    
    from models.user_balance import UserBalance
    
    query = db.query(UserBalance).filter(UserBalance.pending > 0)
    
    if chit_id:
        query = query.filter(UserBalance.chit_id == chit_id)
    
    pending_balances = query.all()
    
    total_defaulters = len(pending_balances)
    total_pending = sum(float(b.pending) for b in pending_balances)
    
    # Categorize by severity
    high_severity = 0
    medium_severity = 0
    low_severity = 0
    
    for balance in pending_balances:
        chit = db.query(Chit).filter(Chit.id == balance.chit_id).first()
        if not chit:
            continue
        
        if balance.pending > chit.monthly_amount * 2:
            high_severity += 1
        elif balance.pending > chit.monthly_amount:
            medium_severity += 1
        else:
            low_severity += 1
    
    return {
        "total_defaulters": total_defaulters,
        "total_pending_amount": total_pending,
        "severity_breakdown": {
            "high": high_severity,
            "medium": medium_severity,
            "low": low_severity
        }
    }


@router.post("/{user_id}/send-reminder")
async def send_payment_reminder(
    user_id: int,
    chit_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Send payment reminder to defaulter (placeholder for SMS/Email integration)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    chit = db.query(Chit).filter(Chit.id == chit_id).first()
    if not chit:
        raise HTTPException(status_code=404, detail="Chit not found")
    
    # Get pending amount
    from models.user_balance import UserBalance
    balance = db.query(UserBalance).filter(
        UserBalance.user_id == user_id,
        UserBalance.chit_id == chit_id
    ).first()
    
    if not balance or balance.pending <= 0:
        raise HTTPException(status_code=400, detail="No pending payments for this user")
    
    # TODO: Integrate with SMS/Email service
    # For now, just log the reminder
    print(f"[REMINDER] Sending reminder to {user.name} ({user.phone})")
    print(f"[REMINDER] Pending amount: ₹{balance.pending} for {chit.chit_name}")
    
    return {
        "message": "Reminder sent successfully",
        "user_name": user.name,
        "user_phone": user.phone,
        "pending_amount": float(balance.pending),
        "chit_name": chit.chit_name
    }
