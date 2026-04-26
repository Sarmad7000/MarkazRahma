from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import uuid
import csv
import io
import httpx

from models import (
    PrayerTimes, UpdateIqamahRequest, UpdateJummahRequest, Prayer, JummahTime,
    DonationRequest, DonationResponse,
    PaymentTransaction, CheckoutStatusResponse, DonationGoal, DonationGoalResponse,
    UpdateDonationGoalRequest, AdminLoginRequest, AdminLoginResponse, DonationHistoryItem,
    AddOfflineDonationRequest, PopupSettings, UpdatePopupSettingsRequest,
    Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest, SiteSettings,
    TimetableSettings, UpdateTimetableRequest, Event, CreateEventRequest, UpdateEventRequest,
    HeroCard, CreateHeroCardRequest, UpdateHeroCardRequest, HeroSettings, UpdateHeroSettingsRequest,
    ContactFormSettings, UpdateContactFormSettingsRequest, ContactSubmission,
    CreateContactSubmissionRequest, UpdateContactSubmissionRequest
)
from auth import authenticate_admin, create_access_token, get_current_user

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app without a prefix
app = FastAPI(title="Markaz Al-Rahma API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Health check
@api_router.get("/")
async def root():
    return {"message": "Markaz Al-Rahma API is running", "status": "healthy"}

# ============== PRAYER TIMES ENDPOINTS ==============

@api_router.get("/prayers/today", response_model=PrayerTimes)
async def get_todays_prayer_times():
    """Get today's prayer times from database"""
    try:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # Fetch from database
        stored_times = await db.prayer_times.find_one({"date": today}, {"_id": 0})
        
        if not stored_times:
            raise HTTPException(
                status_code=404, 
                detail=f"Prayer times not found for {today}. Please upload prayer times via admin panel."
            )
        
        logger.info(f"Retrieved prayer times for {today}")
        return PrayerTimes(**stored_times)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prayer times: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch prayer times")

@api_router.get("/prayers/date", response_model=PrayerTimes)
async def get_prayer_times_by_date(date: str):
    """
    Get prayer times for a specific date from database
    Query param: date in YYYY-MM-DD format
    """
    try:
        # Validate date format
        datetime.strptime(date, "%Y-%m-%d")
        
        # Fetch from database
        stored_times = await db.prayer_times.find_one({"date": date}, {"_id": 0})
        
        if not stored_times:
            raise HTTPException(
                status_code=404,
                detail=f"Prayer times not found for {date}. Please upload prayer times via admin panel."
            )
        
        return PrayerTimes(**stored_times)
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prayer times for {date}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch prayer times")

@api_router.put("/prayers/iqamah")
async def update_iqamah_time(request: UpdateIqamahRequest, current_user: dict = Depends(get_current_user)):
    """Update iqamah time for a specific prayer (admin only)"""
    try:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # Get current prayer times
        current_times = await db.prayer_times.find_one({"date": today}, {"_id": 0})
        
        if not current_times:
            raise HTTPException(
                status_code=404,
                detail=f"Prayer times not found for {today}. Please upload prayer times via CSV first."
            )
        
        # Update the specific iqamah time
        prayers = current_times.get('prayers', [])
        updated = False
        for prayer in prayers:
            if prayer['name'] == request.prayer_name:
                prayer['iqamah'] = request.iqamah_time
                updated = True
                break
        
        if not updated:
            raise HTTPException(status_code=404, detail=f"Prayer '{request.prayer_name}' not found")
        
        # Update in database
        current_times['updated_at'] = datetime.now(timezone.utc)
        await db.prayer_times.update_one(
            {"date": today},
            {"$set": current_times},
            upsert=True
        )
        
        logger.info(f"Admin updated {request.prayer_name} iqamah time to {request.iqamah_time}")
        return {"message": "Iqamah time updated successfully", "prayer": request.prayer_name, "iqamah": request.iqamah_time}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating iqamah time: {e}")
        raise HTTPException(status_code=500, detail="Failed to update iqamah time")

@api_router.put("/prayers/jummah")
async def update_jummah_times(request: UpdateJummahRequest, current_user: dict = Depends(get_current_user)):
    """Update Jummah prayer time (admin only)"""
    try:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # Get current prayer times
        current_times = await db.prayer_times.find_one({"date": today}, {"_id": 0})
        
        if not current_times:
            raise HTTPException(
                status_code=404,
                detail=f"Prayer times not found for {today}. Please upload prayer times via CSV first."
            )
        
        # Update Jummah time
        current_times['jummah'] = {"time": request.time}
        current_times['updated_at'] = datetime.now(timezone.utc)
        
        await db.prayer_times.update_one(
            {"date": today},
            {"$set": current_times},
            upsert=True
        )
        
        logger.info(f"Admin updated Jummah time to {request.time}")
        return {"message": "Jummah time updated successfully", "jummah": {"time": request.time}}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating Jummah times: {e}")
        raise HTTPException(status_code=500, detail="Failed to update Jummah times")

@api_router.post("/admin/prayer-times/bulk-update")
async def bulk_update_prayer_times(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Bulk update both Adhan and Iqamah times for multiple dates via CSV upload
    CSV Format: Date,Fajr_Adhan,Fajr_Iqama,Dhuhr_Adhan,Dhuhr_Iqama,Asr_Adhan,Asr_Iqama,Maghrib_Adhan,Maghrib_Iqama,Isha_Adhan,Isha_Iqama,Sunrise,Sunset
    Accepts both "Duhur" and "Dhuhr" spellings
    Sets Jummah time to match Dhuhr Iqamah time
    """
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV")
        
        # Read and decode CSV file
        contents = await file.read()
        csv_text = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_text))
        
        headers = csv_reader.fieldnames or []
        
        # Check for Dhuhr (accept both spellings)
        dhuhr_adhan_header = None
        dhuhr_iqama_header = None
        
        if 'Duhur_Adhan' in headers:
            dhuhr_adhan_header = 'Duhur_Adhan'
        elif 'Dhuhr_Adhan' in headers:
            dhuhr_adhan_header = 'Dhuhr_Adhan'
        else:
            raise HTTPException(
                status_code=400, 
                detail="Missing Dhuhr_Adhan/Duhur_Adhan column"
            )
        
        if 'Duhur_Iqama' in headers:
            dhuhr_iqama_header = 'Duhur_Iqama'
        elif 'Dhuhr_Iqama' in headers:
            dhuhr_iqama_header = 'Dhuhr_Iqama'
        else:
            raise HTTPException(
                status_code=400, 
                detail="Missing Dhuhr_Iqama/Duhur_Iqama column"
            )
        
        # Required headers (without Dhuhr variants)
        required_headers = [
            'Date', 'Fajr_Adhan', 'Fajr_Iqama', 
            'Asr_Adhan', 'Asr_Iqama', 
            'Maghrib_Adhan', 'Maghrib_Iqama', 
            'Isha_Adhan', 'Isha_Iqama'
        ]
        
        # Optional headers
        optional_headers = ['Sunrise', 'Sunset']
        
        # Validate all required headers are present
        for header in required_headers:
            if header not in headers:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required column: {header}"
                )
        
        # Parse and validate all rows first
        rows_to_update = []
        row_num = 1
        
        for row in csv_reader:
            row_num += 1
            
            # Validate date format
            try:
                date_str = row['Date'].strip()
                datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid date format in row {row_num}: {row['Date']}. Expected YYYY-MM-DD"
                )
            
            # Validate and collect all prayer times
            prayers_data = {
                'Fajr': {
                    'adhan': row['Fajr_Adhan'].strip(),
                    'iqamah': row['Fajr_Iqama'].strip()
                },
                'Dhuhr': {
                    'adhan': row[dhuhr_adhan_header].strip(),
                    'iqamah': row[dhuhr_iqama_header].strip()
                },
                'Asr': {
                    'adhan': row['Asr_Adhan'].strip(),
                    'iqamah': row['Asr_Iqama'].strip()
                },
                'Maghrib': {
                    'adhan': row['Maghrib_Adhan'].strip(),
                    'iqamah': row['Maghrib_Iqama'].strip()
                },
                'Isha': {
                    'adhan': row['Isha_Adhan'].strip(),
                    'iqamah': row['Isha_Iqama'].strip()
                }
            }
            
            # Validate time formats
            for prayer_name, times in prayers_data.items():
                for time_type, time_str in times.items():
                    try:
                        datetime.strptime(time_str, "%H:%M")
                    except ValueError:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid time format in row {row_num} for {prayer_name} {time_type}: {time_str}. Expected HH:MM"
                        )
            
            # Get optional Sunrise and Sunset
            sunrise = row.get('Sunrise', '').strip() or 'N/A'
            sunset = row.get('Sunset', '').strip() or 'N/A'
            
            # Validate sunrise/sunset if provided
            for time_label, time_val in [('Sunrise', sunrise), ('Sunset', sunset)]:
                if time_val != 'N/A':
                    try:
                        datetime.strptime(time_val, "%H:%M")
                    except ValueError:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid time format in row {row_num} for {time_label}: {time_val}. Expected HH:MM"
                        )
            
            rows_to_update.append({
                'date': date_str,
                'prayers': prayers_data,
                'sunrise': sunrise,
                'sunset': sunset
            })
        
        if not rows_to_update:
            raise HTTPException(status_code=400, detail="CSV file contains no data rows")
        
        # All validation passed - now update the database
        updated_count = 0
        
        for row_data in rows_to_update:
            date_str = row_data['date']
            prayers_data = row_data['prayers']
            
            # Build prayers array
            prayers = [
                Prayer(
                    name='Fajr',
                    adhan=prayers_data['Fajr']['adhan'],
                    iqamah=prayers_data['Fajr']['iqamah']
                ),
                Prayer(
                    name='Dhuhr',
                    adhan=prayers_data['Dhuhr']['adhan'],
                    iqamah=prayers_data['Dhuhr']['iqamah']
                ),
                Prayer(
                    name='Asr',
                    adhan=prayers_data['Asr']['adhan'],
                    iqamah=prayers_data['Asr']['iqamah']
                ),
                Prayer(
                    name='Maghrib',
                    adhan=prayers_data['Maghrib']['adhan'],
                    iqamah=prayers_data['Maghrib']['iqamah']
                ),
                Prayer(
                    name='Isha',
                    adhan=prayers_data['Isha']['adhan'],
                    iqamah=prayers_data['Isha']['iqamah']
                ),
            ]
            
            # Create prayer times object
            prayer_times_obj = PrayerTimes(
                date=date_str,
                hijri_date="",  # Can be added later if needed
                prayers=prayers,
                jummah=JummahTime(time=prayers_data['Dhuhr']['iqamah']),  # Jummah matches Dhuhr Iqamah
                sunrise=row_data['sunrise'],
                sunset=row_data['sunset']
            )
            
            # Update in database
            await db.prayer_times.update_one(
                {"date": date_str},
                {"$set": prayer_times_obj.dict()},
                upsert=True
            )
            
            updated_count += 1
        
        logger.info(f"Admin bulk updated {updated_count} dates with prayer times from CSV")
        return {
            "message": f"Successfully updated {updated_count} dates",
            "updated_count": updated_count,
            "dates_updated": [row['date'] for row in rows_to_update]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in bulk update: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")

# ============== DONATION ENDPOINTS ==============
# Note: Stripe checkout replaced with Square external redirect
# These endpoints kept for API compatibility but return not implemented

@api_router.post("/donations/create-checkout", response_model=DonationResponse)
async def create_donation_checkout(request: DonationRequest, http_request: Request):
    """
    Legacy endpoint - Now using Square external checkout
    Kept for API compatibility
    """
    raise HTTPException(
        status_code=501, 
        detail="Direct checkout deprecated. Please use Square external link."
    )

@api_router.get("/donations/status/{session_id}", response_model=CheckoutStatusResponse)
async def get_donation_status(session_id: str, http_request: Request):
    """
    Legacy endpoint - Now using Square external checkout
    Kept for API compatibility
    """
    raise HTTPException(
        status_code=501,
        detail="Status check deprecated. Donations tracked manually via admin panel."
    )

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """
    Legacy Stripe webhook endpoint
    Not used with Square checkout
    """
    return {"status": "deprecated", "message": "Using Square checkout - webhook not applicable"}


# ============== DONATION GOAL ENDPOINTS ==============

async def update_donation_goal_progress(amount: float, currency: str):
    """Update the current amount for the active donation goal"""
    try:
        # Get active donation goal
        goal = await db.donation_goals.find_one({"active": True})
        
        if goal:
            # Convert amount to goal currency if needed (simplified - assumes GBP)
            new_amount = goal.get('current_amount', 0.0) + amount
            
            await db.donation_goals.update_one(
                {"_id": goal['_id']},
                {
                    "$set": {
                        "current_amount": new_amount,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            logger.info(f"Updated donation goal: {new_amount} / {goal['target_amount']} {currency}")
    except Exception as e:
        logger.error(f"Error updating donation goal: {e}")

@api_router.get("/donations/goal", response_model=DonationGoalResponse)
async def get_donation_goal():
    """Get the current active donation goal"""
    try:
        goal = await db.donation_goals.find_one({"active": True})
        
        if not goal:
            # Create default goal if none exists
            default_goal = DonationGoal(
                title="Mosque Expansion Fund",
                target_amount=50000.0,
                current_amount=0.0,
                currency="gbp",
                description="Help us expand our space to serve the growing community better"
            )
            
            await db.donation_goals.insert_one(default_goal.dict())
            goal = default_goal.dict()
        
        percentage = (goal['current_amount'] / goal['target_amount'] * 100) if goal['target_amount'] > 0 else 0
        
        return DonationGoalResponse(
            title=goal['title'],
            target_amount=goal['target_amount'],
            current_amount=goal['current_amount'],
            currency=goal['currency'],
            description=goal['description'],
            percentage=round(percentage, 2)
        )
        
    except Exception as e:
        logger.error(f"Error fetching donation goal: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch donation goal")

# ============== ADMIN ENDPOINTS ==============

@api_router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest):
    """Admin login endpoint"""
    try:
        if not authenticate_admin(request.username, request.password):
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password"
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": request.username})
        
        logger.info(f"Admin user '{request.username}' logged in successfully")
        
        return AdminLoginResponse(
            access_token=access_token,
            username=request.username
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during admin login: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@api_router.get("/admin/donations/history", response_model=List[DonationHistoryItem])
async def get_donation_history(
    limit: int = 50,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get donation history (admin only)"""
    try:
        # Fetch transactions sorted by created_at descending
        transactions = await db.payment_transactions.find(
            {},
            {
                "id": 1,
                "session_id": 1,
                "amount": 1,
                "currency": 1,
                "payment_status": 1,
                "status": 1,
                "created_at": 1
            }
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return [DonationHistoryItem(**t) for t in transactions]
        
    except Exception as e:
        logger.error(f"Error fetching donation history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch donation history")

@api_router.get("/admin/donations/stats")
async def get_donation_stats(current_user: dict = Depends(get_current_user)):
    """Get donation statistics (admin only)"""
    try:
        # Total donations count
        total_count = await db.payment_transactions.count_documents({"payment_status": "paid"})
        
        # Total amount raised
        pipeline = [
            {"$match": {"payment_status": "paid"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        result = await db.payment_transactions.aggregate(pipeline).to_list(1)
        total_amount = result[0]['total'] if result else 0
        
        # Recent donations (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_count = await db.payment_transactions.count_documents({
            "payment_status": "paid",
            "created_at": {"$gte": seven_days_ago}
        })
        
        return {
            "total_donations": total_count,
            "total_amount": total_amount,
            "recent_donations": recent_count,
            "currency": "gbp"
        }
        
    except Exception as e:
        logger.error(f"Error fetching donation stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch donation stats")

@api_router.put("/admin/donations/goal")
async def update_donation_goal(
    request: UpdateDonationGoalRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update donation goal settings (admin only)"""
    try:
        # Get active goal
        goal = await db.donation_goals.find_one({"active": True})
        
        if not goal:
            raise HTTPException(status_code=404, detail="No active donation goal found")
        
        # Prepare update data
        update_data = {"updated_at": datetime.utcnow()}
        if request.title:
            update_data["title"] = request.title
        if request.target_amount:
            update_data["target_amount"] = request.target_amount
        if request.description:
            update_data["description"] = request.description
        
        # Update goal
        await db.donation_goals.update_one(
            {"_id": goal['_id']},
            {"$set": update_data}
        )
        
        logger.info("Admin updated donation goal")
        return {"message": "Donation goal updated successfully", "updated_fields": list(update_data.keys())}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating donation goal: {e}")
        raise HTTPException(status_code=500, detail="Failed to update donation goal")

@api_router.post("/admin/donations/add-offline")
async def add_offline_donation(
    request: AddOfflineDonationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add offline donation from PayPal, LaunchGood, bank transfer, or cash (admin only)"""
    try:
        # Create a transaction record for the offline donation
        transaction = PaymentTransaction(
            session_id=f"offline_{request.source}_{datetime.utcnow().timestamp()}",
            amount=request.amount,
            currency="gbp",
            payment_status="paid",
            status="complete",
            metadata={
                "source": request.source,
                "note": request.note or "",
                "date": request.date or datetime.utcnow().isoformat(),
                "added_by": "admin"
            }
        )
        
        await db.payment_transactions.insert_one(transaction.dict())
        
        # Update donation goal progress
        await update_donation_goal_progress(request.amount, "gbp")
        
        logger.info(f"Admin added offline donation: £{request.amount} from {request.source}")
        return {
            "message": "Offline donation added successfully",
            "amount": request.amount,
            "source": request.source
        }
        
    except Exception as e:
        logger.error(f"Error adding offline donation: {e}")
        raise HTTPException(status_code=500, detail="Failed to add offline donation")

@api_router.get("/admin/donations/summary")
async def get_donation_summary(current_user: dict = Depends(get_current_user)):
    """Get breakdown of donations by source (admin only)"""
    try:
        # Stripe donations (from website)
        stripe_donations = await db.payment_transactions.count_documents({
            "payment_status": "paid",
            "metadata.source": {"$ne": "offline"}
        })
        
        stripe_pipeline = [
            {"$match": {"payment_status": "paid", "metadata.source": {"$ne": "offline"}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        stripe_result = await db.payment_transactions.aggregate(stripe_pipeline).to_list(1)
        stripe_total = stripe_result[0]['total'] if stripe_result else 0
        
        # Offline donations by source
        offline_sources = ["bank_transfer", "cash"]
        offline_breakdown = {}
        
        for source in offline_sources:
            count = await db.payment_transactions.count_documents({
                "payment_status": "paid",
                "metadata.source": source
            })
            
            pipeline = [
                {"$match": {"payment_status": "paid", "metadata.source": source}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
            result = await db.payment_transactions.aggregate(pipeline).to_list(1)
            total = result[0]['total'] if result else 0
            
            offline_breakdown[source] = {
                "count": count,
                "total": total
            }
        
        return {
            "stripe": {
                "count": stripe_donations,
                "total": stripe_total
            },
            "offline": offline_breakdown,
            "currency": "gbp"
        }
        
    except Exception as e:
        logger.error(f"Error fetching donation summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch donation summary")

# ============== POPUP SETTINGS ENDPOINTS ==============

@api_router.get("/popup-settings")
async def get_popup_settings():
    """Get current popup settings"""
    try:
        settings = await db.popup_settings.find_one({}, {"_id": 0})
        
        # Return default settings if none exist
        if not settings:
            default_settings = {
                "title": "Our Last Ramadan in Colindale",
                "description": "Help us reach our goal of £100,000 to relocate before Ramadan ends. Every donation brings us closer to a permanent home for our community.",
                "citation": '"Whoever builds a mosque for Allah, Allah will build for him a house like it in Paradise."\n- Sahih Al-Bukhari 450, Sahih Muslim 533',
                "image_path": "https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/1w25b3eq_OUR%20LAST%20RAMADAN%20IN%20COLINDALE%20%282%29.png",
                "enabled": True
            }
            return default_settings
        
        return settings
        
    except Exception as e:
        logger.error(f"Error fetching popup settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch popup settings")

@api_router.put("/admin/popup-settings")
async def update_popup_settings(
    request: UpdatePopupSettingsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update popup settings (Admin only)"""
    try:
        # Get current settings
        current_settings = await db.popup_settings.find_one({}, {"_id": 0})
        
        if not current_settings:
            # Create default settings if none exist
            current_settings = {
                "id": str(uuid.uuid4()),
                "title": "Our Last Ramadan in Colindale",
                "description": "Help us reach our goal of £100,000 to relocate before Ramadan ends.",
                "citation": "Sahih Al-Bukhari 450, Sahih Muslim 533",
                "image_path": "https://customer-assets.emergentagent.com/job_markaz-rahma-1/artifacts/1w25b3eq_OUR%20LAST%20RAMADAN%20IN%20COLINDALE%20%282%29.png",
                "enabled": True,
                "updated_at": datetime.utcnow()
            }
        
        # Update fields
        update_data = request.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        current_settings.update(update_data)
        
        # Save to database
        await db.popup_settings.update_one(
            {},
            {"$set": current_settings},
            upsert=True
        )
        
        logger.info(f"Popup settings updated by {current_user.get('sub', 'admin')}")
        return {"message": "Popup settings updated successfully", "settings": current_settings}
        
    except Exception as e:
        logger.error(f"Error updating popup settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update popup settings")

# ============== ANNOUNCEMENTS ENDPOINTS ==============

@api_router.get("/announcements")
async def get_announcements():
    """Get all active announcements"""
    try:
        # Get site settings for announcements_enabled flag
        site_settings = await db.site_settings.find_one({}, {"_id": 0})
        announcements_enabled = site_settings.get("announcements_enabled", True) if site_settings else True
        
        # Get announcements sorted by order
        cursor = db.announcements.find({}).sort("order", 1)
        announcements_raw = await cursor.to_list(100)
        
        # Remove _id from each announcement
        announcements = []
        for ann in announcements_raw:
            ann_dict = dict(ann)
            ann_dict.pop('_id', None)
            announcements.append(ann_dict)
        
        logger.info(f"Fetched {len(announcements)} announcements, enabled: {announcements_enabled}")
        
        return {
            "announcements": announcements,
            "announcements_enabled": announcements_enabled
        }
        
    except Exception as e:
        logger.error(f"Error fetching announcements: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch announcements")

@api_router.get("/admin/announcements")
async def get_all_announcements_admin(current_user: dict = Depends(get_current_user)):
    """Get all announcements (Admin only)"""
    try:
        announcements = await db.announcements.find(
            {},
            {"_id": 0}
        ).sort("order", 1).to_list(100)
        
        return {"announcements": announcements}
        
    except Exception as e:
        logger.error(f"Error fetching announcements: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch announcements")

@api_router.post("/admin/announcements")
async def create_announcement(
    request: CreateAnnouncementRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new announcement (Admin only)"""
    try:
        announcement = Announcement(
            text=request.text,
            order=request.order,
            enabled=True
        )
        
        await db.announcements.insert_one(announcement.dict())
        
        logger.info(f"Announcement created by {current_user.get('sub', 'admin')}")
        return {"message": "Announcement created successfully", "announcement": announcement}
        
    except Exception as e:
        logger.error(f"Error creating announcement: {e}")
        raise HTTPException(status_code=500, detail="Failed to create announcement")

@api_router.put("/admin/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str,
    request: UpdateAnnouncementRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update an announcement (Admin only)"""
    try:
        # Check if announcement exists
        existing = await db.announcements.find_one({"id": announcement_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        # Update fields
        update_data = request.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        await db.announcements.update_one(
            {"id": announcement_id},
            {"$set": update_data}
        )
        
        logger.info(f"Announcement {announcement_id} updated by {current_user.get('sub', 'admin')}")
        return {"message": "Announcement updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating announcement: {e}")
        raise HTTPException(status_code=500, detail="Failed to update announcement")

@api_router.delete("/admin/announcements/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an announcement (Admin only)"""
    try:
        result = await db.announcements.delete_one({"id": announcement_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Announcement not found")
        
        logger.info(f"Announcement {announcement_id} deleted by {current_user.get('sub', 'admin')}")
        return {"message": "Announcement deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting announcement: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete announcement")

@api_router.put("/admin/announcements-toggle")
async def toggle_announcements(
    enabled: bool,
    current_user: dict = Depends(get_current_user)
):
    """Toggle announcements system on/off (Admin only)"""
    try:
        await db.site_settings.update_one(
            {},
            {"$set": {"announcements_enabled": enabled, "updated_at": datetime.utcnow()}},
            upsert=True
        )
        
        logger.info(f"Announcements toggled to {enabled} by {current_user.get('sub', 'admin')}")
        return {"message": f"Announcements {'enabled' if enabled else 'disabled'} successfully"}
        
    except Exception as e:
        logger.error(f"Error toggling announcements: {e}")
        raise HTTPException(status_code=500, detail="Failed to toggle announcements")

# ============== TIMETABLE ENDPOINTS ==============

@api_router.get("/timetable")
async def get_timetable():
    """Get timetable image"""
    try:
        timetable = await db.timetable_settings.find_one({}, {"_id": 0})
        
        if not timetable:
            return {"image_path": None}
        
        return timetable
        
    except Exception as e:
        logger.error(f"Error fetching timetable: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch timetable")

@api_router.put("/admin/timetable")
async def update_timetable(
    request: UpdateTimetableRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update timetable image (Admin only)"""
    try:
        timetable_data = {
            "id": str(uuid.uuid4()),
            "image_path": request.image_path,
            "updated_at": datetime.utcnow()
        }
        
        await db.timetable_settings.update_one(
            {},
            {"$set": timetable_data},
            upsert=True
        )
        
        logger.info(f"Timetable updated by {current_user.get('sub', 'admin')}")
        return {"message": "Timetable updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating timetable: {e}")
        raise HTTPException(status_code=500, detail="Failed to update timetable")

# ============== EVENTS ENDPOINTS ==============

@api_router.get("/events")
async def get_events():
    """Get all active events"""
    try:
        events = await db.events.find(
            {"enabled": True},
            {"_id": 0}
        ).sort("order", 1).to_list(100)
        
        return {"events": events}
        
    except Exception as e:
        logger.error(f"Error fetching events: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch events")

@api_router.get("/admin/events")
async def get_all_events_admin(current_user: dict = Depends(get_current_user)):
    """Get all events (Admin only)"""
    try:
        events = await db.events.find(
            {},
            {"_id": 0}
        ).sort("order", 1).to_list(100)
        
        return {"events": events}
        
    except Exception as e:
        logger.error(f"Error fetching events: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch events")

@api_router.post("/admin/events")
async def create_event(
    request: CreateEventRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new event (Admin only)"""
    try:
        event = Event(
            title=request.title,
            description=request.description,
            image_path=request.image_path,
            order=request.order,
            enabled=True
        )
        
        await db.events.insert_one(event.dict())
        
        logger.info(f"Event created by {current_user.get('sub', 'admin')}")
        return {"message": "Event created successfully", "event": event}
        
    except Exception as e:
        logger.error(f"Error creating event: {e}")
        raise HTTPException(status_code=500, detail="Failed to create event")

@api_router.put("/admin/events/{event_id}")
async def update_event(
    event_id: str,
    request: UpdateEventRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update an event (Admin only)"""
    try:
        existing = await db.events.find_one({"id": event_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Event not found")
        
        update_data = request.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        await db.events.update_one(
            {"id": event_id},
            {"$set": update_data}
        )
        
        logger.info(f"Event {event_id} updated by {current_user.get('sub', 'admin')}")
        return {"message": "Event updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event: {e}")
        raise HTTPException(status_code=500, detail="Failed to update event")

@api_router.delete("/admin/events/{event_id}")
async def delete_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an event (Admin only)"""
    try:
        result = await db.events.delete_one({"id": event_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        
        logger.info(f"Event {event_id} deleted by {current_user.get('sub', 'admin')}")
        return {"message": "Event deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete event")

# ============== IMAGE UPLOAD ENDPOINT ==============

from fastapi import UploadFile, File
import base64

@api_router.post("/admin/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload an image for popup (Admin only) - Stores as base64 in MongoDB"""
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and WebP are allowed.")
        
        # Validate file size (max 5MB)
        file_content = await file.read()
        file_size_mb = len(file_content) / (1024 * 1024)
        if file_size_mb > 5:
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Convert to base64
        base64_image = base64.b64encode(file_content).decode('utf-8')
        
        # Create data URL with proper mime type
        image_data_url = f"data:{file.content_type};base64,{base64_image}"
        
        logger.info(f"Image uploaded by {current_user.get('sub', 'admin')} - Size: {file_size_mb:.2f}MB")
        return {
            "message": "Image uploaded successfully",
            "image_path": image_data_url
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

# ============== MIXLR LIVE STATUS ENDPOINT ==============

@api_router.get("/mixlr/status")
async def get_mixlr_live_status():
    """Check if Mixlr stream is currently live"""
    try:
        import httpx
        
        # Fetch the Mixlr page
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get('https://markazrahma.mixlr.com/')
            html = response.text
            
            # Check for live indicators in the HTML
            is_live = (
                'is-live' in html or
                'Live now' in html or
                'live-indicator' in html or
                'broadcasting' in html or
                '"is_live":true' in html or
                'data-live="true"' in html
            )
            
            return {
                "is_live": is_live,
                "checked_at": datetime.now(timezone.utc).isoformat()
            }
            
    except Exception as e:
        logger.error(f"Error checking Mixlr status: {e}")
        # Return offline status on error
        return {
            "is_live": False,
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "error": "Could not check status"
        }

# ============== HERO CAROUSEL ENDPOINTS ==============

@api_router.get("/hero/cards")
async def get_hero_cards():
    """Get all active hero cards"""
    try:
        cards = await db.hero_cards.find(
            {"enabled": True},
            {"_id": 0}
        ).sort("order", 1).to_list(100)
        
        return {"cards": cards}
        
    except Exception as e:
        logger.error(f"Error fetching hero cards: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch hero cards")

@api_router.get("/hero/settings")
async def get_hero_settings():
    """Get hero carousel settings"""
    try:
        settings = await db.hero_settings.find_one({}, {"_id": 0})
        
        if not settings:
            # Return default settings
            return {
                "carousel_enabled": False,
                "scroll_interval": 5000
            }
        
        return settings
        
    except Exception as e:
        logger.error(f"Error fetching hero settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch hero settings")

@api_router.get("/admin/hero/cards")
async def get_all_hero_cards_admin(current_user: dict = Depends(get_current_user)):
    """Get all hero cards (Admin only)"""
    try:
        cards = await db.hero_cards.find(
            {},
            {"_id": 0}
        ).sort("order", 1).to_list(100)
        
        return {"cards": cards}
        
    except Exception as e:
        logger.error(f"Error fetching hero cards: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch hero cards")

@api_router.post("/admin/hero/cards")
async def create_hero_card(
    request: CreateHeroCardRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new hero card (Admin only)"""
    try:
        card = HeroCard(
            title=request.title,
            content_type=request.content_type,
            content_url=request.content_url,
            order=request.order or 0
        )
        
        await db.hero_cards.insert_one(card.dict())
        
        logger.info(f"Hero card created by {current_user.get('sub', 'admin')}: {card.title}")
        return {"message": "Hero card created successfully", "card": card.dict()}
        
    except Exception as e:
        logger.error(f"Error creating hero card: {e}")
        raise HTTPException(status_code=500, detail="Failed to create hero card")

@api_router.put("/admin/hero/cards/{card_id}")
async def update_hero_card(
    card_id: str,
    request: UpdateHeroCardRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update a hero card (Admin only)"""
    try:
        card = await db.hero_cards.find_one({"id": card_id}, {"_id": 0})
        
        if not card:
            raise HTTPException(status_code=404, detail="Hero card not found")
        
        update_data = {k: v for k, v in request.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        await db.hero_cards.update_one(
            {"id": card_id},
            {"$set": update_data}
        )
        
        logger.info(f"Hero card updated by {current_user.get('sub', 'admin')}: {card_id}")
        return {"message": "Hero card updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating hero card: {e}")
        raise HTTPException(status_code=500, detail="Failed to update hero card")

@api_router.delete("/admin/hero/cards/{card_id}")
async def delete_hero_card(
    card_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a hero card (Admin only)"""
    try:
        result = await db.hero_cards.delete_one({"id": card_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Hero card not found")
        
        logger.info(f"Hero card deleted by {current_user.get('sub', 'admin')}: {card_id}")
        return {"message": "Hero card deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting hero card: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete hero card")

@api_router.put("/admin/hero/settings")
async def update_hero_settings(
    request: UpdateHeroSettingsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update hero carousel settings (Admin only)"""
    try:
        update_data = {k: v for k, v in request.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        await db.hero_settings.update_one(
            {},
            {"$set": update_data},
            upsert=True
        )
        
        logger.info(f"Hero settings updated by {current_user.get('sub', 'admin')}")
        return {"message": "Hero settings updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating hero settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update hero settings")


# ===== YOUTUBE RECORDINGS ENDPOINTS =====

YOUTUBE_API_KEY = "AIzaSyAv-8bQkYhNPixHkoSoN-WbGcB87A-zynI"
YOUTUBE_CHANNEL_HANDLE = "markazrahma"

@api_router.get("/youtube/videos")
async def get_youtube_videos():
    """Get all videos from the YouTube channel"""
    try:
        from services.youtube_service import get_youtube_service
        
        youtube = get_youtube_service(YOUTUBE_API_KEY)
        
        # Get channel ID from handle
        channel_id = await youtube.get_channel_id_from_handle(YOUTUBE_CHANNEL_HANDLE)
        
        if not channel_id:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        # Get videos
        videos = await youtube.get_channel_videos(channel_id, max_results=50)
        
        return {"videos": videos, "channel_id": channel_id}
        
    except Exception as e:
        logger.error(f"Error fetching YouTube videos: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch videos")

@api_router.get("/youtube/search")
async def search_youtube_videos(q: str):
    """Search videos in the channel"""
    try:
        from services.youtube_service import get_youtube_service
        
        youtube = get_youtube_service(YOUTUBE_API_KEY)
        
        # Get channel ID from handle
        channel_id = await youtube.get_channel_id_from_handle(YOUTUBE_CHANNEL_HANDLE)
        
        if not channel_id:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        # Search videos
        videos = await youtube.search_videos(channel_id, q, max_results=20)
        
        return {"videos": videos}
        
    except Exception as e:
        logger.error(f"Error searching YouTube videos: {e}")
        raise HTTPException(status_code=500, detail="Failed to search videos")


# ===== CONTACT FORM ENDPOINTS =====

@api_router.get("/contact/settings")
async def get_contact_form_settings():
    """Get contact form dropdown settings (PUBLIC - returns only reason options)"""
    try:
        settings = await db.contact_form_settings.find_one({}, {"_id": 0})

        if not settings:
            default_settings = ContactFormSettings()
            await db.contact_form_settings.insert_one(default_settings.dict())
            return {"reason_options": default_settings.reason_options}

        # Only return safe public fields - never leak credentials
        return {"reason_options": settings.get("reason_options", [])}
    except Exception as e:
        logger.error(f"Error fetching contact form settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch settings")


@api_router.get("/admin/contact/settings")
async def get_contact_form_settings_admin(current_user: dict = Depends(get_current_user)):
    """Get full contact form settings including credentials (admin only)"""
    try:
        settings = await db.contact_form_settings.find_one({}, {"_id": 0})

        if not settings:
            default_settings = ContactFormSettings()
            await db.contact_form_settings.insert_one(default_settings.dict())
            return default_settings

        return ContactFormSettings(**settings)
    except Exception as e:
        logger.error(f"Error fetching admin contact form settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch settings")

@api_router.post("/contact/submit")
async def submit_contact_form(request: CreateContactSubmissionRequest):
    """Submit a new contact form"""
    try:
        submission = ContactSubmission(**request.dict())
        await db.contact_submissions.insert_one(submission.dict())
        
        # Get settings for Google Sheets and email
        settings = await db.contact_form_settings.find_one({}, {"_id": 0})
        
        if settings:
            # Send to Google Sheets if configured
            if settings.get('google_sheet_id') and settings.get('google_credentials_json'):
                try:
                    from services.google_sheets_service import GoogleSheetsService
                    sheets_service = GoogleSheetsService(
                        settings['google_credentials_json'],
                        settings['google_sheet_id']
                    )
                    sheets_service.append_submission(request.reason, submission.dict())
                except Exception as e:
                    logger.error(f"Failed to add to Google Sheets: {e}")
            
            # Send email notification if configured
            if settings.get('email_recipient'):
                try:
                    from services.google_sheets_service import send_contact_notification
                    send_contact_notification(settings['email_recipient'], submission.dict())
                except Exception as e:
                    logger.error(f"Failed to send email notification: {e}")
        
        logger.info(f"New contact form submission from {request.name} - {request.reason}")
        return {"message": "Form submitted successfully", "id": submission.id}
    except Exception as e:
        logger.error(f"Error submitting contact form: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit form")

@api_router.get("/admin/contact/submissions")
async def get_contact_submissions(current_user: dict = Depends(get_current_user)):
    """Get all contact form submissions (admin only)"""
    try:
        submissions = await db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
        return {"submissions": submissions}
    except Exception as e:
        logger.error(f"Error fetching submissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch submissions")

@api_router.put("/admin/contact/submissions/{submission_id}")
async def update_contact_submission(
    submission_id: str,
    request: UpdateContactSubmissionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update contact submission status (admin only)"""
    try:
        update_data = {k: v for k, v in request.dict().items() if v is not None}
        update_data['updated_at'] = datetime.now(timezone.utc)
        
        result = await db.contact_submissions.update_one(
            {"id": submission_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        logger.info(f"Admin updated contact submission {submission_id}")
        return {"message": "Submission updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating submission: {e}")
        raise HTTPException(status_code=500, detail="Failed to update submission")

@api_router.delete("/admin/contact/submissions/{submission_id}")
async def delete_contact_submission(submission_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a contact submission (admin only)"""
    try:
        result = await db.contact_submissions.delete_one({"id": submission_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        logger.info(f"Admin deleted contact submission {submission_id}")
        return {"message": "Submission deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting submission: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete submission")

@api_router.put("/admin/contact/settings")
async def update_contact_form_settings(
    request: UpdateContactFormSettingsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update contact form settings (admin only)"""
    try:
        # Get existing settings or create new
        existing = await db.contact_form_settings.find_one({})
        
        # Prepare update data
        update_data = {k: v for k, v in request.dict().items() if v is not None}
        update_data['updated_at'] = datetime.now(timezone.utc)
        
        if existing:
            await db.contact_form_settings.update_one(
                {"id": existing["id"]},
                {"$set": update_data}
            )
        else:
            settings = ContactFormSettings(**request.dict())
            await db.contact_form_settings.insert_one(settings.dict())
        
        # If Google Sheets is configured and reason_options changed, create sheets
        if update_data.get('reason_options') and update_data.get('google_sheet_id') and update_data.get('google_credentials_json'):
            try:
                from services.google_sheets_service import GoogleSheetsService
                sheets_service = GoogleSheetsService(
                    update_data['google_credentials_json'],
                    update_data['google_sheet_id']
                )
                sheets_service.create_sheets_for_reasons(update_data['reason_options'])
            except Exception as e:
                logger.error(f"Failed to create Google Sheets tabs: {e}")
        
        logger.info(f"Admin updated contact form settings")
        return {"message": "Settings updated successfully"}
    except Exception as e:
        logger.error(f"Error updating contact form settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update settings")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# Include the router in the main app (MUST be at the end after all routes are defined)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
