"""
YouTube API service for fetching channel videos
"""
import logging
from typing import List, Dict, Optional
import httpx

logger = logging.getLogger(__name__)

class YouTubeService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://www.googleapis.com/youtube/v3"
    
    async def get_channel_id_from_handle(self, handle: str) -> Optional[str]:
        """Get channel ID from @handle"""
        try:
            # Remove @ if present
            handle = handle.replace('@', '')
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/search",
                    params={
                        'part': 'snippet',
                        'q': handle,
                        'type': 'channel',
                        'key': self.api_key,
                        'maxResults': 1
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('items'):
                        return data['items'][0]['id']['channelId']
                
                logger.error(f"Failed to get channel ID: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting channel ID: {e}")
            return None
    
    async def get_channel_videos(self, channel_id: str, max_results: int = 50) -> List[Dict]:
        """Fetch videos from a channel"""
        try:
            async with httpx.AsyncClient() as client:
                # First, get the uploads playlist ID
                channel_response = await client.get(
                    f"{self.base_url}/channels",
                    params={
                        'part': 'contentDetails',
                        'id': channel_id,
                        'key': self.api_key
                    }
                )
                
                if channel_response.status_code != 200:
                    logger.error(f"Failed to get channel: {channel_response.status_code}")
                    return []
                
                channel_data = channel_response.json()
                if not channel_data.get('items'):
                    return []
                
                uploads_playlist_id = channel_data['items'][0]['contentDetails']['relatedPlaylists']['uploads']
                
                # Get videos from uploads playlist
                videos_response = await client.get(
                    f"{self.base_url}/playlistItems",
                    params={
                        'part': 'snippet,contentDetails',
                        'playlistId': uploads_playlist_id,
                        'maxResults': max_results,
                        'key': self.api_key
                    }
                )
                
                if videos_response.status_code != 200:
                    logger.error(f"Failed to get videos: {videos_response.status_code}")
                    return []
                
                videos_data = videos_response.json()
                
                # Format video data
                videos = []
                for item in videos_data.get('items', []):
                    snippet = item['snippet']
                    video_id = item['contentDetails']['videoId']
                    
                    videos.append({
                        'id': video_id,
                        'title': snippet['title'],
                        'description': snippet['description'],
                        'thumbnail': snippet['thumbnails']['high']['url'],
                        'published_at': snippet['publishedAt'],
                        'channel_title': snippet['channelTitle']
                    })
                
                logger.info(f"Fetched {len(videos)} videos from channel {channel_id}")
                return videos
                
        except Exception as e:
            logger.error(f"Error fetching channel videos: {e}")
            return []
    
    async def search_videos(self, channel_id: str, query: str, max_results: int = 20) -> List[Dict]:
        """Search videos within a channel"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/search",
                    params={
                        'part': 'snippet',
                        'channelId': channel_id,
                        'q': query,
                        'type': 'video',
                        'maxResults': max_results,
                        'order': 'date',
                        'key': self.api_key
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Failed to search videos: {response.status_code}")
                    return []
                
                data = response.json()
                
                videos = []
                for item in data.get('items', []):
                    snippet = item['snippet']
                    video_id = item['id']['videoId']
                    
                    videos.append({
                        'id': video_id,
                        'title': snippet['title'],
                        'description': snippet['description'],
                        'thumbnail': snippet['thumbnails']['high']['url'],
                        'published_at': snippet['publishedAt'],
                        'channel_title': snippet['channelTitle']
                    })
                
                return videos
                
        except Exception as e:
            logger.error(f"Error searching videos: {e}")
            return []


# Initialize with environment variable
youtube_service = None

def get_youtube_service(api_key: str):
    global youtube_service
    if youtube_service is None:
        youtube_service = YouTubeService(api_key)
    return youtube_service
