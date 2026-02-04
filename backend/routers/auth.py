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


@router.post("/password-reset/request")
async def request_password_reset(
    phone: str,
    db: Session = Depends(get_db)
):
    """
    Request password reset - generates a secure token.
    
    In production, this token would be sent via SMS/email.
    For now, we return it directly (for testing/development).
    
    Token expires in 30 minutes and can only be used once.
    """
    from models.password_reset_token import PasswordResetToken
    
    # Find staff by phone
    staff = db.query(Staff).filter(Staff.phone == phone).first()
    
    if not staff:
        # Don't reveal if phone exists or not (security)
        return {
            "message": "If this phone number is registered, a reset link has been sent.",
            "expires_in_minutes": 30
        }
    
    if not staff.is_active:
        return {
            "message": "If this phone number is registered, a reset link has been sent.",
            "expires_in_minutes": 30
        }
    
    # Invalidate any existing unused tokens for this staff
    db.query(PasswordResetToken).filter(
        PasswordResetToken.staff_id == staff.id,
        PasswordResetToken.used == False
    ).update({"used": True})
    
    # Create new token
    token = PasswordResetToken(
        staff_id=staff.id,
        token=PasswordResetToken.generate_token(),
        expires_at=PasswordResetToken.get_expiry(minutes=30)
    )
    db.add(token)
    db.commit()
    
    # In production: Send SMS/Email with token
    # For development: Return token directly
    return {
        "message": "Password reset token generated",
        "token": token.token,  # Remove in production!
        "expires_in_minutes": 30,
        "note": "In production, this token would be sent via SMS/email"
    }


@router.post("/password-reset/verify")
async def verify_password_reset(
    token: str,
    new_password: str,
    db: Session = Depends(get_db)
):
    """
    Reset password using the token from /password-reset/request.
    
    Token must be:
    - Valid (not expired)
    - Not already used
    - Matching a real staff account
    """
    from models.password_reset_token import PasswordResetToken
    from datetime import datetime
    
    # Find token
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token
    ).first()
    
    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    if not reset_token.is_valid():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired or already been used"
        )
    
    # Validate new password
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    
    # Get staff and update password
    staff = db.query(Staff).filter(Staff.id == reset_token.staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )
    
    # Update password
    staff.password_hash = get_password_hash(new_password)
    
    # Mark token as used
    reset_token.mark_used()
    
    db.commit()
    
    return {"message": "Password has been reset successfully. You can now login with your new password."}


@router.post("/password-reset/admin")
async def admin_reset_password(
    staff_id: int,
    new_password: str,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """
    Admin-only: Reset password for any staff member.
    
    This is useful when staff forgets password and can't 
    receive SMS/email for self-service reset.
    """
    from auth.dependencies import require_admin
    
    # Must be admin
    if not current_staff.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Find target staff
    target_staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not target_staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    # Validate new password
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    
    # Update password
    target_staff.password_hash = get_password_hash(new_password)
    db.commit()
    
    return {
        "message": f"Password reset successfully for {target_staff.name}",
        "staff_id": target_staff.id,
        "staff_name": target_staff.name
    }

