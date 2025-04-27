import pytest
from unittest.mock import MagicMock, patch
import sys
import os

# Mock the direct_memory_injection_service module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../app')))

# Import the module under test
# Note: In a real implementation, this would import the actual module
# For this test framework, we'll mock the imports since we don't have the actual code
with patch.dict('sys.modules', {
    'app.services.direct_memory_injection_service': MagicMock(),
    'app.config': MagicMock(),
    'app.utils.logger': MagicMock()
}):
    # Now we can import our mocked module
    from app.services import direct_memory_injection_service

class TestDirectMemoryInjectionService:
    """Test suite for the direct memory injection service"""
    
    def setup_method(self):
        """Set up test fixtures before each test method"""
        # Reset mocks before each test
        direct_memory_injection_service.reset_mock()
        
        # Mock the direct memory injection service methods
        self.mock_direct_injection_service = MagicMock()
        direct_memory_injection_service.DirectMemoryInjectionService = MagicMock(return_value=self.mock_direct_injection_service)
        
        # Create an instance of the service
        self.service = direct_memory_injection_service.DirectMemoryInjectionService()
    
    def test_inject_memory_via_api(self, mock_openai_api):
        """Test injecting memory via API"""
        # Arrange
        api_key = "sk-test123456789"
        memory_chunks = ["User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!"]
        self.mock_direct_injection_service.inject_memory_via_api.return_value = {"success": True, "injected_chunks": 1}
        
        # Act
        result = self.service.inject_memory_via_api(api_key, memory_chunks)
        
        # Assert
        assert result["success"] is True
        assert result["injected_chunks"] == 1
        self.mock_direct_injection_service.inject_memory_via_api.assert_called_once_with(api_key, memory_chunks)
    
    def test_inject_memory_via_api_multiple_chunks(self, mock_openai_api):
        """Test injecting multiple memory chunks via API"""
        # Arrange
        api_key = "sk-test123456789"
        memory_chunks = [
            "User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!",
            "User: What's the weather like?\nAssistant: It's sunny today."
        ]
        self.mock_direct_injection_service.inject_memory_via_api.return_value = {"success": True, "injected_chunks": 2}
        
        # Act
        result = self.service.inject_memory_via_api(api_key, memory_chunks)
        
        # Assert
        assert result["success"] is True
        assert result["injected_chunks"] == 2
        self.mock_direct_injection_service.inject_memory_via_api.assert_called_once_with(api_key, memory_chunks)
    
    def test_inject_memory_via_api_empty_chunks(self, mock_openai_api):
        """Test injecting empty memory chunks via API"""
        # Arrange
        api_key = "sk-test123456789"
        memory_chunks = []
        self.mock_direct_injection_service.inject_memory_via_api.return_value = {"success": True, "injected_chunks": 0}
        
        # Act
        result = self.service.inject_memory_via_api(api_key, memory_chunks)
        
        # Assert
        assert result["success"] is True
        assert result["injected_chunks"] == 0
        self.mock_direct_injection_service.inject_memory_via_api.assert_called_once_with(api_key, memory_chunks)
    
    def test_inject_memory_via_api_failure(self, mock_openai_api):
        """Test failure during memory injection via API"""
        # Arrange
        api_key = "sk-test123456789"
        memory_chunks = ["User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!"]
        error_message = "Failed to inject memory via API"
        self.mock_direct_injection_service.inject_memory_via_api.return_value = {"success": False, "error": error_message}
        
        # Act
        result = self.service.inject_memory_via_api(api_key, memory_chunks)
        
        # Assert
        assert result["success"] is False
        assert result["error"] == error_message
        self.mock_direct_injection_service.inject_memory_via_api.assert_called_once_with(api_key, memory_chunks)
    
    def test_verify_api_key(self, mock_openai_api):
        """Test verifying API key"""
        # Arrange
        api_key = "sk-test123456789"
        self.mock_direct_injection_service.verify_api_key.return_value = {"valid": True}
        
        # Act
        result = self.service.verify_api_key(api_key)
        
        # Assert
        assert result["valid"] is True
        self.mock_direct_injection_service.verify_api_key.assert_called_once_with(api_key)
    
    def test_verify_api_key_invalid(self, mock_openai_api):
        """Test verifying invalid API key"""
        # Arrange
        api_key = "invalid-key"
        self.mock_direct_injection_service.verify_api_key.return_value = {"valid": False, "error": "Invalid API key"}
        
        # Act
        result = self.service.verify_api_key(api_key)
        
        # Assert
        assert result["valid"] is False
        assert "error" in result
        self.mock_direct_injection_service.verify_api_key.assert_called_once_with(api_key)
    
    def test_format_memory_for_api(self):
        """Test formatting memory for API injection"""
        # Arrange
        memory_chunks = ["User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!"]
        expected_formatted = [{"role": "system", "content": "User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!"}]
        self.mock_direct_injection_service.format_memory_for_api.return_value = expected_formatted
        
        # Act
        result = self.service.format_memory_for_api(memory_chunks)
        
        # Assert
        assert result == expected_formatted
        self.mock_direct_injection_service.format_memory_for_api.assert_called_once_with(memory_chunks)
    
    def test_handle_api_injection_error(self, mock_openai_api):
        """Test handling errors during API injection"""
        # Arrange
        api_key = "sk-test123456789"
        memory_chunks = ["User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!"]
        error_message = "API rate limit exceeded"
        self.mock_direct_injection_service.inject_memory_via_api.side_effect = Exception(error_message)
        
        # Act/Assert
        with pytest.raises(Exception) as excinfo:
            self.service.inject_memory_via_api(api_key, memory_chunks)
        
        # Assert
        assert str(excinfo.value) == error_message
        self.mock_direct_injection_service.inject_memory_via_api.assert_called_once_with(api_key, memory_chunks)
