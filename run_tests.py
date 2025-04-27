#!/usr/bin/env python3
"""
Total Recall Test Runner

This script runs tests for the Total Recall application.
It supports running unit tests, API tests, integration tests, and frontend tests.
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

# Define test directories
TEST_DIR = Path(__file__).parent / "tests"
UNIT_TEST_DIR = TEST_DIR / "unit"
API_TEST_DIR = TEST_DIR / "api"
INTEGRATION_TEST_DIR = TEST_DIR / "integration"
FRONTEND_TEST_DIR = TEST_DIR / "frontend"

def run_python_tests(test_dir, verbose=False):
    """Run Python tests using pytest"""
    print(f"\n{'='*80}")
    print(f"Running tests in {test_dir}")
    print(f"{'='*80}")
    
    cmd = ["pytest", str(test_dir)]
    if verbose:
        cmd.append("-v")
    
    result = subprocess.run(cmd)
    return result.returncode == 0

def run_frontend_tests(verbose=False):
    """Run frontend tests using Jest"""
    print(f"\n{'='*80}")
    print(f"Running frontend tests")
    print(f"{'='*80}")
    
    cmd = ["npm", "test"]
    if verbose:
        cmd.append("--verbose")
    
    # Change to the frontend directory
    cwd = os.getcwd()
    os.chdir("frontend")
    
    try:
        result = subprocess.run(cmd)
        success = result.returncode == 0
    finally:
        # Change back to the original directory
        os.chdir(cwd)
    
    return success

def run_all_tests(verbose=False):
    """Run all tests"""
    unit_success = run_python_tests(UNIT_TEST_DIR, verbose)
    api_success = run_python_tests(API_TEST_DIR, verbose)
    integration_success = run_python_tests(INTEGRATION_TEST_DIR, verbose)
    frontend_success = run_frontend_tests(verbose)
    
    all_success = unit_success and api_success and integration_success and frontend_success
    
    print(f"\n{'='*80}")
    print("Test Summary")
    print(f"{'='*80}")
    print(f"Unit Tests: {'PASSED' if unit_success else 'FAILED'}")
    print(f"API Tests: {'PASSED' if api_success else 'FAILED'}")
    print(f"Integration Tests: {'PASSED' if integration_success else 'FAILED'}")
    print(f"Frontend Tests: {'PASSED' if frontend_success else 'FAILED'}")
    print(f"\nOverall: {'PASSED' if all_success else 'FAILED'}")
    
    return all_success

def main():
    parser = argparse.ArgumentParser(description="Run tests for Total Recall")
    parser.add_argument("--unit", action="store_true", help="Run unit tests")
    parser.add_argument("--api", action="store_true", help="Run API tests")
    parser.add_argument("--integration", action="store_true", help="Run integration tests")
    parser.add_argument("--frontend", action="store_true", help="Run frontend tests")
    parser.add_argument("--all", action="store_true", help="Run all tests")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
    
    args = parser.parse_args()
    
    # If no specific test type is specified, run all tests
    if not (args.unit or args.api or args.integration or args.frontend or args.all):
        args.all = True
    
    success = True
    
    if args.unit:
        success = run_python_tests(UNIT_TEST_DIR, args.verbose) and success
    
    if args.api:
        success = run_python_tests(API_TEST_DIR, args.verbose) and success
    
    if args.integration:
        success = run_python_tests(INTEGRATION_TEST_DIR, args.verbose) and success
    
    if args.frontend:
        success = run_frontend_tests(args.verbose) and success
    
    if args.all:
        success = run_all_tests(args.verbose)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
