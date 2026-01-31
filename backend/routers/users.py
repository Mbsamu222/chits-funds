from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.user import User
from models.staff import Staff
from models.staff_user import StaffUser
from models.chit_member import ChitMember
from models.chit_month import ChitMonth
from models.chit import Chit
from models.payment import Payment
from auth.dependencies import get_current_staff, require_admin, filter_users_for_staff, get_staff_user_ids
from schemas import UserCreate, UserUpdate, UserResponse, UserDashboard

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
async def list_users(
    search: Optional[str] = Query(None, description="Search by name or phone"),
    skip: int = 0,
    limit: int = 50,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """
    List all users (filtered for staff, all for admin)
    Staff can only see their assigned users
    """
    query = db.query(User)
    
    # Filter based on staff permissions
    query = filter_users_for_staff(query, current_staff, db)
    
    # Search filter
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) | 
            (User.phone.ilike(f"%{search}%"))
        )
    
    users = query.offset(skip).limit(limit).all()
    return users


@router.post("", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new user (Admin only)"""
    # Check if phone already exists
    existing = db.query(User).filter(User.phone == user_data.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Check email if provided
    if user_data.email:
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    user = User(
        name=user_data.name,
        phone=user_data.phone,
        email=user_data.email,
        address=user_data.address,
        created_by=current_staff.id
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get user by ID (staff can only access assigned users)"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if staff can access this user
    if not current_staff.is_admin():
        allowed_ids = get_staff_user_ids(current_staff, db)
        if user_id not in allowed_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this user"
            )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields if provided
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.phone is not None:
        # Check if new phone is unique
        existing = db.query(User).filter(
            User.phone == user_data.phone,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
        user.phone = user_data.phone
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.address is not None:
        user.address = user_data.address
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/{user_id}/dashboard")
async def get_user_dashboard(
    user_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """
    Get complete member dashboard
    Shows: all chits, month-wise payment status, balance, late payments
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check access for staff
    if not current_staff.is_admin():
        allowed_ids = get_staff_user_ids(current_staff, db)
        if user_id not in allowed_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this user"
            )
    
    # Get all chit memberships
    memberships = db.query(ChitMember).filter(
        ChitMember.user_id == user_id,
        ChitMember.is_active == True
    ).all()
    
    chits_data = []
    total_paid = 0
    total_balance = 0
    pending_months = 0
    
    for membership in memberships:
        chit = db.query(Chit).filter(Chit.id == membership.chit_id).first()
        
        # Get all months for this chit
        months = db.query(ChitMonth).filter(
            ChitMonth.chit_id == chit.id
        ).order_by(ChitMonth.month_number).all()
        
        # Get payments for this user + chit
        payments = db.query(Payment).filter(
            Payment.user_id == user_id,
            Payment.chit_id == chit.id
        ).all()
        
        # Create payment lookup by month
        paid_months = {}
        user_total_paid = 0
        for payment in payments:
            if payment.chit_month_id:
                month_num = None
                for m in months:
                    if m.id == payment.chit_month_id:
                        month_num = m.month_number
                        break
                if month_num:
                    paid_months[month_num] = paid_months.get(month_num, 0) + float(payment.amount_paid)
            user_total_paid += float(payment.amount_paid)
        
        # Calculate month-wise status
        month_status = []
        for i in range(1, chit.total_months + 1):
            paid_amount = paid_months.get(i, 0)
            required = float(chit.monthly_amount)
            month_status.append({
                "month": i,
                "required": required,
                "paid": paid_amount,
                "is_paid": paid_amount >= required,
                "balance": max(0, required - paid_amount)
            })
            if paid_amount < required:
                pending_months += 1
        
        chit_balance = float(chit.total_amount) - user_total_paid
        total_paid += user_total_paid
        total_balance += chit_balance
        
        chits_data.append({
            "chit_id": chit.id,
            "chit_name": chit.chit_name,
            "total_amount": float(chit.total_amount),
            "monthly_amount": float(chit.monthly_amount),
            "total_months": chit.total_months,
            "slot_number": membership.slot_number,
            "total_paid": user_total_paid,
            "balance": chit_balance,
            "month_status": month_status
        })
    
    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "address": user.address,
            "is_active": user.is_active,
            "created_at": user.created_at
        },
        "chits": chits_data,
        "total_paid": total_paid,
        "total_balance": total_balance,
        "pending_months": pending_months
    }
