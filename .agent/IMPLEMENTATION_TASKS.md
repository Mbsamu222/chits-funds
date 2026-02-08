# Chit Funds - Implementation Tasks

## ✅ COMPLETED TASKS

### Core Functionality

- [x] User Management (CRUD)
- [x] Staff Management
- [x] Chit Management
- [x] Member Management
- [x] Payment Processing (Cash/GPay)
- [x] Account Ledger System
- [x] Basic Reports
- [x] Pamphlet Generation
- [x] Dashboard with clickable cards
- [x] Dark/Light theme
- [x] Filters on Accounts page (Type, Source, Month, Year, Chit)

### UI/UX

- [x] Premium design with glassmorphism
- [x] Responsive layout
- [x] Loading states
- [x] Toast notifications

---

## 🔧 IMMEDIATE FIXES (Phase 1) - Make All UI Elements Functional

### 1. Navigation & Clickable Elements

- [ ] Make chit names in tables clickable → navigate to `/chits/:id`
- [ ] Make user names in tables clickable → navigate to `/users/:id`
- [ ] Add click-to-call on phone numbers
- [ ] Add WhatsApp quick action on phone numbers
- [ ] Fix any broken navigation links

### 2. Empty States with Actions

- [ ] Users page empty state → "Add First User" button
- [ ] Chits page empty state → "Create First Chit" button
- [ ] Payments page empty state → "Record First Payment" button
- [ ] Reports page empty state → informative message

### 3. Form Validation & Error Handling

- [ ] Show inline validation errors
- [ ] Display API error messages to user
- [ ] Add confirmation dialogs before delete operations
- [ ] Prevent duplicate submissions (disable button on submit)

### 4. Settings Page Enhancements

- [ ] Add profile edit functionality
- [ ] Add password change option
- [ ] Add notification preferences
- [ ] Add display preferences (items per page, date format)

---

## 🚀 CRITICAL ENTERPRISE FEATURES (Phase 2)

### 5. Auction & Bidding System ⭐⭐⭐

**Backend:**

- [ ] Create `Auction` model (id, chit_month_id, auction_date, status, created_at)
- [ ] Create `Bid` model (id, auction_id, user_id, bid_amount, bid_time, status)
- [ ] API endpoint: `POST /auctions/create` - Create auction for a month
- [ ] API endpoint: `POST /auctions/:id/bid` - Place a bid
- [ ] API endpoint: `GET /auctions/:id/bids` - Get all bids for an auction
- [ ] API endpoint: `POST /auctions/:id/close` - Close auction, determine winner
- [ ] Business logic: Calculate dividend per member after auction

**Frontend:**

- [ ] Auction scheduling interface (select chit + month, set date/time)
- [ ] Live bidding interface (real-time bid updates)
- [ ] Auction history view
- [ ] Winner announcement UI
- [ ] Payout distribution workflow

### 6. Notification System ⭐⭐⭐

**Backend:**

- [ ] Create `Notification` model (id, user_id, type, title, message, read, created_at)
- [ ] Create `NotificationPreference` model (user_id, sms, email, whatsapp)
- [ ] Integrate SMS API (Twilio/MSG91)
- [ ] Integrate Email API (SendGrid/SMTP)
- [ ] Create notification templates
- [ ] API endpoints for notification CRUD
- [ ] Scheduled tasks: payment reminders, auction reminders

**Frontend:**

- [ ] Notification bell icon in header
- [ ] Notification dropdown/modal
- [ ] Mark as read functionality
- [ ] Notification preferences in Settings

### 7. Document Management & KYC ⭐⭐⭐

**Backend:**

- [ ] Create `Document` model (id, user_id, type, file_path, status, expiry_date, verified_by, verified_at)
- [ ] Document types: AADHAAR, PAN, PHOTO, AGREEMENT, GUARANTOR_DOC
- [ ] API endpoint: `POST /users/:id/documents` - Upload document
- [ ] API endpoint: `GET /users/:id/documents` - List documents
- [ ] API endpoint: `PUT /documents/:id/verify` - Verify document
- [ ] API endpoint: `DELETE /documents/:id` - Delete document
- [ ] File storage (local/S3)

**Frontend:**

- [ ] Document upload interface in UserDetail page
- [ ] Document viewer/preview
- [ ] Document verification workflow (for admin)
- [ ] Document expiry alerts
- [ ] KYC status badge on user cards

### 8. Fine & Penalty Management ⭐⭐

**Backend:**

- [ ] Create `Fine` model (id, user_id, chit_month_id, fine_type, amount, waived, waived_by, created_at)
- [ ] Create `FineRule` model (id, chit_id, days_late, penalty_percentage, fixed_amount)
- [ ] Auto-calculate fines for late payments
- [ ] API endpoints for fine CRUD
- [ ] Waiver request workflow

**Frontend:**

- [ ] Fine configuration in Chit

settings

- [ ] Fine display in payment page
- [ ] Waiver request interface
- [ ] Fine reports

### 9. Receipt & PDF Generation ⭐⭐

**Backend:**

- [ ] Install PDF library (reportlab/weasyprint)
- [ ] Create receipt template (HTML → PDF)
- [ ] API endpoint: `GET /payments/:id/receipt` - Generate PDF receipt
- [ ] Auto-email receipt after payment
- [ ] Monthly statement generation

**Frontend:**

- [ ] "Download Receipt" button on payment rows
- [ ] "Email Receipt" option
- [ ] Preview before download

### 10. Defaulter Management ⭐⭐

**Backend:**

- [ ] API endpoint: `GET /defaulters` - List users with pending payments
- [ ] Defaulter criteria: X days past due date
- [ ] Defaulter status levels (YELLOW: 1-7 days, ORANGE: 8-15 days, RED: 15+ days)
- [ ] Legal notice template generation

**Frontend:**

- [ ] Defaulters list page/section
- [ ] Defaulter status badges
- [ ] Follow-up workflow interface
- [ ] Send reminder notifications
- [ ] Settlement tracking

---

## 👥 MEMBER PORTAL (Phase 3)

### 11. Member Authentication & Dashboard

**Backend:**

- [ ] Separate auth endpoint for members: `POST /member/login`
- [ ] Member JWT tokens
- [ ] API endpoints for member-specific data

**Frontend:**

- [ ] Member login page
- [ ] Member dashboard (their chits, payments, dues)
- [ ] Payment history view
- [ ] Upcoming auctions view
- [ ] Profile edit

### 12. Online Payment Integration

**Backend:**

- [ ] Integrate Razorpay/Paytm/PhonePe
- [ ] Payment gateway webhook handling
- [ ] Auto-record payment on success

**Frontend:**

- [ ] "Pay Online" button
- [ ] Payment gateway integration
- [ ] Payment success/failure handling

---

## 📊 ADVANCED FEATURES (Phase 4)

### 13. Advanced Reporting & Analytics

- [ ] Collection efficiency report (by staff, by chit)
- [ ] Profit/Loss statement
- [ ] Cashflow projection
- [ ] Export to Excel/CSV
- [ ] Dashboard charts (Chart.js/Recharts)

### 14. Chit Lifecycle Management

- [ ] Chit closure workflow
- [ ] Final settlement calculation
- [ ] Member exit/transfer process
- [ ] Slot transfer approval workflow

### 15. Attendance & Meetings

- [ ] Meeting scheduling
- [ ] Attendance tracking
- [ ] Meeting minutes

---

## 🎯 PRIORITY ORDER

1. ✅ Fix all UI navigation and clickable elements (Week 1)
2. ✅ Auction & Bidding System (Week 1-2)
3. ✅ Notification System (Week 2)
4. ✅ Document Management (Week 2-3)
5. ✅ Receipt Generation (Week 3)
6. ✅ Fine & Penalty (Week 3)
7. ✅ Defaulter Management (Week 4)
8. ✅ Member Portal (Week 4-5)
9. ✅ Online Payments (Week 5)
10. ✅ Advanced Reporting (Week 6)
