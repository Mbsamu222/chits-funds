"""
Notes Router - CRUD for account notes (customer credit/debit tracking).
Stored in the database, not localStorage.
"""
from typing import Optional
import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from models.staff import Staff
from models.account_note import AccountNote
from auth.dependencies import get_current_staff, require_admin

router = APIRouter(prefix="/notes", tags=["Notes"])


# =====================
# Pydantic Schemas
# =====================

class NoteCreate(BaseModel):
    customer_name: str
    credit: float = 0.0
    debit: float = 0.0
    description: Optional[str] = None


class NoteResponse(BaseModel):
    id: int
    customer_name: str
    credit: float
    debit: float
    description: Optional[str]
    created_at: Optional[str]
    created_by_name: Optional[str]

    class Config:
        from_attributes = True


# =====================
# Endpoints
# =====================

@router.get("")
async def list_notes(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """List all account notes with optional search and pagination."""
    query = db.query(AccountNote)
    
    if search:
        query = query.filter(AccountNote.customer_name.ilike(f"%{search}%"))
    
    # Order by newest first
    query = query.order_by(AccountNote.created_at.desc())
    
    # Count total
    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))
    
    # Paginate
    notes = query.offset((page - 1) * per_page).limit(per_page).all()
    
    # Calculate totals across ALL notes (not just current page)
    total_query = db.query(AccountNote)
    if search:
        total_query = total_query.filter(AccountNote.customer_name.ilike(f"%{search}%"))
    
    total_credit = total_query.with_entities(func.sum(AccountNote.credit)).scalar() or 0.0
    total_debit = total_query.with_entities(func.sum(AccountNote.debit)).scalar() or 0.0
    
    # Build response items
    items = []
    for note in notes:
        staff = db.query(Staff).filter(Staff.id == note.created_by).first() if note.created_by else None
        items.append({
            "id": note.id,
            "customer_name": note.customer_name,
            "credit": float(note.credit or 0),
            "debit": float(note.debit or 0),
            "description": note.description,
            "created_at": note.created_at.isoformat() if note.created_at else None,
            "created_by_name": staff.name if staff else None
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "total_credit": float(total_credit),
        "total_debit": float(total_debit),
        "balance": float(total_credit - total_debit)
    }


@router.post("")
async def create_note(
    data: NoteCreate,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new account note (admin only)."""
    if not data.customer_name.strip():
        raise HTTPException(status_code=400, detail="Customer name is required")
    
    if data.credit == 0 and data.debit == 0:
        raise HTTPException(status_code=400, detail="Enter either credit or debit amount")
    
    note = AccountNote(
        customer_name=data.customer_name.strip(),
        credit=data.credit,
        debit=data.debit,
        description=data.description,
        created_by=current_staff.id
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    return {
        "id": note.id,
        "message": f"Note added for {note.customer_name}",
        "customer_name": note.customer_name,
        "credit": float(note.credit),
        "debit": float(note.debit)
    }


@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete an account note (admin only)."""
    note = db.query(AccountNote).filter(AccountNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    
    return {"message": "Note deleted successfully", "id": note_id}
