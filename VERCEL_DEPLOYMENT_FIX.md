# Vercel Deployment Fix - Hero Carousel Blank Issue

## Problem
The hero carousel appears blank on Vercel production because the frontend was hardcoded to call the preview environment backend URL instead of the production backend.

## Root Cause
1. **Hardcoded Preview URL**: The `.env` file contained `REACT_APP_BACKEND_URL=https://markaz-rahma-1.preview.emergentagent.com`
2. **React Build Process**: Environment variables are baked into the JavaScript bundle at build time
3. **Wrong API Calls**: Production frontend was calling preview backend, causing CORS errors or 404s
4. **Silent Failure**: The carousel component didn't handle API errors, resulting in a blank screen

## What Was Fixed

### 1. Environment Variable Configuration
- **Local Development**: Set to `http://localhost:8001` for local testing
- **Production**: Should be set to empty string `""` or relative URL in Vercel

### 2. Added Error Handling
- The `HeroCarousel` component now checks for API errors
- Shows user-friendly error message if data fails to load
- Prevents blank screen by adding fallback for array bounds

### 3. Updated API Configuration
- Added fallback for empty `REACT_APP_BACKEND_URL`
- Supports relative URLs for same-domain deployment

## Deployment Steps for Vercel

### Option 1: Use Relative URLs (Recommended for Vercel)

**Step 1: Set Environment Variable in Vercel Dashboard**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `REACT_APP_BACKEND_URL`
   - **Value**: `` (leave empty for same-domain deployment)
   - **Environment**: Select "Production" (and optionally "Preview" and "Development")
4. Click **Save**

**Step 2: Redeploy**
1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Option 2: Use Your Production Domain

If your backend is on a different domain than frontend:

**Step 1: Set Environment Variable in Vercel Dashboard**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `REACT_APP_BACKEND_URL`
   - **Value**: `https://your-production-backend-domain.com` (replace with actual domain)
   - **Environment**: Select "Production"
4. Click **Save**

**Step 2: Redeploy**
Same as Option 1, Step 2.

## Verification

After deployment, verify the fix:

### 1. Check the Live Site
- Visit your production URL
- The hero carousel should load and display cards
- Auto-scroll should work seamlessly

### 2. Check Browser Console (Optional)
- Press F12 to open Developer Tools
- Go to **Console** tab
- Should see no CORS errors or 404s
- Go to **Network** tab
- Look for successful API calls to:
  - `/api/hero/cards` (Status: 200 OK)
  - `/api/hero/settings` (Status: 200 OK)

### 3. Test API Endpoints Directly
```bash
# Replace with your production domain
curl https://your-domain.vercel.app/api/hero/cards
curl https://your-domain.vercel.app/api/hero/settings
```

Both should return JSON data with status 200.

## Files Modified

1. `/app/frontend/.env` - Updated to use `http://localhost:8001` for local dev
2. `/app/frontend/src/services/api.js` - Added fallback for empty BACKEND_URL
3. `/app/frontend/src/components/sections/HeroCarousel.jsx` - Added error handling and array bounds protection

## Important Notes

⚠️ **DO NOT** hardcode preview or production URLs in the `.env` file that gets committed to Git.

✅ **DO** set environment variables through the Vercel dashboard for each environment.

✅ **DO** use relative URLs (`""`) when frontend and backend are deployed to the same domain.

## Common Issues

### Issue: Carousel still blank after redeployment
**Solution**: 
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh the page (Ctrl+Shift+R)
- Check that environment variable was set for "Production" environment

### Issue: CORS errors in console
**Solution**:
- Verify `REACT_APP_BACKEND_URL` is set correctly
- If using different domains, ensure backend has CORS configured for frontend domain

### Issue: 404 errors for API calls
**Solution**:
- Verify `/api/hero/cards` endpoint exists and works
- Check `vercel.json` routing configuration
- Ensure backend is deployed and running

## Contact

If issues persist after following these steps, check:
1. Vercel deployment logs for errors
2. Browser console for specific error messages
3. Network tab for failed API requests

---

**Last Updated**: April 16, 2026
**Issue**: Hero Carousel blank on Vercel production
**Status**: ✅ FIXED
