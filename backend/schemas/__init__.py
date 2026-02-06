from pydantic import BaseModel, EmailStr, Field, field_validator
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

    @field_validator('email', mode='before')
    @classmethod
    def empty_str_to_none_email(cls, v):
        if v == '' or v is None:
            return None
        return v

    @field_validator('address', mode='before')
    @classmethod
    def empty_str_to_none_address(cls, v):
        if v == '' or v is None:
            return None
        return v


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('email', mode='before')
    @classmethod
    def empty_str_to_none_email(cls, v):
        if v == '' or v is None:
            return None
        return v

    @field_validator('address', mode='before')
    @classmethod
    def empty_str_to_none_address(cls, v):
        if v == '' or v is None:
            return None
        return v



class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    created_by: Optional[int] = None
    
    class Config:
        from_attributes = True


class UserDashboard(BaseModel):
    user: UserResponse
    chits: list
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

    @field_validator('email', mode='before')
    @classmethod
    def empty_str_to_none_email(cls, v):
        if v == '' or v is None:
            return None
        return v


class StaffCreate(StaffBase):
    password: str = Field(..., min_length=6)
    role: str = "staff"  # "admin" or "staff"


class StaffUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

    @field_validator('email', mode='before')
    @classmethod
    def empty_str_to_none_email(cls, v):
        if v == '' or v is None:
            return None
        return v



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
# Chit Schemas
# =====================

class ChitBase(BaseModel):
    chit_name: str = Field(..., min_length=2, max_length=100)
    total_amount: float = Field(..., gt=0)
    total_months: int = Field(default=20, ge=1, le=100)
    start_date: Optional[str] = None


class ChitCreate(ChitBase):
    pass


class ChitUpdate(BaseModel):
    chit_name: Optional[str] = Field(None, min_length=2, max_length=100)
    start_date: Optional[str] = None
    is_active: Optional[bool] = None


class ChitResponse(ChitBase):
    id: int
    monthly_amount: float
    is_active: bool
    created_at: datetime
    member_count: int = 0
    
    class Config:
        from_attributes = True


class ChitMemberAdd(BaseModel):
    user_id: int
    slot_number: int = Field(..., ge=1, le=100)


class ChitMemberResponse(BaseModel):
    id: int
    chit_id: int
    user_id: int
    user_name: str
    user_phone: str
    slot_number: int
    join_date: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


# =====================
# Chit Month Schemas
# =====================

class ChitMonthBase(BaseModel):
    month_number: int = Field(..., ge=1, le=100)


class ChitMonthCreate(ChitMonthBase):
    auction_date: Optional[str] = None
    winner_user_id: Optional[int] = None
    payout_amount: Optional[float] = None

    @field_validator('auction_date', mode='before')
    @classmethod
    def empty_str_to_none_date(cls, v):
        if v == '' or v is None:
            return None
        return v

    @field_validator('winner_user_id', 'payout_amount', mode='before')
    @classmethod
    def empty_str_to_none_numeric(cls, v):
        if v == '' or v is None:
            return None
        return v


class ChitMonthUpdate(BaseModel):
    auction_date: Optional[str] = None
    winner_user_id: Optional[int] = None
    payout_amount: Optional[float] = None
    admin_profit: Optional[float] = None
    status: Optional[str] = None

    @field_validator('auction_date', 'status', mode='before')
    @classmethod
    def empty_str_to_none_str(cls, v):
        if v == '' or v is None:
            return None
        return v

    @field_validator('winner_user_id', 'payout_amount', 'admin_profit', mode='before')
    @classmethod
    def empty_str_to_none_numeric(cls, v):
        if v == '' or v is None:
            return None
        return v


class ChitMonthResponse(ChitMonthBase):
    id: int
    chit_id: int
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
    chit_id: int
    chit_month_id: Optional[int] = None
    amount_paid: float = Field(..., gt=0)
    payment_mode: str = "cash"  # "cash" or "gpay"
    notes: Optional[str] = None

    @field_validator('chit_month_id', mode='before')
    @classmethod
    def empty_str_to_none_month_id(cls, v):
        if v == '' or v is None:
            return None
        return v

    @field_validator('notes', mode='before')
    @classmethod
    def empty_str_to_none_notes(cls, v):
        if v == '' or v is None:
            return None
        return v


class PaymentCreate(PaymentBase):
    pass



class PaymentResponse(PaymentBase):
    id: int
    user_name: str
    chit_name: str
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
    chit_count: int
    pending_months: int


class ChitProfitReport(BaseModel):
    chit_id: int
    chit_name: str
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


# =====================
# Account & Ledger Schemas
# =====================

class LedgerEntryCreate(BaseModel):
    """Create a ledger entry (for adjustments)"""
    user_id: int
    chit_id: int
    chit_month_id: Optional[int] = None
    entry_type: str  # "debit" or "credit"
    amount: float = Field(..., gt=0)
    source: str = "adjustment"
    notes: Optional[str] = None


class LedgerEntryResponse(BaseModel):
    """Response for a single ledger entry"""
    id: int
    user_id: int
    user_name: str
    chit_id: int
    chit_name: str
    chit_month_id: Optional[int] = None
    month_number: Optional[int] = None
    entry_type: str  # debit/credit
    amount: float
    source: str
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    notes: Optional[str] = None
    created_by_id: int
    created_by_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class MonthTally(BaseModel):
    """Payment status for a single month"""
    month_number: int
    chit_month_id: Optional[int] = None
    due: float
    paid: float
    pending: float
    status: str  # "paid", "partial", "pending", "advance", "not_started"


class ChitBalanceSummary(BaseModel):
    """Balance summary for a user in a specific chit"""
    chit_id: int
    chit_name: str
    monthly_amount: float
    total_months: int
    total_due: float
    total_paid: float
    pending: float
    advance: float
    months: list[MonthTally] = []


class UserAccountSummary(BaseModel):
    """Complete account summary for a user"""
    user_id: int
    user_name: str
    user_phone: str
    total_due: float
    total_paid: float
    pending: float
    advance: float
    chits: list[ChitBalanceSummary] = []


class AccountsDashboardSummary(BaseModel):
    """Overall accounts dashboard"""
    total_users: int
    total_chits: int
    total_due: float
    total_collected: float
    total_pending: float
    total_advance: float
    overdue_users: int
    overdue_amount: float


class GenerateDuesRequest(BaseModel):
    """Request to generate monthly dues"""
    chit_id: int
    month_number: int


class GenerateDuesResponse(BaseModel):
    """Response after generating dues"""
    chit_id: int
    chit_name: str
    month_number: int
    members_count: int
    total_dues_generated: float
    entries_created: int


class PaymentAllocationPreview(BaseModel):
    """Preview of how a payment will be allocated"""
    user_id: int
    user_name: str
    chit_id: int
    chit_name: str
    payment_amount: float
    allocations: list[dict]  # List of {month_number, amount, type}
    advance_amount: float
    message: str


class PaginatedResponse(BaseModel):
    """Standard pagination wrapper"""
    items: list
    total: int
    page: int
    per_page: int
    total_pages: int

