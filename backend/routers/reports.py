from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from database import get_db
from models.staff import Staff
from models.chit import Chit
from models.chit_month import ChitMonth, MonthStatus
from models.payment import Payment
from auth.dependencies import require_admin
from schemas import ProfitSummary, ChitProfitReport, MonthProfitReport

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/profit", response_model=ProfitSummary)
async def get_profit_summary(
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get overall profit summary (Admin only)"""
    # Total collected from all payments
    total_collected = db.query(func.sum(Payment.amount_paid)).scalar() or 0
    
    # Total payout from completed months
    total_payout = db.query(func.sum(ChitMonth.payout_amount)).filter(
        ChitMonth.status == MonthStatus.COMPLETED
    ).scalar() or 0
    
    # Calculate profit
    total_profit = float(total_collected) - float(total_payout)
    
    # Count stats
    chit_count = db.query(Chit).filter(Chit.is_active == True).count()
    pending_months = db.query(ChitMonth).filter(
        ChitMonth.status == MonthStatus.PENDING
    ).count()
    
    return ProfitSummary(
        total_collected=float(total_collected),
        total_payout=float(total_payout),
        total_profit=total_profit,
        chit_count=chit_count,
        pending_months=pending_months
    )


@router.get("/profit/chits")
async def get_profit_by_chits(
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get chit-wise profit report (Admin only)"""
    chits = db.query(Chit).all()
    
    result = []
    for chit in chits:
        # Total collected for this chit
        collected = db.query(func.sum(Payment.amount_paid)).filter(
            Payment.chit_id == chit.id
        ).scalar() or 0
        
        # Total payout for this chit
        payout = db.query(func.sum(ChitMonth.payout_amount)).filter(
            ChitMonth.chit_id == chit.id,
            ChitMonth.status == MonthStatus.COMPLETED
        ).scalar() or 0
        
        # Completed months
        completed = db.query(ChitMonth).filter(
            ChitMonth.chit_id == chit.id,
            ChitMonth.status == MonthStatus.COMPLETED
        ).count()
        
        result.append({
            "chit_id": chit.id,
            "chit_name": chit.chit_name,
            "total_amount": float(chit.total_amount),
            "total_months": chit.total_months,
            "completed_months": completed,
            "total_collected": float(collected),
            "total_payout": float(payout),
            "total_profit": float(collected) - float(payout),
            "is_active": chit.is_active
        })
    
    return result


@router.get("/profit/chit/{chit_id}")
async def get_chit_profit_detail(
    chit_id: int,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get detailed profit for a specific chit (Admin only)"""
    chit = db.query(Chit).filter(Chit.id == chit_id).first()
    
    if not chit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chit not found"
        )
    
    months = db.query(ChitMonth).filter(
        ChitMonth.chit_id == chit_id
    ).order_by(ChitMonth.month_number).all()
    
    month_details = []
    total_collected = 0
    total_payout = 0
    total_profit = 0
    
    for month in months:
        # Collected for this month
        collected = db.query(func.sum(Payment.amount_paid)).filter(
            Payment.chit_month_id == month.id
        ).scalar() or 0
        
        payout = float(month.payout_amount) if month.payout_amount else 0
        profit = float(collected) - payout
        
        total_collected += float(collected)
        total_payout += payout
        total_profit += profit
        
        month_details.append({
            "month_number": month.month_number,
            "status": month.status.value,
            "collected": float(collected),
            "payout": payout,
            "profit": profit,
            "winner_user_id": month.winner_user_id
        })
    
    return {
        "chit_id": chit.id,
        "chit_name": chit.chit_name,
        "total_amount": float(chit.total_amount),
        "monthly_amount": float(chit.monthly_amount),
        "total_months": chit.total_months,
        "summary": {
            "total_collected": total_collected,
            "total_payout": total_payout,
            "total_profit": total_profit
        },
        "months": month_details
    }


@router.get("/profit/monthly")
async def get_monthly_profit(
    year: Optional[int] = None,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get month-wise profit report (Admin only)"""
    # Get all payments (no year filter for now to show all data)
    payments = db.query(Payment).all()
    
    # Group payments by year-month
    monthly_data = {}
    for p in payments:
        year_val = p.payment_date.year
        month_val = p.payment_date.month
        key = (year_val, month_val)
        if key not in monthly_data:
            monthly_data[key] = {"collected": 0, "payout": 0}
        monthly_data[key]["collected"] += float(p.amount_paid)
    
    # Get payouts by month (based on auction_date)
    payouts = db.query(ChitMonth).filter(
        ChitMonth.status == MonthStatus.COMPLETED,
        ChitMonth.auction_date != None
    ).all()
    
    for payout in payouts:
        if payout.auction_date:
            try:
                # Handle both string and date objects
                if isinstance(payout.auction_date, str):
                    date_parts = payout.auction_date.split('-')
                    year_val = int(date_parts[0])
                    month_val = int(date_parts[1])
                else:
                    year_val = payout.auction_date.year
                    month_val = payout.auction_date.month
                
                key = (year_val, month_val)
                if key not in monthly_data:
                    monthly_data[key] = {"collected": 0, "payout": 0}
                monthly_data[key]["payout"] += float(payout.payout_amount or 0)
            except:
                pass  # Skip invalid dates
    
    # Format result as flat array with year and month as separate fields
    result = []
    for (year_val, month_val) in sorted(monthly_data.keys(), reverse=True):
        data = monthly_data[(year_val, month_val)]
        result.append({
            "year": year_val,
            "month": month_val,
            "total_collected": data["collected"],
            "total_payouts": data["payout"],
            "profit": data["collected"] - data["payout"]
        })
    
    return result


@router.get("/dashboard")
async def get_admin_dashboard(
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard summary (Admin only)"""
    from models.user import User
    
    # Counts
    total_users = db.query(User).filter(User.is_active == True).count()
    total_staff = db.query(Staff).filter(Staff.is_active == True).count()
    active_chits = db.query(Chit).filter(Chit.is_active == True).count()
    
    # Financial summary
    total_collected = db.query(func.sum(Payment.amount_paid)).scalar() or 0
    total_payout = db.query(func.sum(ChitMonth.payout_amount)).filter(
        ChitMonth.status == MonthStatus.COMPLETED
    ).scalar() or 0
    total_profit = float(total_collected) - float(total_payout)
    
    # This month's collection
    current_month = datetime.now().month
    current_year = datetime.now().year
    monthly_collection = db.query(func.sum(Payment.amount_paid)).filter(
        func.extract('month', Payment.payment_date) == current_month,
        func.extract('year', Payment.payment_date) == current_year
    ).scalar() or 0
    
    # Pending amount (simplified - could be calculated from user balances)
    pending_months = db.query(ChitMonth).filter(
        ChitMonth.status == MonthStatus.PENDING
    ).count()
    
    # Calculate pending amount from pending months
    pending_amount = db.query(func.sum(Chit.monthly_amount)).join(
        ChitMonth, ChitMonth.chit_id == Chit.id
    ).filter(
        ChitMonth.status == MonthStatus.PENDING
    ).scalar() or 0
    
    # Recent activity
    recent_payments = db.query(Payment).order_by(
        Payment.payment_date.desc()
    ).limit(5).all()
    
    recent_payment_list = []
    for p in recent_payments:
        user = db.query(User).filter(User.id == p.user_id).first()
        chit = db.query(Chit).filter(Chit.id == p.chit_id).first()
        recent_payment_list.append({
            "id": p.id,
            "user_name": user.name if user else "Unknown",
            "chit_name": chit.chit_name if chit else "Unknown",
            "amount": float(p.amount_paid),
            "mode": p.payment_mode.value,
            "date": p.payment_date
        })
    
    # Return flat structure matching frontend expectations
    return {
        "total_users": total_users,
        "total_staff": total_staff,
        "active_chits": active_chits,
        "total_collected": float(total_collected),
        "total_payout": float(total_payout),
        "total_profit": total_profit,
        "monthly_collection": float(monthly_collection),
        "pending_amount": float(pending_amount),
        "pending_months": pending_months,
        "recent_payments": recent_payment_list
    }
