from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List

from models import (
    PrayerTimes, UpdateIqamahRequest, UpdateJummahRequest,
    DonationRequest, DonationResponse,
    PaymentTransaction, CheckoutStatusResponse, DonationGoal, DonationGoalResponse,
    UpdateDonationGoalRequest, AdminLoginRequest, AdminLoginResponse, DonationHistoryItem,
    AddOfflineDonationRequest
)
from services.prayer_service import prayer_service
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse, CheckoutStatusResponse as StripeCheckoutStatus
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

@api_router.post("/donations/create-checkout", response_model=DonationResponse)
async def create_donation_checkout(request: DonationRequest, http_request: Request):
    """Create a Stripe checkout session for donation"""
    try:
        # Initialize Stripe checkout
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Prepare checkout request
        amount = request.amount if request.amount else 10.0  # Default £10
        
        checkout_request = CheckoutSessionRequest(
            amount=float(amount),
            currency=request.currency,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata=request.metadata or {"source": "web_donation"}
        )
        
        # Create checkout session
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction in database with PENDING status
        transaction = PaymentTransaction(
            session_id=session.session_id,
            amount=amount,
            currency=request.currency,
            payment_status="pending",
            status="initiated",
            metadata=request.metadata
        )
        
        await db.payment_transactions.insert_one(transaction.dict())
        
        logger.info(f"Created checkout session: {session.session_id} for amount {amount} {request.currency}")
        
        return DonationResponse(url=session.url, session_id=session.session_id)
        
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@api_router.get("/donations/status/{session_id}", response_model=CheckoutStatusResponse)
async def get_donation_status(session_id: str, http_request: Request):
    """Get the status of a donation checkout session"""
    try:
        # Check database first
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # If already completed, return cached status
        if transaction.get('payment_status') == 'paid' and transaction.get('status') == 'complete':
            return CheckoutStatusResponse(
                status=transaction['status'],
                payment_status=transaction['payment_status'],
                amount=transaction['amount'],
                currency=transaction['currency'],
                metadata=transaction.get('metadata')
            )
        
        # Otherwise, check with Stripe for latest status
        host_url = str(http_request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        stripe_status: StripeCheckoutStatus = await stripe_checkout.get_checkout_status(session_id)
        
        # Update database if payment is complete
        if stripe_status.payment_status == 'paid' and transaction.get('payment_status') != 'paid':
            # Only process once to avoid duplicate donation counting
            await db.payment_transactions.update_one(
                {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                {
                    "$set": {
                        "payment_status": "paid",
                        "status": "complete",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Update donation goal progress
            await update_donation_goal_progress(stripe_status.amount_total / 100, stripe_status.currency)
            
            logger.info(f"Payment completed for session {session_id}: {stripe_status.amount_total/100} {stripe_status.currency}")
        
        return CheckoutStatusResponse(
            status=stripe_status.status,
            payment_status=stripe_status.payment_status,
            amount=stripe_status.amount_total / 100,  # Convert from cents to main currency
            currency=stripe_status.currency,
            metadata=stripe_status.metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking donation status: {e}")
        raise HTTPException(status_code=500, detail="Failed to check donation status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        webhook_body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing Stripe signature")
        
        # Initialize Stripe checkout for webhook handling
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(webhook_body, signature)
        
        logger.info(f"Webhook received: {webhook_response.event_type} for session {webhook_response.session_id}")
        
        # Update transaction in database based on webhook event
        if webhook_response.payment_status == 'paid':
            result = await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id, "payment_status": {"$ne": "paid"}},
                {
                    "$set": {
                        "payment_status": "paid",
                        "status": "complete",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # If this is a new payment completion, update donation goal
            if result.modified_count > 0:
                transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
                if transaction:
                    await update_donation_goal_progress(transaction['amount'], transaction['currency'])
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

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
        
        logger.info(f"Admin updated donation goal")
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
        
        // Offline donations by source
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
