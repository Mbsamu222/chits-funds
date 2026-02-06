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
from models.chit import Chit
from models.chit_month import ChitMonth
from models.payment import Payment, PaymentMode
from auth.dependencies import get_current_staff, get_staff_user_ids
from schemas import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("")
async def list_payments(
    user_id: Optional[int] = None,
    chit_id: Optional[int] = None,
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
    if chit_id:
        query = query.filter(Payment.chit_id == chit_id)
    if month_id:
        query = query.filter(Payment.chit_month_id == month_id)
    
    payments = query.order_by(Payment.payment_date.desc()).offset(skip).limit(limit).all()
    
    result = []
    for p in payments:
        user = db.query(User).filter(User.id == p.user_id).first()
        chit = db.query(Chit).filter(Chit.id == p.chit_id).first()
        collector = db.query(Staff).filter(Staff.id == p.collected_by_staff_id).first()
        
        month_num = None
        if p.chit_month_id:
            month = db.query(ChitMonth).filter(ChitMonth.id == p.chit_month_id).first()
            month_num = month.month_number if month else None
        
        result.append({
            "id": p.id,
            "user_id": p.user_id,
            "user_name": user.name if user else "Unknown",
            "chit_id": p.chit_id,
            "chit_name": chit.chit_name if chit else "Unknown",
            "chit_month_id": p.chit_month_id,
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
    """
    Record a new payment with automatic ledger allocation.
    
    Payment Flow:
    1. Create Payment record
    2. Get all pending DEBIT entries for user + chit (FIFO order)
    3. Allocate payment to oldest dues first
    4. Create CREDIT entries for each allocation
    5. Any excess amount becomes advance credit
    6. Update UserBalance cache
    """
    # DEBUG: Print incoming data
    print(f"[DEBUG] Payment data received: user_id={payment_data.user_id}, chit_id={payment_data.chit_id}, amount={payment_data.amount_paid}, mode={payment_data.payment_mode}")
    
    from models.account_ledger import AccountLedger, EntryType, LedgerSource
    from models.user_balance import UserBalance
    from sqlalchemy import func
    from decimal import Decimal
    
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
    
    # Verify chit exists
    chit = db.query(Chit).filter(Chit.id == payment_data.chit_id).first()
    if not chit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chit not found"
        )
    
    # Verify chit_month if provided
    if payment_data.chit_month_id:
        chit_month = db.query(ChitMonth).filter(
            ChitMonth.id == payment_data.chit_month_id,
            ChitMonth.chit_id == payment_data.chit_id
        ).first()
        if not chit_month:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chit month not found"
            )
    
    # === PAYMENT VALIDATION RULES ===
    from models.chit_member import ChitMember
    from datetime import timedelta
    
    # 1. Check if user is a member of this chit (warning only, not blocking)
    membership = db.query(ChitMember).filter(
        ChitMember.user_id == payment_data.user_id,
        ChitMember.chit_id == payment_data.chit_id,
        ChitMember.is_active == True
    ).first()
    
    is_member = membership is not None
    print(f"[DEBUG] is_member={is_member}")
    
    # 2. Validate payment amount (minimum only - no maximum limit for flexibility)
    if payment_data.amount_paid <= 0:
        print(f"[DEBUG] Amount validation failed: amount <= 0")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than zero"
        )
    
    # Note: Max payment validation removed to allow flexibility
    # (advance payments, multiple months, etc.)
    print(f"[DEBUG] Chit total_amount={chit.total_amount}, monthly={chit.monthly_amount}, payment={payment_data.amount_paid}")
    
    # 3. Duplicate check - DISABLED for development
    # Uncomment this in production to prevent accidental duplicate payments
    # five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
    # duplicate = db.query(Payment).filter(
    #     Payment.user_id == payment_data.user_id,
    #     Payment.chit_id == payment_data.chit_id,
    #     Payment.amount_paid == payment_data.amount_paid,
    #     Payment.payment_date >= five_minutes_ago
    # ).first()
    # 
    # if duplicate:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail=f"Possible duplicate payment detected. Wait 5 minutes or use a different amount."
    #     )
    print(f"[DEBUG] All validations passed, creating payment...")

    
    # Create payment record
    payment_mode = PaymentMode.GPAY if payment_data.payment_mode == "gpay" else PaymentMode.CASH
    
    payment = Payment(
        user_id=payment_data.user_id,
        chit_id=payment_data.chit_id,
        chit_month_id=payment_data.chit_month_id,
        amount_paid=payment_data.amount_paid,
        payment_mode=payment_mode,
        collected_by_staff_id=current_staff.id,
        notes=payment_data.notes
    )
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    # === LEDGER ALLOCATION ===
    # Get all chit months with pending dues (FIFO - oldest first)
    chit_months = db.query(ChitMonth).filter(
        ChitMonth.chit_id == payment_data.chit_id
    ).order_by(ChitMonth.month_number).all()
    
    remaining_amount = Decimal(str(payment_data.amount_paid))
    allocations = []
    
    for month in chit_months:
        if remaining_amount <= 0:
            break
        
        # Calculate pending for this month
        month_debit = db.query(func.sum(AccountLedger.amount)).filter(
            AccountLedger.user_id == payment_data.user_id,
            AccountLedger.chit_id == payment_data.chit_id,
            AccountLedger.chit_month_id == month.id,
            AccountLedger.entry_type == EntryType.DEBIT
        ).scalar() or Decimal('0')
        
        month_credit = db.query(func.sum(AccountLedger.amount)).filter(
            AccountLedger.user_id == payment_data.user_id,
            AccountLedger.chit_id == payment_data.chit_id,
            AccountLedger.chit_month_id == month.id,
            AccountLedger.entry_type == EntryType.CREDIT
        ).scalar() or Decimal('0')
        
        pending = month_debit - month_credit
        
        if pending <= 0:
            continue  # This month is fully paid
        
        # Allocate payment to this month
        if remaining_amount >= pending:
            # Full payment for this month
            allocation_amount = pending
            allocation_type = "full"
        else:
            # Partial payment
            allocation_amount = remaining_amount
            allocation_type = "partial"
        
        # Create CREDIT entry
        credit_entry = AccountLedger(
            user_id=payment_data.user_id,
            chit_id=payment_data.chit_id,
            chit_month_id=month.id,
            entry_type=EntryType.CREDIT,
            amount=allocation_amount,
            source=LedgerSource.PAYMENT,
            reference_id=payment.id,
            reference_type="payment",
            notes=f"Payment #{payment.id} - Month {month.month_number} ({allocation_type})",
            created_by=current_staff.id
        )
        db.add(credit_entry)
        
        allocations.append({
            "month_number": month.month_number,
            "amount": float(allocation_amount),
            "type": allocation_type
        })
        
        remaining_amount -= allocation_amount
    
    # Handle advance/overpayment
    advance_amount = 0
    if remaining_amount > 0:
        advance_amount = float(remaining_amount)
        # Create advance CREDIT entry (no month assigned)
        advance_entry = AccountLedger(
            user_id=payment_data.user_id,
            chit_id=payment_data.chit_id,
            chit_month_id=None,  # No specific month for advance
            entry_type=EntryType.CREDIT,
            amount=remaining_amount,
            source=LedgerSource.ADVANCE,
            reference_id=payment.id,
            reference_type="payment",
            notes=f"Advance payment from Payment #{payment.id}",
            created_by=current_staff.id
        )
        db.add(advance_entry)
    
    db.commit()
    
    # Update UserBalance cache
    balance = db.query(UserBalance).filter(
        UserBalance.user_id == payment_data.user_id,
        UserBalance.chit_id == payment_data.chit_id
    ).first()
    
    if not balance:
        balance = UserBalance(
            user_id=payment_data.user_id,
            chit_id=payment_data.chit_id
        )
        db.add(balance)
    
    # Recalculate balance
    total_debit = db.query(func.sum(AccountLedger.amount)).filter(
        AccountLedger.user_id == payment_data.user_id,
        AccountLedger.chit_id == payment_data.chit_id,
        AccountLedger.entry_type == EntryType.DEBIT
    ).scalar() or Decimal('0')
    
    total_credit = db.query(func.sum(AccountLedger.amount)).filter(
        AccountLedger.user_id == payment_data.user_id,
        AccountLedger.chit_id == payment_data.chit_id,
        AccountLedger.entry_type == EntryType.CREDIT
    ).scalar() or Decimal('0')
    
    balance.total_due = float(total_debit)
    balance.total_paid = float(total_credit)
    diff = float(total_debit) - float(total_credit)
    balance.pending = max(0, diff)
    balance.advance = max(0, -diff)
    balance.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "id": payment.id,
        "user_id": payment.user_id,
        "user_name": user.name,
        "chit_id": payment.chit_id,
        "chit_name": chit.chit_name,
        "amount_paid": float(payment.amount_paid),
        "payment_mode": payment.payment_mode.value,
        "collected_by_staff_id": payment.collected_by_staff_id,
        "payment_date": payment.payment_date,
        "allocations": allocations,
        "advance_amount": advance_amount,
        "is_member": is_member,
        "message": "Payment recorded successfully" + (" (Note: User is not a member of this chit)" if not is_member else "")
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
    chit = db.query(Chit).filter(Chit.id == payment.chit_id).first()
    collector = db.query(Staff).filter(Staff.id == payment.collected_by_staff_id).first()
    
    month_num = None
    if payment.chit_month_id:
        month = db.query(ChitMonth).filter(ChitMonth.id == payment.chit_month_id).first()
        month_num = month.month_number if month else None
    
    return {
        "id": payment.id,
        "user_id": payment.user_id,
        "user_name": user.name if user else "Unknown",
        "user_phone": user.phone if user else "",
        "chit_id": payment.chit_id,
        "chit_name": chit.chit_name if chit else "Unknown",
        "chit_month_id": payment.chit_month_id,
        "month_number": month_num,
        "amount_paid": float(payment.amount_paid),
        "payment_mode": payment.payment_mode.value,
        "screenshot_url": payment.screenshot_url,
        "collected_by_staff_id": payment.collected_by_staff_id,
        "collected_by_name": collector.name if collector else "Unknown",
        "payment_date": payment.payment_date,
        "notes": payment.notes
    }
