# Vercel Deployment Fix for Timetable & Events Pages

## Issue
The /timetable and /events pages were not loading on Vercel deployment, returning 404 errors.

## Root Cause
Client-side routing in React requires proper configuration to ensure that Vercel serves index.html for all non-API routes, allowing React Router to handle the routing on the client side.

## Solution Applied

### 1. Updated Root vercel.json
Added explicit route handlers for /timetable and /events pages:

```json
{
  "src": "/timetable",
  "dest": "/frontend/build/index.html"
},
{
  "src": "/events",
  "dest": "/frontend/build/index.html"
},
{
  "src": "/admin/(.*)",
  "dest": "/frontend/build/index.html"
}
```

### 2. Created _redirects File
Created `/app/frontend/public/_redirects` to handle client-side routing:

```
# Redirect all non-API routes to index.html for client-side routing
/api/*  /api/:splat  200
/*      /index.html  200
```

### 3. Created Frontend vercel.json
Created `/app/frontend/vercel.json` for additional routing configuration:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Files Modified/Created
1. `/app/vercel.json` - Updated with explicit route handlers
2. `/app/frontend/public/_redirects` - Created for client-side routing
3. `/app/frontend/vercel.json` - Created for additional routing config

## Deployment Steps
After these changes, you need to redeploy to Vercel:

1. **Commit changes to Git:**
   ```bash
   git add .
   git commit -m "Fix: Add routing configuration for Timetable and Events pages"
   git push
   ```

2. **Vercel will automatically redeploy** (if auto-deploy is enabled)
   OR
   **Manually trigger deployment:**
   - Go to Vercel dashboard
   - Click on your project
   - Click "Redeploy" on the latest deployment

3. **Clear Vercel cache (if needed):**
   - In Vercel dashboard, go to Settings → General
   - Scroll to "Clear Build Cache"
   - Click "Clear Build Cache and Redeploy"

## Verification
After deployment, test these URLs:
- `https://your-domain.vercel.app/` - Homepage (should work)
- `https://your-domain.vercel.app/timetable` - Timetable page (should now work)
- `https://your-domain.vercel.app/events` - Events page (should now work)
- `https://your-domain.vercel.app/admin/login` - Admin login (should work)

## How It Works
1. When a user visits `/timetable` or `/events`, Vercel matches the route in vercel.json
2. Instead of returning 404, Vercel serves `/frontend/build/index.html`
3. React Router loads and matches the route to the appropriate component
4. The Timetable or Events page renders correctly

## Additional Notes
- All API routes starting with `/api/` are still handled by the Python backend
- Static assets (CSS, JS, images) are served from `/static/` directory
- The catch-all route `/(.*)` ensures any unknown routes also serve index.html
- This is standard SPA (Single Page Application) deployment configuration

## Troubleshooting
If pages still don't load after deployment:

1. **Check build logs** in Vercel dashboard for any errors
2. **Verify environment variables** are set correctly in Vercel
3. **Clear browser cache** and try in incognito mode
4. **Check Vercel Functions logs** for any runtime errors
5. **Verify the build output** contains all necessary files in `frontend/build/`

## Environment Variables (if not set)
Make sure these are set in Vercel dashboard:
- `REACT_APP_BACKEND_URL` - Your Vercel app URL (e.g., https://your-app.vercel.app)
- Any other API keys or configuration needed
