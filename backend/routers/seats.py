from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models.staff import Staff
from models.seat import Seat
from models.seat_member import SeatMember
from models.seat_month import SeatMonth, MonthStatus
from models.user import User
from auth.dependencies import get_current_staff, require_admin
from schemas import (
    SeatCreate, SeatUpdate, SeatResponse, 
    SeatMemberAdd, SeatMemberResponse,
    SeatMonthCreate, SeatMonthUpdate, SeatMonthResponse
)

router = APIRouter(prefix="/seats", tags=["Seats"])


@router.get("", response_model=List[SeatResponse])
async def list_seats(
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """List all seats"""
    query = db.query(Seat)
    
    if is_active is not None:
        query = query.filter(Seat.is_active == is_active)
    
    seats = query.offset(skip).limit(limit).all()
    
    return [
        SeatResponse(
            id=s.id,
            seat_name=s.seat_name,
            total_amount=float(s.total_amount),
            total_months=s.total_months,
            monthly_amount=float(s.monthly_amount),
            start_date=s.start_date.isoformat() if s.start_date else None,
            is_active=s.is_active,
            created_at=s.created_at,
            member_count=len(s.members)
        )
        for s in seats
    ]


@router.post("", response_model=SeatResponse)
async def create_seat(
    seat_data: SeatCreate,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new seat/chit group (Admin only)"""
    # Calculate monthly amount
    monthly = seat_data.total_amount / seat_data.total_months
    
    # Parse start_date if provided
    start_date = None
    if seat_data.start_date:
        try:
            start_date = datetime.strptime(seat_data.start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    
    seat = Seat(
        seat_name=seat_data.seat_name,
        total_amount=seat_data.total_amount,
        total_months=seat_data.total_months,
        monthly_amount=monthly,
        start_date=start_date,
        created_by=current_staff.id
    )
    
    db.add(seat)
    db.commit()
    db.refresh(seat)
    
    # Create SeatMonth entries for each month
    for month_num in range(1, seat.total_months + 1):
        seat_month = SeatMonth(
            seat_id=seat.id,
            month_number=month_num,
            status=MonthStatus.PENDING
        )
        db.add(seat_month)
    
    db.commit()
    
    return SeatResponse(
        id=seat.id,
        seat_name=seat.seat_name,
        total_amount=float(seat.total_amount),
        total_months=seat.total_months,
        monthly_amount=float(seat.monthly_amount),
        start_date=seat.start_date.isoformat() if seat.start_date else None,
        is_active=seat.is_active,
        created_at=seat.created_at,
        member_count=0
    )


@router.get("/{seat_id}", response_model=SeatResponse)
async def get_seat(
    seat_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get seat details"""
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    
    if not seat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seat not found"
        )
    
    return SeatResponse(
        id=seat.id,
        seat_name=seat.seat_name,
        total_amount=float(seat.total_amount),
        total_months=seat.total_months,
        monthly_amount=float(seat.monthly_amount),
        start_date=seat.start_date.isoformat() if seat.start_date else None,
        is_active=seat.is_active,
        created_at=seat.created_at,
        member_count=len(seat.members)
    )


@router.put("/{seat_id}", response_model=SeatResponse)
async def update_seat(
    seat_id: int,
    seat_data: SeatUpdate,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update seat (Admin only)"""
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    
    if not seat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seat not found"
        )
    
    if seat_data.seat_name is not None:
        seat.seat_name = seat_data.seat_name
    if seat_data.start_date is not None:
        try:
            seat.start_date = datetime.strptime(seat_data.start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    if seat_data.is_active is not None:
        seat.is_active = seat_data.is_active
    
    db.commit()
    db.refresh(seat)
    
    return SeatResponse(
        id=seat.id,
        seat_name=seat.seat_name,
        total_amount=float(seat.total_amount),
        total_months=seat.total_months,
        monthly_amount=float(seat.monthly_amount),
        start_date=seat.start_date.isoformat() if seat.start_date else None,
        is_active=seat.is_active,
        created_at=seat.created_at,
        member_count=len(seat.members)
    )


# ========================
# Seat Members
# ========================

@router.get("/{seat_id}/members")
async def get_seat_members(
    seat_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get all members of a seat"""
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    
    if not seat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seat not found"
        )
    
    members = db.query(SeatMember).filter(SeatMember.seat_id == seat_id).all()
    
    result = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        result.append({
            "id": m.id,
            "seat_id": m.seat_id,
            "user_id": m.user_id,
            "user_name": user.name if user else "Unknown",
            "user_phone": user.phone if user else "",
            "slot_number": m.slot_number,
            "join_date": m.join_date,
            "is_active": m.is_active
        })
    
    return {
        "seat_id": seat_id,
        "seat_name": seat.seat_name,
        "total_slots": seat.total_months,
        "members": sorted(result, key=lambda x: x["slot_number"])
    }


@router.post("/{seat_id}/members")
async def add_seat_member(
    seat_id: int,
    data: SeatMemberAdd,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Add a member to a seat (Admin only)"""
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    
    if not seat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seat not found"
        )
    
    user = db.query(User).filter(User.id == data.user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user already in this seat
    existing = db.query(SeatMember).filter(
        SeatMember.seat_id == seat_id,
        SeatMember.user_id == data.user_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already in this seat"
        )
    
    # Check if slot is taken
    slot_taken = db.query(SeatMember).filter(
        SeatMember.seat_id == seat_id,
        SeatMember.slot_number == data.slot_number
    ).first()
    
    if slot_taken:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slot {data.slot_number} is already taken"
        )
    
    # Validate slot number
    if data.slot_number < 1 or data.slot_number > seat.total_months:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slot number must be between 1 and {seat.total_months}"
        )
    
    member = SeatMember(
        seat_id=seat_id,
        user_id=data.user_id,
        slot_number=data.slot_number
    )
    
    db.add(member)
    db.commit()
    db.refresh(member)
    
    return {
        "id": member.id,
        "seat_id": member.seat_id,
        "user_id": member.user_id,
        "user_name": user.name,
        "slot_number": member.slot_number,
        "join_date": member.join_date
    }


@router.delete("/{seat_id}/members/{member_id}")
async def remove_seat_member(
    seat_id: int,
    member_id: int,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Remove a member from a seat (Admin only)"""
    member = db.query(SeatMember).filter(
        SeatMember.id == member_id,
        SeatMember.seat_id == seat_id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this seat"
        )
    
    db.delete(member)
    db.commit()
    
    return {"message": "Member removed from seat"}


# ========================
# Seat Months / Auction
# ========================

@router.get("/{seat_id}/months")
async def get_seat_months(
    seat_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get month-wise status of a seat"""
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    
    if not seat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seat not found"
        )
    
    months = db.query(SeatMonth).filter(
        SeatMonth.seat_id == seat_id
    ).order_by(SeatMonth.month_number).all()
    
    result = []
    from models.payment import Payment
    
    for m in months:
        # Get winner name if exists
        winner_name = None
        if m.winner_user_id:
            winner = db.query(User).filter(User.id == m.winner_user_id).first()
            winner_name = winner.name if winner else None
        
        # Calculate total collected for this month
        total_collected = db.query(Payment).filter(
            Payment.seat_month_id == m.id
        ).with_entities(db.query(Payment.amount_paid).filter(
            Payment.seat_month_id == m.id
        )).all()
        
        total = sum([float(p.amount_paid) for p in db.query(Payment).filter(
            Payment.seat_month_id == m.id
        ).all()])
        
        result.append({
            "id": m.id,
            "seat_id": m.seat_id,
            "month_number": m.month_number,
            "auction_date": m.auction_date.isoformat() if m.auction_date else None,
            "winner_user_id": m.winner_user_id,
            "winner_name": winner_name,
            "payout_amount": float(m.payout_amount) if m.payout_amount else None,
            "admin_profit": float(m.admin_profit) if m.admin_profit else None,
            "status": m.status.value,
            "total_collected": total
        })
    
    return {
        "seat_id": seat_id,
        "seat_name": seat.seat_name,
        "total_months": seat.total_months,
        "months": result
    }


@router.put("/{seat_id}/months/{month_number}")
async def update_seat_month(
    seat_id: int,
    month_number: int,
    data: SeatMonthUpdate,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update seat month / record auction (Admin only)"""
    month = db.query(SeatMonth).filter(
        SeatMonth.seat_id == seat_id,
        SeatMonth.month_number == month_number
    ).first()
    
    if not month:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Month not found"
        )
    
    if data.auction_date:
        try:
            month.auction_date = datetime.strptime(data.auction_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    
    if data.winner_user_id is not None:
        # Verify user exists and is a member of this seat
        member = db.query(SeatMember).filter(
            SeatMember.seat_id == seat_id,
            SeatMember.user_id == data.winner_user_id
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Winner must be a member of this seat"
            )
        
        month.winner_user_id = data.winner_user_id
    
    if data.payout_amount is not None:
        month.payout_amount = data.payout_amount
    
    if data.admin_profit is not None:
        month.admin_profit = data.admin_profit
    
    if data.status is not None:
        if data.status == "completed":
            month.status = MonthStatus.COMPLETED
        else:
            month.status = MonthStatus.PENDING
    
    db.commit()
    db.refresh(month)
    
    # Get winner name
    winner_name = None
    if month.winner_user_id:
        winner = db.query(User).filter(User.id == month.winner_user_id).first()
        winner_name = winner.name if winner else None
    
    return {
        "id": month.id,
        "seat_id": month.seat_id,
        "month_number": month.month_number,
        "auction_date": month.auction_date.isoformat() if month.auction_date else None,
        "winner_user_id": month.winner_user_id,
        "winner_name": winner_name,
        "payout_amount": float(month.payout_amount) if month.payout_amount else None,
        "admin_profit": float(month.admin_profit) if month.admin_profit else None,
        "status": month.status.value
    }
