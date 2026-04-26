"""
Google Sheets integration for contact form submissions
"""
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

class GoogleSheetsService:
    def __init__(self, credentials_json: str, spreadsheet_id: str):
        """Initialize Google Sheets service with credentials"""
        self.spreadsheet_id = spreadsheet_id
        try:
            credentials_dict = json.loads(credentials_json)
            credentials = service_account.Credentials.from_service_account_info(
                credentials_dict,
                scopes=['https://www.googleapis.com/auth/spreadsheets']
            )
            self.service = build('sheets', 'v4', credentials=credentials)
        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets service: {e}")
            raise

    def get_or_create_sheet(self, sheet_name: str) -> bool:
        """Get existing sheet or create new one if it doesn't exist"""
        try:
            # Get existing sheets
            spreadsheet = self.service.spreadsheets().get(
                spreadsheetId=self.spreadsheet_id
            ).execute()
            
            existing_sheets = [sheet['properties']['title'] for sheet in spreadsheet.get('sheets', [])]
            
            if sheet_name in existing_sheets:
                return True
            
            # Create new sheet
            request_body = {
                'requests': [{
                    'addSheet': {
                        'properties': {
                            'title': sheet_name
                        }
                    }
                }]
            }
            
            self.service.spreadsheets().batchUpdate(
                spreadsheetId=self.spreadsheet_id,
                body=request_body
            ).execute()
            
            # Add header row
            self.add_header_row(sheet_name)
            
            logger.info(f"Created new sheet: {sheet_name}")
            return True
            
        except HttpError as e:
            logger.error(f"Error creating sheet {sheet_name}: {e}")
            return False

    def add_header_row(self, sheet_name: str):
        """Add header row to a sheet"""
        try:
            headers = [['Timestamp', 'Name', 'Location', 'Email', 'Phone', 'Message', 'Status']]
            
            self.service.spreadsheets().values().update(
                spreadsheetId=self.spreadsheet_id,
                range=f"{sheet_name}!A1:G1",
                valueInputOption='RAW',
                body={'values': headers}
            ).execute()
            
        except HttpError as e:
            logger.error(f"Error adding header row: {e}")

    def append_submission(self, sheet_name: str, submission: Dict) -> bool:
        """Append a submission to the specified sheet"""
        try:
            # Ensure sheet exists
            self.get_or_create_sheet(sheet_name)
            
            # Prepare row data
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            row = [
                timestamp,
                submission.get('name', ''),
                submission.get('location', ''),
                submission.get('email', ''),
                submission.get('phone', ''),
                submission.get('message', ''),
                submission.get('status', 'new')
            ]
            
            # Append to sheet
            self.service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range=f"{sheet_name}!A:G",
                valueInputOption='RAW',
                insertDataOption='INSERT_ROWS',
                body={'values': [row]}
            ).execute()
            
            logger.info(f"Added submission to sheet: {sheet_name}")
            return True
            
        except HttpError as e:
            logger.error(f"Error appending to sheet {sheet_name}: {e}")
            return False

    def create_sheets_for_reasons(self, reasons: List[str]):
        """Create sheets for all reason options"""
        for reason in reasons:
            self.get_or_create_sheet(reason)


def send_contact_notification(recipient_email: str, submission: Dict):
    """Send email notification about new contact submission"""
    # TODO: Implement email sending using your preferred email service
    # For now, just log the notification
    logger.info(f"Would send email to {recipient_email} about submission from {submission.get('name')}")
    # You can integrate with SendGrid, AWS SES, or any email service
    pass
