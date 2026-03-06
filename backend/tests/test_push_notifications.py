"""
Backend API Tests for Push Notification System
Tests: Push token registration/unregistration, CRM webhook, test push endpoint
"""
import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://ios-auth-fix-1.preview.emergentagent.com')
BASE_URL = BASE_URL.rstrip('/')

# Test credentials provided
TEST_EMAIL = "andre@tuningfux.de"
TEST_PASSWORD = "Test1234"

class TestAuthFlow:
    """Test authentication still works (login flow)"""
    
    def test_login_success(self):
        """Test login endpoint returns tokens and customer info"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "deviceName": "pytest-test"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "accessToken" in data, "Missing accessToken in response"
        assert "refreshToken" in data, "Missing refreshToken in response"
        assert "customer" in data, "Missing customer in response"
        assert data["customer"]["email"] == TEST_EMAIL, "Email mismatch"
        assert "id" in data["customer"], "Missing customer id"
        
        print(f"Login successful - Customer ID: {data['customer']['id']}")
    
    def test_login_invalid_credentials(self):
        """Test login fails with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "invalid@test.com",
                "password": "wrongpassword",
                "deviceName": "pytest-test"
            },
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for authenticated tests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "deviceName": "pytest-fixture"
        },
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        data = response.json()
        return {
            "token": data["accessToken"],
            "customer_id": data["customer"]["id"]
        }
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


class TestPushTokenRegistration:
    """Test POST /api/push/register endpoint"""
    
    def test_register_push_token_success(self, auth_token):
        """Test successful push token registration"""
        # Use a fake but valid-format Expo push token for testing
        test_token = "ExponentPushToken[TEST_TOKEN_123456]"
        
        response = requests.post(
            f"{BASE_URL}/api/push/register",
            json={"expoPushToken": test_token},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token['token']}"
            }
        )
        
        assert response.status_code == 200, f"Registration failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "message" in data, "Missing message in response"
        assert "customerId" in data, "Missing customerId in response"
        assert data["customerId"] == auth_token["customer_id"], "Customer ID mismatch"
        
        print(f"Push token registered successfully for customer {data['customerId']}")
    
    def test_register_push_token_update_existing(self, auth_token):
        """Test updating an existing push token"""
        test_token = "ExponentPushToken[TEST_TOKEN_UPDATE_123]"
        
        # Register first time
        response1 = requests.post(
            f"{BASE_URL}/api/push/register",
            json={"expoPushToken": test_token},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token['token']}"
            }
        )
        assert response1.status_code == 200
        
        # Register same token again (should update)
        response2 = requests.post(
            f"{BASE_URL}/api/push/register",
            json={"expoPushToken": test_token},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token['token']}"
            }
        )
        
        assert response2.status_code == 200, f"Update failed: {response2.status_code}"
        
    def test_register_push_token_invalid_format(self, auth_token):
        """Test registration fails with invalid token format"""
        invalid_token = "InvalidToken12345"  # Not an Expo token format
        
        response = requests.post(
            f"{BASE_URL}/api/push/register",
            json={"expoPushToken": invalid_token},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token['token']}"
            }
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_register_push_token_no_auth(self):
        """Test registration fails without auth token"""
        response = requests.post(
            f"{BASE_URL}/api/push/register",
            json={"expoPushToken": "ExponentPushToken[NO_AUTH]"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_register_push_token_invalid_auth(self):
        """Test registration fails with invalid auth token"""
        response = requests.post(
            f"{BASE_URL}/api/push/register",
            json={"expoPushToken": "ExponentPushToken[INVALID_AUTH]"},
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer invalid_token_here"
            }
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestPushTokenUnregistration:
    """Test POST /api/push/unregister endpoint"""
    
    def test_unregister_push_tokens_success(self, auth_token):
        """Test successful push token unregistration"""
        # First register a token
        test_token = "ExponentPushToken[TEST_UNREGISTER_TOKEN]"
        requests.post(
            f"{BASE_URL}/api/push/register",
            json={"expoPushToken": test_token},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token['token']}"
            }
        )
        
        # Now unregister
        response = requests.post(
            f"{BASE_URL}/api/push/unregister",
            json={},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token['token']}"
            }
        )
        
        assert response.status_code == 200, f"Unregister failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "message" in data, "Missing message in response"
        assert "count" in data, "Missing count in response"
        
        print(f"Unregistered {data['count']} push tokens")
    
    def test_unregister_no_auth(self):
        """Test unregistration fails without auth"""
        response = requests.post(
            f"{BASE_URL}/api/push/unregister",
            json={},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestCRMWebhook:
    """Test POST /api/webhooks/crm/order endpoint"""
    
    def test_webhook_order_created_success(self):
        """Test webhook receives order.created event"""
        webhook_payload = {
            "event": "order.created",
            "sentAt": datetime.utcnow().isoformat(),
            "data": {
                "orderId": 12345,
                "customerId": 1,  # Customer from test credentials
                "customerEmail": "andre@tuningfux.de",
                "fileName": "test_file.bin",
                "fileSize": 1024000
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/webhooks/crm/order",
            json=webhook_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Webhook failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data.get("status") == "ok", "Expected status=ok"
        assert data.get("event") == "order.created", "Event mismatch"
        
        print("Webhook order.created processed successfully")
    
    def test_webhook_unknown_event(self):
        """Test webhook handles unknown events gracefully"""
        webhook_payload = {
            "event": "unknown.event",
            "sentAt": datetime.utcnow().isoformat(),
            "data": {}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/webhooks/crm/order",
            json=webhook_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "ok"
        assert data.get("event") == "unknown.event"
    
    def test_webhook_invalid_json(self):
        """Test webhook rejects invalid JSON"""
        response = requests.post(
            f"{BASE_URL}/api/webhooks/crm/order",
            data="not valid json{",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_webhook_order_with_missing_customer(self):
        """Test webhook handles order with missing customerId"""
        webhook_payload = {
            "event": "order.created",
            "sentAt": datetime.utcnow().isoformat(),
            "data": {
                "orderId": 99999,
                # No customerId - should still process but not send push
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/webhooks/crm/order",
            json=webhook_payload,
            headers={"Content-Type": "application/json"}
        )
        
        # Should still return 200 - webhook received but no push sent
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


class TestTicketWebhook:
    """Test POST /api/webhooks/crm/ticket endpoint"""
    
    def test_webhook_ticket_reply(self):
        """Test webhook receives ticket.reply event"""
        webhook_payload = {
            "event": "ticket.reply",
            "sentAt": datetime.utcnow().isoformat(),
            "data": {
                "ticketNumber": "TK-12345",
                "customerId": 1
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/webhooks/crm/ticket",
            json=webhook_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Webhook failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data.get("status") == "ok"
        assert data.get("event") == "ticket.reply"


class TestPushNotificationTest:
    """Test POST /api/push/test endpoint"""
    
    def test_push_test_no_registered_token(self, auth_token):
        """Test push test endpoint when no tokens registered"""
        # First unregister all tokens for this customer
        requests.post(
            f"{BASE_URL}/api/push/unregister",
            json={},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token['token']}"
            }
        )
        
        # Now try to send test notification - should fail (no active tokens)
        response = requests.post(
            f"{BASE_URL}/api/push/test",
            json={},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token['token']}"
            }
        )
        
        # Should return 404 because no active push tokens
        assert response.status_code == 404, f"Expected 404 (no tokens), got {response.status_code}"
    
    def test_push_test_no_auth(self):
        """Test push test endpoint requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/push/test",
            json={},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestOrderCreationSync:
    """Test that order creation still works and syncs to CRM"""
    
    def test_orders_list_authenticated(self, auth_token):
        """Test orders list endpoint works with authentication"""
        response = requests.get(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {auth_token['token']}"}
        )
        
        # Should return 200 or possibly redirect/different status
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"Orders endpoint returned: {type(data)}")


# Cleanup test data after all tests
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_tokens():
    """Cleanup test tokens after all tests"""
    yield
    # After tests complete, clean up test tokens
    try:
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "deviceName": "cleanup"
            },
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code == 200:
            token = login_response.json()["accessToken"]
            requests.post(
                f"{BASE_URL}/api/push/unregister",
                json={},
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                }
            )
            print("Test tokens cleaned up")
    except:
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
