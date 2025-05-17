#!/usr/bin/env python3
"""
Endpoint Tester - CLI tool for testing protected OpenAI endpoints

This module provides CLI commands for testing various OpenAI endpoints
using the authenticated session token.
"""

import os
import json
import time
import argparse
import requests
from typing import Dict, Any, List, Optional
from pathlib import Path

# Import the TokenManager from token_debugger
try:
    from .token_debugger import TokenManager
except ImportError:
    # When running as a standalone script
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from cli.token_debugger import TokenManager

# Constants
TOKEN_FILE = os.path.expanduser("~/.total_recall/auth/token.json")
ENDPOINTS_FILE = os.path.expanduser("~/.total_recall/config/endpoints.json")
CONFIG_DIR = os.path.dirname(ENDPOINTS_FILE)

# Default endpoints to test
DEFAULT_ENDPOINTS = [
    {
        "name": "Session Info",
        "url": "https://chat.openai.com/api/auth/session",
        "method": "GET",
        "description": "Returns current session information"
    },
    {
        "name": "Conversations",
        "url": "https://chat.openai.com/backend-api/conversations",
        "method": "GET",
        "description": "Returns recent conversation metadata"
    },
    {
        "name": "Models",
        "url": "https://chat.openai.com/backend-api/models",
        "method": "GET",
        "description": "Returns list of available models"
    }
]


class EndpointTester:
    """Tests OpenAI endpoints using the authenticated session token"""
    
    def __init__(self, token_file: str = TOKEN_FILE, endpoints_file: str = ENDPOINTS_FILE):
        """Initialize the endpoint tester"""
        self.token_file = token_file
        self.endpoints_file = endpoints_file
        self.token_manager = TokenManager(token_file)
        self._ensure_config_dir()
        self.endpoints = self._load_endpoints()
        
    def _ensure_config_dir(self):
        """Ensure the configuration directory exists"""
        os.makedirs(os.path.dirname(self.endpoints_file), exist_ok=True)
        
    def _load_endpoints(self) -> List[Dict[str, Any]]:
        """Load endpoints from the endpoints file or use defaults"""
        if os.path.exists(self.endpoints_file):
            try:
                with open(self.endpoints_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading endpoints file: {e}")
                print("Using default endpoints instead.")
                return DEFAULT_ENDPOINTS
        else:
            # Save default endpoints
            self._save_endpoints(DEFAULT_ENDPOINTS)
            return DEFAULT_ENDPOINTS
    
    def _save_endpoints(self, endpoints: List[Dict[str, Any]]) -> None:
        """Save endpoints to the endpoints file"""
        with open(self.endpoints_file, 'w') as f:
            json.dump(endpoints, f, indent=2)
            
    def add_endpoint(self, name: str, url: str, method: str = "GET", 
                    description: str = "") -> None:
        """Add a new endpoint to test"""
        # Check if endpoint with this name already exists
        for endpoint in self.endpoints:
            if endpoint["name"] == name:
                print(f"Endpoint '{name}' already exists. Updating it.")
                endpoint["url"] = url
                endpoint["method"] = method
                endpoint["description"] = description
                self._save_endpoints(self.endpoints)
                return
                
        # Add new endpoint
        self.endpoints.append({
            "name": name,
            "url": url,
            "method": method,
            "description": description
        })
        self._save_endpoints(self.endpoints)
        print(f"Added endpoint: {name}")
    
    def remove_endpoint(self, name: str) -> bool:
        """Remove an endpoint by name"""
        initial_count = len(self.endpoints)
        self.endpoints = [e for e in self.endpoints if e["name"] != name]
        
        if len(self.endpoints) < initial_count:
            self._save_endpoints(self.endpoints)
            print(f"Removed endpoint: {name}")
            return True
        else:
            print(f"Endpoint not found: {name}")
            return False
    
    def list_endpoints(self) -> None:
        """List all configured endpoints"""
        print("\n=== Configured Endpoints ===")
        for i, endpoint in enumerate(self.endpoints, 1):
            print(f"{i}. {endpoint['name']}")
            print(f"   URL: {endpoint['url']}")
            print(f"   Method: {endpoint['method']}")
            if endpoint.get('description'):
                print(f"   Description: {endpoint['description']}")
            print()
    
    def test_endpoint(self, endpoint: Dict[str, Any], token_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test a single endpoint"""
        result = {
            "name": endpoint["name"],
            "url": endpoint["url"],
            "method": endpoint["method"],
            "success": False,
            "status_code": None,
            "response_time": None,
            "error": None,
            "response_preview": None
        }
        
        # Get the access token
        access_token = token_data.get("access_token")
        if not access_token:
            result["error"] = "No access token found"
            return result
        
        # Prepare headers
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Make the request
        start_time = time.time()
        try:
            method = endpoint["method"].upper()
            if method == "GET":
                response = requests.get(endpoint["url"], headers=headers, timeout=10)
            elif method == "POST":
                # For POST requests, we'd need to add body data
                # This is a simplified version
                response = requests.post(endpoint["url"], headers=headers, json={}, timeout=10)
            else:
                result["error"] = f"Unsupported method: {method}"
                return result
                
            # Record response time
            result["response_time"] = round((time.time() - start_time) * 1000)  # ms
            result["status_code"] = response.status_code
            
            # Check if successful
            result["success"] = 200 <= response.status_code < 300
            
            # Get response preview
            try:
                json_response = response.json()
                # Limit the preview to avoid huge outputs
                result["response_preview"] = json.dumps(json_response, indent=2)[:500]
                if len(json.dumps(json_response, indent=2)) > 500:
                    result["response_preview"] += "...(truncated)"
            except Exception:
                # Not JSON or other error
                text_preview = response.text[:500]
                if len(response.text) > 500:
                    text_preview += "...(truncated)"
                result["response_preview"] = text_preview
                
        except requests.exceptions.Timeout:
            result["error"] = "Request timed out"
        except requests.exceptions.ConnectionError:
            result["error"] = "Connection error"
        except Exception as e:
            result["error"] = str(e)
            
        return result
    
    def test_all_endpoints(self) -> List[Dict[str, Any]]:
        """Test all configured endpoints"""
        # Load token data
        token_data = self.token_manager.load_token()
        if not token_data:
            print("No token found. Please authenticate first.")
            return []
            
        # Check if token is expired
        if self.token_manager.is_token_expired(token_data):
            print("Token is expired. Please re-authenticate.")
            return []
            
        results = []
        for endpoint in self.endpoints:
            print(f"Testing endpoint: {endpoint['name']}...")
            result = self.test_endpoint(endpoint, token_data)
            results.append(result)
            
        return results
    
    def test_specific_endpoint(self, name: str) -> Optional[Dict[str, Any]]:
        """Test a specific endpoint by name"""
        # Load token data
        token_data = self.token_manager.load_token()
        if not token_data:
            print("No token found. Please authenticate first.")
            return None
            
        # Check if token is expired
        if self.token_manager.is_token_expired(token_data):
            print("Token is expired. Please re-authenticate.")
            return None
            
        # Find the endpoint
        endpoint = next((e for e in self.endpoints if e["name"] == name), None)
        if not endpoint:
            print(f"Endpoint not found: {name}")
            return None
            
        print(f"Testing endpoint: {endpoint['name']}...")
        return self.test_endpoint(endpoint, token_data)


def test_endpoints(args):
    """Test all configured endpoints"""
    tester = EndpointTester(args.token_file, args.endpoints_file)
    results = tester.test_all_endpoints()
    
    if not results:
        return
    
    # Display results in a table format
    print("\n=== Endpoint Test Results ===")
    print(f"{'Name':<20} {'Status':<10} {'Code':<6} {'Time (ms)':<10} {'Result'}")
    print("-" * 80)
    
    for result in results:
        status = "✓ SUCCESS" if result["success"] else "✗ FAILED"
        code = result["status_code"] if result["status_code"] else "N/A"
        time_ms = result["response_time"] if result["response_time"] else "N/A"
        error = result["error"] if result["error"] else ""
        
        print(f"{result['name'][:20]:<20} {status:<10} {code:<6} {time_ms:<10} {error}")
    
    print("\nFor detailed responses, use the 'test-endpoint' command with a specific endpoint name.")


def test_endpoint(args):
    """Test a specific endpoint"""
    tester = EndpointTester(args.token_file, args.endpoints_file)
    result = tester.test_specific_endpoint(args.name)
    
    if not result:
        return
    
    # Display detailed result
    print("\n=== Endpoint Test Result ===")
    print(f"Name: {result['name']}")
    print(f"URL: {result['url']}")
    print(f"Method: {result['method']}")
    print(f"Success: {'Yes' if result['success'] else 'No'}")
    print(f"Status Code: {result['status_code']}")
    print(f"Response Time: {result['response_time']} ms")
    
    if result["error"]:
        print(f"Error: {result['error']}")
    
    if result["response_preview"]:
        print("\n=== Response Preview ===")
        print(result["response_preview"])


def add_endpoint(args):
    """Add a new endpoint to test"""
    tester = EndpointTester(args.token_file, args.endpoints_file)
    tester.add_endpoint(args.name, args.url, args.method, args.description)


def remove_endpoint(args):
    """Remove an endpoint"""
    tester = EndpointTester(args.token_file, args.endpoints_file)
    tester.remove_endpoint(args.name)


def list_endpoints(args):
    """List all configured endpoints"""
    tester = EndpointTester(args.token_file, args.endpoints_file)
    tester.list_endpoints()


def main():
    """Main entry point for the endpoint tester CLI"""
    parser = argparse.ArgumentParser(description="OpenAI Endpoint Tester")
    parser.add_argument('--token-file', default=TOKEN_FILE, 
                        help=f"Path to token file (default: {TOKEN_FILE})")
    parser.add_argument('--endpoints-file', default=ENDPOINTS_FILE,
                        help=f"Path to endpoints file (default: {ENDPOINTS_FILE})")
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # test-endpoints command
    test_all_parser = subparsers.add_parser('test-endpoints', 
                                          help='Test all configured endpoints')
    test_all_parser.set_defaults(func=test_endpoints)
    
    # test-endpoint command
    test_parser = subparsers.add_parser('test-endpoint', 
                                      help='Test a specific endpoint')
    test_parser.add_argument('name', help='Name of the endpoint to test')
    test_parser.set_defaults(func=test_endpoint)
    
    # add-endpoint command
    add_parser = subparsers.add_parser('add-endpoint', 
                                     help='Add a new endpoint to test')
    add_parser.add_argument('name', help='Name of the endpoint')
    add_parser.add_argument('url', help='URL of the endpoint')
    add_parser.add_argument('--method', default='GET', 
                          help='HTTP method (default: GET)')
    add_parser.add_argument('--description', default='', 
                          help='Description of the endpoint')
    add_parser.set_defaults(func=add_endpoint)
    
    # remove-endpoint command
    remove_parser = subparsers.add_parser('remove-endpoint', 
                                        help='Remove an endpoint')
    remove_parser.add_argument('name', help='Name of the endpoint to remove')
    remove_parser.set_defaults(func=remove_endpoint)
    
    # list-endpoints command
    list_parser = subparsers.add_parser('list-endpoints', 
                                      help='List all configured endpoints')
    list_parser.set_defaults(func=list_endpoints)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        return
    
    args.func(args)


if __name__ == "__main__":
    main()
