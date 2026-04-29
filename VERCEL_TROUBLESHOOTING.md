# Vercel Deployment Troubleshooting Guide

## Current Issues
1. ❌ Image upload failing: "Failed to upload image"
2. ❌ Popup settings update failing: "Failed to update popup settings"

## Quick Diagnostic Steps

### Step 1: Check Vercel Logs
```bash
vercel logs --follow
```

Or in Vercel Dashboard:
- Go to your project
- Click "Deployments"
- Click on latest deployment
- Click "Functions" tab
- Look for errors in `/api` function

### Step 2: Verify Environment Variables

**Go to Vercel Dashboard → Settings → Environment Variables**

Required variables (check ALL are set):
```
MONGO_URL = mongodb+srv://username:password@cluster.mongodb.net/database
DB_NAME = test_database
JWT_SECRET = your-secret-key
```

**Common Issues:**
- ❌ MONGO_URL missing or incorrect
- ❌ DB_NAME doesn't match your MongoDB database
- ❌ JWT_SECRET not set

### Step 3: Test API Endpoints Directly

**Test if backend is running:**
```bash
curl https://your-site.vercel.app/api/
```
Should return: `{"message":"Markaz Al-Rahma API is running","status":"healthy"}`

**Test authentication:**
```bash
curl -X POST https://your-site.vercel.app/api/admin/token \
  -H "Content-Type: application/json" \
  -d '{"username":"MarkazRahma2026","password":"Bismillah20!"}'
```
Should return: `{"access_token":"...","token_type":"bearer",...}`

**If authentication fails:**
- Check MongoDB connection
- Verify admin user exists in database
- Check JWT_SECRET is set

### Step 4: Check MongoDB Atlas Network Access

**MongoDB Atlas Dashboard:**
1. Go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

This allows Vercel's serverless functions to connect.

### Step 5: Check Vercel Function Size Limits

The base64 image upload might exceed function size limits.

**Vercel Limits:**
- Request body: 4.5MB (Hobby), 100MB (Pro)
- Response body: 4.5MB (Hobby), 5MB (Pro)

**If image upload fails with large files:**
- Try smaller image (< 2MB)
- Compress image before upload
- Consider upgrading to Vercel Pro

## Common Error Messages & Solutions

### Error: "Failed to upload image"

**Possible causes:**
1. **File too large** → Compress image to < 2MB
2. **MongoDB connection failed** → Check MONGO_URL
3. **Authentication failed** → Check JWT_SECRET
4. **CORS issue** → Check backend allows `*` origins

**Debug:**
```bash
# Check Vercel function logs
vercel logs | grep "upload-image"
```

### Error: "Failed to update popup settings"

**Possible causes:**
1. **MongoDB connection failed** → Check MONGO_URL and DB_NAME
2. **Collection doesn't exist** → Manually create `popup_settings` collection
3. **Authentication failed** → Re-login to admin panel

**Fix:**
```javascript
// In MongoDB Shell or Compass:
use test_database
db.popup_settings.insertOne({
  "id": "default",
  "title": "Our Last Ramadan in Colindale",
  "description": "Help us reach our goal...",
  "citation": "Whoever builds a mosque...",
  "image_path": "https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/1w25b3eq_OUR%20LAST%20RAMADAN%20IN%20COLINDALE%20%282%29.png",
  "enabled": true,
  "updated_at": new Date()
})
```

### Error: "Network Error" or "CORS Error"

**Check backend CORS settings:**
```python
# In /app/backend/server.py
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # ← Should be "*"
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Step-by-Step Fix for Current Issues

### Fix 1: Verify MongoDB Connection

**Test MongoDB connection locally:**
```bash
mongosh "your-mongodb-connection-string"
use test_database
db.popup_settings.find()
```

If this works locally but fails on Vercel:
→ MongoDB Atlas Network Access needs to allow Vercel IPs

### Fix 2: Check Vercel Environment Variables

**Copy these to Vercel Dashboard:**
1. Go to Settings → Environment Variables
2. Add/Update:
   - `MONGO_URL` → Your full MongoDB connection string
   - `DB_NAME` → `test_database`
   - `JWT_SECRET` → Any secure random string

3. **Important:** Redeploy after adding variables!
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"

### Fix 3: Test with Smaller Image

**If image upload fails:**
1. Try uploading a very small image (< 500KB)
2. If that works → File size is the issue
3. If still fails → MongoDB or auth issue

## Manual Testing Checklist

- [ ] Vercel environment variables are set
- [ ] MongoDB Atlas allows connections from anywhere
- [ ] Admin can login successfully
- [ ] Other admin functions work (announcements, prayer times)
- [ ] Small image upload works
- [ ] Popup settings update works without image change

## Getting More Debug Info

**Add this to browser console on admin page:**
```javascript
// Check API endpoint
console.log('API URL:', localStorage.getItem('REACT_APP_BACKEND_URL'));

// Check auth token
console.log('Auth token:', localStorage.getItem('admin_token'));

// Test API connection
fetch('https://your-site.vercel.app/api/')
  .then(r => r.json())
  .then(d => console.log('API Status:', d))
  .catch(e => console.error('API Error:', e));
```

## Still Not Working?

**Share these details:**
1. Vercel function logs (from Dashboard or `vercel logs`)
2. Browser console errors (F12 → Console tab)
3. MongoDB Atlas network access settings
4. Environment variables (hide sensitive values)

## Quick Fixes to Try

1. **Clear browser cache and reload admin page**
2. **Re-login to admin panel**
3. **Try in incognito/private browser window**
4. **Redeploy on Vercel after checking env variables**
5. **Wait 2-3 minutes after deployment for functions to warm up**
