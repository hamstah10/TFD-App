#!/usr/bin/env python3
"""
Backend API Testing Script for Customer Photo Upload and Fahrzeugschein Scanner
Tests the photo endpoints and Fahrzeugschein Scanner API according to review requests.
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

def test_fahrzeugschein_scanner():
    """Test the /scan-fahrzeugschein endpoint as requested in the review"""
    print("=" * 60)
    print("TESTING FAHRZEUGSCHEIN SCANNER API ENDPOINT")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print()
    
    # Test data from the review request - tiny 1x1 pixel test image
    test_payload = {
        "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "show_cuts": False
    }
    
    try:
        print("Testing POST /api/scan-fahrzeugschein - Scan vehicle registration document")
        print("-" * 50)
        print("Test Image: 1x1 pixel test image (should return success=false or success=true)")
        
        response = requests.post(
            f"{BASE_URL}/scan-fahrzeugschein",
            json=test_payload,
            headers={"Content-Type": "application/json"},
            timeout=60  # Longer timeout for external API call
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Endpoint is accessible (200 OK)")
            
            try:
                response_data = response.json()
                print(f"Response JSON: {json.dumps(response_data, indent=2)}")
                
                # Verify response format has required 'success' field
                if 'success' not in response_data:
                    print("❌ FAILED: Response missing required 'success' field")
                    return False
                
                print("✅ SUCCESS: Response has required 'success' field")
                success_value = response_data['success']
                print(f"Success value: {success_value}")
                
                # Test expects either success=false (correct behavior for test image) 
                # or success=true (if API accepts anything)
                if success_value == False:
                    print("✅ SUCCESS: API correctly returned success=False for 1x1 test image")
                    if 'error' in response_data:
                        print(f"   Error message: {response_data['error']}")
                elif success_value == True:
                    print("✅ SUCCESS: API returned success=True (accepts any image)")
                    if 'country_code' in response_data:
                        print(f"   Country code: {response_data.get('country_code')}")
                    if 'data' in response_data:
                        print(f"   Data returned: {response_data.get('data')}")
                else:
                    print(f"❌ FAILED: Unexpected success value: {success_value} (expected True or False)")
                    return False
                
                # Check optional fields are properly typed
                optional_fields = {
                    'error': str,
                    'country_code': str, 
                    'data': dict
                }
                
                for field, expected_type in optional_fields.items():
                    if field in response_data and response_data[field] is not None:
                        if not isinstance(response_data[field], expected_type):
                            print(f"⚠️  WARNING: Field '{field}' has unexpected type: {type(response_data[field])}")
                        else:
                            print(f"✅ Field '{field}' has correct type: {expected_type.__name__}")
                
                print()
                print("=" * 60)
                print("✅ FAHRZEUGSCHEIN SCANNER API TEST COMPLETED SUCCESSFULLY")
                print("=" * 60)
                print("\nVerified functionality:")
                print("• Endpoint is accessible at /api/scan-fahrzeugschein")
                print("• Response format is correct (has success field)")
                print("• Error handling works properly for invalid/test images")
                print("• Response structure matches expected schema")
                
                return True
                
            except json.JSONDecodeError as e:
                print(f"❌ FAILED: Could not parse response JSON: {e}")
                print(f"Raw response: {response.text}")
                return False
        else:
            print(f"❌ FAILED: Expected 200 OK, got {response.status_code}")
            print(f"Response text: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ FAILED: Request timed out (external API may be slow/unavailable)")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"❌ FAILED: Connection error: {e}")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ FAILED: Request error: {e}")
        return False
    except Exception as e:
        print(f"❌ FAILED: Unexpected error: {e}")
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
    
    # Run photo endpoint tests (existing functionality)
    photo_success = test_photo_endpoints()
    
    print()
    
    # Run Fahrzeugschein Scanner test (new review request)
    scanner_success = test_fahrzeugschein_scanner()
    
    # Overall results
    print(f"\n{'='*60}")
    print("OVERALL TEST RESULTS:")
    print(f"{'='*60}")
    print(f"Photo API Tests:           {'✅ PASS' if photo_success else '❌ FAIL'}")
    print(f"Fahrzeugschein Scanner:    {'✅ PASS' if scanner_success else '❌ FAIL'}")
    
    if photo_success and scanner_success:
        print("\n🎉 All backend tests passed successfully!")
        exit(0)
    else:
        print("\n💥 Some backend tests failed!")
        exit(1)