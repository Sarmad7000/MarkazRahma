from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List
import uuid

from models import (
    PrayerTimes, UpdateIqamahRequest, UpdateJummahRequest,
    DonationRequest, DonationResponse,
    PaymentTransaction, CheckoutStatusResponse, DonationGoal, DonationGoalResponse,
    UpdateDonationGoalRequest, AdminLoginRequest, AdminLoginResponse, DonationHistoryItem,
    AddOfflineDonationRequest, PopupSettings, UpdatePopupSettingsRequest,
    Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest, SiteSettings
)
from services.prayer_service import prayer_service
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
    """Get today's prayer times with live Adhan times from API"""
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Check if we have stored iqamah times for today
        stored_times = await db.prayer_times.find_one({"date": today})
        
        # Fetch live adhan times from AlAdhan API
        api_data = prayer_service.fetch_prayer_times_from_api()
        
        # Use stored iqamah times if available, otherwise use defaults
        iqamah_times = None
        if stored_times:
            iqamah_times = {
                prayer['name']: prayer['iqamah']
                for prayer in stored_times.get('prayers', [])
            }
        
        # Create prayer times object
        prayer_times = prayer_service.create_prayer_times_object(api_data, iqamah_times)
        
        # Store/update in database
        await db.prayer_times.update_one(
            {"date": today},
            {"$set": prayer_times.dict()},
            upsert=True
        )
        
        logger.info(f"Retrieved prayer times for {today}")
        return prayer_times
        
    except Exception as e:
        logger.error(f"Error fetching prayer times: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch prayer times")

@api_router.get("/prayers/date", response_model=PrayerTimes)
async def get_prayer_times_by_date(date: str):
    """
    Get prayer times for a specific date
    Query param: date in YYYY-MM-DD format
    """
    try:
        # Validate date format
        datetime.strptime(date, "%Y-%m-%d")
        
        # Check if we have stored iqamah times for this date
        stored_times = await db.prayer_times.find_one({"date": date})
        
        # Fetch live adhan times from AlAdhan API
        api_data = prayer_service.fetch_prayer_times_from_api(date)
        
        # Use stored iqamah times if available
        iqamah_times = None
        if stored_times:
            iqamah_times = {
                prayer['name']: prayer['iqamah']
                for prayer in stored_times.get('prayers', [])
            }
        
        # Create prayer times object
        prayer_times = prayer_service.create_prayer_times_object(api_data, iqamah_times)
        
        # Store/update in database
        await db.prayer_times.update_one(
            {"date": date},
            {"$set": prayer_times.dict()},
            upsert=True
        )
        
        return prayer_times
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        logger.error(f"Error fetching prayer times for {date}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch prayer times")

@api_router.put("/prayers/iqamah")
async def update_iqamah_time(request: UpdateIqamahRequest, current_user: dict = Depends(get_current_user)):
    """Update iqamah time for a specific prayer (admin only)"""
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Get current prayer times
        current_times = await db.prayer_times.find_one({"date": today})
        
        if not current_times:
            # If no record exists, fetch from API first
            api_data = prayer_service.fetch_prayer_times_from_api()
            prayer_times = prayer_service.create_prayer_times_object(api_data)
            current_times = prayer_times.dict()
        
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
        current_times['updated_at'] = datetime.utcnow()
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
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Get current prayer times
        current_times = await db.prayer_times.find_one({"date": today})
        
        if not current_times:
            # If no record exists, fetch from API first
            api_data = prayer_service.fetch_prayer_times_from_api()
            prayer_times = prayer_service.create_prayer_times_object(api_data)
            current_times = prayer_times.dict()
        
        # Update Jummah time
        current_times['jummah'] = {"time": request.time}
        current_times['updated_at'] = datetime.utcnow()
        
        await db.prayer_times.update_one(
            {"date": today},
            {"$set": current_times},
            upsert=True
        )
        
        logger.info(f"Admin updated Jummah time to {request.time}")
        return {"message": "Jummah time updated successfully", "jummah": {"time": request.time}}
        
    except Exception as e:
        logger.error(f"Error updating Jummah times: {e}")
        raise HTTPException(status_code=500, detail="Failed to update Jummah times")

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
        
        logger.info(f"Popup settings updated by {current_user['username']}")
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
        
        logger.info(f"Announcement created by {current_user['username']}")
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
        
        logger.info(f"Announcement {announcement_id} updated by {current_user['username']}")
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
        
        logger.info(f"Announcement {announcement_id} deleted by {current_user['username']}")
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
        
        logger.info(f"Announcements toggled to {enabled} by {current_user['username']}")
        return {"message": f"Announcements {'enabled' if enabled else 'disabled'} successfully"}
        
    except Exception as e:
        logger.error(f"Error toggling announcements: {e}")
        raise HTTPException(status_code=500, detail="Failed to toggle announcements")

# ============== IMAGE UPLOAD ENDPOINT ==============

from fastapi import UploadFile, File
import uuid as uuid_lib
import shutil

@api_router.post("/admin/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload an image for popup (Admin only)"""
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and WebP are allowed.")
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid_lib.uuid4()}.{file_extension}"
        
        # Save to uploads directory
        upload_dir = Path("/app/frontend/public/uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = upload_dir / unique_filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return the public URL path
        image_url = f"/uploads/{unique_filename}"
        
        logger.info(f"Image uploaded by {current_user['username']}: {image_url}")
        return {"message": "Image uploaded successfully", "image_path": image_url}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
