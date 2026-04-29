# Vercel Build Fix Guide

## Issue: npm install failed

**Problem:** Vercel was using npm but your project uses yarn.

---

## ✅ Fixes Applied

### 1. Added `vercel-build` Script
**File:** `/app/frontend/package.json`

```json
"scripts": {
  "vercel-build": "craco build"
}
```

### 2. Updated `vercel.json`
**File:** `/app/vercel.json`

Simplified configuration to properly handle monorepo structure.

### 3. Created `.vercelignore`
Excludes unnecessary files from deployment.

---

## 🔧 Required: Vercel Dashboard Settings

### **IMPORTANT: Set These in Vercel Dashboard**

Go to: **Project Settings** → **Environment Variables**

Add the following:

#### Production Variables:
```
MONGO_URL=your_mongodb_connection_string
DB_NAME=markaz_rahma
STRIPE_API_KEY=your_stripe_key
JWT_SECRET=your_jwt_secret_min_32_chars
REACT_APP_BACKEND_URL=https://your-project.vercel.app
```

**Note:** Replace `your-project.vercel.app` with your actual Vercel domain after first deployment.

---

## 📋 Deployment Steps

### Option 1: Quick Fix (Redeploy)

1. **Push these changes to GitHub:**
   ```bash
   git add .
   git commit -m "Fix Vercel build configuration"
   git push
   ```

2. **In Vercel Dashboard:**
   - Go to your project
   - Click "Deployments"
   - Click "Redeploy" on the latest deployment
   - Or it will auto-deploy from the push

---

### Option 2: Clean Deployment

1. **Delete the project from Vercel** (if errors persist)

2. **Re-import from GitHub:**
   - Go to vercel.com/new
   - Import your repository
   - **Framework Preset:** Other (or Create React App)
   - **Root Directory:** Leave as `./`
   - Let vercel.json handle the build

3. **Add Environment Variables** (from list above)

4. **Deploy**

---

## 🎯 What vercel.json Does Now

```json
{
  "builds": [
    {
      "src": "api/index.py",           // Python backend
      "use": "@vercel/python"
    },
    {
      "src": "frontend/package.json",  // React frontend
      "use": "@vercel/static-build",   // Uses yarn automatically
      "config": {
        "distDir": "build"              // Output directory
      }
    }
  ]
}
```

**Vercel will:**
1. Detect yarn.lock in `/frontend`
2. Run `yarn install` automatically
3. Run `yarn vercel-build` (which runs `craco build`)
4. Serve from `frontend/build/` directory

---

## ✅ Expected Build Output

```
Installing dependencies...
✓ Detected yarn
✓ Running "yarn install"
✓ Dependencies installed

Building...
✓ Running "yarn vercel-build"
✓ Build completed
✓ Static files ready in frontend/build

Deploying...
✓ Deployment successful
```

---

## 🚨 Common Issues & Fixes

### Issue: "npm install failed"
**Fix:** Make sure yarn.lock exists in `/frontend` ✅ (Already there)

### Issue: "vercel-build script not found"
**Fix:** Check package.json has `"vercel-build": "craco build"` ✅ (Added)

### Issue: "Environment variables not working"
**Fix:** Add them in Vercel Dashboard → Settings → Environment Variables

### Issue: "Backend API not working"
**Fix:** 
1. Check MongoDB URL is correct
2. Verify all environment variables are set
3. Check Vercel Functions logs

---

## 📊 Build Configuration Summary

| Setting | Value |
|---------|-------|
| Framework | Auto-detected (Create React App) |
| Package Manager | Yarn (auto-detected) |
| Build Command | `yarn vercel-build` |
| Output Directory | `frontend/build` |
| Root Directory | `./` (monorepo) |

---

## 🔐 Security Note

**Never commit these to Git:**
- ❌ `.env` files with real credentials
- ❌ API keys
- ❌ MongoDB connection strings

**Always use:**
- ✅ Vercel Environment Variables
- ✅ `.env.example` for documentation

---

## 📝 Next Steps After Successful Deployment

1. **Update Backend URL:**
   - Go to Vercel Dashboard → Environment Variables
   - Update `REACT_APP_BACKEND_URL` to your actual Vercel URL
   - Redeploy

2. **Test Everything:**
   - Homepage loads ✓
   - Prayer times display ✓
   - Donations work ✓
   - Admin login works ✓

3. **Monitor:**
   - Check Vercel Functions logs for API errors
   - Monitor deployment analytics

---

## 🆘 Still Having Issues?

### Check Build Logs:
1. Go to Vercel Dashboard
2. Click on failed deployment
3. View build logs
4. Look for specific error messages

### Common Error Messages:

**"Cannot find module"**
→ Missing dependency, run `cd frontend && yarn add <package-name>`

**"Build failed"**
→ Check frontend code for syntax errors

**"Function execution timeout"**
→ Backend issue, check MongoDB connection

---

## ✅ Files Modified

- ✅ `/app/frontend/package.json` - Added vercel-build script
- ✅ `/app/vercel.json` - Simplified build config
- ✅ `/app/.vercelignore` - Exclude unnecessary files

---

**After pushing these changes, your build should succeed!** 🚀
