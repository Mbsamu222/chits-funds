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


@router.get("/analytics/collection-trends")
async def get_collection_trends(
    months: int = Query(6, description="Number of months to include"),
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get payment collection trends over time"""
    from datetime import timedelta
    from collections import defaultdict
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months * 30)
    
    payments = db.query(Payment).filter(
        Payment.payment_date >= start_date
    ).all()
    
    # Group by month
    monthly_trends = defaultdict(lambda: {"count": 0, "amount": 0})
    
    for payment in payments:
        month_key = payment.payment_date.strftime('%Y-%m')
        monthly_trends[month_key]["count"] += 1
        monthly_trends[month_key]["amount"] += float(payment.amount_paid)
    
    result = []
    for month_key in sorted(monthly_trends.keys()):
        data = monthly_trends[month_key]
        result.append({
            "month": month_key,
            "count": data["count"],
            "amount": data["amount"],
            "average": data["amount"] / data["count"] if data["count"] > 0 else 0
        })
    
    return result


@router.get("/analytics/member-performance")
async def get_member_performance(
    chit_id: Optional[int] = None,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get member payment performance analytics"""
    from models.user import User
    from models.user_balance import UserBalance
    from models.chit_member import ChitMember
    
    # Get all members
    query = db.query(ChitMember)
    if chit_id:
        query = query.filter(ChitMember.chit_id == chit_id)
    
    members = query.all()
    
    performance = []
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        if not user:
            continue
        
        # Get payment count
        payment_count = db.query(Payment).filter(
            Payment.user_id == member.user_id,
            Payment.chit_id == member.chit_id
        ).count()
        
        # Get total paid
        total_paid = db.query(func.sum(Payment.amount_paid)).filter(
            Payment.user_id == member.user_id,
            Payment.chit_id == member.chit_id
        ).scalar() or 0
        
        # Get balance
        balance = db.query(UserBalance).filter(
            UserBalance.user_id == member.user_id,
            UserBalance.chit_id == member.chit_id
        ).first()
        
        # Calculate on-time payment percentage
        total_months = db.query(ChitMonth).filter(
            ChitMonth.chit_id == member.chit_id
        ).count()
        
        on_time_rate = (payment_count / total_months * 100) if total_months > 0 else 0
        
        performance.append({
            "user_id": user.id,
            "user_name": user.name,
            "chit_id": member.chit_id,
            "total_payments": payment_count,
            "total_paid": float(total_paid),
            "pending": float(balance.pending) if balance else 0,
            "on_time_rate": round(on_time_rate, 2),
            "status": "excellent" if on_time_rate > 90 else "good" if on_time_rate > 70 else "poor"
        })
    
    # Sort by on-time rate
    performance.sort(key=lambda x: x["on_time_rate"], reverse=True)
    
    return performance


@router.get("/analytics/payment-patterns")
async def get_payment_patterns(
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Analyze payment patterns - mode, timing, amounts"""
    
    # Payment mode distribution
    gpay_count = db.query(Payment).filter(Payment.payment_mode == "gpay").count()
    cash_count = db.query(Payment).filter(Payment.payment_mode == "cash").count()
    
    # Day of week distribution
    all_payments = db.query(Payment).all()
    day_distribution = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}  # Monday=0, Sunday=6
    
    for payment in all_payments:
        day = payment.payment_date.weekday()
        day_distribution[day] += 1
    
    # Average payment amount
    avg_payment = db.query(func.avg(Payment.amount_paid)).scalar() or 0
    
    # Peak payment hours (if times are tracked)
    hour_distribution = {}
    for payment in all_payments:
        hour = payment.payment_date.hour
        hour_distribution[hour] = hour_distribution.get(hour, 0) + 1
    
    return {
        "payment_modes": {
            "gpay": gpay_count,
            "cash": cash_count,
            "gpay_percentage": (gpay_count / (gpay_count + cash_count) * 100) if (gpay_count + cash_count) > 0 else 0
        },
        "day_of_week": [
            {"day": "Monday", "count": day_distribution[0]},
            {"day": "Tuesday", "count": day_distribution[1]},
            {"day": "Wednesday", "count": day_distribution[2]},
            {"day": "Thursday", "count": day_distribution[3]},
            {"day": "Friday", "count": day_distribution[4]},
            {"day": "Saturday", "count": day_distribution[5]},
            {"day": "Sunday", "count": day_distribution[6]}
        ],
        "average_payment": float(avg_payment),
        "peak_hours": sorted(hour_distribution.items(), key=lambda x: x[1], reverse=True)[:5]
    }


@router.get("/analytics/comprehensive")
async def get_comprehensive_analytics(
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics dashboard data"""
    from models.user import User
    from models.user_balance import UserBalance
    
    # Overall stats
    total_users = db.query(User).filter(User.is_active == True).count()
    total_chits = db.query(Chit).filter(Chit.is_active == True).count()
    total_payments = db.query(Payment).count()
    
    # Financial overview
    total_collected = db.query(func.sum(Payment.amount_paid)).scalar() or 0
    total_payout = db.query(func.sum(ChitMonth.payout_amount)).filter(
        ChitMonth.status == MonthStatus.COMPLETED
    ).scalar() or 0
    
    # Defaulter stats
    defaulters_count = db.query(UserBalance).filter(UserBalance.pending > 0).count()
    total_pending = db.query(func.sum(UserBalance.pending)).scalar() or 0
    
    # Growth metrics
    this_month = datetime.now().month
    this_year = datetime.now().year
    
    new_users_this_month = db.query(User).filter(
        func.extract('month', User.created_at) == this_month,
        func.extract('year', User.created_at) == this_year
    ).count()
    
    payments_this_month = db.query(Payment).filter(
        func.extract('month', Payment.payment_date) == this_month,
        func.extract('year', Payment.payment_date) == this_year
    ).count()
    
    collection_this_month = db.query(func.sum(Payment.amount_paid)).filter(
        func.extract('month', Payment.payment_date) == this_month,
        func.extract('year', Payment.payment_date) == this_year
    ).scalar() or 0
    
    return {
        "overview": {
            "total_users": total_users,
            "total_chits": total_chits,
            "total_payments": total_payments,
            "defaulters_count": defaulters_count
        },
        "financial": {
            "total_collected": float(total_collected),
            "total_payout": float(total_payout),
            "total_profit": float(total_collected) - float(total_payout),
            "total_pending": float(total_pending)
        },
        "this_month": {
            "new_users": new_users_this_month,
            "payments": payments_this_month,
            "collection": float(collection_this_month)
        }
    }

