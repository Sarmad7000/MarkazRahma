"""
Tests for YouTube Recordings + Contact Form (public, admin) + security check on /api/contact/settings
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://markaz-rahma-1.preview.emergentagent.com').rstrip('/')
ADMIN_USER = "MarkazRahma2026"
ADMIN_PASS = "Bismillah20!"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{BASE_URL}/api/admin/login",
                     json={"username": ADMIN_USER, "password": ADMIN_PASS},
                     timeout=20)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- YouTube ----------
class TestYouTube:
    def test_get_videos(self, session):
        r = session.get(f"{BASE_URL}/api/youtube/videos", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "videos" in data
        assert isinstance(data["videos"], list)
        assert len(data["videos"]) > 0, "No videos returned"
        v = data["videos"][0]
        for k in ("id", "title", "thumbnail", "published_at"):
            assert k in v, f"missing {k} in video"

    def test_search_videos(self, session):
        r = session.get(f"{BASE_URL}/api/youtube/search", params={"q": "ramadan"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "videos" in data
        assert isinstance(data["videos"], list)


# ---------- Contact: Public security ----------
class TestContactPublic:
    def test_public_settings_no_credentials_leak(self, session):
        r = session.get(f"{BASE_URL}/api/contact/settings", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        # Must contain reason_options
        assert "reason_options" in data
        assert isinstance(data["reason_options"], list)
        # Must NOT leak any credentials/PII fields
        for forbidden in ("google_credentials_json", "google_sheet_id", "email_recipient"):
            assert forbidden not in data, f"SECURITY LEAK: '{forbidden}' present in public response"


# ---------- Contact: Admin settings ----------
class TestContactAdminSettings:
    def test_admin_settings_requires_auth(self, session):
        r = session.get(f"{BASE_URL}/api/admin/contact/settings", timeout=20)
        assert r.status_code in (401, 403), f"Expected auth failure, got {r.status_code}"

    def test_admin_get_full_settings(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/admin/contact/settings", headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "reason_options" in data
        # The full model includes credential fields (may be None/empty)
        assert "google_sheet_id" in data
        assert "google_credentials_json" in data
        assert "email_recipient" in data

    def test_admin_update_settings_persists(self, session, auth_headers):
        payload = {
            "reason_options": ["General Inquiry", "Donation Help", "TEST_Marriage Services"],
            "email_recipient": "TEST_admin@markazrahma.test",
            "google_sheet_id": "TEST_FAKE_SHEET_ID_12345",
            "google_credentials_json": '{"type":"service_account","project_id":"fake"}'
        }
        r = session.put(f"{BASE_URL}/api/admin/contact/settings",
                        headers=auth_headers, json=payload, timeout=30)
        assert r.status_code == 200, r.text

        # Verify persistence
        r2 = session.get(f"{BASE_URL}/api/admin/contact/settings", headers=auth_headers, timeout=20)
        assert r2.status_code == 200
        d = r2.json()
        assert d["email_recipient"] == payload["email_recipient"]
        assert d["google_sheet_id"] == payload["google_sheet_id"]
        assert d["google_credentials_json"] == payload["google_credentials_json"]
        assert "TEST_Marriage Services" in d["reason_options"]

        # Public endpoint must still NOT leak
        rp = session.get(f"{BASE_URL}/api/contact/settings", timeout=20)
        assert rp.status_code == 200
        public_data = rp.json()
        for forbidden in ("google_credentials_json", "google_sheet_id", "email_recipient"):
            assert forbidden not in public_data
        assert "TEST_Marriage Services" in public_data["reason_options"]


# ---------- Contact: Submission ----------
class TestContactSubmission:
    submission_id = None

    def test_submit_contact_form_with_invalid_creds(self, session):
        # Even though admin set fake creds in previous test, submission should still succeed
        payload = {
            "name": "TEST_John Doe",
            "location": "London",
            "reason": "General Inquiry",
            "email": "test_john@example.com",
            "phone": "+447000000000",
            "message": "TEST_Hello, this is a test submission."
        }
        r = session.post(f"{BASE_URL}/api/contact/submit", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data
        TestContactSubmission.submission_id = data["id"]

    def test_admin_list_submissions(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/admin/contact/submissions", headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "submissions" in data
        assert isinstance(data["submissions"], list)
        ids = [s.get("id") for s in data["submissions"]]
        if TestContactSubmission.submission_id:
            assert TestContactSubmission.submission_id in ids

    def test_admin_update_submission_status(self, session, auth_headers):
        sid = TestContactSubmission.submission_id
        if not sid:
            pytest.skip("no submission id")
        r = session.put(f"{BASE_URL}/api/admin/contact/submissions/{sid}",
                        headers=auth_headers, json={"status": "read"}, timeout=20)
        assert r.status_code == 200, r.text

        # Verify status persisted
        r2 = session.get(f"{BASE_URL}/api/admin/contact/submissions", headers=auth_headers, timeout=20)
        rec = next((s for s in r2.json()["submissions"] if s.get("id") == sid), None)
        assert rec is not None
        assert rec["status"] == "read"

    def test_admin_delete_submission(self, session, auth_headers):
        sid = TestContactSubmission.submission_id
        if not sid:
            pytest.skip("no submission id")
        r = session.delete(f"{BASE_URL}/api/admin/contact/submissions/{sid}", headers=auth_headers, timeout=20)
        assert r.status_code == 200, r.text

        # Verify gone
        r2 = session.get(f"{BASE_URL}/api/admin/contact/submissions", headers=auth_headers, timeout=20)
        ids = [s.get("id") for s in r2.json()["submissions"]]
        assert sid not in ids


# ---------- Regression ----------
class TestRegression:
    def test_announcements(self, session):
        r = session.get(f"{BASE_URL}/api/announcements", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert "announcements" in d

    def test_donation_goal(self, session):
        r = session.get(f"{BASE_URL}/api/donations/goal", timeout=20)
        assert r.status_code == 200

    def test_hero_settings(self, session):
        r = session.get(f"{BASE_URL}/api/hero/settings", timeout=20)
        assert r.status_code == 200

    def test_prayers_today_or_404(self, session):
        # Either prayer times exist (200) or not seeded (404). Both acceptable per design.
        r = session.get(f"{BASE_URL}/api/prayers/today", timeout=20)
        assert r.status_code in (200, 404)


# ---------- Cleanup: restore baseline reason_options ----------
def test_zz_cleanup_restore_settings(auth_headers):
    s = requests.Session()
    payload = {
        "reason_options": ["General Inquiry", "Donation Help", "Marriage Services", "Janazah Services", "Volunteer", "Other"],
        "email_recipient": "",
        "google_sheet_id": "",
        "google_credentials_json": ""
    }
    r = s.put(f"{BASE_URL}/api/admin/contact/settings", headers=auth_headers, json=payload, timeout=30)
    assert r.status_code == 200
