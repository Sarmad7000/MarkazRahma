# Vercel Deployment Fix - Base64 Image Storage

## Problem
Vercel's serverless functions have a read-only filesystem, so file uploads fail.

## Solution Implemented
Images are now stored as **base64-encoded data URLs** directly in MongoDB.

## Changes Made

### Backend (`/app/backend/server.py`)
- Updated `/api/admin/upload-image` endpoint
- Now converts uploaded files to base64
- Returns data URL format: `data:image/png;base64,iVBORw0K...`
- Validates file size (max 5MB)
- No filesystem writes required

### How It Works

1. **Admin uploads image** in the popup settings
2. **Backend receives file** → converts to base64
3. **Returns data URL** (e.g., `data:image/png;base64,...`)
4. **Frontend stores** this URL in popup_settings
5. **Browser displays** image directly from data URL

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Fixed image upload for Vercel - using base64 storage"
git push origin main
```

### 2. Vercel Environment Variables
Ensure these are set in Vercel dashboard:
- `MONGO_URL` - Your MongoDB connection string
- `DB_NAME` - Database name (test_database)
- `JWT_SECRET` - Your JWT secret key

### 3. Redeploy
Vercel will auto-deploy on push, or manually trigger deployment.

## Testing After Deployment

1. **Go to admin panel**: `https://your-site.vercel.app/admin/login`
2. **Login** with credentials
3. **Navigate to "Popup Settings" tab**
4. **Upload an image** (max 5MB, PNG/JPG/WebP)
5. **Save settings**
6. **Refresh homepage** - popup should show new image

## Troubleshooting

### If announcements still fail:
Check Vercel logs for MongoDB connection errors:
```bash
vercel logs
```

### If image upload fails:
- Check file size (must be < 5MB)
- Check file type (PNG, JPG, WebP only)
- Check Vercel function logs for errors

### Database Connection Issues:
- Verify MONGO_URL is set correctly in Vercel
- Check MongoDB Atlas allows Vercel IPs (set to "Allow from Anywhere" for testing)

## Advantages of Base64 Storage

✅ Works on Vercel serverless (no filesystem needed)
✅ No external services required
✅ Simple implementation
✅ Fast for small images
✅ Image stored with settings in MongoDB

## Limitations

⚠️ File size limit: 5MB (to keep MongoDB documents manageable)
⚠️ Slightly slower for very large images
⚠️ Better suited for single popup image than galleries

## Alternative Solutions (Future)

If base64 becomes problematic:
- **Cloudinary**: Free tier with 25GB storage
- **Vercel Blob**: Paid service from Vercel
- **AWS S3**: Industry standard cloud storage
