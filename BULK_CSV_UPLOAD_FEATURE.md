# Bulk CSV Upload Feature for Iqamah Times

## Overview
This feature allows administrators to bulk-update Iqamah prayer times for an entire month by uploading a CSV file through the Admin Dashboard.

## Feature Details

### Backend Implementation
- **Endpoint**: `POST /api/admin/iqamah/bulk-update`
- **Authentication**: Requires admin JWT token
- **File**: `/app/backend/server.py` (lines 213-341)

### Frontend Implementation
- **Component**: `PrayerTimesTab.jsx`
- **Location**: `/app/frontend/src/components/admin/PrayerTimesTab.jsx`
- **API Function**: `bulkUpdateIqamahTimes()` in `/app/frontend/src/services/adminApi.js`

## CSV Format Requirements

### Required Columns
```csv
Date,Fajr_Iqama,Duhur_Iqama,Asr_Iqama,Magrib_Iqama,Isha_Iqama
```

**Note**: Both "Duhur_Iqama" and "Dhuhr_Iqama" spellings are accepted

### Format Specifications
- **Date Format**: YYYY-MM-DD (e.g., 2026-03-01)
- **Time Format**: HH:MM (e.g., 05:30, 13:00)
- **File Extension**: Must be .csv

### Example CSV
```csv
Date,Fajr_Iqama,Duhur_Iqama,Asr_Iqama,Magrib_Iqama,Isha_Iqama
2026-03-01,05:45,13:00,15:30,17:50,19:30
2026-03-02,05:30,13:00,15:30,17:55,19:30
2026-03-03,05:30,13:00,15:30,17:55,19:30
```

## Key Features

### 1. Comprehensive Validation
- **File Type**: Only .csv files accepted
- **Date Format**: Validates YYYY-MM-DD format
- **Time Format**: Validates HH:MM format for all prayers
- **Headers**: Validates all required columns are present
- **Spelling Flexibility**: Accepts both "Duhur" and "Dhuhr" spellings

### 2. Error Handling
- **Reject on Error**: If ANY row is invalid, the entire upload is rejected
- **No Partial Updates**: Ensures data consistency
- **Clear Error Messages**: Shows specific row number and issue

### 3. Automatic Jummah Time
- **Auto-Sync**: Jummah time automatically matches Dhuhr Iqamah time
- **Consistency**: Ensures Jummah is always aligned with weekday Dhuhr

### 4. User Experience
- **Confirmation Dialog**: Shows before upload with warning about overwriting
- **File Selection Preview**: Displays selected filename
- **Loading State**: Shows "Uploading..." during API call
- **Success/Error Toasts**: Clear feedback on upload result
- **Auto-Refresh**: Page reloads after successful upload to show new times

### 5. Mobile Responsive
- Full mobile support in the admin dashboard
- Touch-friendly file input
- Responsive dialog sizing

## API Response

### Success Response
```json
{
  "message": "Successfully updated 31 dates",
  "updated_count": 31,
  "dates_updated": ["2026-03-01", "2026-03-02", ...]
}
```

### Error Response Examples
```json
{
  "detail": "Invalid time format in row 3 for Fajr: INVALID. Expected HH:MM"
}
```

```json
{
  "detail": "Invalid date format in row 5: 03-01-2026. Expected YYYY-MM-DD"
}
```

```json
{
  "detail": "Missing required column: Asr_Iqama. Found: Date, Fajr_Iqama, ..."
}
```

## Testing

### Backend Testing (curl)
```bash
# Get API URL and login
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
TOKEN=$(curl -s -X POST "$API_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"MarkazRahma2026","password":"Bismillah20!"}' | \
  python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

# Upload CSV
curl -X POST "$API_URL/api/admin/iqamah/bulk-update" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/file.csv"
```

### Verification
```bash
# Check if times were updated (example for March 15)
curl -s "$API_URL/api/prayers/date?date=2026-03-15"
```

## Security
- **Authentication Required**: Only authenticated admins can upload
- **File Type Validation**: Strict CSV-only enforcement
- **Input Sanitization**: All dates and times validated before processing
- **Database Safety**: Uses upsert operations to prevent conflicts

## How It Works

1. **User uploads CSV** through admin dashboard
2. **Confirmation dialog** shows with warning
3. **Backend receives file** and validates format
4. **All rows validated** before any database updates
5. **If validation passes**, updates MongoDB for each date:
   - Fetches live Adhan times from AlAdhan API
   - Applies Iqamah times from CSV
   - Sets Jummah time to match Dhuhr
   - Updates/inserts document in `prayer_times` collection
6. **Returns summary** of updated dates
7. **Frontend refreshes** to show new times

## Database Impact
- **Collection**: `prayer_times`
- **Operation**: `update_one` with `upsert=True` for each date
- **Fields Updated**: `prayers`, `jummah`, `updated_at`
- **Adhan Times**: Always fetched live from AlAdhan API

## Future Enhancements
- Download template CSV button
- Preview CSV data before confirming
- Batch size limits for very large files
- Progress bar for uploads with many rows
- Ability to upload multiple months at once
