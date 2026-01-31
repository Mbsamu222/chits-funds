from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models.staff import Staff
from models.chit import Chit
from models.chit_member import ChitMember
from models.chit_month import ChitMonth, MonthStatus
from models.user import User
from auth.dependencies import get_current_staff, require_admin
from schemas import (
    ChitCreate, ChitUpdate, ChitResponse, 
    ChitMemberAdd, ChitMemberResponse,
    ChitMonthCreate, ChitMonthUpdate, ChitMonthResponse
)

router = APIRouter(prefix="/chits", tags=["Chits"])


@router.get("", response_model=List[ChitResponse])
async def list_chits(
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """List all chits"""
    query = db.query(Chit)
    
    if is_active is not None:
        query = query.filter(Chit.is_active == is_active)
    
    chits = query.offset(skip).limit(limit).all()
    
    return [
        ChitResponse(
            id=c.id,
            chit_name=c.chit_name,
            total_amount=float(c.total_amount),
            total_months=c.total_months,
            monthly_amount=float(c.monthly_amount),
            start_date=c.start_date.isoformat() if c.start_date else None,
            is_active=c.is_active,
            created_at=c.created_at,
            member_count=len(c.members)
        )
        for c in chits
    ]


@router.post("", response_model=ChitResponse)
async def create_chit(
    chit_data: ChitCreate,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new chit group (Admin only)"""
    # Calculate monthly amount
    monthly = chit_data.total_amount / chit_data.total_months
    
    # Parse start_date if provided
    start_date = None
    if chit_data.start_date:
        try:
            start_date = datetime.strptime(chit_data.start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    
    chit = Chit(
        chit_name=chit_data.chit_name,
        total_amount=chit_data.total_amount,
        total_months=chit_data.total_months,
        monthly_amount=monthly,
        start_date=start_date,
        created_by=current_staff.id
    )
    
    db.add(chit)
    db.commit()
    db.refresh(chit)
    
    # Create ChitMonth entries for each month
    for month_num in range(1, chit.total_months + 1):
        chit_month = ChitMonth(
            chit_id=chit.id,
            month_number=month_num,
            status=MonthStatus.PENDING
        )
        db.add(chit_month)
    
    db.commit()
    
    return ChitResponse(
        id=chit.id,
        chit_name=chit.chit_name,
        total_amount=float(chit.total_amount),
        total_months=chit.total_months,
        monthly_amount=float(chit.monthly_amount),
        start_date=chit.start_date.isoformat() if chit.start_date else None,
        is_active=chit.is_active,
        created_at=chit.created_at,
        member_count=0
    )


@router.get("/{chit_id}", response_model=ChitResponse)
async def get_chit(
    chit_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get chit details"""
    chit = db.query(Chit).filter(Chit.id == chit_id).first()
    
    if not chit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chit not found"
        )
    
    return ChitResponse(
        id=chit.id,
        chit_name=chit.chit_name,
        total_amount=float(chit.total_amount),
        total_months=chit.total_months,
        monthly_amount=float(chit.monthly_amount),
        start_date=chit.start_date.isoformat() if chit.start_date else None,
        is_active=chit.is_active,
        created_at=chit.created_at,
        member_count=len(chit.members)
    )


@router.put("/{chit_id}", response_model=ChitResponse)
async def update_chit(
    chit_id: int,
    chit_data: ChitUpdate,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update chit (Admin only)"""
    chit = db.query(Chit).filter(Chit.id == chit_id).first()
    
    if not chit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chit not found"
        )
    
    if chit_data.chit_name is not None:
        chit.chit_name = chit_data.chit_name
    if chit_data.start_date is not None:
        try:
            chit.start_date = datetime.strptime(chit_data.start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    if chit_data.is_active is not None:
        chit.is_active = chit_data.is_active
    
    db.commit()
    db.refresh(chit)
    
    return ChitResponse(
        id=chit.id,
        chit_name=chit.chit_name,
        total_amount=float(chit.total_amount),
        total_months=chit.total_months,
        monthly_amount=float(chit.monthly_amount),
        start_date=chit.start_date.isoformat() if chit.start_date else None,
        is_active=chit.is_active,
        created_at=chit.created_at,
        member_count=len(chit.members)
    )


# ========================
# Chit Members
# ========================

@router.get("/{chit_id}/members")
async def get_chit_members(
    chit_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get all members of a chit"""
    chit = db.query(Chit).filter(Chit.id == chit_id).first()
    
    if not chit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chit not found"
        )
    
    members = db.query(ChitMember).filter(ChitMember.chit_id == chit_id).all()
    
    result = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        result.append({
            "id": m.id,
            "chit_id": m.chit_id,
            "user_id": m.user_id,
            "user_name": user.name if user else "Unknown",
            "user_phone": user.phone if user else "",
            "slot_number": m.slot_number,
            "join_date": m.join_date,
            "is_active": m.is_active
        })
    
    return {
        "chit_id": chit_id,
        "chit_name": chit.chit_name,
        "total_slots": chit.total_months,
        "members": sorted(result, key=lambda x: x["slot_number"])
    }


@router.post("/{chit_id}/members")
async def add_chit_member(
    chit_id: int,
    data: ChitMemberAdd,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Add a member to a chit (Admin only)"""
    chit = db.query(Chit).filter(Chit.id == chit_id).first()
    
    if not chit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chit not found"
        )
    
    user = db.query(User).filter(User.id == data.user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user already in this chit
    existing = db.query(ChitMember).filter(
        ChitMember.chit_id == chit_id,
        ChitMember.user_id == data.user_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already in this chit"
        )
    
    # Check if slot is taken
    slot_taken = db.query(ChitMember).filter(
        ChitMember.chit_id == chit_id,
        ChitMember.slot_number == data.slot_number
    ).first()
    
    if slot_taken:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slot {data.slot_number} is already taken"
        )
    
    # Validate slot number
    if data.slot_number < 1 or data.slot_number > chit.total_months:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slot number must be between 1 and {chit.total_months}"
        )
    
    member = ChitMember(
        chit_id=chit_id,
        user_id=data.user_id,
        slot_number=data.slot_number
    )
    
    db.add(member)
    db.commit()
    db.refresh(member)
    
    return {
        "id": member.id,
        "chit_id": member.chit_id,
        "user_id": member.user_id,
        "user_name": user.name,
        "slot_number": member.slot_number,
        "join_date": member.join_date
    }


@router.delete("/{chit_id}/members/{member_id}")
async def remove_chit_member(
    chit_id: int,
    member_id: int,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Remove a member from a chit (Admin only)"""
    member = db.query(ChitMember).filter(
        ChitMember.id == member_id,
        ChitMember.chit_id == chit_id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this chit"
        )
    
    db.delete(member)
    db.commit()
    
    return {"message": "Member removed from chit"}


# ========================
# Chit Months / Auction
# ========================

@router.get("/{chit_id}/months")
async def get_chit_months(
    chit_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get month-wise status of a chit"""
    chit = db.query(Chit).filter(Chit.id == chit_id).first()
    
    if not chit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chit not found"
        )
    
    months = db.query(ChitMonth).filter(
        ChitMonth.chit_id == chit_id
    ).order_by(ChitMonth.month_number).all()
    
    result = []
    from models.payment import Payment
    
    for m in months:
        # Get winner name if exists
        winner_name = None
        if m.winner_user_id:
            winner = db.query(User).filter(User.id == m.winner_user_id).first()
            winner_name = winner.name if winner else None
        
        # Calculate total collected for this month
        total = sum([float(p.amount_paid) for p in db.query(Payment).filter(
            Payment.chit_month_id == m.id
        ).all()])
        
        result.append({
            "id": m.id,
            "chit_id": m.chit_id,
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
        "chit_id": chit_id,
        "chit_name": chit.chit_name,
        "total_months": chit.total_months,
        "months": result
    }


@router.put("/{chit_id}/months/{month_number}")
async def update_chit_month(
    chit_id: int,
    month_number: int,
    data: ChitMonthUpdate,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update chit month / record auction (Admin only)"""
    month = db.query(ChitMonth).filter(
        ChitMonth.chit_id == chit_id,
        ChitMonth.month_number == month_number
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
        # Verify user exists and is a member of this chit
        member = db.query(ChitMember).filter(
            ChitMember.chit_id == chit_id,
            ChitMember.user_id == data.winner_user_id
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Winner must be a member of this chit"
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
        "chit_id": month.chit_id,
        "month_number": month.month_number,
        "auction_date": month.auction_date.isoformat() if month.auction_date else None,
        "winner_user_id": month.winner_user_id,
        "winner_name": winner_name,
        "payout_amount": float(month.payout_amount) if month.payout_amount else None,
        "admin_profit": float(month.admin_profit) if month.admin_profit else None,
        "status": month.status.value
    }
