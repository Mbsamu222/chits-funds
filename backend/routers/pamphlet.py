"""
Pamphlet generation router for monthly payment reports
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from database import get_db
from models.staff import Staff
from models.chit import Chit
from models.chit_member import ChitMember
from models.chit_month import ChitMonth
from models.payment import Payment
from models.user import User
from models.account_ledger import AccountLedger, EntryType
from auth.dependencies import get_current_staff

router = APIRouter(prefix="/pamphlets", tags=["Pamphlets"])


@router.get("/chit/{chit_id}/month/{month_number}")
async def get_monthly_pamphlet(
    chit_id: int,
    month_number: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """
    Get pamphlet data for a specific chit group and month.
    Returns all member payment statuses using AccountLedger for accuracy.
    
    Financial Calculation:
    - Due Amount = Sum of DEBIT entries for this user/month
    - Paid Amount = Sum of CREDIT entries for this user/month
    - Status = Based on paid vs due comparison
    """
    # Get chit details
    chit = db.query(Chit).filter(Chit.id == chit_id).first()
    if not chit:
        raise HTTPException(status_code=404, detail="Chit not found")
    
    # Get month details
    month = db.query(ChitMonth).filter(
        ChitMonth.chit_id == chit_id,
        ChitMonth.month_number == month_number
    ).first()
    
    if not month:
        raise HTTPException(status_code=404, detail="Month not found")
    
    # Get all members
    members = db.query(ChitMember).filter(ChitMember.chit_id == chit_id).all()
    
    # Build member payment status list
    member_payments = []
    total_collected = 0
    total_pending = 0
    total_due_sum = 0
    
    for member in members:
        # Get user details
        user = db.query(User).filter(User.id == member.user_id).first()
        if not user:
            continue
        
        # Get due amount from AccountLedger (DEBIT entries)
        due_result = db.query(func.sum(AccountLedger.amount)).filter(
            AccountLedger.chit_id == chit_id,
            AccountLedger.user_id == member.user_id,
            AccountLedger.chit_month_id == month.id,
            AccountLedger.entry_type == EntryType.DEBIT
        ).scalar()
        
        due_amount = float(due_result) if due_result else float(chit.monthly_amount)
        
        # Get paid amount from AccountLedger (CREDIT entries)
        paid_result = db.query(func.sum(AccountLedger.amount)).filter(
            AccountLedger.chit_id == chit_id,
            AccountLedger.user_id == member.user_id,
            AccountLedger.chit_month_id == month.id,
            AccountLedger.entry_type == EntryType.CREDIT
        ).scalar()
        
        paid_amount = float(paid_result) if paid_result else 0
        
        # Also check Payment table for direct payments (fallback)
        if paid_amount == 0:
            payment = db.query(Payment).filter(
                Payment.chit_id == chit_id,
                Payment.user_id == member.user_id,
                Payment.chit_month_id == month.id
            ).first()
            if payment:
                paid_amount = float(payment.amount_paid)
        
        # Calculate status
        balance = due_amount - paid_amount
        if paid_amount >= due_amount:
            payment_status = "paid"
        elif paid_amount > 0:
            payment_status = "partial"
        else:
            payment_status = "pending"
        
        # Get latest payment date
        latest_payment = db.query(Payment).filter(
            Payment.chit_id == chit_id,
            Payment.user_id == member.user_id,
            Payment.chit_month_id == month.id
        ).order_by(Payment.payment_date.desc()).first()
        
        member_payments.append({
            "slot_number": member.slot_number,
            "user_id": member.user_id,
            "user_name": user.name,
            "user_phone": user.phone,
            "due_amount": due_amount,
            "paid_amount": paid_amount,
            "balance": balance,
            "status": payment_status,
            "payment_date": latest_payment.payment_date.isoformat() if latest_payment and latest_payment.payment_date else None
        })
        
        total_due_sum += due_amount
        total_collected += paid_amount
        if paid_amount < due_amount:
            total_pending += balance
    
    # Sort by slot number
    member_payments.sort(key=lambda x: x["slot_number"])
    
    # Get winner info if auction completed
    winner_name = None
    if month.winner_user_id:
        winner = db.query(User).filter(User.id == month.winner_user_id).first()
        winner_name = winner.name if winner else None
    
    # Calculate collection percentage
    collection_pct = round((total_collected / total_due_sum) * 100, 1) if total_due_sum > 0 else 0
    
    return {
        "chit": {
            "id": chit.id,
            "name": chit.chit_name,
            "total_amount": float(chit.total_amount),
            "monthly_amount": float(chit.monthly_amount),
            "total_months": chit.total_months,
            "start_date": chit.start_date.isoformat() if chit.start_date else None
        },
        "month": {
            "month_number": month_number,
            "status": month.status.value if hasattr(month.status, 'value') else str(month.status),
            "auction_date": month.auction_date.isoformat() if month.auction_date else None,
            "winner_user_id": month.winner_user_id,
            "winner_name": winner_name,
            "payout_amount": float(month.payout_amount) if month.payout_amount else None,
            "admin_profit": float(month.admin_profit) if month.admin_profit else None
        },
        "members": member_payments,
        "summary": {
            "total_members": len(member_payments),
            "total_due": total_due_sum,
            "total_collected": total_collected,
            "total_pending": total_pending,
            "collection_percentage": collection_pct
        },
        "generated_at": datetime.now().isoformat(),
        "generated_by": current_staff.name
    }
