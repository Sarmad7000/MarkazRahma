# YouTube Recordings Page Setup

You have two options for managing YouTube videos on your site:

## Option 1: Auto-Fetch from YouTube Channel/Playlist (Recommended)

**What you need:**
1. Your YouTube Channel URL or Playlist URL
2. YouTube Data API v3 Key (Free)

### How to get YouTube API Key:

**Step 1: Go to Google Cloud Console**
1. Visit: https://console.cloud.google.com/
2. Use the same project you created for Google Sheets (or create new)

**Step 2: Enable YouTube Data API v3**
1. In left sidebar: "APIs & Services" → "Library"
2. Search for: "YouTube Data API v3"
3. Click on it
4. Click "Enable"

**Step 3: Create API Key**
1. In left sidebar: "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key (looks like: `AIzaSyA...`)
4. (Optional but recommended) Click "Restrict Key":
   - Application restrictions: "HTTP referrers"
   - Add: `www.markazrahma.org/*` and `*.vercel.app/*`
   - API restrictions: Select "YouTube Data API v3"
   - Click "Save"

**Step 4: Find Your Channel/Playlist Info**

**If you have a YouTube Channel:**
1. Go to your YouTube channel
2. Copy the URL (looks like one of these):
   - `https://www.youtube.com/channel/UC...` (Channel ID)
   - `https://www.youtube.com/@YourChannelName` (Handle)
3. Send me the full URL

**If you have a Playlist:**
1. Go to your playlist
2. Click "Share"
3. Copy the URL (looks like: `https://www.youtube.com/playlist?list=PL...`)
4. Send me the playlist ID (the part after `list=`)

**What to send me:**
- YouTube API Key: `AIzaSyA_______________`
- Channel URL OR Playlist ID: `_______________`

**How it will work:**
- Page automatically fetches latest videos
- Updates every time page loads
- Videos appear in grid layout
- Click to play in embedded player

---

## Option 2: Manual Video Management (Simpler, No API Needed)

**What you need:**
- Nothing! Just video URLs

**How it works:**
1. I create a "YouTube Videos" tab in admin panel
2. You manually add YouTube video URLs
3. Videos appear on the YouTube Recordings page
4. You control exactly which videos show

**Pros:**
- No API key needed
- Full control over which videos appear
- Simpler setup

**Cons:**
- Need to manually add each video
- No auto-updates

---

## Which Option Do You Prefer?

**Tell me:**
1. **Option 1 (Auto-fetch)** - Send YouTube API Key + Channel/Playlist URL
2. **Option 2 (Manual)** - I'll create admin panel for you to add videos

**For Option 1, provide:**
```
YouTube API Key: AIzaSyA_______________
Channel URL or Playlist URL: _______________
```

**For Option 2:**
Just say "Manual" and I'll set it up!

---

## My Recommendation:
- If you regularly upload videos → Option 1 (Auto-fetch)
- If you only want to show specific videos → Option 2 (Manual)
- If unsure → Start with Option 2 (easy to switch later)
