# URGENT: Vercel 404 Fix for Timetable & Events Pages

## Problem
Pages `/timetable` and `/events` return 404 on Vercel deployment even after routing configuration.

## Root Cause
Vercel's build process may not be properly configured for React Router's client-side routing, or the configuration isn't being applied correctly.

## Solution Applied (Multiple Layers)

### 1. Updated Root vercel.json
Changed from "routes" only to "rewrites" + "routes" with filesystem handler:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.py"
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/build/index.html"
    }
  ]
}
```

The `"handle": "filesystem"` is crucial - it tells Vercel to check for actual files first before applying the catch-all route.

### 2. Created 404.html Fallback
Created `/app/frontend/public/404.html` that redirects to index.html with session storage:

```html
<script>
    sessionStorage.setItem('redirectPath', window.location.pathname);
    window.location.href = '/';
</script>
```

### 3. Updated App.js with RedirectHandler
Added a component to handle redirects from 404.html:

```javascript
function RedirectHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath');
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);
  return null;
}
```

### 4. Simplified _redirects File
```
/api/*  200
/*      /index.html  200
```

### 5. Updated Frontend vercel.json
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/:path*", "destination": "/index.html" }
  ]
}
```

## Files Modified
1. `/app/vercel.json` - Added rewrites and filesystem handler
2. `/app/frontend/vercel.json` - Updated rewrites pattern
3. `/app/frontend/public/_redirects` - Simplified
4. `/app/frontend/public/404.html` - **NEW** - Fallback redirect
5. `/app/frontend/src/App.js` - Added RedirectHandler component

## Deployment Instructions

### Step 1: Push Changes
```bash
git add .
git commit -m "Fix: Multiple layers for Vercel routing - 404.html fallback + rewrites"
git push
```

### Step 2: Clear Vercel Cache (IMPORTANT!)
1. Go to https://vercel.com/dashboard
2. Select your project "markaz-rahma" or similar
3. Go to **Settings** → **General**
4. Scroll down to **Build & Development Settings**
5. Click **"Clear Build Cache"**
6. Then click **"Redeploy"**

### Step 3: Verify Build Output
After deployment:
1. Check the deployment logs in Vercel dashboard
2. Look for successful build of `frontend/build` directory
3. Verify that `404.html` is in the build output

### Step 4: Test URLs
After deployment completes, test:
- https://markazrahma.org/ (should work)
- https://markazrahma.org/timetable (should work now)
- https://markazrahma.org/events (should work now)
- https://markazrahma.org/admin/login (should work)

Try in:
- Regular browser
- Incognito/Private mode
- Different browsers

## How It Works Now

### Scenario 1: Direct Navigation (e.g., typing URL)
1. User goes to `markazrahma.org/timetable`
2. Vercel checks filesystem (no `/timetable` file exists)
3. Vercel serves `404.html` (fallback)
4. 404.html saves path to sessionStorage and redirects to `/`
5. App.js RedirectHandler reads sessionStorage
6. React Router navigates to `/timetable`
7. Timetable component renders

### Scenario 2: Internal Navigation (clicking links)
1. User clicks "Prayer Timetable" link
2. React Router handles navigation
3. No server request needed
4. Timetable component renders immediately

## Troubleshooting

### If Still Getting 404:

1. **Check Build Output**
   - In Vercel dashboard, go to the deployment
   - Click on "Source" or "Output"
   - Verify `404.html` exists in `frontend/build/`

2. **Check Environment Variables**
   - Go to Settings → Environment Variables
   - Ensure `REACT_APP_BACKEND_URL` is set correctly
   - Should be your Vercel deployment URL

3. **Force Hard Refresh**
   - Clear browser cache completely
   - Or use: Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)
   - Select "Cached images and files"

4. **Check Vercel Logs**
   - Go to deployment → Functions tab
   - Check for any routing errors
   - Look at the request logs

5. **Try Different Browser**
   - Sometimes Chrome caches aggressively
   - Try Firefox or Safari

6. **Check Build Command**
   - Verify in `package.json`: `"vercel-build": "cd frontend && yarn install && yarn build"`
   - This should be automatically used by Vercel

### If 404.html Isn't Being Created:

Check `frontend/public/` directory contains:
- `index.html`
- `404.html` (should be created now)
- `_redirects`
- `favicon.ico`

These files should copy to `frontend/build/` during build.

## Alternative: Manual Test Locally

To test if the build works:

```bash
cd /app/frontend
yarn build
cd build
# Check if 404.html exists
ls -la

# Serve locally to test
npx serve -s . -p 3000
```

Then try:
- http://localhost:3000/
- http://localhost:3000/timetable
- http://localhost:3000/events

## Contact Vercel Support (If All Else Fails)

If none of the above works:

1. Go to Vercel dashboard
2. Click the chat icon (bottom right)
3. Explain: "SPA routes returning 404 despite vercel.json configuration"
4. Share: Your project name and deployment URL
5. Mention: "Using React Router with /timetable and /events routes"

They can check server-side routing configuration.

## Important Notes

- Changes require **redeployment** to Vercel
- Must **clear build cache** in Vercel for config changes to apply
- Browser cache can cause false negatives - always test in incognito
- The 404.html approach is a fallback - the rewrites should work first
- All three layers (rewrites, 404.html, RedirectHandler) work together

## Success Indicators

After deployment, you should see:
- ✅ No 404 errors on /timetable and /events
- ✅ Direct navigation works (typing URL in address bar)
- ✅ Internal navigation works (clicking links)
- ✅ Browser back/forward buttons work
- ✅ Refresh on any page works
