# Markaz Al-Rahma - Mosque Website

A modern, responsive website for Markaz Al-Rahma mosque in Colindale, London. Features real-time prayer times, donation tracking, and admin management.

## Features

- 🕌 **Live Prayer Times** - Automatic prayer times with manual Iqamah updates
- 💰 **Donation Tracking** - Manual donation entry and progress tracking
- 📱 **Responsive Design** - Works on all devices
- 🔐 **Admin Dashboard** - Secure admin panel for managing content
- ⚡ **SWR Caching** - Fast, reliable prayer times with smart caching
- 🎨 **Modern UI** - Clean cyan, black, and white design

## Tech Stack

- **Frontend**: React, Tailwind CSS, shadcn/ui, SWR
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Deployment**: Vercel or Render

## Project Structure

```
/app
├── api/                    # Vercel serverless entry point
│   ├── index.py           # Backend entry for Vercel
│   └── requirements.txt
├── backend/               # Main backend code
│   ├── server.py         # FastAPI app
│   ├── models.py         # Data models
│   ├── auth.py          # Authentication
│   └── services/        # Business logic
├── frontend/             # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   │   ├── admin/  # Admin-specific components
│   │   │   ├── sections/ # Homepage sections
│   │   │   └── ui/     # shadcn components
│   │   ├── pages/      # Main pages
│   │   └── services/   # API services
│   └── public/
├── vercel.json          # Vercel configuration
└── render.yaml          # Render configuration
```

## Deployment Options

### Option 1: Vercel (Full-Stack) ⭐ Recommended
Deploy both frontend and backend on Vercel (serverless).

**Pros:**
- Single platform
- Easiest setup
- Automatic HTTPS & CDN
- Free tier: 100GB-hrs

**See**: `VERCEL_DEPLOYMENT.md`

### Option 2: Render + Vercel (Hybrid)
Backend on Render, Frontend on Vercel.

**Pros:**
- Always-on backend (no cold starts)
- Better for 24/7 availability

**See**: `RENDER.md` and `DEPLOYMENT.md`

## Quick Start

### Local Development

1. **Clone and Install**
   ```bash
   cd /app/backend
   pip install -r requirements.txt

   cd /app/frontend
   yarn install
   ```

2. **Set Up Environment Variables**
   ```bash
   # backend/.env
   MONGO_URL=mongodb://localhost:27017/
   DB_NAME=markaz_rahma
   JWT_SECRET=your-secret-key
   STRIPE_API_KEY=sk_test_key

   # frontend/.env
   REACT_APP_BACKEND_URL=http://localhost:8001
   ```

3. **Run**
   ```bash
   # Backend
   cd /app/backend
   uvicorn server:app --reload --port 8001

   # Frontend (new terminal)
   cd /app/frontend
   yarn start
   ```

4. **Access**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8001/api/
   - Admin: http://localhost:3000/admin/login

## Admin Access

**Default Credentials:**
- Username: `MarkazRahma2026`
- Password: `Bismillah20!`

⚠️ **Change these in production!**

## Environment Variables

### Backend
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `JWT_SECRET` - Secret for JWT tokens
- `STRIPE_API_KEY` - Stripe API key (optional)

### Frontend
- `REACT_APP_BACKEND_URL` - Backend API URL

## Key Features

### Prayer Times
- Fetches from AlAdhan API
- SWR caching for instant loads
- Manual Iqamah time updates via admin
- Automatic "Next Prayer" highlighting

### Donations
- External Square checkout integration
- Manual donation tracking (Cash/Bank)
- Progress bar visualization
- Admin-only donation entry

### Admin Dashboard
- Prayer time management
- Donation tracking
- Goal settings
- Secure authentication

## Documentation

- `VERCEL_DEPLOYMENT.md` - Vercel deployment guide
- `RENDER.md` - Render deployment guide
- `DEPLOYMENT.md` - General deployment info
- `REFACTORING_SUMMARY.md` - Code structure improvements
- `SWR_VERIFICATION_REPORT.md` - SWR implementation details

## Support

For deployment issues:
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Render**: [render.com/docs](https://render.com/docs)

## License

Built for Markaz Al-Rahma, Colindale, London.
