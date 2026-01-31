from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from database import get_db
from models.staff import Staff
from models.seat import Seat
from models.seat_month import SeatMonth, MonthStatus
from models.payment import Payment
from auth.dependencies import require_admin
from schemas import ProfitSummary, SeatProfitReport, MonthProfitReport

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
    total_payout = db.query(func.sum(SeatMonth.payout_amount)).filter(
        SeatMonth.status == MonthStatus.COMPLETED
    ).scalar() or 0
    
    # Calculate profit
    total_profit = float(total_collected) - float(total_payout)
    
    # Count stats
    seat_count = db.query(Seat).filter(Seat.is_active == True).count()
    pending_months = db.query(SeatMonth).filter(
        SeatMonth.status == MonthStatus.PENDING
    ).count()
    
    return ProfitSummary(
        total_collected=float(total_collected),
        total_payout=float(total_payout),
        total_profit=total_profit,
        seat_count=seat_count,
        pending_months=pending_months
    )


@router.get("/profit/seats")
async def get_profit_by_seats(
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get seat-wise profit report (Admin only)"""
    seats = db.query(Seat).all()
    
    result = []
    for seat in seats:
        # Total collected for this seat
        collected = db.query(func.sum(Payment.amount_paid)).filter(
            Payment.seat_id == seat.id
        ).scalar() or 0
        
        # Total payout for this seat
        payout = db.query(func.sum(SeatMonth.payout_amount)).filter(
            SeatMonth.seat_id == seat.id,
            SeatMonth.status == MonthStatus.COMPLETED
        ).scalar() or 0
        
        # Completed months
        completed = db.query(SeatMonth).filter(
            SeatMonth.seat_id == seat.id,
            SeatMonth.status == MonthStatus.COMPLETED
        ).count()
        
        result.append({
            "seat_id": seat.id,
            "seat_name": seat.seat_name,
            "total_amount": float(seat.total_amount),
            "total_months": seat.total_months,
            "completed_months": completed,
            "total_collected": float(collected),
            "total_payout": float(payout),
            "profit": float(collected) - float(payout),
            "is_active": seat.is_active
        })
    
    return result


@router.get("/profit/seat/{seat_id}")
async def get_seat_profit_detail(
    seat_id: int,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get detailed profit for a specific seat (Admin only)"""
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    
    if not seat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seat not found"
        )
    
    months = db.query(SeatMonth).filter(
        SeatMonth.seat_id == seat_id
    ).order_by(SeatMonth.month_number).all()
    
    month_details = []
    total_collected = 0
    total_payout = 0
    total_profit = 0
    
    for month in months:
        # Collected for this month
        collected = db.query(func.sum(Payment.amount_paid)).filter(
            Payment.seat_month_id == month.id
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
        "seat_id": seat.id,
        "seat_name": seat.seat_name,
        "total_amount": float(seat.total_amount),
        "monthly_amount": float(seat.monthly_amount),
        "total_months": seat.total_months,
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
    # Default to current year
    if not year:
        year = datetime.now().year
    
    # Get all payments grouped by month
    payments = db.query(Payment).filter(
        func.extract('year', Payment.payment_date) == year
    ).all()
    
    # Group payments by month
    monthly_data = {}
    for p in payments:
        month_key = p.payment_date.strftime("%Y-%m")
        if month_key not in monthly_data:
            monthly_data[month_key] = {"collected": 0, "payout": 0}
        monthly_data[month_key]["collected"] += float(p.amount_paid)
    
    # Get payouts by month
    payouts = db.query(SeatMonth).filter(
        SeatMonth.status == MonthStatus.COMPLETED,
        SeatMonth.auction_date != None
    ).all()
    
    for payout in payouts:
        if payout.auction_date:
            month_key = payout.auction_date.strftime("%Y-%m")
            if month_key not in monthly_data:
                monthly_data[month_key] = {"collected": 0, "payout": 0}
            monthly_data[month_key]["payout"] += float(payout.payout_amount or 0)
    
    # Format result
    result = []
    for month_key in sorted(monthly_data.keys()):
        data = monthly_data[month_key]
        result.append({
            "month": month_key,
            "total_collected": data["collected"],
            "total_payout": data["payout"],
            "profit": data["collected"] - data["payout"]
        })
    
    return {
        "year": year,
        "months": result,
        "total": {
            "collected": sum(m["total_collected"] for m in result),
            "payout": sum(m["total_payout"] for m in result),
            "profit": sum(m["profit"] for m in result)
        }
    }


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
    total_seats = db.query(Seat).filter(Seat.is_active == True).count()
    
    # Financial summary
    total_collected = db.query(func.sum(Payment.amount_paid)).scalar() or 0
    total_payout = db.query(func.sum(SeatMonth.payout_amount)).filter(
        SeatMonth.status == MonthStatus.COMPLETED
    ).scalar() or 0
    
    # Recent activity
    recent_payments = db.query(Payment).order_by(
        Payment.payment_date.desc()
    ).limit(5).all()
    
    recent_payment_list = []
    for p in recent_payments:
        user = db.query(User).filter(User.id == p.user_id).first()
        seat = db.query(Seat).filter(Seat.id == p.seat_id).first()
        recent_payment_list.append({
            "id": p.id,
            "user_name": user.name if user else "Unknown",
            "seat_name": seat.seat_name if seat else "Unknown",
            "amount": float(p.amount_paid),
            "mode": p.payment_mode.value,
            "date": p.payment_date
        })
    
    # Pending months count
    pending_months = db.query(SeatMonth).filter(
        SeatMonth.status == MonthStatus.PENDING
    ).count()
    
    return {
        "stats": {
            "total_users": total_users,
            "total_staff": total_staff,
            "total_seats": total_seats,
            "pending_months": pending_months
        },
        "financial": {
            "total_collected": float(total_collected),
            "total_payout": float(total_payout),
            "total_profit": float(total_collected) - float(total_payout)
        },
        "recent_payments": recent_payment_list
    }
