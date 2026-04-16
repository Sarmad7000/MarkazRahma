# Prayer Times CSV Upload Guide

## Overview
Upload monthly prayer times (both Adhan and Iqamah) via CSV file through the Admin Dashboard.

## CSV Format

### Required Columns:
1. **Date** - Format: YYYY-MM-DD (e.g., 2026-05-01)
2. **Fajr_Adhan** - Format: HH:MM (e.g., 04:15)
3. **Fajr_Iqama** - Format: HH:MM (e.g., 04:30)
4. **Dhuhr_Adhan** or **Duhur_Adhan** - Format: HH:MM (both spellings accepted)
5. **Dhuhr_Iqama** or **Duhur_Iqama** - Format: HH:MM (both spellings accepted)
6. **Asr_Adhan** - Format: HH:MM
7. **Asr_Iqama** - Format: HH:MM
8. **Maghrib_Adhan** - Format: HH:MM
9. **Maghrib_Iqama** - Format: HH:MM
10. **Isha_Adhan** - Format: HH:MM
11. **Isha_Iqama** - Format: HH:MM

### Optional Columns:
12. **Sunrise** - Format: HH:MM (optional, defaults to "N/A")
13. **Sunset** - Format: HH:MM (optional, defaults to "N/A")

## Sample CSV Template

```csv
Date,Fajr_Adhan,Fajr_Iqama,Dhuhr_Adhan,Dhuhr_Iqama,Asr_Adhan,Asr_Iqama,Maghrib_Adhan,Maghrib_Iqama,Isha_Adhan,Isha_Iqama,Sunrise,Sunset
2026-05-01,04:19,04:34,13:01,13:16,16:49,17:04,20:00,20:05,21:44,21:59,05:55,20:00
2026-05-02,04:17,04:32,13:01,13:16,16:50,17:05,20:01,20:06,21:45,22:00,05:53,20:01
2026-05-03,04:15,04:30,13:01,13:16,16:51,17:06,20:02,20:07,21:47,22:02,05:51,20:02
```

## How to Upload

1. **Login to Admin Dashboard**
   - URL: `https://www.markazrahma.org/admin/login`
   - Enter admin credentials

2. **Navigate to Prayer Times Tab**
   - Click on "Prayer Times" tab in the admin panel

3. **Upload CSV File**
   - Click "Choose File" or "Upload CSV"
   - Select your prepared CSV file
   - Click "Upload" or "Submit"

4. **Verify Upload**
   - Check the success message
   - Refresh the main website to see updated prayer times

## Important Notes

✅ **Jummah Time**: Automatically set to match Dhuhr Iqamah time

✅ **Spelling Variants**: Accepts both "Dhuhr" and "Duhur" spellings

✅ **Bulk Upload**: Can upload an entire month's (or more) worth of prayer times at once

✅ **Updates**: Uploading a CSV with existing dates will overwrite those dates

⚠️ **Time Format**: Must be in 24-hour format (HH:MM), e.g., 13:00 not 1:00 PM

⚠️ **Date Format**: Must be YYYY-MM-DD, e.g., 2026-05-01 not 05/01/2026

## Example Monthly Upload

For May 2026, create a CSV with 31 rows (one for each day):

```csv
Date,Fajr_Adhan,Fajr_Iqama,Dhuhr_Adhan,Dhuhr_Iqama,Asr_Adhan,Asr_Iqama,Maghrib_Adhan,Maghrib_Iqama,Isha_Adhan,Isha_Iqama,Sunrise,Sunset
2026-05-01,04:19,04:34,13:01,13:16,16:49,17:04,20:00,20:05,21:44,21:59,05:55,20:00
2026-05-02,04:17,04:32,13:01,13:16,16:50,17:05,20:01,20:06,21:45,22:00,05:53,20:01
... (continue for all 31 days)
2026-05-31,03:45,04:00,13:02,13:17,17:05,17:20,20:25,20:30,22:15,22:30,05:10,20:25
```

## Troubleshooting

**Error: "Invalid date format"**
- Ensure dates are in YYYY-MM-DD format
- Check for extra spaces or special characters

**Error: "Invalid time format"**
- Ensure times are in HH:MM 24-hour format
- Times must have leading zeros (e.g., 04:30, not 4:30)

**Error: "Missing required column"**
- Verify all required columns are present
- Check column names match exactly (case-sensitive)

**Prayer times not showing**
- Clear browser cache (Ctrl+Shift+R)
- Check that dates include today's date
- Verify CSV was uploaded successfully

## API Endpoint

**POST** `/api/admin/prayer-times/bulk-update`
- Requires admin authentication
- Content-Type: multipart/form-data
- Field name: `file`
- File type: `.csv`

---

**Last Updated**: April 16, 2026  
**Feature**: CSV-based Prayer Times Management  
**Status**: ✅ Active (AlAdhan API removed)
