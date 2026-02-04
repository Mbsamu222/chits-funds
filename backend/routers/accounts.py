"""
Accounts Router - Handle all ledger and account-related operations.

This is the financial truth layer for the chit fund system.
All dues and payments flow through the account ledger.
"""
from typing import Optional
import math
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime
from decimal import Decimal

from database import get_db
from models.staff import Staff
from models.user import User
from models.chit import Chit
from models.chit_member import ChitMember
from models.chit_month import ChitMonth
from models.account_ledger import AccountLedger, EntryType, LedgerSource
from models.user_balance import UserBalance
from auth.dependencies import get_current_staff, require_admin
from schemas import (
    LedgerEntryCreate, LedgerEntryResponse,
    UserAccountSummary, ChitBalanceSummary, MonthTally,
    AccountsDashboardSummary, GenerateDuesResponse,
    PaymentAllocationPreview, PaginatedResponse
)

router = APIRouter(prefix="/accounts", tags=["Accounts"])


# =====================
# Helper Functions
# =====================

def get_or_create_balance(db: Session, user_id: int, chit_id: int) -> UserBalance:
    """Get existing or create new UserBalance record"""
    balance = db.query(UserBalance).filter(
        UserBalance.user_id == user_id,
        UserBalance.chit_id == chit_id
    ).first()
    
    if not balance:
        balance = UserBalance(
            user_id=user_id,
            chit_id=chit_id,
            total_due=0,
            total_paid=0,
            pending=0,
            advance=0
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)
    
    return balance


def update_user_balance(db: Session, user_id: int, chit_id: int):
    """Recalculate and update UserBalance from ledger entries"""
    balance = get_or_create_balance(db, user_id, chit_id)
    
    # Sum of debits
    debit_sum = db.query(func.sum(AccountLedger.amount)).filter(
        AccountLedger.user_id == user_id,
        AccountLedger.chit_id == chit_id,
        AccountLedger.entry_type == EntryType.DEBIT
    ).scalar() or Decimal('0')
    
    # Sum of credits
    credit_sum = db.query(func.sum(AccountLedger.amount)).filter(
        AccountLedger.user_id == user_id,
        AccountLedger.chit_id == chit_id,
        AccountLedger.entry_type == EntryType.CREDIT
    ).scalar() or Decimal('0')
    
    balance.total_due = float(debit_sum)
    balance.total_paid = float(credit_sum)
    
    diff = float(debit_sum) - float(credit_sum)
    if diff > 0:
        balance.pending = diff
        balance.advance = 0
    else:
        balance.pending = 0
        balance.advance = abs(diff)
    
    balance.updated_at = datetime.utcnow()
    db.commit()
    
    return balance


def get_month_status(due: float, paid: float) -> str:
    """Determine the payment status for a month"""
    if due == 0:
        return "not_started"
    if paid >= due:
        return "paid" if paid == due else "advance"
    if paid > 0:
        return "partial"
    return "pending"


# =====================
# Ledger Endpoints
# =====================

@router.get("/ledger")
async def list_ledger_entries(
    user_id: Optional[int] = None,
    chit_id: Optional[int] = None,
    entry_type: Optional[str] = None,
    source: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """
    List ledger entries with optional filters.
    Returns paginated results with user and chit details.
    """
    query = db.query(AccountLedger)
    
    if user_id:
        query = query.filter(AccountLedger.user_id == user_id)
    if chit_id:
        query = query.filter(AccountLedger.chit_id == chit_id)
    if entry_type:
        query = query.filter(AccountLedger.entry_type == entry_type)
    if source:
        query = query.filter(AccountLedger.source == source)
    
    # Order by newest first
    query = query.order_by(AccountLedger.created_at.desc())
    
    # Count total
    total = query.count()
    total_pages = math.ceil(total / per_page)
    
    # Paginate
    entries = query.offset((page - 1) * per_page).limit(per_page).all()
    
    # Build response
    items = []
    for entry in entries:
        user = db.query(User).filter(User.id == entry.user_id).first()
        chit = db.query(Chit).filter(Chit.id == entry.chit_id).first()
        staff = db.query(Staff).filter(Staff.id == entry.created_by).first()
        
        month_number = None
        if entry.chit_month_id:
            month = db.query(ChitMonth).filter(ChitMonth.id == entry.chit_month_id).first()
            month_number = month.month_number if month else None
        
        items.append({
            "id": entry.id,
            "user_id": entry.user_id,
            "user_name": user.name if user else "Unknown",
            "chit_id": entry.chit_id,
            "chit_name": chit.chit_name if chit else "Unknown",
            "chit_month_id": entry.chit_month_id,
            "month_number": month_number,
            "entry_type": entry.entry_type.value,
            "amount": float(entry.amount),
            "source": entry.source.value,
            "reference_id": entry.reference_id,
            "reference_type": entry.reference_type,
            "notes": entry.notes,
            "created_by_id": entry.created_by,
            "created_by_name": staff.name if staff else "Unknown",
            "created_at": entry.created_at
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }


@router.post("/ledger/adjustment")
async def create_adjustment_entry(
    data: LedgerEntryCreate,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a manual adjustment entry (admin only).
    Use this to correct discrepancies or make manual entries.
    """
    # Validate user
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate chit
    chit = db.query(Chit).filter(Chit.id == data.chit_id).first()
    if not chit:
        raise HTTPException(status_code=404, detail="Chit not found")
    
    # Validate entry type
    entry_type = EntryType.DEBIT if data.entry_type == "debit" else EntryType.CREDIT
    
    # Create entry
    entry = AccountLedger(
        user_id=data.user_id,
        chit_id=data.chit_id,
        chit_month_id=data.chit_month_id,
        entry_type=entry_type,
        amount=data.amount,
        source=LedgerSource.ADJUSTMENT,
        notes=data.notes or "Manual adjustment",
        created_by=current_staff.id
    )
    
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    # Update user balance
    update_user_balance(db, data.user_id, data.chit_id)
    
    return {
        "id": entry.id,
        "message": f"Adjustment entry created: {entry_type.value} of ₹{data.amount}",
        "entry_type": entry_type.value,
        "amount": float(entry.amount)
    }


# =====================
# Dues Generation
# =====================

@router.post("/generate-dues/{chit_id}/{month_number}")
async def generate_monthly_dues(
    chit_id: int,
    month_number: int,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Generate monthly due entries (DEBIT) for all members of a chit.
    This creates the "amount owed" entries in the ledger.
    """
    # Validate chit
    chit = db.query(Chit).filter(Chit.id == chit_id).first()
    if not chit:
        raise HTTPException(status_code=404, detail="Chit not found")
    
    if month_number < 1 or month_number > chit.total_months:
        raise HTTPException(
            status_code=400, 
            detail=f"Month number must be between 1 and {chit.total_months}"
        )
    
    # Get or create ChitMonth
    chit_month = db.query(ChitMonth).filter(
        ChitMonth.chit_id == chit_id,
        ChitMonth.month_number == month_number
    ).first()
    
    if not chit_month:
        chit_month = ChitMonth(
            chit_id=chit_id,
            month_number=month_number
        )
        db.add(chit_month)
        db.commit()
        db.refresh(chit_month)
    
    # Check if dues already generated for this month
    existing_dues = db.query(AccountLedger).filter(
        AccountLedger.chit_id == chit_id,
        AccountLedger.chit_month_id == chit_month.id,
        AccountLedger.entry_type == EntryType.DEBIT,
        AccountLedger.source == LedgerSource.MONTHLY_DUE
    ).count()
    
    if existing_dues > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Dues already generated for month {month_number}. Found {existing_dues} entries."
        )
    
    # Get all active members
    members = db.query(ChitMember).filter(
        ChitMember.chit_id == chit_id,
        ChitMember.is_active == True
    ).all()
    
    if not members:
        raise HTTPException(status_code=400, detail="No active members in this chit")
    
    # Monthly amount for each member
    monthly_amount = float(chit.monthly_amount)
    entries_created = 0
    
    for member in members:
        # Create DEBIT entry for this member
        entry = AccountLedger(
            user_id=member.user_id,
            chit_id=chit_id,
            chit_month_id=chit_month.id,
            entry_type=EntryType.DEBIT,
            amount=monthly_amount,
            source=LedgerSource.MONTHLY_DUE,
            reference_id=chit_month.id,
            reference_type="chit_month",
            notes=f"Monthly due for Month {month_number}",
            created_by=current_staff.id
        )
        db.add(entry)
        entries_created += 1
        
        # Update user balance
        update_user_balance(db, member.user_id, chit_id)
    
    db.commit()
    
    return GenerateDuesResponse(
        chit_id=chit_id,
        chit_name=chit.chit_name,
        month_number=month_number,
        members_count=len(members),
        total_dues_generated=monthly_amount * len(members),
        entries_created=entries_created
    )


# =====================
# User Account Summary
# =====================

@router.get("/user/{user_id}")
async def get_user_account_summary(
    user_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """
    Get complete account summary for a user including all their chits.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all chits the user is a member of
    memberships = db.query(ChitMember).filter(
        ChitMember.user_id == user_id
    ).all()
    
    total_due = 0
    total_paid = 0
    chits_summary = []
    
    for membership in memberships:
        chit = db.query(Chit).filter(Chit.id == membership.chit_id).first()
        if not chit:
            continue
        
        # Get or update balance
        balance = get_or_create_balance(db, user_id, chit.id)
        update_user_balance(db, user_id, chit.id)
        balance = db.query(UserBalance).filter(
            UserBalance.user_id == user_id,
            UserBalance.chit_id == chit.id
        ).first()
        
        # Build month-wise tally
        months_tally = []
        for month_num in range(1, chit.total_months + 1):
            chit_month = db.query(ChitMonth).filter(
                ChitMonth.chit_id == chit.id,
                ChitMonth.month_number == month_num
            ).first()
            
            if not chit_month:
                months_tally.append(MonthTally(
                    month_number=month_num,
                    chit_month_id=None,
                    due=0,
                    paid=0,
                    pending=0,
                    status="not_started"
                ))
                continue
            
            # Get debits for this month
            month_debit = db.query(func.sum(AccountLedger.amount)).filter(
                AccountLedger.user_id == user_id,
                AccountLedger.chit_id == chit.id,
                AccountLedger.chit_month_id == chit_month.id,
                AccountLedger.entry_type == EntryType.DEBIT
            ).scalar() or Decimal('0')
            
            # Get credits for this month
            month_credit = db.query(func.sum(AccountLedger.amount)).filter(
                AccountLedger.user_id == user_id,
                AccountLedger.chit_id == chit.id,
                AccountLedger.chit_month_id == chit_month.id,
                AccountLedger.entry_type == EntryType.CREDIT
            ).scalar() or Decimal('0')
            
            due = float(month_debit)
            paid = float(month_credit)
            pending = max(0, due - paid)
            
            months_tally.append(MonthTally(
                month_number=month_num,
                chit_month_id=chit_month.id,
                due=due,
                paid=paid,
                pending=pending,
                status=get_month_status(due, paid)
            ))
        
        chit_summary = ChitBalanceSummary(
            chit_id=chit.id,
            chit_name=chit.chit_name,
            monthly_amount=float(chit.monthly_amount),
            total_months=chit.total_months,
            total_due=float(balance.total_due) if balance else 0,
            total_paid=float(balance.total_paid) if balance else 0,
            pending=float(balance.pending) if balance else 0,
            advance=float(balance.advance) if balance else 0,
            months=months_tally
        )
        
        chits_summary.append(chit_summary)
        total_due += float(balance.total_due) if balance else 0
        total_paid += float(balance.total_paid) if balance else 0
    
    pending = max(0, total_due - total_paid)
    advance = max(0, total_paid - total_due)
    
    return UserAccountSummary(
        user_id=user.id,
        user_name=user.name,
        user_phone=user.phone,
        total_due=total_due,
        total_paid=total_paid,
        pending=pending,
        advance=advance,
        chits=chits_summary
    )


# =====================
# Dashboard Summary
# =====================

@router.get("/dashboard")
async def get_accounts_dashboard(
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """
    Get overall accounts dashboard with summary statistics.
    """
    # Total users and chits
    total_users = db.query(User).filter(User.is_active == True).count()
    total_chits = db.query(Chit).filter(Chit.is_active == True).count()
    
    # Aggregate from ledger
    total_due = db.query(func.sum(AccountLedger.amount)).filter(
        AccountLedger.entry_type == EntryType.DEBIT
    ).scalar() or Decimal('0')
    
    total_collected = db.query(func.sum(AccountLedger.amount)).filter(
        AccountLedger.entry_type == EntryType.CREDIT
    ).scalar() or Decimal('0')
    
    total_pending = max(0, float(total_due) - float(total_collected))
    total_advance = max(0, float(total_collected) - float(total_due))
    
    # Count users with overdue amounts
    overdue_balances = db.query(UserBalance).filter(
        UserBalance.pending > 0
    ).all()
    
    overdue_users = len(overdue_balances)
    overdue_amount = sum(float(b.pending) for b in overdue_balances)
    
    return AccountsDashboardSummary(
        total_users=total_users,
        total_chits=total_chits,
        total_due=float(total_due),
        total_collected=float(total_collected),
        total_pending=total_pending,
        total_advance=total_advance,
        overdue_users=overdue_users,
        overdue_amount=overdue_amount
    )


# =====================
# Payment Allocation Preview
# =====================

@router.get("/payment-preview")
async def preview_payment_allocation(
    user_id: int,
    chit_id: int,
    amount: float,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """
    Preview how a payment will be allocated across pending dues.
    Uses FIFO (First In, First Out) - oldest dues paid first.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    chit = db.query(Chit).filter(Chit.id == chit_id).first()
    if not chit:
        raise HTTPException(status_code=404, detail="Chit not found")
    
    # Get all pending months (debits not fully credited)
    pending_months = []
    chit_months = db.query(ChitMonth).filter(
        ChitMonth.chit_id == chit_id
    ).order_by(ChitMonth.month_number).all()
    
    for month in chit_months:
        # Total due for this month
        month_debit = db.query(func.sum(AccountLedger.amount)).filter(
            AccountLedger.user_id == user_id,
            AccountLedger.chit_id == chit_id,
            AccountLedger.chit_month_id == month.id,
            AccountLedger.entry_type == EntryType.DEBIT
        ).scalar() or Decimal('0')
        
        # Total paid for this month
        month_credit = db.query(func.sum(AccountLedger.amount)).filter(
            AccountLedger.user_id == user_id,
            AccountLedger.chit_id == chit_id,
            AccountLedger.chit_month_id == month.id,
            AccountLedger.entry_type == EntryType.CREDIT
        ).scalar() or Decimal('0')
        
        pending = float(month_debit) - float(month_credit)
        if pending > 0:
            pending_months.append({
                "chit_month_id": month.id,
                "month_number": month.month_number,
                "pending": pending
            })
    
    # Allocate payment FIFO
    remaining = amount
    allocations = []
    
    for pending_month in pending_months:
        if remaining <= 0:
            break
        
        if remaining >= pending_month["pending"]:
            # Full payment for this month
            allocations.append({
                "month_number": pending_month["month_number"],
                "chit_month_id": pending_month["chit_month_id"],
                "amount": pending_month["pending"],
                "type": "full"
            })
            remaining -= pending_month["pending"]
        else:
            # Partial payment
            allocations.append({
                "month_number": pending_month["month_number"],
                "chit_month_id": pending_month["chit_month_id"],
                "amount": remaining,
                "type": "partial"
            })
            remaining = 0
    
    advance_amount = remaining if remaining > 0 else 0
    
    message = "Payment will be allocated to pending dues."
    if advance_amount > 0:
        message = f"₹{advance_amount:.2f} will be saved as advance after clearing all dues."
    
    return PaymentAllocationPreview(
        user_id=user_id,
        user_name=user.name,
        chit_id=chit_id,
        chit_name=chit.chit_name,
        payment_amount=amount,
        allocations=allocations,
        advance_amount=advance_amount,
        message=message
    )
