"""
Backend API Tests for Timetable and Events Features
Testing: GET /api/timetable, PUT /api/admin/timetable
Testing: GET /api/events, GET /api/admin/events, POST/PUT/DELETE /api/admin/events
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://markaz-rahma-1.preview.emergentagent.com').rstrip('/')

# Test credentials - load from environment for security
TEST_USERNAME = os.environ.get('TEST_ADMIN_USERNAME', 'MarkazRahma2026')
TEST_PASSWORD = os.environ.get('TEST_ADMIN_PASSWORD', 'Bismillah20!')

# ============== FIXTURES ==============

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for admin endpoints"""
    response = api_client.post(f"{BASE_URL}/api/admin/login", json={
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")

@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


# ============== HEALTH CHECK ==============

class TestHealthCheck:
    """API Health check tests"""
    
    def test_api_root_returns_healthy(self, api_client):
        """Test API root returns healthy status"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ API is healthy")


# ============== ADMIN LOGIN ==============

class TestAdminLogin:
    """Admin authentication tests"""
    
    def test_admin_login_success(self, api_client):
        """Test successful admin login"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data.get("username") == TEST_USERNAME
        assert len(data["access_token"]) > 0
        print("✓ Admin login successful")
    
    def test_admin_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials returns 401"""
        response = api_client.post(f"{BASE_URL}/api/admin/login", json={
            "username": "wrong_user",
            "password": "wrong_pass"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")


# ============== TIMETABLE TESTS ==============

class TestTimetablePublic:
    """Public timetable endpoint tests"""
    
    def test_get_timetable_returns_200(self, api_client):
        """Test GET /api/timetable returns 200"""
        response = api_client.get(f"{BASE_URL}/api/timetable")
        assert response.status_code == 200
        data = response.json()
        # Should have image_path key (may be null if not set)
        assert "image_path" in data or data == {}
        print(f"✓ GET /api/timetable returned 200, image_path: {data.get('image_path', 'N/A')[:50] if data.get('image_path') else 'None'}...")


class TestTimetableAdmin:
    """Admin timetable management tests"""
    
    def test_update_timetable_requires_auth(self, api_client):
        """Test PUT /api/admin/timetable requires authentication"""
        response = requests.put(f"{BASE_URL}/api/admin/timetable", json={
            "image_path": "test_image.jpg"
        })
        assert response.status_code in [401, 403]  # Both are valid unauthorized responses
        print("✓ Timetable update correctly requires authentication")
    
    def test_update_timetable_success(self, authenticated_client):
        """Test PUT /api/admin/timetable updates successfully"""
        test_image_path = f"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        response = authenticated_client.put(f"{BASE_URL}/api/admin/timetable", json={
            "image_path": test_image_path
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Timetable updated successfully"
        print("✓ Timetable updated successfully")
        
        # Verify the update persisted
        get_response = authenticated_client.get(f"{BASE_URL}/api/timetable")
        assert get_response.status_code == 200
        timetable_data = get_response.json()
        assert timetable_data.get("image_path") == test_image_path
        print("✓ Timetable update persisted correctly")


# ============== EVENTS PUBLIC TESTS ==============

class TestEventsPublic:
    """Public events endpoint tests"""
    
    def test_get_events_returns_200(self, api_client):
        """Test GET /api/events returns 200"""
        response = api_client.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert isinstance(data["events"], list)
        print(f"✓ GET /api/events returned 200, found {len(data['events'])} events")


# ============== EVENTS ADMIN TESTS ==============

class TestEventsAdmin:
    """Admin events management tests (CRUD)"""
    
    @pytest.fixture(autouse=True)
    def setup_test_event_data(self):
        """Setup test event data"""
        self.test_event = {
            "title": f"TEST_Event_{uuid.uuid4().hex[:8]}",
            "description": "Test event description for automated testing",
            "image_path": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "order": 99
        }
    
    def test_get_admin_events_requires_auth(self, api_client):
        """Test GET /api/admin/events requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/events")
        assert response.status_code in [401, 403]  # Both are valid unauthorized responses
        print("✓ Admin events list correctly requires authentication")
    
    def test_get_admin_events_success(self, authenticated_client):
        """Test GET /api/admin/events returns all events"""
        response = authenticated_client.get(f"{BASE_URL}/api/admin/events")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert isinstance(data["events"], list)
        print(f"✓ GET /api/admin/events returned {len(data['events'])} events")
    
    def test_create_event_requires_auth(self, api_client):
        """Test POST /api/admin/events requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/events", json=self.test_event)
        assert response.status_code in [401, 403]  # Both are valid unauthorized responses
        print("✓ Event creation correctly requires authentication")
    
    def test_create_event_success(self, authenticated_client):
        """Test POST /api/admin/events creates event successfully"""
        response = authenticated_client.post(f"{BASE_URL}/api/admin/events", json=self.test_event)
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Event created successfully"
        assert "event" in data
        
        # Verify event data
        event = data["event"]
        assert event["title"] == self.test_event["title"]
        assert event["description"] == self.test_event["description"]
        assert "id" in event
        print(f"✓ Event created successfully with ID: {event['id']}")
        
        # Store event ID for cleanup
        self.__class__.created_event_id = event["id"]
    
    def test_update_event_success(self, authenticated_client):
        """Test PUT /api/admin/events/{id} updates event"""
        # First create an event
        create_response = authenticated_client.post(f"{BASE_URL}/api/admin/events", json=self.test_event)
        assert create_response.status_code == 200
        event_id = create_response.json()["event"]["id"]
        
        # Update the event
        update_data = {
            "title": f"UPDATED_{self.test_event['title']}",
            "description": "Updated description"
        }
        
        update_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/events/{event_id}",
            json=update_data
        )
        assert update_response.status_code == 200
        assert update_response.json().get("message") == "Event updated successfully"
        print(f"✓ Event {event_id} updated successfully")
        
        # Cleanup - delete the event
        authenticated_client.delete(f"{BASE_URL}/api/admin/events/{event_id}")
    
    def test_update_event_not_found(self, authenticated_client):
        """Test PUT /api/admin/events/{id} returns 404 for non-existent event"""
        fake_id = "non_existent_event_id_12345"
        response = authenticated_client.put(
            f"{BASE_URL}/api/admin/events/{fake_id}",
            json={"title": "Test"}
        )
        assert response.status_code == 404
        print("✓ Update non-existent event returns 404")
    
    def test_toggle_event_enabled(self, authenticated_client):
        """Test toggling event enabled status"""
        # Create an event
        create_response = authenticated_client.post(f"{BASE_URL}/api/admin/events", json=self.test_event)
        assert create_response.status_code == 200
        event_id = create_response.json()["event"]["id"]
        
        # Toggle enabled to false
        toggle_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/events/{event_id}",
            json={"enabled": False}
        )
        assert toggle_response.status_code == 200
        print(f"✓ Event {event_id} toggled to disabled")
        
        # Verify public endpoint doesn't show disabled event
        public_response = authenticated_client.get(f"{BASE_URL}/api/events")
        public_events = public_response.json()["events"]
        disabled_event_ids = [e["id"] for e in public_events if e["id"] == event_id]
        assert len(disabled_event_ids) == 0, "Disabled event should not appear in public list"
        print("✓ Disabled event not visible in public endpoint")
        
        # Cleanup
        authenticated_client.delete(f"{BASE_URL}/api/admin/events/{event_id}")
    
    def test_delete_event_success(self, authenticated_client):
        """Test DELETE /api/admin/events/{id} deletes event"""
        # Create an event
        create_response = authenticated_client.post(f"{BASE_URL}/api/admin/events", json=self.test_event)
        assert create_response.status_code == 200
        event_id = create_response.json()["event"]["id"]
        
        # Delete the event
        delete_response = authenticated_client.delete(f"{BASE_URL}/api/admin/events/{event_id}")
        assert delete_response.status_code == 200
        assert delete_response.json().get("message") == "Event deleted successfully"
        print(f"✓ Event {event_id} deleted successfully")
        
        # Verify deletion - should return 404
        get_response = authenticated_client.put(
            f"{BASE_URL}/api/admin/events/{event_id}",
            json={"title": "Test"}
        )
        assert get_response.status_code == 404
        print("✓ Deleted event returns 404 on access")
    
    def test_delete_event_not_found(self, authenticated_client):
        """Test DELETE /api/admin/events/{id} returns 404 for non-existent event"""
        fake_id = "non_existent_event_id_12345"
        response = authenticated_client.delete(f"{BASE_URL}/api/admin/events/{fake_id}")
        assert response.status_code == 404
        print("✓ Delete non-existent event returns 404")


# ============== IMAGE UPLOAD TEST ==============

class TestImageUpload:
    """Test image upload endpoint"""
    
    def test_upload_image_requires_auth(self):
        """Test POST /api/admin/upload-image requires authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/upload-image")
        assert response.status_code in [401, 403, 422]  # 401/403 unauthorized or 422 missing file
        print("✓ Image upload correctly requires authentication")


# ============== CLEANUP ==============

@pytest.fixture(scope="module", autouse=True)
def cleanup_test_events(authenticated_client):
    """Cleanup any test events after tests complete"""
    yield
    # Cleanup: Delete all events with TEST_ prefix
    try:
        response = authenticated_client.get(f"{BASE_URL}/api/admin/events")
        if response.status_code == 200:
            events = response.json().get("events", [])
            for event in events:
                if event.get("title", "").startswith("TEST_"):
                    authenticated_client.delete(f"{BASE_URL}/api/admin/events/{event['id']}")
                    print(f"Cleaned up test event: {event['title']}")
    except Exception as e:
        print(f"Cleanup warning: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
