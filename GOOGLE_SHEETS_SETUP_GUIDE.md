# How to Get Google Service Account Credentials

## Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

## Step 2: Create a New Project (or use existing)
1. Click the project dropdown at the top
2. Click "New Project"
3. Name it: "Markaz Rahma Contact Forms"
4. Click "Create"
5. Wait for project creation (takes ~30 seconds)
6. Select your new project from the dropdown

## Step 3: Enable Google Sheets API
1. In the left sidebar, click "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on "Google Sheets API"
4. Click "Enable"
5. Wait for it to enable (~10 seconds)

## Step 4: Create Service Account
1. In the left sidebar, click "APIs & Services" → "Credentials"
2. Click "Create Credentials" at the top
3. Select "Service Account"
4. Fill in:
   - Service account name: `contact-form-service`
   - Service account ID: (auto-fills, leave it)
   - Description: `Service account for contact form submissions`
5. Click "Create and Continue"
6. For "Grant this service account access to project":
   - Role: Select "Editor" (or "Basic → Editor")
7. Click "Continue"
8. Skip the optional "Grant users access" step
9. Click "Done"

## Step 5: Create and Download JSON Key
1. You'll see your service account in the list
2. Click on the service account email (looks like: contact-form-service@project-name.iam.gserviceaccount.com)
3. Go to the "Keys" tab
4. Click "Add Key" → "Create new key"
5. Choose "JSON" format
6. Click "Create"
7. **A JSON file will download to your computer** - Keep this safe!

## Step 6: What's in the JSON file?
The downloaded file looks like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "contact-form-service@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

**IMPORTANT**: Copy the `client_email` value - you'll need this for Step 7!

## Step 7: Create Google Sheet and Share It
1. Go to: https://sheets.google.com/
2. Click "Blank" to create a new spreadsheet
3. Name it: "Contact Form Submissions"
4. Copy the Sheet ID from the URL:
   - URL looks like: `https://docs.google.com/spreadsheets/d/1ABC123xyz456_YOUR_SHEET_ID_HERE/edit`
   - The Sheet ID is the long string between `/d/` and `/edit`
   - Example: `1ABC123xyz456_YOUR_SHEET_ID_HERE`
5. **IMPORTANT - Share the sheet**:
   - Click "Share" button (top right)
   - Paste the `client_email` from Step 6 (the service account email)
   - Give it "Editor" access
   - Click "Send"

## Step 8: What to Send Me
**Send me:**
1. The entire contents of the downloaded JSON file (you can paste it here)
2. The Google Sheet ID (the long string from the URL)

**Security Note**: The JSON credentials will only be stored in your database, not in code or version control.

---

## Alternative: Just Give Me Access
If you prefer, you can:
1. Add my email to your Google Cloud project as owner
2. Share the Google Sheet with me
3. I'll set it up for you

Let me know which approach you prefer!
