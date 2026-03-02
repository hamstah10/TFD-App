#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

# Test configuration
API_BASE_URL = "https://motor-test.preview.emergentagent.com/api"

def log_test(test_name, status, details=""):
    """Log test results"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_emoji} {test_name}")
    if details:
        print(f"    Details: {details}")
    print()

def test_chiptuning_api_chain():
    """Test the complete chiptuning API chain with live external API and mdt_id"""
    print("=" * 80)
    print("🚗 TESTING CHIPTUNING API CHAIN WITH LIVE EXTERNAL API")
    print("=" * 80)
    print()

    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    })

    # Step 1: Get Vehicle Types and extract PKW mdt_id
    print("📋 Step 1: Getting vehicle types...")
    try:
        response = session.get(f"{API_BASE_URL}/chiptuning/types")
        
        if response.status_code != 200:
            log_test("GET /chiptuning/types", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return False
        
        data = response.json()
        if not data.get("status"):
            log_test("GET /chiptuning/types", "FAIL", f"API returned status=false: {data}")
            return False
        
        types = data.get("data", [])
        if not types:
            log_test("GET /chiptuning/types", "FAIL", "No vehicle types returned")
            return False
        
        # Find PKW type
        pkw_type = None
        for vtype in types:
            if "PKW" in vtype.get("name", "").upper():
                pkw_type = vtype
                break
        
        if not pkw_type:
            log_test("GET /chiptuning/types", "FAIL", "PKW type not found in response")
            return False
        
        pkw_ulid = pkw_type.get("id")
        mdt_id = pkw_type.get("mdt_id")
        
        if not pkw_ulid:
            log_test("GET /chiptuning/types", "FAIL", "PKW type has no id/ulid field")
            return False
        
        if not mdt_id:
            log_test("GET /chiptuning/types", "FAIL", "PKW type has no mdt_id field")
            return False
        
        log_test("GET /chiptuning/types", "PASS", f"Found {len(types)} types, PKW ID: {pkw_ulid}, MDT_ID: {mdt_id}")
        
    except Exception as e:
        log_test("GET /chiptuning/types", "FAIL", f"Exception: {str(e)}")
        return False

    # Step 2: Get Manufacturers for PKW using mdt_id
    print("🏭 Step 2: Getting manufacturers for PKW...")
    try:
        response = session.get(f"{API_BASE_URL}/chiptuning/manufacturers/{pkw_ulid}?mdt_id={mdt_id}")
        
        if response.status_code != 200:
            log_test("GET /chiptuning/manufacturers", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return False
        
        data = response.json()
        if not data.get("status"):
            log_test("GET /chiptuning/manufacturers", "FAIL", f"API returned status=false: {data}")
            return False
        
        manufacturers = data.get("data", [])
        if not manufacturers:
            log_test("GET /chiptuning/manufacturers", "FAIL", "No manufacturers returned")
            return False
        
        # Look for a real manufacturer (Audi, BMW, Mercedes, etc.)
        selected_manufacturer = None
        real_brands = ["audi", "bmw", "mercedes", "volkswagen", "porsche", "ford", "opel"]
        
        for manu in manufacturers:
            manu_name = manu.get("name", "").lower()
            if any(brand in manu_name for brand in real_brands):
                selected_manufacturer = manu
                break
        
        if not selected_manufacturer:
            # Fallback to first manufacturer
            selected_manufacturer = manufacturers[0]
        
        manufacturer_ulid = selected_manufacturer.get("id")
        manufacturer_name = selected_manufacturer.get("name")
        
        if not manufacturer_ulid:
            log_test("GET /chiptuning/manufacturers", "FAIL", "Selected manufacturer has no id/ulid")
            return False
        
        log_test("GET /chiptuning/manufacturers", "PASS", f"Found {len(manufacturers)} manufacturers, selected: {manufacturer_name} (ID: {manufacturer_ulid})")
        
    except Exception as e:
        log_test("GET /chiptuning/manufacturers", "FAIL", f"Exception: {str(e)}")
        return False

    # Step 3: Get Models for selected manufacturer
    print("🚗 Step 3: Getting models for manufacturer...")
    try:
        response = session.get(f"{API_BASE_URL}/chiptuning/models/{manufacturer_ulid}?mdt_id={mdt_id}")
        
        if response.status_code != 200:
            log_test("GET /chiptuning/models", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return False
        
        data = response.json()
        if not data.get("status"):
            log_test("GET /chiptuning/models", "FAIL", f"API returned status=false: {data}")
            return False
        
        models = data.get("data", [])
        if not models:
            log_test("GET /chiptuning/models", "FAIL", "No models returned")
            return False
        
        # Select first model
        selected_model = models[0]
        model_ulid = selected_model.get("id")
        model_name = selected_model.get("name")
        
        if not model_ulid:
            log_test("GET /chiptuning/models", "FAIL", "Selected model has no id/ulid")
            return False
        
        log_test("GET /chiptuning/models", "PASS", f"Found {len(models)} models, selected: {model_name} (ID: {model_ulid})")
        
    except Exception as e:
        log_test("GET /chiptuning/models", "FAIL", f"Exception: {str(e)}")
        return False

    # Step 4: Get Builds/Years for selected model
    print("🔧 Step 4: Getting builds/years for model...")
    try:
        response = session.get(f"{API_BASE_URL}/chiptuning/builts/{model_ulid}?mdt_id={mdt_id}")
        
        if response.status_code != 200:
            log_test("GET /chiptuning/builts", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return False
        
        data = response.json()
        if not data.get("status"):
            log_test("GET /chiptuning/builts", "FAIL", f"API returned status=false: {data}")
            return False
        
        builts = data.get("data", [])
        if not builts:
            log_test("GET /chiptuning/builts", "FAIL", "No builds returned")
            return False
        
        # Select first build
        selected_built = builts[0]
        built_ulid = selected_built.get("id")
        built_name = selected_built.get("name")
        
        if not built_ulid:
            log_test("GET /chiptuning/builts", "FAIL", "Selected build has no id/ulid")
            return False
        
        log_test("GET /chiptuning/builts", "PASS", f"Found {len(builts)} builds, selected: {built_name} (ID: {built_ulid})")
        
    except Exception as e:
        log_test("GET /chiptuning/builts", "FAIL", f"Exception: {str(e)}")
        return False

    # Step 5: Get Engines for selected build
    print("🏎️ Step 5: Getting engines for build...")
    try:
        response = session.get(f"{API_BASE_URL}/chiptuning/engines/{built_ulid}?mdt_id={mdt_id}")
        
        if response.status_code != 200:
            log_test("GET /chiptuning/engines", "FAIL", f"HTTP {response.status_code}: {response.text}")
            return False
        
        data = response.json()
        if not data.get("status"):
            log_test("GET /chiptuning/engines", "FAIL", f"API returned status=false: {data}")
            return False
        
        engines = data.get("data", [])
        if not engines:
            log_test("GET /chiptuning/engines", "FAIL", "No engines returned")
            return False
        
        # Select first engine
        selected_engine = engines[0]
        engine_ulid = selected_engine.get("id")
        engine_name = selected_engine.get("name")
        
        if not engine_ulid:
            log_test("GET /chiptuning/engines", "FAIL", "Selected engine has no id/ulid")
            return False
        
        log_test("GET /chiptuning/engines", "PASS", f"Found {len(engines)} engines, selected: {engine_name} (ID: {engine_ulid})")
        
    except Exception as e:
        log_test("GET /chiptuning/engines", "FAIL", f"Exception: {str(e)}")
        return False

    # Summary
    print("=" * 80)
    print("✅ CHIPTUNING API CHAIN TEST COMPLETED SUCCESSFULLY!")
    print("=" * 80)
    print(f"🔗 Complete chain test passed:")
    print(f"   Types → Manufacturers → Models → Builds → Engines")
    print(f"   All endpoints returned status: true with real data")
    print(f"   mdt_id parameter ({mdt_id}) passed correctly throughout chain")
    print()
    return True

def test_basic_api_connectivity():
    """Test basic API connectivity"""
    print("🌐 Testing basic API connectivity...")
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            log_test("Basic API connectivity", "PASS", f"API version: {data.get('version', 'unknown')}, mock_data: {data.get('mock_data', 'unknown')}")
            return True
        else:
            log_test("Basic API connectivity", "FAIL", f"HTTP {response.status_code}")
            return False
    except Exception as e:
        log_test("Basic API connectivity", "FAIL", f"Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print(f"🚀 Starting Backend API Testing")
    print(f"📡 Target API: {API_BASE_URL}")
    print()
    
    # Test basic connectivity first
    if not test_basic_api_connectivity():
        print("❌ Basic connectivity failed. Stopping tests.")
        sys.exit(1)
    
    # Test chiptuning API chain
    success = test_chiptuning_api_chain()
    
    if success:
        print("🎉 ALL TESTS PASSED! The chiptuning API chain is working with live external API.")
        sys.exit(0)
    else:
        print("💥 SOME TESTS FAILED! Check the details above.")
        sys.exit(1)

if __name__ == "__main__":
    main()