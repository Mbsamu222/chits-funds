# Duplicate Payment Detection Feature

## Overview

Implemented a duplicate payment detection system that alerts users when they attempt to add a payment with the same details (user, chit, amount, payment mode) within a 5-minute window.

## Features Implemented

### Backend Changes

1. **`backend/routers/payments.py`** (Lines 166-197)
   - Re-enabled duplicate detection logic
   - Checks for payments with matching:
     - User ID
     - Chit ID
     - Amount
     - Payment mode
     - Created within last 5 minutes
   - Returns HTTP 409 (Conflict) status with duplicate details
   - Accepts `force_duplicate` flag to bypass duplicate check after confirmation

2. **`backend/schemas/__init__.py`** (Line 291)
   - Added `force_duplicate: bool = False` field to `PaymentCreate` schema
   - Allows frontend to retry payment after user confirmation

### Frontend Changes

1. **State Management** (Lines 21-23)
   - Added `duplicateData` state to store duplicate payment information
   - Added `showDuplicateModal` state to control duplicate confirmation dialog

2. **Payment Submission** (Lines 72-126)
   - Modified `handleSubmit` to accept `forceDuplicate` parameter
   - Detects HTTP 409 status code from backend
   - Shows duplicate confirmation modal when duplicates are detected
   - Sends `force_duplicate: true` flag when user confirms

3. **Duplicate Confirmation Modal** (Lines 609-706)
   - **Warning Banner**: Shows alert about duplicate detection
   - **Duplicate Details**: Displays each duplicate payment with:
     - Amount (formatted as currency)
     - Payment date and time
     - Payment mode (Cash/GPay)
     - Notes (if any)
   - **Action Buttons**:
     - **Cancel & Edit**: Returns to payment form to modify details
     - **Proceed Anyway**: Submits payment with force_duplicate flag
   - **Helpful Tip**: Guides users on when to cancel vs proceed

## User Flow

1. User fills payment form and clicks "Record"
2. If duplicate detected:
   - Payment form closes
   - Duplicate confirmation modal opens
   - Shows all matching payments from last 5 minutes
3. User has two options:
   - **Cancel & Edit**: Go back to form to change amount, mode, or notes
   - **Proceed Anyway**: Confirm duplicate payment is intentional

## Visual Design

- **Warning Banner**: Red-tinted background with border for attention
- **Duplicate Cards**: Dark surface cards showing each duplicate payment
- **Payment Mode Badges**: Color-coded badges (blue for GPay, secondary for Cash)
- **Currency Formatting**: Indian Rupee format (₹)
- **Date Format**: Localized Indian format with time

## Benefits

1. **Prevents Accidental Duplicates**: Catches common data entry mistakes
2. **User-Friendly**: Shows clear options instead of blocking outright
3. **Flexible**: Allows genuine duplicate payments when needed
4. **Informative**: Displays all relevant details to help decision-making
5. **Time-Window Based**: Only checks last 5 minutes (adjustable)

## Configuration

To adjust the duplicate detection window, modify this line in `backend/routers/payments.py`:

```python
five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)  # Change minutes value
```

## Testing

Try creating the same payment twice quickly to see the duplicate detection in action:

1. Add a payment (e.g., ₹1000, Cash, for a specific user/chit)
2. Immediately try adding the same payment again
3. Duplicate confirmation modal should appear
4. Click "Proceed Anyway" to confirm or "Cancel & Edit" to modify
