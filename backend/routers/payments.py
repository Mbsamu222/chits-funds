from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime
import os
import uuid
from database import get_db
from config import settings
from models.staff import Staff
from models.user import User
from models.seat import Seat
from models.seat_month import SeatMonth
from models.payment import Payment, PaymentMode
from auth.dependencies import get_current_staff, get_staff_user_ids
from schemas import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("")
async def list_payments(
    user_id: Optional[int] = None,
    seat_id: Optional[int] = None,
    month_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """List payments with optional filters"""
    query = db.query(Payment)
    
    # Staff can only see payments from their assigned users
    if not current_staff.is_admin():
        allowed_user_ids = get_staff_user_ids(current_staff, db)
        query = query.filter(Payment.user_id.in_(allowed_user_ids))
    
    if user_id:
        query = query.filter(Payment.user_id == user_id)
    if seat_id:
        query = query.filter(Payment.seat_id == seat_id)
    if month_id:
        query = query.filter(Payment.seat_month_id == month_id)
    
    payments = query.order_by(Payment.payment_date.desc()).offset(skip).limit(limit).all()
    
    result = []
    for p in payments:
        user = db.query(User).filter(User.id == p.user_id).first()
        seat = db.query(Seat).filter(Seat.id == p.seat_id).first()
        collector = db.query(Staff).filter(Staff.id == p.collected_by_staff_id).first()
        
        month_num = None
        if p.seat_month_id:
            month = db.query(SeatMonth).filter(SeatMonth.id == p.seat_month_id).first()
            month_num = month.month_number if month else None
        
        result.append({
            "id": p.id,
            "user_id": p.user_id,
            "user_name": user.name if user else "Unknown",
            "seat_id": p.seat_id,
            "seat_name": seat.seat_name if seat else "Unknown",
            "seat_month_id": p.seat_month_id,
            "month_number": month_num,
            "amount_paid": float(p.amount_paid),
            "payment_mode": p.payment_mode.value,
            "screenshot_url": p.screenshot_url,
            "collected_by_staff_id": p.collected_by_staff_id,
            "collected_by_name": collector.name if collector else "Unknown",
            "payment_date": p.payment_date,
            "notes": p.notes
        })
    
    return result


@router.post("")
async def create_payment(
    payment_data: PaymentCreate,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Record a new payment"""
    # Verify user exists
    user = db.query(User).filter(User.id == payment_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Staff can only record payments for their assigned users
    if not current_staff.is_admin():
        allowed_user_ids = get_staff_user_ids(current_staff, db)
        if payment_data.user_id not in allowed_user_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only record payments for your assigned users"
            )
    
    # Verify seat exists
    seat = db.query(Seat).filter(Seat.id == payment_data.seat_id).first()
    if not seat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seat not found"
        )
    
    # Verify seat_month if provided
    if payment_data.seat_month_id:
        seat_month = db.query(SeatMonth).filter(
            SeatMonth.id == payment_data.seat_month_id,
            SeatMonth.seat_id == payment_data.seat_id
        ).first()
        if not seat_month:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seat month not found"
            )
    
    # Create payment
    payment_mode = PaymentMode.GPAY if payment_data.payment_mode == "gpay" else PaymentMode.CASH
    
    payment = Payment(
        user_id=payment_data.user_id,
        seat_id=payment_data.seat_id,
        seat_month_id=payment_data.seat_month_id,
        amount_paid=payment_data.amount_paid,
        payment_mode=payment_mode,
        collected_by_staff_id=current_staff.id,
        notes=payment_data.notes
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return {
        "id": payment.id,
        "user_id": payment.user_id,
        "user_name": user.name,
        "seat_id": payment.seat_id,
        "seat_name": seat.seat_name,
        "amount_paid": float(payment.amount_paid),
        "payment_mode": payment.payment_mode.value,
        "collected_by_staff_id": payment.collected_by_staff_id,
        "payment_date": payment.payment_date,
        "message": "Payment recorded successfully"
    }


@router.post("/{payment_id}/upload-screenshot")
async def upload_screenshot(
    payment_id: int,
    file: UploadFile = File(...),
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Upload screenshot for a GPay payment"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Staff can only upload for their payments
    if not current_staff.is_admin() and payment.collected_by_staff_id != current_staff.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only upload screenshots for your own payments"
        )
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WebP images are allowed"
        )
    
    # Create upload directory if not exists
    upload_dir = os.path.abspath(settings.UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    
    # Save file
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Update payment with screenshot URL
    payment.screenshot_url = f"/uploads/screenshots/{filename}"
    db.commit()
    
    return {
        "message": "Screenshot uploaded successfully",
        "screenshot_url": payment.screenshot_url
    }


@router.get("/{payment_id}")
async def get_payment(
    payment_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get payment details"""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Staff can only view their assigned users' payments
    if not current_staff.is_admin():
        allowed_user_ids = get_staff_user_ids(current_staff, db)
        if payment.user_id not in allowed_user_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this payment"
            )
    
    user = db.query(User).filter(User.id == payment.user_id).first()
    seat = db.query(Seat).filter(Seat.id == payment.seat_id).first()
    collector = db.query(Staff).filter(Staff.id == payment.collected_by_staff_id).first()
    
    month_num = None
    if payment.seat_month_id:
        month = db.query(SeatMonth).filter(SeatMonth.id == payment.seat_month_id).first()
        month_num = month.month_number if month else None
    
    return {
        "id": payment.id,
        "user_id": payment.user_id,
        "user_name": user.name if user else "Unknown",
        "user_phone": user.phone if user else "",
        "seat_id": payment.seat_id,
        "seat_name": seat.seat_name if seat else "Unknown",
        "seat_month_id": payment.seat_month_id,
        "month_number": month_num,
        "amount_paid": float(payment.amount_paid),
        "payment_mode": payment.payment_mode.value,
        "screenshot_url": payment.screenshot_url,
        "collected_by_staff_id": payment.collected_by_staff_id,
        "collected_by_name": collector.name if collector else "Unknown",
        "payment_date": payment.payment_date,
        "notes": payment.notes
    }
