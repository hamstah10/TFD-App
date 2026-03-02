#!/usr/bin/env python3
"""
Backend API Testing for Chiptuning Database App
Comprehensive testing of all backend endpoints
"""

import requests
import json
import base64
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://motor-test.preview.emergentagent.com/api"

def log_test(test_name, success, message, response_data=None):
    """Log test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status} {test_name}")
    print(f"   {message}")
    if response_data and not success:
        print(f"   Response: {response_data}")

def test_chiptuning_api():
    """Test the main Chiptuning API endpoints that should now use live external API"""
    print("\n🔄 TESTING CHIPTUNING API ENDPOINTS (Live External API)")
    print("=" * 80)
    
    # Test 1: GET /api/chiptuning/types - Get all vehicle types
    print("\n1. Testing GET /api/chiptuning/types")
    try:
        response = requests.get(f"{BASE_URL}/chiptuning/types", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check response structure
            if data.get("status") and "data" in data:
                vehicle_types = data["data"]
                
                # Check if we have real data (should be more than mock data)
                if isinstance(vehicle_types, list) and len(vehicle_types) > 0:
                    # Check for expected real data structure with ULIDs
                    sample_type = vehicle_types[0]
                    has_id = "id" in sample_type
                    has_name = "name" in sample_type
                    
                    # Look for real vehicle types like PKW, LKW, etc.
                    type_names = [t.get("name", "").upper() for t in vehicle_types]
                    has_real_types = any(name in ["PKW", "LKW", "AGRAR", "MOTORRAD"] for name in type_names)
                    
                    if has_id and has_name and has_real_types:
                        log_test(
                            "Vehicle Types API", 
                            True, 
                            f"Successfully retrieved {len(vehicle_types)} vehicle types with real data from external API"
                        )
                        
                        # Store first type ULID for next test
                        pkw_type_id = None
                        for vtype in vehicle_types:
                            if vtype.get("name", "").upper() in ["PKW", "CAR", "PASSENGER"]:
                                pkw_type_id = vtype["id"]
                                break
                        
                        if not pkw_type_id and len(vehicle_types) > 0:
                            pkw_type_id = vehicle_types[0]["id"]
                            
                        return test_manufacturers_api(pkw_type_id)
                    else:
                        log_test(
                            "Vehicle Types API", 
                            False, 
                            "Response structure invalid or still using mock data",
                            data
                        )
                else:
                    log_test(
                        "Vehicle Types API", 
                        False, 
                        "No vehicle types returned",
                        data
                    )
            else:
                log_test(
                    "Vehicle Types API", 
                    False, 
                    "Invalid response structure - missing status or data",
                    data
                )
        else:
            log_test(
                "Vehicle Types API", 
                False, 
                f"HTTP {response.status_code}: {response.text[:200]}"
            )
            
    except requests.RequestException as e:
        log_test(
            "Vehicle Types API", 
            False, 
            f"Request failed: {str(e)}"
        )
    except Exception as e:
        log_test(
            "Vehicle Types API", 
            False, 
            f"Unexpected error: {str(e)}"
        )

def test_manufacturers_api(type_ulid):
    """Test GET /api/chiptuning/manufacturers/{type_ulid}"""
    print(f"\n2. Testing GET /api/chiptuning/manufacturers/{type_ulid}")
    
    try:
        response = requests.get(f"{BASE_URL}/chiptuning/manufacturers/{type_ulid}", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("status") and "data" in data:
                manufacturers = data["data"]
                
                if isinstance(manufacturers, list) and len(manufacturers) > 0:
                    # Check for real manufacturer data
                    sample_manu = manufacturers[0]
                    has_id = "id" in sample_manu
                    has_name = "name" in sample_manu
                    
                    # Look for real manufacturers like Audi, BMW, Mercedes
                    manu_names = [m.get("name", "").upper() for m in manufacturers]
                    has_real_manufacturers = any(name in ["AUDI", "BMW", "MERCEDES", "VOLKSWAGEN", "FORD"] for name in manu_names)
                    
                    if has_id and has_name and has_real_manufacturers:
                        log_test(
                            "Manufacturers API", 
                            True, 
                            f"Successfully retrieved {len(manufacturers)} manufacturers with real data"
                        )
                        
                        # Use first manufacturer for next test
                        manufacturer_ulid = manufacturers[0]["id"]
                        return test_models_api(manufacturer_ulid)
                    else:
                        log_test(
                            "Manufacturers API", 
                            False, 
                            "Still using mock data or invalid structure",
                            data
                        )
                else:
                    log_test(
                        "Manufacturers API", 
                        False, 
                        "No manufacturers returned",
                        data
                    )
            else:
                log_test(
                    "Manufacturers API", 
                    False, 
                    "Invalid response structure",
                    data
                )
        else:
            log_test(
                "Manufacturers API", 
                False, 
                f"HTTP {response.status_code}: {response.text[:200]}"
            )
            
    except requests.RequestException as e:
        log_test(
            "Manufacturers API", 
            False, 
            f"Request failed: {str(e)}"
        )
    except Exception as e:
        log_test(
            "Manufacturers API", 
            False, 
            f"Unexpected error: {str(e)}"
        )

def test_models_api(manufacturer_ulid):
    """Test GET /api/chiptuning/models/{manufacturer_ulid}"""
    print(f"\n3. Testing GET /api/chiptuning/models/{manufacturer_ulid}")
    
    try:
        response = requests.get(f"{BASE_URL}/chiptuning/models/{manufacturer_ulid}", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("status") and "data" in data:
                models = data["data"]
                
                if isinstance(models, list) and len(models) > 0:
                    sample_model = models[0]
                    has_id = "id" in sample_model
                    has_name = "name" in sample_model
                    
                    if has_id and has_name:
                        log_test(
                            "Models API", 
                            True, 
                            f"Successfully retrieved {len(models)} models with real data"
                        )
                        return True
                    else:
                        log_test(
                            "Models API", 
                            False, 
                            "Invalid model structure",
                            data
                        )
                else:
                    log_test(
                        "Models API", 
                        False, 
                        "No models returned",
                        data
                    )
            else:
                log_test(
                    "Models API", 
                    False, 
                    "Invalid response structure",
                    data
                )
        else:
            log_test(
                "Models API", 
                False, 
                f"HTTP {response.status_code}: {response.text[:200]}"
            )
            
    except requests.RequestException as e:
        log_test(
            "Models API", 
            False, 
            f"Request failed: {str(e)}"
        )
    except Exception as e:
        log_test(
            "Models API", 
            False, 
            f"Unexpected error: {str(e)}"
        )
    
    return False

def test_all_other_apis():
    """Test other backend APIs for regression testing"""
    print("\n🔄 TESTING OTHER BACKEND APIS (Regression Test)")
    print("=" * 80)
    
    # Test Blog API
    print("\n4. Testing Blog API")
    try:
        response = requests.get(f"{BASE_URL}/blog", timeout=10)
        if response.status_code == 200:
            log_test("Blog API", True, "Blog endpoint accessible")
        else:
            log_test("Blog API", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Blog API", False, f"Request failed: {str(e)}")
    
    # Test Contact API
    print("\n5. Testing Contact Form API")
    test_contact_data = {
        "name": "Test User API",
        "email": "test@example.com",
        "subject": "API Test Message",
        "message": "This is a test message from the API testing suite."
    }
    try:
        response = requests.post(f"{BASE_URL}/contact", json=test_contact_data, timeout=10)
        if response.status_code == 200:
            log_test("Contact API", True, "Contact form submission successful")
        else:
            log_test("Contact API", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Contact API", False, f"Request failed: {str(e)}")
    
    # Test Opening Hours API
    print("\n6. Testing Opening Hours API")
    try:
        response = requests.get(f"{BASE_URL}/opening-hours", timeout=10)
        if response.status_code == 200:
            log_test("Opening Hours API", True, "Opening hours endpoint accessible")
        else:
            log_test("Opening Hours API", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Opening Hours API", False, f"Request failed: {str(e)}")
    
    # Test Company Info API
    print("\n7. Testing Company Info API")
    try:
        response = requests.get(f"{BASE_URL}/company-info", timeout=10)
        if response.status_code == 200:
            log_test("Company Info API", True, "Company info endpoint accessible")
        else:
            log_test("Company Info API", False, f"HTTP {response.status_code}")
    except Exception as e:
        log_test("Company Info API", False, f"Request failed: {str(e)}")

def main():
    """Run all tests"""
    print("🚀 BACKEND API COMPREHENSIVE TESTING")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Time: {datetime.now()}")
    
    # Test the main focus: Chiptuning API with live external API
    success = test_chiptuning_api()
    
    # Test other APIs for regression
    test_all_other_apis()
    
    print("\n" + "=" * 80)
    print("🏁 TESTING COMPLETED")
    if success:
        print("✅ Primary Chiptuning API tests PASSED - Live external API working!")
    else:
        print("❌ Primary Chiptuning API tests FAILED - Check external API connection")
    print("=" * 80)

if __name__ == "__main__":
    main()