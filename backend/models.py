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
    time: str

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

class UpdateJummahRequest(BaseModel):
    time: str

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

class DonationHistoryItem(BaseModel):
    id: str
    session_id: str
    amount: float
    currency: str
    payment_status: str
    status: str
    created_at: datetime

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

class UpdateDonationGoalRequest(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    description: Optional[str] = None

class AddOfflineDonationRequest(BaseModel):
    amount: float
    source: str  # bank_transfer, cash
    note: Optional[str] = None
    date: Optional[str] = None

# Admin Models
class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str

# Popup Settings Models
class PopupSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    citation: str
    image_path: str
    enabled: bool = True
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UpdatePopupSettingsRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    citation: Optional[str] = None
    image_path: Optional[str] = None
    enabled: Optional[bool] = None

# Announcement Models
class Announcement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    url: Optional[str] = None
    order: int = 0
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CreateAnnouncementRequest(BaseModel):
    text: str
    url: Optional[str] = None
    order: Optional[int] = 0

class UpdateAnnouncementRequest(BaseModel):
    text: Optional[str] = None
    url: Optional[str] = None
    order: Optional[int] = None
    enabled: Optional[bool] = None

# Site Settings Models
class SiteSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    announcements_enabled: bool = True
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Timetable Settings Models
class TimetableSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image_path: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UpdateTimetableRequest(BaseModel):
    image_path: str

# Event Models
class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    image_path: str
    order: int = 0
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CreateEventRequest(BaseModel):
    title: str
    description: str
    image_path: str
    order: Optional[int] = 0

class UpdateEventRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_path: Optional[str] = None
    order: Optional[int] = None
    enabled: Optional[bool] = None



# Hero Carousel Models
class HeroCard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content_type: str  # 'default', 'video', 'image'
    content_url: Optional[str] = None  # YouTube URL or image data URL
    order: int = 0
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CreateHeroCardRequest(BaseModel):
    title: str
    content_type: str
    content_url: Optional[str] = None
    order: Optional[int] = 0

class UpdateHeroCardRequest(BaseModel):
    title: Optional[str] = None
    content_type: Optional[str] = None
    content_url: Optional[str] = None
    order: Optional[int] = None
    enabled: Optional[bool] = None

class HeroSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    carousel_enabled: bool = False
    scroll_interval: int = 5000  # milliseconds
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UpdateHeroSettingsRequest(BaseModel):
    carousel_enabled: Optional[bool] = None
    scroll_interval: Optional[int] = None
