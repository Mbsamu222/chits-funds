"""
Backfill AccountLedger entries for existing members

Run this script once to create missing DEBIT entries for all existing
chit members. This is needed because the automatic ledger creation
was added after some members were already added.

Usage:
    cd backend
    python scripts/backfill_ledger.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.chit import Chit
from models.chit_member import ChitMember
from models.chit_month import ChitMonth
from models.user import User
from models.staff import Staff
from models.account_ledger import AccountLedger, EntryType, LedgerSource


def backfill_ledger_entries():
    """Create missing DEBIT entries for all existing members"""
    db = SessionLocal()
    
    try:
        # Get admin staff for created_by field
        admin = db.query(Staff).filter(Staff.role == "admin").first()
        if not admin:
            print("❌ No admin found. Please create an admin first.")
            return
        
        print(f"Using admin: {admin.name} (ID: {admin.id})")
        
        # Get all chits
        chits = db.query(Chit).all()
        print(f"\nFound {len(chits)} chits")
        
        total_created = 0
        total_skipped = 0
        
        for chit in chits:
            print(f"\n📋 Processing chit: {chit.chit_name} (ID: {chit.id})")
            
            # Get all months for this chit
            months = db.query(ChitMonth).filter(
                ChitMonth.chit_id == chit.id
            ).order_by(ChitMonth.month_number).all()
            
            # Get all members
            members = db.query(ChitMember).filter(
                ChitMember.chit_id == chit.id
            ).all()
            
            print(f"   Months: {len(months)}, Members: {len(members)}")
            
            for member in members:
                user = db.query(User).filter(User.id == member.user_id).first()
                member_name = user.name if user else f"User {member.user_id}"
                
                for month in months:
                    # Check if DEBIT entry already exists
                    existing = db.query(AccountLedger).filter(
                        AccountLedger.chit_id == chit.id,
                        AccountLedger.user_id == member.user_id,
                        AccountLedger.chit_month_id == month.id,
                        AccountLedger.entry_type == EntryType.DEBIT,
                        AccountLedger.source == LedgerSource.MONTHLY_DUE
                    ).first()
                    
                    if existing:
                        total_skipped += 1
                        continue
                    
                    # Create DEBIT entry
                    ledger_entry = AccountLedger(
                        user_id=member.user_id,
                        chit_id=chit.id,
                        chit_month_id=month.id,
                        entry_type=EntryType.DEBIT,
                        amount=float(chit.monthly_amount),
                        source=LedgerSource.MONTHLY_DUE,
                        reference_id=month.id,
                        reference_type="chit_month",
                        notes=f"Backfilled due for Month {month.month_number}",
                        created_by=admin.id
                    )
                    db.add(ledger_entry)
                    total_created += 1
                
                print(f"   ✓ {member_name}: processed")
        
        db.commit()
        
        print(f"\n{'='*50}")
        print(f"✅ Backfill complete!")
        print(f"   Created: {total_created} entries")
        print(f"   Skipped: {total_skipped} (already existed)")
        print(f"{'='*50}")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("="*50)
    print("AccountLedger Backfill Script")
    print("="*50)
    backfill_ledger_entries()
