# Render Deployment Guide for Markaz Al-Rahma

## 🚀 Quick Deploy to Render

### Option 1: One-Click Deploy (Recommended)

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Click "New +" → "Blueprint"
4. Connect your GitHub repository
5. Render will detect `render.yaml` and set everything up automatically!

### Option 2: Manual Setup

#### Step 1: Deploy Backend

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: markaz-rahma-api
   - **Region**: Oregon (or closest to you)
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

5. Add Environment Variables:
   ```
   MONGO_URL=mongodb+srv://your-connection-string
   DB_NAME=markaz_rahma
   CORS_ORIGINS=https://markaz-rahma.vercel.app
   ADMIN_USERNAME=MarkazRahma2026
   ADMIN_PASSWORD=Bismillah20!
   JWT_SECRET_KEY=your-secret-key-here
   ```

6. Click "Create Web Service"

#### Step 2: Deploy MongoDB

**Option A: Render MongoDB (Recommended)**
1. In Render dashboard, click "New +" → "PostgreSQL" (they also support MongoDB via Docker)
2. Or use MongoDB Atlas (free tier)

**Option B: MongoDB Atlas (Easiest)**
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Add to `MONGO_URL` in Render

#### Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework**: Create React App
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`
4. Environment Variable:
   - `REACT_APP_BACKEND_URL`: https://markaz-rahma-api.onrender.com
5. Deploy!

## 🔧 Environment Variables

### Backend (Render)
| Variable | Value | Required |
|----------|-------|----------|
| `MONGO_URL` | MongoDB connection string | ✅ Yes |
| `DB_NAME` | markaz_rahma | ✅ Yes |
| `CORS_ORIGINS` | Your Vercel URL | ✅ Yes |
| `ADMIN_USERNAME` | MarkazRahma2026 | ✅ Yes |
| `ADMIN_PASSWORD` | Your password | ✅ Yes |
| `JWT_SECRET_KEY` | Random secret | ✅ Yes |
| `STRIPE_API_KEY` | (Optional) | ❌ No |

### Frontend (Vercel)
| Variable | Value | Required |
|----------|-------|----------|
| `REACT_APP_BACKEND_URL` | https://markaz-rahma-api.onrender.com | ✅ Yes |

## 📊 Render Free Tier

**What you get:**
- ✅ 750 hours/month free
- ✅ Auto-deploy from GitHub
- ✅ Free SSL certificates
- ✅ Good for production use
- ⚠️ Spins down after 15 min inactivity (first request takes ~30 seconds)

**Pro Tip:** Upgrade to paid plan ($7/month) to prevent spin-down

## 🔄 Auto-Deploy Setup

1. In Render dashboard, go to your service
2. Settings → "Auto-Deploy"
3. Enable "Auto-Deploy from GitHub"
4. Every push to main branch auto-deploys!

## 🧪 Testing Your Deployment

After deployment, test these:

```bash
# Backend health check
curl https://markaz-rahma-api.onrender.com/api/

# Prayer times
curl https://markaz-rahma-api.onrender.com/api/prayers/today

# Donation goal
curl https://markaz-rahma-api.onrender.com/api/donations/goal
```

## 🐛 Troubleshooting

### Backend Won't Start
- Check logs in Render dashboard
- Verify Python version is 3.11
- Check all environment variables are set

### Frontend Can't Connect
- Verify `REACT_APP_BACKEND_URL` in Vercel
- Check CORS settings in backend
- Wait 30 seconds for Render to wake up (free tier)

### MongoDB Connection Issues
- Verify `MONGO_URL` is correct
- Check MongoDB Atlas whitelist (allow all IPs: 0.0.0.0/0)
- Ensure database user has read/write permissions

## 💰 Cost Breakdown

| Service | Free Tier | Paid Option |
|---------|-----------|-------------|
| **Render Backend** | 750 hrs/month | $7/month (always on) |
| **Vercel Frontend** | Unlimited | $20/month (pro features) |
| **MongoDB Atlas** | 512MB storage | $9/month (2GB) |
| **Total** | **FREE** | ~$16/month for production |

## 🎯 Production Checklist

- [ ] Change admin password from default
- [ ] Use strong JWT secret key
- [ ] Set specific CORS origins (not "*")
- [ ] Enable MongoDB authentication
- [ ] Add custom domain
- [ ] Enable HTTPS (automatic on Render/Vercel)
- [ ] Set up monitoring/alerts
- [ ] Configure backup strategy for MongoDB
- [ ] Test all features in production

## 📞 Support

Need help? Contact: sarmadsimab@gmail.com

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
