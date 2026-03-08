import requests
import logging
from datetime import datetime, timedelta
from typing import Optional
from models import PrayerTimes, Prayer, JummahTime

logger = logging.getLogger(__name__)

class PrayerTimesService:
    def __init__(self):
        self.base_url = "https://api.aladhan.com/v1"
        # 15a Carlisle Road, NW9 0HD, Colindale, London coordinates
        self.latitude = 51.5956
        self.longitude = -0.2656
        self.timezone = "Europe/London"
        self.method = 2  # ISNA method
        self.school = 0  # Shafi school
        
    def fetch_prayer_times_from_api(self, date: Optional[str] = None) -> dict:
        """
        Fetch prayer times from AlAdhan API
        
        Args:
            date: Date in DD-MM-YYYY format. If None, uses today's date
            
        Returns:
            dict: API response with prayer times data
        """
        if date is None:
            date_obj = datetime.now()
            date = date_obj.strftime("%d-%m-%Y")
        else:
            # Convert YYYY-MM-DD to DD-MM-YYYY for AlAdhan API
            date_obj = datetime.strptime(date, "%Y-%m-%d")
            date = date_obj.strftime("%d-%m-%Y")
        
        url = (
            f"{self.base_url}/timings/{date}"
            f"?latitude={self.latitude}"
            f"&longitude={self.longitude}"
            f"&method={self.method}"
            f"&school={self.school}"
        )
        
        try:
            logger.info(f"Fetching prayer times from AlAdhan API for {date}")
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            api_response = response.json()
            
            if api_response.get('code') != 200:
                logger.error(f"API returned non-200 code: {api_response.get('code')}")
                raise ValueError(f"API error: {api_response.get('status')}")
            
            logger.info(f"Successfully fetched prayer times for {date}")
            return api_response['data']
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch prayer times: {e}")
            raise
    
    def format_time(self, time_str: str) -> str:
        """Format time from API (HH:MM format) and ensure consistency"""
        try:
            # Parse and reformat to ensure HH:MM format
            time_parts = time_str.split(" ")[0]  # Remove any timezone info
            return time_parts
        except Exception as e:
            logger.error(f"Error formatting time {time_str}: {e}")
            return time_str
    
    def create_prayer_times_object(
        self, 
        api_data: dict, 
        iqamah_times: Optional[dict] = None
    ) -> PrayerTimes:
        """
        Transform API data into PrayerTimes model
        
        Args:
            api_data: Raw data from AlAdhan API
            iqamah_times: Optional dict with custom iqamah times {prayer_name: time}
            
        Returns:
            PrayerTimes object
        """
        timings = api_data['timings']
        date_info = api_data['date']
        
        # Default iqamah times (15 minutes after adhan, except Maghrib which is 5 minutes)
        default_iqamah = {
            'Fajr': self._add_minutes_to_time(timings['Fajr'], 15),
            'Dhuhr': self._add_minutes_to_time(timings['Dhuhr'], 15),
            'Asr': self._add_minutes_to_time(timings['Asr'], 15),
            'Maghrib': self._add_minutes_to_time(timings['Maghrib'], 5),
            'Isha': self._add_minutes_to_time(timings['Isha'], 15),
        }
        
        # Override with custom iqamah times if provided
        if iqamah_times:
            default_iqamah.update(iqamah_times)
        
        prayers = [
            Prayer(
                name='Fajr',
                adhan=self.format_time(timings['Fajr']),
                iqamah=default_iqamah['Fajr']
            ),
            Prayer(
                name='Dhuhr',
                adhan=self.format_time(timings['Dhuhr']),
                iqamah=default_iqamah['Dhuhr']
            ),
            Prayer(
                name='Asr',
                adhan=self.format_time(timings['Asr']),
                iqamah=default_iqamah['Asr']
            ),
            Prayer(
                name='Maghrib',
                adhan=self.format_time(timings['Maghrib']),
                iqamah=default_iqamah['Maghrib']
            ),
            Prayer(
                name='Isha',
                adhan=self.format_time(timings['Isha']),
                iqamah=default_iqamah['Isha']
            ),
        ]
        
        # Format Hijri date
        hijri = date_info.get('hijri', {})
        hijri_date = f"{hijri.get('day')} {hijri.get('month', {}).get('en', '')} {hijri.get('year')}"
        
        # Convert date to YYYY-MM-DD format
        gregorian = date_info['gregorian']
        date_str = f"{gregorian['year']}-{gregorian['month']['number']:02d}-{int(gregorian['day']):02d}"
        
        return PrayerTimes(
            date=date_str,
            hijri_date=hijri_date,
            prayers=prayers,
            jummah=JummahTime(time="13:00"),  # Default Jummah time
            sunrise=self.format_time(timings.get('Sunrise', 'N/A')),
            sunset=self.format_time(timings.get('Sunset', 'N/A'))
        )
    
    def _add_minutes_to_time(self, time_str: str, minutes: int) -> str:
        """Add minutes to a time string in HH:MM format"""
        try:
            time_str = time_str.split(" ")[0]  # Remove timezone if present
            time_obj = datetime.strptime(time_str, "%H:%M")
            new_time = time_obj + timedelta(minutes=minutes)
            return new_time.strftime("%H:%M")
        except Exception as e:
            logger.error(f"Error adding minutes to time {time_str}: {e}")
            return time_str

# Create singleton instance
prayer_service = PrayerTimesService()
