"""
Google Sheets integration for contact form submissions
"""
import json
import logging
from datetime import datetime
from typing import List, Dict
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

# Column order written to each per-reason tab.
# Resolved? is index 7 (column H) — checkbox data validation applied to it.
HEADERS = ['Timestamp', 'Name', 'Location', 'Email', 'Phone', 'Message', 'Status', 'Resolved?', 'Notes']
RESOLVED_COL_INDEX = 7  # 0-indexed, column H


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

    def _get_sheet_id_by_name(self, sheet_name: str):
        """Return numeric sheetId for a given tab name, or None."""
        spreadsheet = self.service.spreadsheets().get(
            spreadsheetId=self.spreadsheet_id
        ).execute()
        for sheet in spreadsheet.get('sheets', []):
            if sheet['properties']['title'] == sheet_name:
                return sheet['properties']['sheetId']
        return None

    def get_or_create_sheet(self, sheet_name: str) -> bool:
        """Get existing sheet or create new one with formatted headers."""
        try:
            existing_sheet_id = self._get_sheet_id_by_name(sheet_name)

            if existing_sheet_id is not None:
                return True

            create_response = self.service.spreadsheets().batchUpdate(
                spreadsheetId=self.spreadsheet_id,
                body={
                    'requests': [{
                        'addSheet': {
                            'properties': {
                                'title': sheet_name,
                                'gridProperties': {
                                    'frozenRowCount': 1,
                                    'columnCount': max(26, len(HEADERS) + 4),
                                }
                            }
                        }
                    }]
                }
            ).execute()

            new_sheet_id = create_response['replies'][0]['addSheet']['properties']['sheetId']

            self.service.spreadsheets().values().update(
                spreadsheetId=self.spreadsheet_id,
                range=f"'{sheet_name}'!A1",
                valueInputOption='RAW',
                body={'values': [HEADERS]}
            ).execute()

            self._format_new_sheet(new_sheet_id)

            logger.info(f"Created new sheet with formatting: {sheet_name}")
            return True

        except HttpError as e:
            logger.error(f"Error creating sheet {sheet_name}: {e}")
            return False

    def _format_new_sheet(self, sheet_id: int):
        """Bold + freeze header row, checkbox data validation on Resolved?, auto-resize columns."""
        requests = [
            {
                'repeatCell': {
                    'range': {
                        'sheetId': sheet_id,
                        'startRowIndex': 0,
                        'endRowIndex': 1,
                    },
                    'cell': {
                        'userEnteredFormat': {
                            'textFormat': {'bold': True},
                            'horizontalAlignment': 'LEFT',
                            'verticalAlignment': 'MIDDLE',
                        }
                    },
                    'fields': 'userEnteredFormat(textFormat,horizontalAlignment,verticalAlignment)'
                }
            },
            {
                'updateSheetProperties': {
                    'properties': {
                        'sheetId': sheet_id,
                        'gridProperties': {'frozenRowCount': 1}
                    },
                    'fields': 'gridProperties.frozenRowCount'
                }
            },
            {
                'setDataValidation': {
                    'range': {
                        'sheetId': sheet_id,
                        'startRowIndex': 1,
                        'endRowIndex': 1000,
                        'startColumnIndex': RESOLVED_COL_INDEX,
                        'endColumnIndex': RESOLVED_COL_INDEX + 1,
                    },
                    'rule': {
                        'condition': {'type': 'BOOLEAN'},
                        'strict': True,
                        'showCustomUi': True,
                    }
                }
            },
            {
                'autoResizeDimensions': {
                    'dimensions': {
                        'sheetId': sheet_id,
                        'dimension': 'COLUMNS',
                        'startIndex': 0,
                        'endIndex': len(HEADERS),
                    }
                }
            },
        ]

        try:
            self.service.spreadsheets().batchUpdate(
                spreadsheetId=self.spreadsheet_id,
                body={'requests': requests}
            ).execute()
        except HttpError as e:
            logger.error(f"Error formatting new sheet: {e}")

    def append_submission(self, sheet_name: str, submission: Dict) -> bool:
        """Append a submission row.

        Resilient: locates the next empty row by scanning column A only,
        so admin-added columns (or extra trailing columns) don't break the
        append target.
        """
        try:
            self.get_or_create_sheet(sheet_name)

            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            row = [
                timestamp,
                submission.get('name', ''),
                submission.get('location', ''),
                submission.get('email', ''),
                submission.get('phone', ''),
                submission.get('message', ''),
                submission.get('status', 'new'),
                False,  # Resolved? checkbox starts unchecked
                '',     # Notes left blank for admin
            ]

            col_a = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=f"'{sheet_name}'!A:A",
            ).execute()
            existing = col_a.get('values', [])
            next_row = len(existing) + 1  # 1-indexed; if header at row 1 + N rows, next = N+2

            self.service.spreadsheets().values().update(
                spreadsheetId=self.spreadsheet_id,
                range=f"'{sheet_name}'!A{next_row}:I{next_row}",
                valueInputOption='USER_ENTERED',
                body={'values': [row]}
            ).execute()

            logger.info(f"Added submission to sheet: {sheet_name} at row {next_row}")
            return True

        except HttpError as e:
            logger.error(f"Error appending to sheet {sheet_name}: {e}")
            return False

    def create_sheets_for_reasons(self, reasons: List[str]):
        """Create sheets for all reason options"""
        for reason in reasons:
            self.get_or_create_sheet(reason)


def send_contact_notification(recipient_email: str, submission: Dict):
    """Email notification stub (skipped per user request)."""
    logger.info(f"Would send email to {recipient_email} about submission from {submission.get('name')}")
