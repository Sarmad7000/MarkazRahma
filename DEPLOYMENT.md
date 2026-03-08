# Markaz Al-Rahma Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set root directory to `frontend`
5. Add environment variable:
   - `REACT_APP_BACKEND_URL`: Your Railway backend URL
6. Deploy!

#### Backend on Railway
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add MongoDB database (from Railway marketplace)
4. Deploy from GitHub
5. Set root directory to `backend`
6. Add environment variables:
   - `MONGO_URL`: (auto-filled by Railway MongoDB)
   - `DB_NAME`: markaz_rahma
   - `CORS_ORIGINS`: Your Vercel URL
   - `ADMIN_USERNAME`: MarkazRahma2026
   - `ADMIN_PASSWORD`: Bismillah20!
7. Deploy command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Option 2: Netlify (Frontend) + Heroku (Backend)

#### Frontend on Netlify
1. Push to GitHub
2. Go to [netlify.com](https://netlify.com)
3. New site from Git
4. Base directory: `frontend`
5. Build command: `yarn build`
6. Publish directory: `build`
7. Environment variables:
   - `REACT_APP_BACKEND_URL`: Your Heroku backend URL

#### Backend on Heroku
1. Install Heroku CLI
2. Create `Procfile` in backend folder:
   ```
   web: uvicorn server:app --host 0.0.0.0 --port $PORT
   ```
3. Deploy:
   ```bash
   heroku create markaz-rahma-api
   heroku addons:create mongolab:sandbox
   heroku config:set DB_NAME=markaz_rahma
   heroku config:set ADMIN_USERNAME=MarkazRahma2026
   heroku config:set ADMIN_PASSWORD=Bismillah20!
   git push heroku main
   ```

### Option 3: DigitalOcean App Platform

1. Create MongoDB cluster on DigitalOcean
2. Create new App
3. Add 2 components:
   - Frontend (React, `frontend` folder)
   - Backend (Python, `backend` folder)
4. Set environment variables for each
5. Deploy!

## Environment Variables Checklist

### Frontend
- ✅ `REACT_APP_BACKEND_URL`

### Backend
- ✅ `MONGO_URL`
- ✅ `DB_NAME`
- ✅ `CORS_ORIGINS`
- ✅ `ADMIN_USERNAME`
- ✅ `ADMIN_PASSWORD`
- ✅ `JWT_SECRET_KEY`
- ⚠️ `STRIPE_API_KEY` (optional if using Stripe)

## Post-Deployment Checklist

- [ ] Test prayer times are loading
- [ ] Test admin login
- [ ] Test donation button redirects to Square
- [ ] Test adding manual donations in admin
- [ ] Update Iqamah times
- [ ] Verify Ramadan popup appears
- [ ] Test contact buttons (email, Twitter)
- [ ] Check mobile responsiveness
- [ ] Update DNS if using custom domain
- [ ] Enable HTTPS
- [ ] Change admin password from default
- [ ] Update CORS to specific domain (not "*")

## Custom Domain Setup

### Vercel
1. Go to project settings
2. Add custom domain
3. Update DNS records as shown

### Netlify
1. Domain settings
2. Add custom domain
3. Configure DNS

## Backup Strategy

### MongoDB Backup
```bash
mongodump --uri="your_mongo_url" --out=./backup
```

### Restore
```bash
mongorestore --uri="your_mongo_url" ./backup
```

## Monitoring

Consider adding:
- Uptime monitoring: UptimeRobot
- Error tracking: Sentry
- Analytics: Google Analytics

## Support

If you need help deploying, contact: sarmadsimab@gmail.com
