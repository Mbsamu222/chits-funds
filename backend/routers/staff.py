from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models.staff import Staff, StaffRole
from models.staff_user import StaffUser
from models.user import User
from auth.jwt_handler import get_password_hash
from auth.dependencies import get_current_staff, require_admin
from schemas import StaffCreate, StaffUpdate, StaffResponse, StaffAssignUsers

router = APIRouter(prefix="/staff", tags=["Staff"])


@router.get("", response_model=List[StaffResponse])
async def list_staff(
    skip: int = 0,
    limit: int = 50,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all staff members (Admin only)"""
    staff_list = db.query(Staff).offset(skip).limit(limit).all()
    return [
        StaffResponse(
            id=s.id,
            name=s.name,
            phone=s.phone,
            email=s.email,
            role=s.role.value,
            is_active=s.is_active,
            created_at=s.created_at
        )
        for s in staff_list
    ]


@router.post("", response_model=StaffResponse)
async def create_staff(
    staff_data: StaffCreate,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new staff member (Admin only)"""
    # Check if phone already exists
    existing = db.query(Staff).filter(Staff.phone == staff_data.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )
    
    # Validate role
    role = StaffRole.ADMIN if staff_data.role == "admin" else StaffRole.STAFF
    
    staff = Staff(
        name=staff_data.name,
        phone=staff_data.phone,
        email=staff_data.email,
        password_hash=get_password_hash(staff_data.password),
        role=role
    )
    
    db.add(staff)
    db.commit()
    db.refresh(staff)
    
    return StaffResponse(
        id=staff.id,
        name=staff.name,
        phone=staff.phone,
        email=staff.email,
        role=staff.role.value,
        is_active=staff.is_active,
        created_at=staff.created_at
    )


@router.get("/{staff_id}", response_model=StaffResponse)
async def get_staff(
    staff_id: int,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get staff by ID (Admin only)"""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    return StaffResponse(
        id=staff.id,
        name=staff.name,
        phone=staff.phone,
        email=staff.email,
        role=staff.role.value,
        is_active=staff.is_active,
        created_at=staff.created_at
    )


@router.put("/{staff_id}", response_model=StaffResponse)
async def update_staff(
    staff_id: int,
    staff_data: StaffUpdate,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update staff member (Admin only)"""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    if staff_data.name is not None:
        staff.name = staff_data.name
    if staff_data.phone is not None:
        staff.phone = staff_data.phone
    if staff_data.email is not None:
        staff.email = staff_data.email
    if staff_data.is_active is not None:
        staff.is_active = staff_data.is_active
    
    db.commit()
    db.refresh(staff)
    
    return StaffResponse(
        id=staff.id,
        name=staff.name,
        phone=staff.phone,
        email=staff.email,
        role=staff.role.value,
        is_active=staff.is_active,
        created_at=staff.created_at
    )


@router.post("/{staff_id}/assign-users")
async def assign_users_to_staff(
    staff_id: int,
    data: StaffAssignUsers,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Assign users to a staff member (Admin only)"""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    assigned_count = 0
    skipped_count = 0
    
    for user_id in data.user_ids:
        # Check if user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            skipped_count += 1
            continue
        
        # Check if already assigned to any staff
        existing = db.query(StaffUser).filter(StaffUser.user_id == user_id).first()
        if existing:
            # Update assignment
            existing.staff_id = staff_id
        else:
            # Create new assignment
            assignment = StaffUser(staff_id=staff_id, user_id=user_id)
            db.add(assignment)
        
        assigned_count += 1
    
    db.commit()
    
    return {
        "message": f"Assigned {assigned_count} users to {staff.name}",
        "assigned": assigned_count,
        "skipped": skipped_count
    }


@router.get("/{staff_id}/users")
async def get_staff_users(
    staff_id: int,
    current_staff: Staff = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all users assigned to a staff member (Admin only)"""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    assignments = db.query(StaffUser).filter(StaffUser.staff_id == staff_id).all()
    user_ids = [a.user_id for a in assignments]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    
    return {
        "staff_id": staff_id,
        "staff_name": staff.name,
        "user_count": len(users),
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "phone": u.phone,
                "email": u.email,
                "is_active": u.is_active
            }
            for u in users
        ]
    }
