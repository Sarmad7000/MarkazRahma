# Markaz Al-Rahma Mosque Website - Product Requirements Document

## Original Problem Statement
Build a website for Markaz Al-Rahma mosque in Colindale, London. The website should:
- Display prayer times (live API for Adhan, manually updated Iqamah)
- Feature donation functionality (Stripe/PayPal + bank transfer info)
- Use cyan, black, and white color scheme matching the logo
- Be simple, modern, and minimalistic with Islamic touches
- Include location map on homepage and contact page
- Be Shariah compliant with Quran and Sunnah

## User Information
- **Mosque Name:** Markaz Al-Rahma (Al-Rahma Centre)
- **Location:** Colindale, London (51.590636°N, 0.25°W)
- **Twitter:** @MarkazRahma
- **Target Audience:** Local Muslim community, potential donors, visitors
- **Status:** Small struggling mosque seeking expansion

## Architecture & Tech Stack
- **Frontend:** React with shadcn/ui components
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Payment:** Stripe (primary) + PayPal
- **Prayer Times API:** AlAdhan API (free tier)
- **Maps:** Google Maps Embed

## What's Been Implemented (March 3, 2025)

### ✅ Frontend (Completed)
1. **Components Created:**
   - `/app/frontend/src/pages/Home.jsx` - Main landing page with backend integration
   - `/app/frontend/src/components/DonationModal.jsx` - Interactive donation modal
   - `/app/frontend/src/components/DonationProgress.jsx` - Live donation progress tracker
   - `/app/frontend/src/services/api.js` - API service layer
   - `/app/frontend/src/data/mock.js` - Static mosque information
   - Updated `/app/frontend/src/App.js` for routing
   - Updated `/app/frontend/src/App.css` for smooth scrolling

2. **Sections Implemented:**
   - **Header:** Sticky navigation with logo, menu links, donate button
   - **Hero:** Welcome message, mosque description, CTA buttons, stats (150+ families, 5 programs, 10+ years)
   - **Prayer Times:** Live prayer times from AlAdhan API with manual Iqamah times, Hijri date
   - **Donation:** Progress tracker, donation modal with Stripe integration, bank transfer details
   - **About:** Mission/vision statements, 4 value cards, facilities list, weekly programs
   - **Location:** Google Maps embed with Colindale coordinates
   - **Contact:** Phone, email, Twitter contact cards
   - **Footer:** Logo, copyright, Islamic tagline

3. **Design Features:**
   - Color scheme: Cyan (#06b6d4), black, white
   - Clean typography with proper spacing
   - Hover effects and transitions
   - Responsive grid layouts
   - lucide-react icons (no emojis)
   - shadcn/ui Card, Button, Dialog, Progress components
   - Loading states and error handling with toast notifications

### ✅ Backend (Completed)
1. **Services Created:**
   - `/app/backend/services/prayer_service.py` - AlAdhan API integration service
   
2. **Models Defined:**
   - `/app/backend/models.py` - All Pydantic models for API validation

3. **Endpoints Implemented:**
   - `GET /api/prayers/today` - Live prayer times for current date
   - `GET /api/prayers/date?date=YYYY-MM-DD` - Prayer times for specific date
   - `PUT /api/prayers/iqamah` - Update iqamah time (admin)
   - `POST /api/donations/create-checkout` - Create Stripe checkout session
   - `GET /api/donations/status/:sessionId` - Check payment status
   - `POST /api/webhook/stripe` - Handle Stripe webhooks
   - `GET /api/donations/goal` - Get donation progress

4. **Database Collections:**
   - `prayer_times` - Stores daily prayer times with custom iqamah
   - `payment_transactions` - Tracks all donation transactions
   - `donation_goals` - Stores fundraising goal and progress

5. **Integrations:**
   - **AlAdhan API:** Live prayer times for Colindale, London
   - **Stripe Payments:** Via emergentintegrations library
   - **MongoDB:** All data persistence

### ✅ Testing (March 3, 2025)
- Backend: 100% (8/8 tests passed)
- Frontend: 95% (all core functionality working)
- Live AlAdhan API integration verified
- Stripe checkout flow tested
- Payment webhook functional
- Donation progress tracking working

## API Contracts (To Be Implemented)

### Prayer Times Endpoints
```
GET  /api/prayers/today
     Response: { date, hijriDate, prayers: [{ name, adhan, iqamah }], jummah }

GET  /api/prayers/date?date=YYYY-MM-DD
     Response: Same as above for specific date

PUT  /api/prayers/iqamah (Admin only)
     Body: { prayer: "Fajr", iqamah: "06:00" }
     Response: Updated prayer times
```

### Donation Endpoints
```
POST /api/donations/create-checkout
     Body: { amount?, package?, originUrl }
     Response: { url, sessionId }

GET  /api/donations/status/:sessionId
     Response: { status, paymentStatus, amount, currency }

POST /api/webhook/stripe
     Body: Stripe webhook event
     Response: 200 OK
```

### Admin Endpoints (Future)
```
POST /api/admin/login
GET  /api/admin/prayer-times
PUT  /api/admin/prayer-times
GET  /api/admin/donations/history
```

## Database Schema

### Collections to Create

#### 1. prayer_times
```json
{
  "_id": ObjectId,
  "date": "2025-03-03",
  "prayers": [
    { "name": "Fajr", "adhan": "05:45", "iqamah": "06:00" },
    { "name": "Dhuhr", "adhan": "12:30", "iqamah": "12:45" },
    ...
  ],
  "jummah": { "khutbah": "13:00", "salah": "13:30" },
  "hijriDate": "3 Ramadan 1446",
  "lastUpdated": ISODate
}
```

#### 2. payment_transactions
```json
{
  "_id": ObjectId,
  "sessionId": "cs_...",
  "amount": 50.00,
  "currency": "gbp",
  "paymentStatus": "paid|pending|failed",
  "status": "complete|initiated",
  "metadata": { "source": "web_checkout" },
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

#### 3. mosque_settings (Future)
```json
{
  "_id": ObjectId,
  "key": "bank_details|contact_info|about_content",
  "value": { ... },
  "updatedAt": ISODate
}
```

## Prioritized Backlog

### P0 - Critical (COMPLETED ✅)
- [x] AlAdhan API integration for live Adhan times
- [x] Iqamah time manual update system
- [x] Stripe payment integration with emergentintegrations
- [x] Payment transaction tracking in MongoDB
- [x] Webhook handling for payment confirmations
- [x] Frontend-backend integration (removed mock data)
- [x] Error handling and loading states
- [x] Donation progress tracker with fundraising goal

### P1 - High Priority
- [ ] Admin authentication system
- [ ] Admin dashboard for Iqamah updates
- [ ] Donation history dashboard
- [ ] Email notifications for donations
- [ ] Success/cancel pages refinement
- [ ] Mobile responsive optimization

### P2 - Medium Priority
- [ ] Monthly prayer times calendar view
- [ ] SEO optimization
- [ ] Social media Open Graph tags
- [ ] Announcement banner system
- [ ] Newsletter signup
- [ ] Prayer time caching optimization (currently uses default)

### P3 - Nice to Have
- [ ] PayPal integration
- [ ] Prayer time notifications
- [ ] Multi-language support (Arabic/English)
- [ ] Event calendar system
- [ ] Download monthly timetable PDF
- [ ] Donation receipt generation

## Integration Details

### AlAdhan Prayer Times API
- **Endpoint:** https://api.aladhan.com/v1
- **Location:** 51.590636, -0.25 (Colindale)
- **Method:** 2 (ISNA)
- **School:** 0 (Shafi)
- **Timezone:** Europe/London
- **Caching:** 1 hour for daily times
- **Fallback:** Use last cached times if API fails

### Stripe Payment Integration
- **Library:** emergentintegrations.payments.stripe.checkout
- **Test Key:** Already in backend .env
- **Flow:** 
  1. Frontend calls backend with originUrl
  2. Backend creates checkout session
  3. Creates payment_transactions entry (status: pending)
  4. Redirects to Stripe
  5. User completes payment
  6. Frontend polls status endpoint
  7. Backend updates transaction status
- **Webhook:** /api/webhook/stripe for payment events

## Frontend-Backend Integration Checklist
- [ ] Create axios instance with REACT_APP_BACKEND_URL
- [ ] Add loading spinners for API calls
- [ ] Add error toast notifications (using sonner)
- [ ] Implement prayer times auto-refresh
- [ ] Add payment success/error handling
- [ ] Show real-time payment status updates
- [ ] Handle network errors gracefully

## Testing Requirements
- [ ] Prayer times display correctly for Colindale
- [ ] Iqamah times can be updated by admin
- [ ] Donation flow works end-to-end
- [ ] Payment webhook properly updates status
- [ ] No duplicate payment processing
- [ ] Map loads correctly with mosque location
- [ ] Mobile responsiveness across devices
- [ ] Cross-browser compatibility

## Content Guidelines (Shariah Compliance)
✅ Allowed:
- Prayer times with Hijri calendar
- Quranic quotes and Hadith
- Islamic geometric patterns
- Educational content
- Charity and Zakat information

❌ Not Allowed:
- Images of living beings in worship areas
- Music or musical instruments
- Mixed-gender imagery
- Interest-based fundraising
- Non-halal sponsorships

## Next Immediate Tasks
1. Implement AlAdhan API integration in backend
2. Create prayer times management endpoints
3. Set up Stripe payment integration
4. Create payment_transactions collection
5. Connect frontend to backend APIs
6. Test end-to-end payment flow
7. Deploy and verify live prayer times

## Success Metrics
- Prayer times accuracy: 100% match with official UK Islamic sources
- Donation conversion rate: Track percentage of visitors who donate
- Page load time: < 3 seconds
- Mobile usability: 90+ Google Mobile-Friendly score
- Uptime: 99%+ availability

---

## Updates (Feb 26, 2026 — Current Session)

### ✅ This Session
- **YouTube Recordings**: New `/youtube-recordings` page replaces Mixlr. Backend `GET /api/youtube/videos` and `GET /api/youtube/search?q=` use YouTube Data API v3 against `@markazrahma`. Confirmed live (returning 9+ videos).
- **Contact Form Google Sheets**: Admin Contact tab has UI inputs for `google_sheet_id`, `google_credentials_json` (textarea), and `email_recipient`. On submission, payload is appended to per-reason tabs in the configured Sheet (graceful failure if creds invalid).
- **Security fix**: `GET /api/contact/settings` (public) now returns ONLY `{reason_options}` — credentials are no longer leaked publicly. New `GET /api/admin/contact/settings` (auth) returns full settings for admin UI.
- **Routing fix**: Moved `app.include_router(api_router)` to the END of `server.py` so all routes (including new contact endpoints) register correctly. This was the root cause of multiple 404s.
- **Email notifications**: Skipped per user; `send_contact_notification()` is a logging stub.
- **Prayer Times**: Now fully CSV-driven (AlAdhan API removed earlier this session).
- **Hero Carousel**: Auto-scroll loop fixed, pause-on-hover added.

### Backend test results (iteration_3): 15/15 PASS, 100% frontend flows verified.

### 🔵 P1 / Backlog
- Wire up real email notifications (Resend / SendGrid / Gmail SMTP) when user provides API key.
- Verify domain in Resend if user wants emails sent from `noreply@markazrahma.org`.
- Move `YOUTUBE_API_KEY` from hardcoded `server.py` value to `backend/.env`.

### 🟢 P2 / Future
- Refactor `server.py` (~1530 lines) into routers (`routes/youtube.py`, `routes/contact.py`, `routes/donations.py`, `routes/admin.py`).
- Secure admin password reset endpoint.
- Delete the lingering test submission `TEST_PW User / Colindale` from the admin Contact tab.

---
*Last Updated: Feb 26, 2026*
*Status: Backend ✅ | Frontend ✅ | YouTube ✅ | Contact + Sheets ✅ | Fully Functional*
