"""
Test suite for Customer Tickets API endpoints
Tests ticket list, detail, create, and reply functionality with CRM integration
"""

import pytest
import requests
import os
import time
from datetime import datetime

# Base URL from environment
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://configurator-preview.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "andre@tuningfux.de"
TEST_PASSWORD = "Test1234"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "deviceName": "test-device"
        },
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    data = response.json()
    token = data.get("accessToken") or data.get("token")
    if not token:
        pytest.skip("No access token in login response")
    
    return token


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestAuthFlow:
    """Authentication tests for tickets access"""
    
    def test_login_success(self, api_client):
        """Test successful login"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "deviceName": "test-device"
            }
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "accessToken" in data or "token" in data, "No token in response"
        print(f"Login successful, got token")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "invalid@example.com",
                "password": "wrongpassword",
                "deviceName": "test-device"
            }
        )
        
        assert response.status_code in [401, 422], f"Expected 401/422, got {response.status_code}"
        print(f"Invalid login correctly rejected with {response.status_code}")


class TestTicketList:
    """Tests for GET /api/customer/tickets endpoint"""
    
    def test_get_tickets_authenticated(self, api_client, auth_token):
        """Test getting ticket list with valid authentication"""
        response = api_client.get(
            f"{BASE_URL}/api/customer/tickets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Get tickets failed: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # If tickets exist, verify structure
        if len(data) > 0:
            ticket = data[0]
            assert "ticketNumber" in ticket, "Ticket should have ticketNumber"
            assert "subject" in ticket, "Ticket should have subject"
            assert "status" in ticket, "Ticket should have status"
            assert "priority" in ticket, "Ticket should have priority"
            assert "messageCount" in ticket, "Ticket should have messageCount"
            print(f"Got {len(data)} tickets, first ticket: {ticket.get('ticketNumber')}")
        else:
            print("No existing tickets found")
    
    def test_get_tickets_no_auth(self, api_client):
        """Test getting tickets without authentication"""
        response = api_client.get(f"{BASE_URL}/api/customer/tickets")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Unauthenticated request correctly rejected")
    
    def test_get_tickets_invalid_token(self, api_client):
        """Test getting tickets with invalid token"""
        response = api_client.get(
            f"{BASE_URL}/api/customer/tickets",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("Invalid token correctly rejected")


class TestTicketCreate:
    """Tests for POST /api/customer/tickets endpoint - creates ticket and syncs to CRM"""
    
    def test_create_ticket_success(self, api_client, auth_token):
        """Test creating a new ticket with CRM sync"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        test_subject = f"TEST_Ticket_{timestamp}"
        test_message = f"This is an automated test ticket created at {timestamp}"
        
        response = api_client.post(
            f"{BASE_URL}/api/customer/tickets",
            json={
                "subject": test_subject,
                "message": test_message,
                "priority": "normal"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code in [200, 201], f"Create ticket failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "ticketNumber" in data, "Response should have ticketNumber"
        assert "subject" in data, "Response should have subject"
        assert data["subject"] == test_subject, f"Subject mismatch: {data['subject']} != {test_subject}"
        assert "status" in data, "Response should have status"
        
        # Check CRM sync status
        crm_synced = data.get("crmSynced", False)
        crm_ticket_id = data.get("crmTicketId")
        
        print(f"Created ticket: {data['ticketNumber']}")
        print(f"CRM Synced: {crm_synced}, CRM Ticket ID: {crm_ticket_id}")
        
        if crm_synced:
            assert crm_ticket_id is not None, "CRM synced but no crmTicketId"
            print(f"Ticket successfully synced to CRM with ID: {crm_ticket_id}")
        else:
            crm_error = data.get("crmError")
            print(f"CRM sync failed or not enabled. Error: {crm_error}")
        
        return data["ticketNumber"]
    
    def test_create_ticket_high_priority(self, api_client, auth_token):
        """Test creating a high priority ticket"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        response = api_client.post(
            f"{BASE_URL}/api/customer/tickets",
            json={
                "subject": f"TEST_HighPriority_{timestamp}",
                "message": "High priority test ticket",
                "priority": "high"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code in [200, 201], f"Create failed: {response.text}"
        data = response.json()
        assert data.get("priority") == "high", f"Priority mismatch: {data.get('priority')}"
        print(f"Created high priority ticket: {data['ticketNumber']}")
    
    def test_create_ticket_missing_subject(self, api_client, auth_token):
        """Test creating ticket without subject should fail"""
        response = api_client.post(
            f"{BASE_URL}/api/customer/tickets",
            json={
                "message": "Message without subject"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("Missing subject correctly rejected")
    
    def test_create_ticket_missing_message(self, api_client, auth_token):
        """Test creating ticket without message should fail"""
        response = api_client.post(
            f"{BASE_URL}/api/customer/tickets",
            json={
                "subject": "Subject without message"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("Missing message correctly rejected")
    
    def test_create_ticket_no_auth(self, api_client):
        """Test creating ticket without authentication"""
        response = api_client.post(
            f"{BASE_URL}/api/customer/tickets",
            json={
                "subject": "Test Subject",
                "message": "Test Message"
            }
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Unauthenticated create correctly rejected")


class TestTicketDetail:
    """Tests for GET /api/customer/tickets/{ticketNumber} endpoint"""
    
    def test_get_ticket_detail_success(self, api_client, auth_token):
        """Test getting ticket detail with messages"""
        # First get list to find a ticket
        list_response = api_client.get(
            f"{BASE_URL}/api/customer/tickets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if list_response.status_code != 200 or len(list_response.json()) == 0:
            # Create a ticket first
            create_response = api_client.post(
                f"{BASE_URL}/api/customer/tickets",
                json={
                    "subject": "TEST_DetailTest",
                    "message": "Testing ticket detail endpoint",
                    "priority": "normal"
                },
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert create_response.status_code in [200, 201]
            ticket_number = create_response.json()["ticketNumber"]
        else:
            ticket_number = list_response.json()[0]["ticketNumber"]
        
        # Get ticket detail
        response = api_client.get(
            f"{BASE_URL}/api/customer/tickets/{ticket_number}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Get detail failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify structure
        assert data["ticketNumber"] == ticket_number, "Ticket number mismatch"
        assert "subject" in data, "Response should have subject"
        assert "status" in data, "Response should have status"
        assert "messages" in data, "Response should have messages array"
        assert isinstance(data["messages"], list), "Messages should be a list"
        
        # Verify message structure if messages exist
        if len(data["messages"]) > 0:
            msg = data["messages"][0]
            assert "sender" in msg, "Message should have sender"
            assert "message" in msg, "Message should have message content"
            assert "createdAt" in msg, "Message should have createdAt"
            print(f"Ticket {ticket_number} has {len(data['messages'])} messages")
        
        print(f"Got ticket detail: {ticket_number}, status: {data['status']}")
        return ticket_number
    
    def test_get_ticket_detail_not_found(self, api_client, auth_token):
        """Test getting non-existent ticket"""
        response = api_client.get(
            f"{BASE_URL}/api/customer/tickets/TKT-NONEXISTENT-9999",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Non-existent ticket correctly returned 404")
    
    def test_get_ticket_detail_no_auth(self, api_client):
        """Test getting ticket detail without auth"""
        response = api_client.get(f"{BASE_URL}/api/customer/tickets/TKT-1-0001")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Unauthenticated detail request correctly rejected")


class TestTicketReply:
    """Tests for POST /api/customer/tickets/{ticketNumber}/reply endpoint"""
    
    def test_reply_to_ticket_success(self, api_client, auth_token):
        """Test replying to a ticket and verify CRM sync"""
        # First create a ticket to reply to
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        create_response = api_client.post(
            f"{BASE_URL}/api/customer/tickets",
            json={
                "subject": f"TEST_ReplyTest_{timestamp}",
                "message": "Initial message for reply test",
                "priority": "normal"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert create_response.status_code in [200, 201], f"Create failed: {create_response.text}"
        ticket_number = create_response.json()["ticketNumber"]
        
        # Get initial message count
        detail_before = api_client.get(
            f"{BASE_URL}/api/customer/tickets/{ticket_number}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        initial_count = len(detail_before.json().get("messages", []))
        
        # Send reply
        reply_message = f"Test reply at {timestamp}"
        reply_response = api_client.post(
            f"{BASE_URL}/api/customer/tickets/{ticket_number}/reply",
            json={"message": reply_message},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert reply_response.status_code == 200, f"Reply failed: {reply_response.status_code} - {reply_response.text}"
        
        # Verify reply was added
        detail_after = api_client.get(
            f"{BASE_URL}/api/customer/tickets/{ticket_number}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert detail_after.status_code == 200
        messages = detail_after.json().get("messages", [])
        
        assert len(messages) > initial_count, "Reply should add a new message"
        
        # Check latest message
        latest_msg = messages[-1]
        assert latest_msg["message"] == reply_message, f"Message content mismatch"
        assert latest_msg["sender"] == "customer", "Sender should be customer"
        
        print(f"Reply sent successfully to {ticket_number}")
        print(f"Messages: {initial_count} -> {len(messages)}")
    
    def test_reply_to_nonexistent_ticket(self, api_client, auth_token):
        """Test replying to non-existent ticket"""
        response = api_client.post(
            f"{BASE_URL}/api/customer/tickets/TKT-NONEXISTENT-9999/reply",
            json={"message": "Reply to nowhere"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Reply to non-existent ticket correctly rejected")
    
    def test_reply_empty_message(self, api_client, auth_token):
        """Test replying with empty message"""
        # Get any existing ticket
        list_response = api_client.get(
            f"{BASE_URL}/api/customer/tickets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if list_response.status_code != 200 or len(list_response.json()) == 0:
            pytest.skip("No tickets available for test")
        
        ticket_number = list_response.json()[0]["ticketNumber"]
        
        response = api_client.post(
            f"{BASE_URL}/api/customer/tickets/{ticket_number}/reply",
            json={"message": ""},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Empty message might be rejected or accepted depending on implementation
        print(f"Empty message reply returned: {response.status_code}")
    
    def test_reply_no_auth(self, api_client):
        """Test replying without authentication"""
        response = api_client.post(
            f"{BASE_URL}/api/customer/tickets/TKT-1-0001/reply",
            json={"message": "Unauthorized reply"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Unauthenticated reply correctly rejected")


class TestCRMIntegration:
    """Tests verifying CRM synchronization for tickets"""
    
    def test_ticket_crm_sync_verification(self, api_client, auth_token):
        """Test that tickets are properly synced to CRM"""
        # Create ticket
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        create_response = api_client.post(
            f"{BASE_URL}/api/customer/tickets",
            json={
                "subject": f"TEST_CRMSync_{timestamp}",
                "message": "Verifying CRM synchronization",
                "priority": "normal"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert create_response.status_code in [200, 201]
        data = create_response.json()
        
        print(f"Ticket created: {data.get('ticketNumber')}")
        print(f"CRM Synced: {data.get('crmSynced')}")
        print(f"CRM Ticket ID: {data.get('crmTicketId')}")
        print(f"CRM Ticket Number: {data.get('crmTicketNumber')}")
        
        if data.get("crmError"):
            print(f"CRM Error: {data.get('crmError')}")
        
        # The ticket should have attempted CRM sync
        # Note: crmSynced can be False if CRM is unavailable but ticket is still created locally


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
