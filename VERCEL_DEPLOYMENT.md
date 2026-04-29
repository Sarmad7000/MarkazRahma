# Vercel Deployment Guide

## Overview

This project now supports **BOTH** deployment options:

1. **✨ Vercel (Full-stack)** - Frontend + Backend on Vercel (Serverless)
2. **🔧 Render + Vercel (Hybrid)** - Backend on Render, Frontend on Vercel

---

## Option 1: Full Vercel Deployment (New!)

### Why Choose Vercel Full-Stack?
- ✅ Single platform deployment (easier management)
- ✅ Automatic HTTPS and CDN
- ✅ Zero configuration deployment
- ✅ Git-based workflow
- ⚠️ Serverless (1-2s cold start on first request)

### Prerequisites
- Vercel account ([vercel.com](https://vercel.com))
- GitHub repository
- MongoDB Atlas database

### Step 1: Prepare Environment Variables

Add these in **Vercel Dashboard → Settings → Environment Variables**:

```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=markaz_rahma
STRIPE_API_KEY=sk_test_your_stripe_key
JWT_SECRET=your-secret-jwt-key-min-32-chars
```

### Step 2: Deploy

#### Method A: Vercel Dashboard (Easiest)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push
   ```

2. **Import on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Click "Import"

3. **Configure (Auto-detected)**
   - Framework: Detects automatically
   - Root Directory: `./` (default)
   - Build settings: Auto-configured via `vercel.json`

4. **Add Environment Variables**
   - In deployment config, add all variables above
   - Make sure to add them for Production, Preview, and Development

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your site will be live at `https://your-project.vercel.app`

#### Method B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (first time)
vercel

# Add environment variables interactively
vercel env add MONGO_URL
vercel env add DB_NAME
vercel env add STRIPE_API_KEY
vercel env add JWT_SECRET

# Deploy to production
vercel --prod
```

### Step 3: Update Backend URL

After deployment, update `REACT_APP_BACKEND_URL`:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update `REACT_APP_BACKEND_URL` to your Vercel URL
3. Redeploy

### Step 4: Test

Test these endpoints:
- Homepage: `https://your-project.vercel.app`
- API Health: `https://your-project.vercel.app/api/`
- Prayer Times: `https://your-project.vercel.app/api/prayers/today`
- Admin: `https://your-project.vercel.app/admin/login`

---

## Option 2: Render + Vercel Deployment (Original)

### Why Choose Render + Vercel?
- ✅ Always-on backend (no cold starts)
- ✅ Better for background jobs
- ✅ Separate backend/frontend scaling
- ⚠️ Requires managing two platforms

### Backend on Render

See `RENDER.md` for full instructions.

**Quick Summary:**
1. Push to GitHub
2. Connect Render to your repository
3. Use `render.yaml` configuration
4. Add environment variables
5. Deploy

### Frontend on Vercel

1. **Set Root Directory**
   - In Vercel: Settings → General → Root Directory: `frontend`

2. **Update Backend URL**
   ```bash
   # In frontend/.env
   REACT_APP_BACKEND_URL=https://your-backend.onrender.com
   ```

3. **Deploy**

---

## File Structure

```
/app
├── api/                       # NEW: Vercel serverless backend
│   ├── index.py              # Entry point for Vercel
│   └── requirements.txt      # Python dependencies
├── backend/                   # Original backend (works for both)
│   ├── server.py             # FastAPI app
│   ├── models.py
│   ├── auth.py
│   ├── services/
│   └── .env
├── frontend/                  # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── vercel.json               # NEW: Vercel configuration
└── render.yaml               # Original: Render configuration
```

---

## How It Works

### Vercel Deployment

1. **Frontend Build**
   - Vercel runs `yarn install && yarn build` in `/frontend`
   - Serves static files from `/frontend/build`

2. **Backend (Serverless)**
   - `/api/index.py` imports the FastAPI app from `/backend/server.py`
   - Runs as serverless function
   - All `/api/*` requests routed to Python backend

3. **Routing (via vercel.json)**
   - `/api/*` → Python backend
   - `/*` → React frontend

---

## Comparison: Vercel vs Render

| Feature | Vercel (Full) | Render + Vercel |
|---------|---------------|-----------------|
| **Setup** | ⭐⭐⭐⭐⭐ Easiest | ⭐⭐⭐ Moderate |
| **Cold Starts** | ⚠️ Yes (1-2s) | ✅ No |
| **Cost (Free)** | 100GB-hrs | 750hrs/month |
| **Backend Type** | Serverless | Always-on |
| **Management** | Single platform | Two platforms |
| **Best For** | Small-medium traffic | Constant traffic |

---

## Troubleshooting

### 500 Error on API Calls

**Check:**
1. Environment variables are set correctly in Vercel
2. MongoDB URL is accessible from Vercel
3. Check logs: `vercel logs` or Vercel dashboard

### Frontend Shows Blank Page

**Check:**
1. Build succeeded (check Vercel dashboard)
2. `REACT_APP_BACKEND_URL` is correct
3. Check browser console for errors

### Prayer Times Not Loading

**Check:**
1. API endpoint works: `https://your-site.vercel.app/api/prayers/today`
2. CORS is enabled (already configured)
3. MongoDB connection is active

### Cold Start Delays

**This is normal for Vercel serverless functions.**
- First request after inactivity: 1-2 seconds
- Subsequent requests: <100ms
- Solution: Use Render for always-on backend

---

## Environment Variables Reference

### Required for Vercel

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb+srv://...` |
| `DB_NAME` | Database name | `markaz_rahma` |
| `STRIPE_API_KEY` | Stripe API key | `sk_test_...` |
| `JWT_SECRET` | Secret for admin auth | Min 32 chars |
| `REACT_APP_BACKEND_URL` | Backend URL | `https://your-project.vercel.app` |

### How to Add in Vercel

1. Dashboard → Your Project → Settings → Environment Variables
2. Add each variable
3. Select: Production, Preview, Development
4. Save
5. Redeploy if already deployed

---

## Deployment Checklist

### Before Deploying

- [ ] MongoDB database is set up
- [ ] Environment variables are ready
- [ ] Code is pushed to GitHub
- [ ] Vercel account created

### After Deploying

- [ ] Test homepage loads
- [ ] Test prayer times display
- [ ] Test donation tracking
- [ ] Test admin login
- [ ] Verify all sections work

---

## Getting Help

- **Vercel Issues**: [vercel.com/docs](https://vercel.com/docs)
- **Render Issues**: See `RENDER.md`
- **Project Setup**: See `README.md` and `DEPLOYMENT.md`

---

## Recommended Setup

**For Most Users:**
→ Use **Vercel Full-Stack** (Option 1)
- Simplest deployment
- Good for mosque websites (moderate traffic)
- Free tier is generous

**For High Traffic:**
→ Use **Render + Vercel** (Option 2)
- No cold starts
- Always responsive
- Better for 24/7 availability
