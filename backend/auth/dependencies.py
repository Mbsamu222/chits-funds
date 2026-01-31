from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from auth.jwt_handler import verify_token
from models.staff import Staff, StaffRole
from models.staff_user import StaffUser
from models.user import User

security = HTTPBearer()


async def get_current_staff(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Staff:
    """
    Get current authenticated staff from JWT token
    Returns Staff object if valid, raises 401 if not
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise credentials_exception
    
    staff_id: int = payload.get("sub")
    if staff_id is None:
        raise credentials_exception
    
    staff = db.query(Staff).filter(Staff.id == int(staff_id)).first()
    if staff is None:
        raise credentials_exception
    
    if not staff.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    return staff


async def require_admin(
    current_staff: Staff = Depends(get_current_staff)
) -> Staff:
    """
    Require admin role for the current staff
    Raises 403 if not admin
    """
    if not current_staff.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_staff


def get_staff_user_ids(staff: Staff, db: Session) -> List[int]:
    """
    Get list of user IDs assigned to a staff member
    Admin gets all users, staff gets only assigned users
    """
    if staff.is_admin():
        # Admin can see all users
        return [u.id for u in db.query(User.id).all()]
    
    # Staff can only see assigned users
    assignments = db.query(StaffUser.user_id).filter(
        StaffUser.staff_id == staff.id
    ).all()
    
    return [a.user_id for a in assignments]


def filter_users_for_staff(query, staff: Staff, db: Session):
    """
    Filter a user query based on staff permissions
    Admin sees all, staff sees only assigned
    """
    if staff.is_admin():
        return query
    
    assigned_user_ids = get_staff_user_ids(staff, db)
    return query.filter(User.id.in_(assigned_user_ids))
