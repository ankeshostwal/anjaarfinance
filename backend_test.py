#!/usr/bin/env python3
"""
Vehicle Finance App Backend API Testing
Tests all backend endpoints as specified in the review request
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

class VehicleFinanceAPITester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'response_data': response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()

    def test_authentication(self) -> bool:
        """Test 1: Authentication Test"""
        print("=" * 60)
        print("TEST 1: AUTHENTICATION")
        print("=" * 60)
        
        try:
            # Test login endpoint
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json=login_data,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify required fields
                required_fields = ['access_token', 'token_type', 'username']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(
                        "Authentication", 
                        False, 
                        f"Missing required fields: {missing_fields}",
                        data
                    )
                    return False
                
                # Store token for subsequent requests
                self.token = data['access_token']
                self.headers['Authorization'] = f"Bearer {self.token}"
                
                self.log_test(
                    "Authentication", 
                    True, 
                    f"Login successful. Token received. Username: {data['username']}"
                )
                return True
            else:
                self.log_test(
                    "Authentication", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, f"Exception occurred: {str(e)}")
            return False

    def test_contracts_list(self) -> Optional[str]:
        """Test 2: Get Contracts List Test"""
        print("=" * 60)
        print("TEST 2: GET CONTRACTS LIST")
        print("=" * 60)
        
        if not self.token:
            self.log_test("Get Contracts List", False, "No authentication token available")
            return None
            
        try:
            response = requests.get(
                f"{self.base_url}/api/contracts",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test(
                        "Get Contracts List", 
                        False, 
                        "Response is not an array",
                        data
                    )
                    return None
                
                if len(data) == 0:
                    self.log_test(
                        "Get Contracts List", 
                        False, 
                        "No contracts found. Database might be empty."
                    )
                    return None
                
                # Verify required fields in first contract
                required_fields = [
                    'id', 'contract_number', 'customer_name', 'vehicle_name', 
                    'status', 'outstanding_amount', 'emi_amount', 'contract_date'
                ]
                
                first_contract = data[0]
                missing_fields = [field for field in required_fields if field not in first_contract]
                
                if missing_fields:
                    self.log_test(
                        "Get Contracts List", 
                        False, 
                        f"Missing required fields in contract: {missing_fields}",
                        first_contract
                    )
                    return None
                
                self.log_test(
                    "Get Contracts List", 
                    True, 
                    f"Retrieved {len(data)} contracts successfully"
                )
                
                # Return first contract ID for next test
                return first_contract['id']
                
            else:
                self.log_test(
                    "Get Contracts List", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    response.text
                )
                return None
                
        except Exception as e:
            self.log_test("Get Contracts List", False, f"Exception occurred: {str(e)}")
            return None

    def test_contract_details(self, contract_id: str) -> bool:
        """Test 3: Get Contract Details Test"""
        print("=" * 60)
        print("TEST 3: GET CONTRACT DETAILS")
        print("=" * 60)
        
        if not self.token:
            self.log_test("Get Contract Details", False, "No authentication token available")
            return False
            
        if not contract_id:
            self.log_test("Get Contract Details", False, "No contract ID available")
            return False
            
        try:
            response = requests.get(
                f"{self.base_url}/api/contracts/{contract_id}",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify required nested objects and fields
                required_sections = {
                    'customer': ['name', 'phone', 'address', 'photo'],
                    'guarantor': ['name', 'phone', 'address', 'relation', 'photo'],
                    'vehicle': ['make', 'model', 'year', 'registration_number', 'vin', 'color'],
                    'loan': ['loan_amount', 'interest_rate', 'tenure_months', 'emi_amount'],
                    'payment_schedule': []
                }
                
                missing_sections = []
                missing_fields = []
                
                for section, fields in required_sections.items():
                    if section not in data:
                        missing_sections.append(section)
                    elif fields:  # Only check fields if section has required fields
                        for field in fields:
                            if field not in data[section]:
                                missing_fields.append(f"{section}.{field}")
                
                # Check if payment_schedule is an array
                if 'payment_schedule' in data and not isinstance(data['payment_schedule'], list):
                    missing_fields.append("payment_schedule (should be array)")
                
                if missing_sections or missing_fields:
                    error_msg = ""
                    if missing_sections:
                        error_msg += f"Missing sections: {missing_sections}. "
                    if missing_fields:
                        error_msg += f"Missing fields: {missing_fields}"
                    
                    self.log_test(
                        "Get Contract Details", 
                        False, 
                        error_msg,
                        data
                    )
                    return False
                
                self.log_test(
                    "Get Contract Details", 
                    True, 
                    f"Contract details retrieved successfully for ID: {contract_id}"
                )
                return True
                
            else:
                self.log_test(
                    "Get Contract Details", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Get Contract Details", False, f"Exception occurred: {str(e)}")
            return False

    def test_search_functionality(self) -> bool:
        """Test 4: Search Test"""
        print("=" * 60)
        print("TEST 4: SEARCH FUNCTIONALITY")
        print("=" * 60)
        
        if not self.token:
            self.log_test("Search Functionality", False, "No authentication token available")
            return False
            
        try:
            response = requests.get(
                f"{self.base_url}/api/contracts?search=admin",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test(
                        "Search Functionality", 
                        False, 
                        "Response is not an array",
                        data
                    )
                    return False
                
                self.log_test(
                    "Search Functionality", 
                    True, 
                    f"Search completed successfully. Found {len(data)} results for 'admin'"
                )
                return True
                
            else:
                self.log_test(
                    "Search Functionality", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Search Functionality", False, f"Exception occurred: {str(e)}")
            return False

    def test_filter_functionality(self) -> bool:
        """Test 5: Filter Test"""
        print("=" * 60)
        print("TEST 5: FILTER FUNCTIONALITY")
        print("=" * 60)
        
        if not self.token:
            self.log_test("Filter Functionality", False, "No authentication token available")
            return False
            
        try:
            response = requests.get(
                f"{self.base_url}/api/contracts?status_filter=active",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log_test(
                        "Filter Functionality", 
                        False, 
                        "Response is not an array",
                        data
                    )
                    return False
                
                # Verify all returned contracts have 'active' status
                non_active_contracts = [contract for contract in data if contract.get('status') != 'active']
                
                if non_active_contracts:
                    self.log_test(
                        "Filter Functionality", 
                        False, 
                        f"Found {len(non_active_contracts)} non-active contracts in filtered results"
                    )
                    return False
                
                self.log_test(
                    "Filter Functionality", 
                    True, 
                    f"Filter completed successfully. Found {len(data)} active contracts"
                )
                return True
                
            else:
                self.log_test(
                    "Filter Functionality", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Filter Functionality", False, f"Exception occurred: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Vehicle Finance App Backend API Tests")
        print(f"🌐 Backend URL: {self.base_url}")
        print()
        
        # Test 1: Authentication
        auth_success = self.test_authentication()
        
        if not auth_success:
            print("❌ Authentication failed. Cannot proceed with other tests.")
            return self.generate_summary()
        
        # Test 2: Get Contracts List
        contract_id = self.test_contracts_list()
        
        # Test 3: Get Contract Details (only if we have a contract ID)
        if contract_id:
            self.test_contract_details(contract_id)
        
        # Test 4: Search Functionality
        self.test_search_functionality()
        
        # Test 5: Filter Functionality
        self.test_filter_functionality()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            print()
        
        if passed_tests > 0:
            print("✅ PASSED TESTS:")
            for result in self.test_results:
                if result['success']:
                    print(f"  - {result['test']}")
            print()
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'results': self.test_results
        }

def main():
    # Backend URL from the review request
    backend_url = "https://anjaar-finance.preview.emergentagent.com"
    
    tester = VehicleFinanceAPITester(backend_url)
    summary = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    if summary['failed'] > 0:
        sys.exit(1)
    else:
        print("🎉 All tests passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()