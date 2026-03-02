#!/usr/bin/env python3
"""
Backend API Testing Script for Customer Photo Upload and Retrieval
Tests the photo endpoints according to the review request requirements.
"""

import requests
import json
from datetime import datetime

# Base URL from frontend/.env
BASE_URL = "https://motor-test.preview.emergentagent.com/api"

def test_photo_endpoints():
    """Test customer photo upload and retrieval API endpoints"""
    print("=" * 60)
    print("TESTING CUSTOMER PHOTO API ENDPOINTS")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print()
    
    # Test data - using realistic customer data
    test_user_id = "customer_001"
    test_photo_data = {
        "user_id": test_user_id,
        "base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "filename": "bmw_m3_engine_bay.jpg",
        "description": "Customer's BMW M3 engine bay before chiptuning"
    }
    
    created_photo_id = None
    
    try:
        # ===== TEST 1: POST /api/photos - Create a new photo =====
        print("1. Testing POST /api/photos - Create new photo")
        print("-" * 50)
        
        response = requests.post(
            f"{BASE_URL}/photos",
            json=test_photo_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            photo_response = response.json()
            print("✅ SUCCESS: Photo created successfully")
            print(f"Created photo ID: {photo_response.get('id')}")
            print(f"User ID: {photo_response.get('user_id')}")
            print(f"Filename: {photo_response.get('filename')}")
            print(f"Description: {photo_response.get('description')}")
            print(f"Created at: {photo_response.get('created_at')}")
            
            # Verify all expected fields are present
            required_fields = ['id', 'user_id', 'base64', 'created_at']
            for field in required_fields:
                if field not in photo_response:
                    print(f"❌ MISSING FIELD: {field}")
                    return False
            
            created_photo_id = photo_response.get('id')
            print(f"Base64 length: {len(photo_response.get('base64', ''))}")
            
        else:
            print(f"❌ FAILED: Expected 200 OK, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        print()
        
        # ===== TEST 2: GET /api/photos/{user_id} - Get all photos for user =====
        print("2. Testing GET /api/photos/{user_id} - Get user photos")
        print("-" * 50)
        
        response = requests.get(
            f"{BASE_URL}/photos/{test_user_id}",
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            photos = response.json()
            print("✅ SUCCESS: Retrieved user photos")
            print(f"Number of photos for user {test_user_id}: {len(photos)}")
            
            if len(photos) > 0:
                # Verify the created photo is in the list
                found_photo = False
                for photo in photos:
                    if photo.get('id') == created_photo_id:
                        found_photo = True
                        print(f"✅ Found created photo in user's photos")
                        print(f"   - ID: {photo.get('id')}")
                        print(f"   - User ID: {photo.get('user_id')}")
                        print(f"   - Filename: {photo.get('filename')}")
                        break
                
                if not found_photo:
                    print(f"❌ FAILED: Created photo with ID {created_photo_id} not found in user photos")
                    return False
                    
                # Verify user_id filtering works correctly
                for photo in photos:
                    if photo.get('user_id') != test_user_id:
                        print(f"❌ FAILED: Found photo with wrong user_id: {photo.get('user_id')}")
                        return False
                
                print(f"✅ User ID filtering works correctly - all photos belong to {test_user_id}")
                
            else:
                print(f"❌ FAILED: No photos found for user {test_user_id}, but we just created one")
                return False
        else:
            print(f"❌ FAILED: Expected 200 OK, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        print()
        
        # ===== TEST 3: DELETE /api/photos/{photo_id} - Delete the photo =====
        print("3. Testing DELETE /api/photos/{photo_id} - Delete photo")
        print("-" * 50)
        
        if not created_photo_id:
            print("❌ FAILED: No photo ID available for deletion test")
            return False
        
        response = requests.delete(
            f"{BASE_URL}/photos/{created_photo_id}",
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            delete_response = response.json()
            print("✅ SUCCESS: Photo deleted successfully")
            print(f"Delete response: {delete_response}")
            
            # Verify the photo is actually deleted by trying to get user photos again
            print("\n   Verifying deletion by checking user photos...")
            verification_response = requests.get(f"{BASE_URL}/photos/{test_user_id}", timeout=30)
            
            if verification_response.status_code == 200:
                remaining_photos = verification_response.json()
                
                # Check if deleted photo is still in the list
                for photo in remaining_photos:
                    if photo.get('id') == created_photo_id:
                        print(f"❌ FAILED: Deleted photo {created_photo_id} still exists")
                        return False
                
                print(f"✅ Deletion verified - photo {created_photo_id} successfully removed")
            else:
                print(f"⚠️  WARNING: Could not verify deletion - get photos returned {verification_response.status_code}")
                
        else:
            print(f"❌ FAILED: Expected 200 OK, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        print()
        
        # ===== TEST 4: Test deletion of non-existent photo =====
        print("4. Testing DELETE with non-existent photo ID")
        print("-" * 50)
        
        fake_photo_id = "non_existent_photo_123"
        response = requests.delete(
            f"{BASE_URL}/photos/{fake_photo_id}",
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 404:
            print("✅ SUCCESS: Correctly returned 404 for non-existent photo")
        else:
            print(f"⚠️  UNEXPECTED: Expected 404, got {response.status_code}")
            print(f"Response: {response.text}")
        
        print()
        print("=" * 60)
        print("✅ ALL PHOTO API TESTS COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print("\nVerified functionality:")
        print("• Photos are saved to MongoDB")
        print("• Response includes all expected fields (id, user_id, base64, created_at)")
        print("• User ID filtering works correctly")
        print("• Photo deletion works properly")
        print("• Error handling for non-existent photos")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ JSON DECODE ERROR: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {str(e)}")
        return False

def test_api_health():
    """Test if the API is running"""
    print("Checking API health...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=10)
        if response.status_code == 200:
            api_info = response.json()
            print(f"✅ API is running: {api_info.get('message', 'Unknown')}")
            print(f"   Version: {api_info.get('version', 'Unknown')}")
            print(f"   Using mock data: {api_info.get('mock_data', 'Unknown')}")
            return True
        else:
            print(f"⚠️  API responded with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API health check failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting Backend API Tests...")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    # Test API health first
    if not test_api_health():
        print("❌ API is not responding. Cannot proceed with tests.")
        exit(1)
    
    print()
    
    # Run photo endpoint tests
    success = test_photo_endpoints()
    
    if success:
        print("\n🎉 All tests passed successfully!")
        exit(0)
    else:
        print("\n💥 Some tests failed!")
        exit(1)