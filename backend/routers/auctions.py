from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from decimal import Decimal

from database import get_db
from models import Auction, Bid, AuctionStatus, BidStatus, ChitMonth, Chit, User, ChitMember, Staff
from auth.dependencies import get_current_staff

router = APIRouter(prefix="/auctions", tags=["Auctions"])


# Pydantic schemas
class AuctionCreate(BaseModel):
    chit_month_id: str  # Can be either integer ID or "chit_id_month" format
    auction_date: datetime


class AuctionUpdate(BaseModel):
    auction_date: Optional[datetime] = None
    status: Optional[AuctionStatus] = None


class BidCreate(BaseModel):
    auction_id: int
    user_id: int
    bid_amount: Decimal
    notes: Optional[str] = None


# Create auction
@router.post("")
async def create_auction(
    data: AuctionCreate,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Create a new auction for a chit month"""
    
    # Parse chit_month_id - can be either direct ID or "chit_id_month_number" format
    chit_month_id = None
    
    if '_' in str(data.chit_month_id):
        # Format: "chit_id_month_number"
        try:
            chit_id, month_number = map(int, str(data.chit_month_id).split('_'))
            
            # Check if chit month exists
            chit_month = db.query(ChitMonth).filter(
                ChitMonth.chit_id == chit_id,
                ChitMonth.month_number == month_number
            ).first()
            
            if not chit_month:
                # Create the chit month if it doesn't exist
                chit = db.query(Chit).filter(Chit.id == chit_id).first()
                if not chit:
                    raise HTTPException(status_code=404, detail="Chit not found")
                
                chit_month = ChitMonth(
                    chit_id=chit_id,
                    month_number=month_number,
                    status="pending"
                )
                db.add(chit_month)
                db.commit()
                db.refresh(chit_month)
            
            chit_month_id = chit_month.id
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid chit_month_id format")
    else:
        # Direct chit_month_id
        try:
            chit_month_id = int(data.chit_month_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid chit_month_id")
    
    # Verify chit month exists
    chit_month = db.query(ChitMonth).filter(ChitMonth.id == chit_month_id).first()
    if not chit_month:
        raise HTTPException(status_code=404, detail="Chit month not found")
    
    # Check if auction already exists for this month
    existing = db.query(Auction).filter(
        Auction.chit_month_id == chit_month_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Auction already exists for this month")
    
    auction = Auction(
        chit_month_id=chit_month_id,
        auction_date=data.auction_date,
        status=AuctionStatus.SCHEDULED
    )
    db.add(auction)
    db.commit()
    db.refresh(auction)
    return {"message": "Auction created successfully", "auction_id": auction.id}


# List auctions
@router.get("")
async def list_auctions(
    chit_id: Optional[int] = None,
    status: Optional[AuctionStatus] = None,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """List all auctions, optionally filtered by chit and status"""
    query = db.query(Auction).join(ChitMonth).join(Chit)
    
    if chit_id:
        query = query.filter(Chit.id == chit_id)
    
    if status:
        query = query.filter(Auction.status == status)
    
    query = query.order_by(Auction.auction_date.desc())
    auctions = query.all()
    
    result = []
    for auction in auctions:
        chit_month = auction.chit_month
        chit = chit_month.chit
        
        result.append({
            "id": auction.id,
            "chit_id": chit.id,
            "chit_name": chit.chit_name,
            "month_number": chit_month.month_number,
            "auction_date": auction.auction_date.isoformat(),
            "status": auction.status.value,
            "total_bids": len(auction.bids),
            "winning_bid_amount": float(auction.winning_bid_amount) if auction.winning_bid_amount else None,
            "winner_name": auction.winner.name if auction.winner else None,
            "dividend_per_member": float(auction.dividend_per_member) if auction.dividend_per_member else None
        })
    
    return result


# Get auction details
@router.get("/{auction_id}")
async def get_auction(
    auction_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get detailed auction information with bidding history"""
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    chit_month = auction.chit_month
    chit = chit_month.chit
    
    # Get all bids sorted by amount
    bids_data = []
    for bid in sorted(auction.bids, key=lambda x: x.bid_amount):
        user = bid.user
        bids_data.append({
            "id": bid.id,
            "user_id": user.id,
            "user_name": user.name,
            "bid_amount": float(bid.bid_amount),
            "bid_time": bid.bid_time.isoformat(),
            "status": bid.status.value
        })
    
    return {
        "id": auction.id,
        "chit_id": chit.id,
        "chit_name": chit.chit_name,
        "month_number": chit_month.month_number,
        "auction_date": auction.auction_date.isoformat(),
        "status": auction.status.value,
        "total_members": chit.member_count,
        "total_amount": float(chit.total_amount),
        "bids": bids_data,
        "winning_bid_amount": float(auction.winning_bid_amount) if auction.winning_bid_amount else None,
        "winner_id": auction.winner_user_id,
        "winner_name": auction.winner.name if auction.winner else None,
        "dividend_per_member": float(auction.dividend_per_member) if auction.dividend_per_member else None
    }


# Place bid
@router.post("/bid")
async def place_bid(
    data: BidCreate,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Place a bid in an auction"""
    # Verify auction exists and is open
    auction = db.query(Auction).filter(Auction.id == data.auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    if auction.status != AuctionStatus.OPEN:
        raise HTTPException(status_code=400, detail="Auction is not open for bidding")
    
    # Verify user is a member of this chit
    chit_id = auction.chit_month.chit_id
    member = db.query(ChitMember).filter(
        ChitMember.chit_id == chit_id,
        ChitMember.user_id == data.user_id
    ).first()
    if not member:
        raise HTTPException(status_code=400, detail="User is not a member of this chit group")
    
    # Check if user has already won in a previous month
    previous_wins = db.query(Auction).join(ChitMonth).filter(
        ChitMonth.chit_id == chit_id,
        Auction.winner_user_id == data.user_id
    ).first()
    if previous_wins:
        raise HTTPException(status_code=400, detail="User has already won in a previous auction")
    
    # Validate bid amount (must be less than total chit amount)
    chit = auction.chit_month.chit
    if data.bid_amount >= chit.total_amount:
        raise HTTPException(status_code=400, detail="Bid amount must be less than total chit amount")
    
    # Create bid
    bid = Bid(
        auction_id=data.auction_id,
        user_id=data.user_id,
        bid_amount=data.bid_amount,
        notes=data.notes,
        status=BidStatus.PENDING
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)
    
    return {"message": "Bid placed successfully", "bid_id": bid.id}


# Open auction for bidding
@router.post("/{auction_id}/open")
async def open_auction(
    auction_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Open an auction for bidding"""
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    if auction.status != AuctionStatus.SCHEDULED:
        raise HTTPException(status_code=400, detail="Only scheduled auctions can be opened")
    
    auction.status = AuctionStatus.OPEN
    db.commit()
    
    return {"message": "Auction opened for bidding"}


# Close auction and determine winner
@router.post("/{auction_id}/close")
async def close_auction(
    auction_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Close auction and determine winner (lowest bid wins in chit fund)"""
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    if auction.status != AuctionStatus.OPEN:
        raise HTTPException(status_code=400, detail="Only open auctions can be closed")
    
    # Find winning bid (lowest amount)
    winning_bid = db.query(Bid).filter(
        Bid.auction_id == auction_id,
        Bid.status == BidStatus.PENDING
    ).order_by(Bid.bid_amount.asc()).first()
    
    if not winning_bid:
        raise HTTPException(status_code=400, detail="No bids placed in this auction")
    
    # Calculate dividend per member
    chit = auction.chit_month.chit
    total_collection = chit.total_amount
    winning_amount = winning_bid.bid_amount
    dividend = (total_collection - winning_amount) / chit.member_count
    
    # Update auction
    auction.status = AuctionStatus.CLOSED
    auction.winning_bid_amount = winning_amount
    auction.winner_user_id = winning_bid.user_id
    auction.dividend_per_member = dividend
    
    # Mark winning bid as accepted
    winning_bid.status = BidStatus.ACCEPTED
    
    # Reject all other bids
    other_bids = db.query(Bid).filter(
        Bid.auction_id == auction_id,
        Bid.id != winning_bid.id
    ).all()
    for bid in other_bids:
        bid.status = BidStatus.REJECTED
    
    # Update chit_month with winner info
    auction.chit_month.winner_user_id = winning_bid.user_id
    auction.chit_month.payout_amount = winning_amount
    auction.chit_month.status = "completed"
    
    db.commit()
    
    return {
        "message": "Auction closed successfully",
        "winner_id": winning_bid.user_id,
        "winner_name": winning_bid.user.name,
        "winning_bid_amount": float(winning_amount),
        "payout_amount": float(winning_amount),
        "dividend_per_member": float(dividend)
    }


# Cancel auction
@router.post("/{auction_id}/cancel")
async def cancel_auction(
    auction_id: int,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Cancel an auction"""
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    if auction.status == AuctionStatus.CLOSED:
        raise HTTPException(status_code=400, detail="Cannot cancel a closed auction")
    
    auction.status = AuctionStatus.CANCELLED
    db.commit()
    
    return {"message": "Auction cancelled successfully"}
