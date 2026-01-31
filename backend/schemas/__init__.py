from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# =====================
# User Schemas
# =====================

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    address: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    created_by: Optional[int] = None
    
    class Config:
        from_attributes = True


class UserDashboard(BaseModel):
    user: UserResponse
    seats: list
    total_paid: float
    total_balance: float
    pending_months: int


# =====================
# Staff Schemas
# =====================

class StaffBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None


class StaffCreate(StaffBase):
    password: str = Field(..., min_length=6)
    role: str = "staff"  # "admin" or "staff"


class StaffUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class StaffResponse(StaffBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class StaffAssignUsers(BaseModel):
    user_ids: list[int]


# =====================
# Auth Schemas
# =====================

class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    staff: StaffResponse


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


# =====================
# Seat Schemas
# =====================

class SeatBase(BaseModel):
    seat_name: str = Field(..., min_length=2, max_length=100)
    total_amount: float = Field(..., gt=0)
    total_months: int = Field(default=20, ge=1, le=100)
    start_date: Optional[str] = None


class SeatCreate(SeatBase):
    pass


class SeatUpdate(BaseModel):
    seat_name: Optional[str] = Field(None, min_length=2, max_length=100)
    start_date: Optional[str] = None
    is_active: Optional[bool] = None


class SeatResponse(SeatBase):
    id: int
    monthly_amount: float
    is_active: bool
    created_at: datetime
    member_count: int = 0
    
    class Config:
        from_attributes = True


class SeatMemberAdd(BaseModel):
    user_id: int
    slot_number: int = Field(..., ge=1, le=100)


class SeatMemberResponse(BaseModel):
    id: int
    seat_id: int
    user_id: int
    user_name: str
    user_phone: str
    slot_number: int
    join_date: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


# =====================
# Seat Month Schemas
# =====================

class SeatMonthBase(BaseModel):
    month_number: int = Field(..., ge=1, le=100)


class SeatMonthCreate(SeatMonthBase):
    auction_date: Optional[str] = None
    winner_user_id: Optional[int] = None
    payout_amount: Optional[float] = None


class SeatMonthUpdate(BaseModel):
    auction_date: Optional[str] = None
    winner_user_id: Optional[int] = None
    payout_amount: Optional[float] = None
    admin_profit: Optional[float] = None
    status: Optional[str] = None


class SeatMonthResponse(SeatMonthBase):
    id: int
    seat_id: int
    auction_date: Optional[str] = None
    winner_user_id: Optional[int] = None
    winner_name: Optional[str] = None
    payout_amount: Optional[float] = None
    admin_profit: Optional[float] = None
    status: str
    total_collected: float = 0
    
    class Config:
        from_attributes = True


# =====================
# Payment Schemas
# =====================

class PaymentBase(BaseModel):
    user_id: int
    seat_id: int
    seat_month_id: Optional[int] = None
    amount_paid: float = Field(..., gt=0)
    payment_mode: str = "cash"  # "cash" or "gpay"
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: int
    user_name: str
    seat_name: str
    month_number: Optional[int] = None
    screenshot_url: Optional[str] = None
    collected_by_staff_id: int
    collected_by_name: str
    payment_date: datetime
    
    class Config:
        from_attributes = True


# =====================
# Report Schemas
# =====================

class ProfitSummary(BaseModel):
    total_collected: float
    total_payout: float
    total_profit: float
    seat_count: int
    pending_months: int


class SeatProfitReport(BaseModel):
    seat_id: int
    seat_name: str
    total_amount: float
    completed_months: int
    total_collected: float
    total_payout: float
    profit: float


class MonthProfitReport(BaseModel):
    month: str
    total_collected: float
    total_payout: float
    profit: float
