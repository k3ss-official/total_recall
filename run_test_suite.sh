#!/bin/bash

# Test script for Total Recall integrated application
# This script runs the tests and generates a test report

echo "Running Total Recall tests..."
echo "=============================="

# Create test results directory
mkdir -p test_results

# Run unit tests
echo "Running unit tests..."
python run_tests.py --unit > test_results/unit_test_results.txt
UNIT_RESULT=$?

# Run API tests
echo "Running API tests..."
python run_tests.py --api > test_results/api_test_results.txt
API_RESULT=$?

# Run integration tests
echo "Running integration tests..."
python run_tests.py --integration > test_results/integration_test_results.txt
INTEGRATION_RESULT=$?

# Generate test summary
echo "Generating test summary..."
echo "Test Summary" > test_results/test_summary.txt
echo "====================" >> test_results/test_summary.txt
echo "Unit Tests: $([ $UNIT_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')" >> test_results/test_summary.txt
echo "API Tests: $([ $API_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')" >> test_results/test_summary.txt
echo "Integration Tests: $([ $INTEGRATION_RESULT -eq 0 ] && echo 'PASSED' || echo 'FAILED')" >> test_results/test_summary.txt

# Check if all tests passed
if [ $UNIT_RESULT -eq 0 ] && [ $API_RESULT -eq 0 ] && [ $INTEGRATION_RESULT -eq 0 ]; then
    echo "All tests passed!"
    echo "Overall: PASSED" >> test_results/test_summary.txt
    exit 0
else
    echo "Some tests failed. Check test_results directory for details."
    echo "Overall: FAILED" >> test_results/test_summary.txt
    exit 1
fi
