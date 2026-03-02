import requests
import sys
import json
from datetime import datetime, timedelta

class MosqueAPITester:
    def __init__(self, base_url="https://markaz-rahma-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else type(response_data)}")
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET", 
            "",
            200
        )
        return success

    def test_prayer_times_today(self):
        """Test getting today's prayer times"""
        success, response = self.run_test(
            "Get Today's Prayer Times",
            "GET",
            "prayers/today",
            200
        )
        
        if success:
            # Validate response structure
            required_fields = ['date', 'prayers', 'jummah']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing required field: {field}")
                    return False
            
            # Validate prayers structure
            if len(response['prayers']) != 5:
                print(f"❌ Expected 5 prayers, got {len(response['prayers'])}")
                return False
                
            prayer_names = [p['name'] for p in response['prayers']]
            expected_prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
            if prayer_names != expected_prayers:
                print(f"❌ Unexpected prayer names: {prayer_names}")
                return False
                
            print(f"   Date: {response['date']}")
            print(f"   Hijri Date: {response.get('hijri_date')}")
            print(f"   Prayer Count: {len(response['prayers'])}")
            
        return success

    def test_prayer_times_by_date(self):
        """Test getting prayer times by specific date"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        success, response = self.run_test(
            "Get Prayer Times by Date",
            "GET",
            "prayers/date",
            200,
            params={'date': tomorrow}
        )
        
        if success:
            if response.get('date') != tomorrow:
                print(f"❌ Expected date {tomorrow}, got {response.get('date')}")
                return False
        
        return success

    def test_donation_goal(self):
        """Test getting donation goal"""
        success, response = self.run_test(
            "Get Donation Goal",
            "GET",
            "donations/goal",
            200
        )
        
        if success:
            required_fields = ['title', 'target_amount', 'current_amount', 'currency', 'percentage']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing required field: {field}")
                    return False
            
            print(f"   Goal: {response['title']}")
            print(f"   Progress: {response['current_amount']}/{response['target_amount']} {response['currency']} ({response['percentage']}%)")
            
        return success

    def test_donation_checkout(self):
        """Test creating donation checkout session"""
        donation_data = {
            "amount": 25.0,
            "currency": "gbp",
            "success_url": f"{self.base_url}/?donation=success&session_id={{CHECKOUT_SESSION_ID}}",
            "cancel_url": f"{self.base_url}/?donation=cancelled",
            "metadata": {
                "source": "api_test",
                "timestamp": datetime.now().isoformat()
            }
        }
        
        success, response = self.run_test(
            "Create Donation Checkout",
            "POST",
            "donations/create-checkout",
            200,
            data=donation_data
        )
        
        if success:
            required_fields = ['url', 'session_id']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing required field: {field}")
                    return False
            
            self.session_id = response['session_id']
            print(f"   Session ID: {self.session_id}")
            print(f"   Checkout URL: {response['url'][:50]}...")
            
        return success

    def test_donation_status(self):
        """Test getting donation status"""
        if not self.session_id:
            print("❌ No session ID available from previous test")
            return False
            
        success, response = self.run_test(
            "Get Donation Status",
            "GET",
            f"donations/status/{self.session_id}",
            200
        )
        
        if success:
            required_fields = ['status', 'payment_status', 'amount', 'currency']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing required field: {field}")
                    return False
            
            print(f"   Status: {response['status']}")
            print(f"   Payment Status: {response['payment_status']}")
            print(f"   Amount: {response['amount']} {response['currency']}")
            
        return success

    def test_stripe_webhook_endpoint(self):
        """Test Stripe webhook endpoint is accessible"""
        # We'll just test the endpoint exists and handles missing signature
        success, response = self.run_test(
            "Stripe Webhook Endpoint",
            "POST",
            "webhook/stripe",
            400  # Should return 400 for missing signature
        )
        return success

    def test_update_iqamah_time(self):
        """Test updating iqamah time (admin function)"""
        iqamah_data = {
            "prayer_name": "Fajr",
            "iqamah_time": "06:00"
        }
        
        success, response = self.run_test(
            "Update Iqamah Time",
            "PUT",
            "prayers/iqamah",
            200,
            data=iqamah_data
        )
        
        if success:
            print(f"   Updated: {response.get('prayer')} to {response.get('iqamah')}")
            
        return success

def main():
    print("🕌 Starting Markaz Al-Rahma API Tests")
    print("=" * 50)
    
    tester = MosqueAPITester()
    
    # Core functionality tests
    tests = [
        tester.test_health_check,
        tester.test_prayer_times_today,
        tester.test_prayer_times_by_date,
        tester.test_donation_goal,
        tester.test_donation_checkout,
        tester.test_donation_status,
        tester.test_stripe_webhook_endpoint,
        tester.test_update_iqamah_time
    ]
    
    failed_tests = []
    
    for test in tests:
        try:
            if not test():
                failed_tests.append(test.__name__)
        except Exception as e:
            print(f"❌ {test.__name__} failed with exception: {e}")
            failed_tests.append(test.__name__)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if failed_tests:
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())