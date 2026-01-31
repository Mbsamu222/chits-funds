from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.staff import Staff
from auth.jwt_handler import verify_password, create_access_token, get_password_hash
from auth.dependencies import get_current_staff
from schemas import LoginRequest, TokenResponse, ChangePasswordRequest, StaffResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with phone and password
    Returns JWT token for authenticated requests
    """
    # Find staff by phone
    staff = db.query(Staff).filter(Staff.phone == request.phone).first()
    
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone or password"
        )
    
    if not verify_password(request.password, staff.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone or password"
        )
    
    if not staff.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(staff.id), "role": staff.role.value}
    )
    
    return TokenResponse(
        access_token=access_token,
        staff=StaffResponse(
            id=staff.id,
            name=staff.name,
            phone=staff.phone,
            email=staff.email,
            role=staff.role.value,
            is_active=staff.is_active,
            created_at=staff.created_at
        )
    )


@router.get("/me", response_model=StaffResponse)
async def get_current_user(current_staff: Staff = Depends(get_current_staff)):
    """Get current logged in staff info"""
    return StaffResponse(
        id=current_staff.id,
        name=current_staff.name,
        phone=current_staff.phone,
        email=current_staff.email,
        role=current_staff.role.value,
        is_active=current_staff.is_active,
        created_at=current_staff.created_at
    )


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Change password for current staff"""
    if not verify_password(request.old_password, current_staff.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_staff.password_hash = get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
