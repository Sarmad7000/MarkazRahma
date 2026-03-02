from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
import uuid

# Prayer Time Models
class Prayer(BaseModel):
    name: str
    adhan: str
    iqamah: str

class JummahTime(BaseModel):
    khutbah: str
    salah: str

class PrayerTimes(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    hijri_date: Optional[str] = None
    prayers: List[Prayer]
    jummah: JummahTime
    sunrise: Optional[str] = None
    sunset: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UpdateIqamahRequest(BaseModel):
    prayer_name: str
    iqamah_time: str

# Payment Models
class DonationRequest(BaseModel):
    amount: Optional[float] = None
    currency: str = "gbp"
    success_url: str
    cancel_url: str
    metadata: Optional[Dict[str, str]] = None

class DonationResponse(BaseModel):
    url: str
    session_id: str

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    amount: float
    currency: str
    payment_status: str  # pending, paid, failed, expired
    status: str  # initiated, complete, cancelled
    metadata: Optional[Dict[str, str]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CheckoutStatusResponse(BaseModel):
    status: str
    payment_status: str
    amount: float
    currency: str
    metadata: Optional[Dict[str, str]] = None

# Mosque Settings Models
class DonationGoal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    target_amount: float
    current_amount: float
    currency: str = "gbp"
    description: str
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DonationGoalResponse(BaseModel):
    title: str
    target_amount: float
    current_amount: float
    currency: str
    description: str
    percentage: float
