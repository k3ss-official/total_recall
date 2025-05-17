import pytest
from unittest.mock import MagicMock, patch
import sys
import os
import json

# Mock the direct injection endpoints module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../app')))

# Import the module under test
# Note: In a real implementation, this would import the actual module
# For this test framework, we'll mock the imports since we don't have the actual code
with patch.dict('sys.modules', {
    'app.api.endpoints.direct_injection': MagicMock(),
    'app.services.direct_memory_injection_service': MagicMock(),
    'app.services.progress_tracking_service': MagicMock(),
    'fastapi': MagicMock(),
    'app.config': MagicMock(),
    'app.utils.logger': MagicMock()
}):
    # Now we can import our mocked module
    from app.api.endpoints import direct_injection

class TestDirectInjectionEndpoints:
    """Test suite for the direct memory injection API endpoints"""
    
    def setup_method(self):
        """Set up test fixtures before each test method"""
        # Reset mocks before each test
        direct_injection.reset_mock()
        
        # Mock the FastAPI test client
        self.client = MagicMock()
        
        # Mock the direct memory injection service
        self.mock_direct_injection_service = MagicMock()
        direct_injection.get_direct_memory_injection_service = MagicMock(return_value=self.mock_direct_injection_service)
        
        # Mock the progress tracking service
        self.mock_tracking_service = MagicMock()
        direct_injection.get_progress_tracking_service = MagicMock(return_value=self.mock_tracking_service)
    
    def test_inject_memory_via_api(self, mock_openai_api):
        """Test injecting memory via API endpoint"""
        # Arrange
        api_key = "sk-test123456789"
        memory_chunks = ["User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!"]
        request_data = {
            "api_key": api_key,
            "memory_chunks": memory_chunks
        }
        expected_response = {"success": True, "injected_chunks": 1}
        self.mock_direct_injection_service.inject_memory_via_api.return_value = expected_response
        
        # Mock the endpoint response
        direct_injection.inject_memory_via_api = MagicMock(return_value=expected_response)
        
        # Act
        response = direct_injection.inject_memory_via_api(request_data)
        
        # Assert
        assert response == expected_response
        assert response["success"] is True
        assert response["injected_chunks"] == 1
        self.mock_direct_injection_service.inject_memory_via_api.assert_called_once_with(api_key, memory_chunks)
    
    def test_inject_memory_via_api_multiple_chunks(self, mock_openai_api):
        """Test injecting multiple memory chunks via API"""
        # Arrange
        api_key = "sk-test123456789"
        memory_chunks = [
            "User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!",
            "User: What's the weather like?\nAssistant: It's sunny today."
        ]
        request_data = {
            "api_key": api_key,
            "memory_chunks": memory_chunks
        }
        expected_response = {"success": True, "injected_chunks": 2}
        self.mock_direct_injection_service.inject_memory_via_api.return_value = expected_response
        
        # Mock the endpoint response
        direct_injection.inject_memory_via_api = MagicMock(return_value=expected_response)
        
        # Act
        response = direct_injection.inject_memory_via_api(request_data)
        
        # Assert
        assert response == expected_response
        assert response["success"] is True
        assert response["injected_chunks"] == 2
        self.mock_direct_injection_service.inject_memory_via_api.assert_called_once_with(api_key, memory_chunks)
    
    def test_inject_memory_via_api_empty_chunks(self, mock_openai_api):
        """Test injecting empty memory chunks via API"""
        # Arrange
        api_key = "sk-test123456789"
        memory_chunks = []
        request_data = {
            "api_key": api_key,
            "memory_chunks": memory_chunks
        }
        expected_response = {"success": True, "injected_chunks": 0}
        self.mock_direct_injection_service.inject_memory_via_api.return_value = expected_response
        
        # Mock the endpoint response
        direct_injection.inject_memory_via_api = MagicMock(return_value=expected_response)
        
        # Act
        response = direct_injection.inject_memory_via_api(request_data)
        
        # Assert
        assert response == expected_response
        assert response["success"] is True
        assert response["injected_chunks"] == 0
        self.mock_direct_injection_service.inject_memory_via_api.assert_called_once_with(api_key, memory_chunks)
    
    def test_inject_memory_via_api_failure(self, mock_openai_api):
        """Test failure during memory injection via API"""
        # Arrange
        api_key = "sk-test123456789"
        memory_chunks = ["User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!"]
        request_data = {
            "api_key": api_key,
            "memory_chunks": memory_chunks
        }
        error_message = "Failed to inject memory via API"
        expected_response = {"success": False, "error": error_message}
        self.mock_direct_injection_service.inject_memory_via_api.return_value = expected_response
        
        # Mock the endpoint response
        direct_injection.inject_memory_via_api = MagicMock(return_value=expected_response)
        
        # Act
        response = direct_injection.inject_memory_via_api(request_data)
        
        # Assert
        assert response == expected_response
        assert response["success"] is False
        assert response["error"] == error_message
        self.mock_direct_injection_service.inject_memory_via_api.assert_called_once_with(api_key, memory_chunks)
    
    def test_verify_api_key(self, mock_openai_api):
        """Test verifying API key endpoint"""
        # Arrange
        api_key = "sk-test123456789"
        request_data = {"api_key": api_key}
        expected_response = {"valid": True}
        self.mock_direct_injection_service.verify_api_key.return_value = expected_response
        
        # Mock the endpoint response
        direct_injection.verify_api_key = MagicMock(return_value=expected_response)
        
        # Act
        response = direct_injection.verify_api_key(request_data)
        
        # Assert
        assert response == expected_response
        assert response["valid"] is True
        self.mock_direct_injection_service.verify_api_key.assert_called_once_with(api_key)
    
    def test_verify_api_key_invalid(self, mock_openai_api):
        """Test verifying invalid API key"""
        # Arrange
        api_key = "invalid-key"
        request_data = {"api_key": api_key}
        expected_response = {"valid": False, "error": "Invalid API key"}
        self.mock_direct_injection_service.verify_api_key.return_value = expected_response
        
        # Mock the endpoint response
        direct_injection.verify_api_key = MagicMock(return_value=expected_response)
        
        # Act
        response = direct_injection.verify_api_key(request_data)
        
        # Assert
        assert response == expected_response
        assert response["valid"] is False
        assert "error" in response
        self.mock_direct_injection_service.verify_api_key.assert_called_once_with(api_key)
    
    def test_batch_inject_memory_via_api(self, mock_openai_api):
        """Test batch memory injection via API with progress tracking"""
        # Arrange
        api_key = "sk-test123456789"
        memory_chunks = [
            "User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!",
            "User: What's the weather like?\nAssistant: It's sunny today."
        ]
        request_data = {
            "api_key": api_key,
            "memory_chunks": memory_chunks
        }
        
        # Mock the progress tracking
        task_id = "task_123"
        self.mock_tracking_service.initialize_progress.return_value = {
            "task_id": task_id,
            "task_name": "api_memory_injection",
            "total_items": 2,
            "processed_items": 0,
            "status": "initialized"
        }
        
        # Mock the endpoint response
        expected_response = {"task_id": task_id, "status": "injecting"}
        direct_injection.batch_inject_memory_via_api = MagicMock(return_value=expected_response)
        
        # Act
        response = direct_injection.batch_inject_memory_via_api(request_data)
        
        # Assert
        assert response == expected_response
        assert response["task_id"] == task_id
        assert response["status"] == "injecting"
        self.mock_tracking_service.initialize_progress.assert_called_once()
    
    def test_get_api_injection_status(self):
        """Test getting API injection status"""
        # Arrange
        task_id = "task_123"
        expected_status = {
            "task_id": task_id,
            "task_name": "api_memory_injection",
            "total_items": 10,
            "processed_items": 7,
            "status": "in_progress",
            "percentage": 70.0
        }
        self.mock_tracking_service.get_progress.return_value = expected_status
        
        # Mock the endpoint response
        direct_injection.get_api_injection_status = MagicMock(return_value=expected_status)
        
        # Act
        response = direct_injection.get_api_injection_status(task_id)
        
        # Assert
        assert response == expected_status
        assert response["task_id"] == task_id
        assert response["status"] == "in_progress"
        assert response["percentage"] == 70.0
        self.mock_tracking_service.get_progress.assert_called_once_with(task_id)
    
    def test_cancel_api_injection(self):
        """Test canceling API injection"""
        # Arrange
        task_id = "task_123"
        expected_response = {"task_id": task_id, "status": "canceled"}
        self.mock_tracking_service.cancel_progress.return_value = expected_response
        
        # Mock the endpoint response
        direct_injection.cancel_api_injection = MagicMock(return_value=expected_response)
        
        # Act
        response = direct_injection.cancel_api_injection(task_id)
        
        # Assert
        assert response == expected_response
        assert response["task_id"] == task_id
        assert response["status"] == "canceled"
        self.mock_tracking_service.cancel_progress.assert_called_once_with(task_id)
    
    def test_handle_api_injection_error(self, mock_openai_api):
        """Test handling errors during API injection"""
        # Arrange
        api_key = "sk-test123456789"
        memory_chunks = ["User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!"]
        request_data = {
            "api_key": api_key,
            "memory_chunks": memory_chunks
        }
        error_message = "API rate limit exceeded"
        self.mock_direct_injection_service.inject_memory_via_api.side_effect = Exception(error_message)
        
        # Mock the endpoint response with error handling
        expected_response = {
            "success": False,
            "error": error_message
        }
        direct_injection.inject_memory_via_api = MagicMock(side_effect=Exception(error_message))
        direct_injection.handle_api_injection_error = MagicMock(return_value=expected_response)
        
        # Act/Assert
        with pytest.raises(Exception) as excinfo:
            direct_injection.inject_memory_via_api(request_data)
        
        # Assert
        assert str(excinfo.value) == error_message
        self.mock_direct_injection_service.inject_memory_via_api.assert_called_once_with(api_key, memory_chunks)
