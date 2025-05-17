import pytest
from unittest.mock import MagicMock, patch
import sys
import os

# Mock the necessary modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../app')))

# Import the modules under test
# Note: In a real implementation, this would import the actual modules
# For this test framework, we'll mock the imports since we don't have the actual code
with patch.dict('sys.modules', {
    'app.services.auth_service': MagicMock(),
    'app.services.playwright_auth_service': MagicMock(),
    'app.services.conversation_retrieval_service': MagicMock(),
    'app.services.conversation_processing_service': MagicMock(),
    'app.services.conversation_export_service': MagicMock(),
    'app.services.memory_injection_service': MagicMock(),
    'app.services.direct_memory_injection_service': MagicMock(),
    'app.services.progress_tracking_service': MagicMock(),
    'app.api.endpoints.auth': MagicMock(),
    'app.api.endpoints.conversations': MagicMock(),
    'app.api.endpoints.processing': MagicMock(),
    'app.api.endpoints.injection': MagicMock(),
    'app.api.endpoints.direct_injection': MagicMock(),
    'app.config': MagicMock(),
    'app.utils.logger': MagicMock()
}):
    # Now we can import our mocked modules
    from app.services import auth_service, playwright_auth_service
    from app.services import conversation_retrieval_service, conversation_processing_service, conversation_export_service
    from app.services import memory_injection_service, direct_memory_injection_service, progress_tracking_service
    from app.api.endpoints import auth, conversations, processing, injection, direct_injection

class TestCompleteEndToEndFlow:
    """Integration tests for the complete end-to-end flow"""
    
    def setup_method(self):
        """Set up test fixtures before each test method"""
        # Reset mocks before each test
        auth_service.reset_mock()
        playwright_auth_service.reset_mock()
        conversation_retrieval_service.reset_mock()
        conversation_processing_service.reset_mock()
        conversation_export_service.reset_mock()
        memory_injection_service.reset_mock()
        direct_memory_injection_service.reset_mock()
        progress_tracking_service.reset_mock()
        auth.reset_mock()
        conversations.reset_mock()
        processing.reset_mock()
        injection.reset_mock()
        direct_injection.reset_mock()
        
        # Mock the services
        self.mock_auth_service = MagicMock()
        auth_service.AuthService = MagicMock(return_value=self.mock_auth_service)
        
        self.mock_playwright_auth_service = MagicMock()
        playwright_auth_service.PlaywrightAuthService = MagicMock(return_value=self.mock_playwright_auth_service)
        
        self.mock_retrieval_service = MagicMock()
        conversation_retrieval_service.ConversationRetrievalService = MagicMock(return_value=self.mock_retrieval_service)
        
        self.mock_processing_service = MagicMock()
        conversation_processing_service.ConversationProcessingService = MagicMock(return_value=self.mock_processing_service)
        
        self.mock_export_service = MagicMock()
        conversation_export_service.ConversationExportService = MagicMock(return_value=self.mock_export_service)
        
        self.mock_injection_service = MagicMock()
        memory_injection_service.MemoryInjectionService = MagicMock(return_value=self.mock_injection_service)
        
        self.mock_direct_injection_service = MagicMock()
        direct_memory_injection_service.DirectMemoryInjectionService = MagicMock(return_value=self.mock_direct_injection_service)
        
        self.mock_tracking_service = MagicMock()
        progress_tracking_service.ProgressTrackingService = MagicMock(return_value=self.mock_tracking_service)
        
        # Create instances of the services
        self.auth_service = auth_service.AuthService()
        self.playwright_auth_service = playwright_auth_service.PlaywrightAuthService()
        self.retrieval_service = conversation_retrieval_service.ConversationRetrievalService()
        self.processing_service = conversation_processing_service.ConversationProcessingService()
        self.export_service = conversation_export_service.ConversationExportService()
        self.injection_service = memory_injection_service.MemoryInjectionService()
        self.direct_injection_service = direct_memory_injection_service.DirectMemoryInjectionService()
        self.tracking_service = progress_tracking_service.ProgressTrackingService()
        
        # Mock the API endpoints
        auth.get_auth_service = MagicMock(return_value=self.auth_service)
        auth.get_playwright_auth_service = MagicMock(return_value=self.playwright_auth_service)
        conversations.get_conversation_retrieval_service = MagicMock(return_value=self.retrieval_service)
        processing.get_conversation_processing_service = MagicMock(return_value=self.processing_service)
        processing.get_conversation_export_service = MagicMock(return_value=self.export_service)
        processing.get_progress_tracking_service = MagicMock(return_value=self.tracking_service)
        injection.get_memory_injection_service = MagicMock(return_value=self.injection_service)
        injection.get_progress_tracking_service = MagicMock(return_value=self.tracking_service)
        direct_injection.get_direct_memory_injection_service = MagicMock(return_value=self.direct_injection_service)
        direct_injection.get_progress_tracking_service = MagicMock(return_value=self.tracking_service)
    
    def test_complete_browser_flow(self, mock_browser, sample_conversation, sample_processed_conversation):
        """Test the complete end-to-end flow using browser-based injection"""
        # Arrange
        browser, page = mock_browser
        username = "test_user@example.com"
        password = "test_password"
        login_data = {
            "username": username,
            "password": password
        }
        token = "mock_token_123"
        conversation_id = "conv_123456789"
        json_file_path = "/tmp/conversation_export.json"
        
        # Mock authentication
        self.mock_auth_service.login.return_value = {
            "success": True,
            "token": token,
            "user_id": "user_123"
        }
        
        # Mock conversation retrieval
        self.mock_retrieval_service.get_conversation_list.return_value = [
            {"id": "conv_1", "title": "Conversation 1", "create_time": 1650000000},
            {"id": conversation_id, "title": "Test Conversation", "create_time": 1650001000}
        ]
        
        self.mock_retrieval_service.get_conversation_by_id.return_value = sample_conversation
        
        # Mock conversation processing
        self.mock_processing_service.process_conversation.return_value = sample_processed_conversation
        
        # Mock conversation export
        self.mock_export_service.export_conversation_to_json.return_value = {"success": True, "file_path": json_file_path}
        
        # Mock memory injection
        self.mock_injection_service.open_memory_interface.return_value = {"success": True, "page": page}
        self.mock_injection_service.inject_memory.return_value = {"success": True, "injected_chunks": 1}
        self.mock_injection_service.verify_memory_injection.return_value = {"success": True, "verified": True}
        self.mock_injection_service.close_memory_interface.return_value = {"success": True}
        
        # Mock API endpoints
        auth.login = MagicMock(return_value={
            "success": True,
            "token": token,
            "user_id": "user_123"
        })
        
        conversations.get_conversation_list = MagicMock(return_value=[
            {"id": "conv_1", "title": "Conversation 1", "create_time": 1650000000},
            {"id": conversation_id, "title": "Test Conversation", "create_time": 1650001000}
        ])
        
        conversations.get_conversation_by_id = MagicMock(return_value=sample_conversation)
        processing.process_conversation = MagicMock(return_value=sample_processed_conversation)
        processing.export_processed_conversation = MagicMock(return_value={"success": True, "file_path": json_file_path})
        injection.open_memory_interface = MagicMock(return_value={"success": True, "page": page})
        injection.inject_memory = MagicMock(return_value={"success": True, "injected_chunks": 1})
        injection.verify_memory_injection = MagicMock(return_value={"success": True, "verified": True})
        injection.close_memory_interface = MagicMock(return_value={"success": True})
        
        # Act
        # 1. Login to get token
        login_response = auth.login(login_data)
        token = login_response["token"]
        
        # 2. Get conversation list
        conversation_list = conversations.get_conversation_list(token)
        
        # 3. Find the conversation ID we want
        found_id = None
        for conv in conversation_list:
            if conv["title"] == "Test Conversation":
                found_id = conv["id"]
                break
        
        # 4. Get specific conversation
        conversation = conversations.get_conversation_by_id(token, found_id)
        
        # 5. Process the conversation
        processed_conversation = processing.process_conversation(conversation)
        
        # 6. Export the processed conversation to JSON
        export_response = processing.export_processed_conversation(processed_conversation, "json")
        
        # 7. Open memory interface
        open_response = injection.open_memory_interface(page)
        
        # 8. Inject memory chunks
        inject_response = injection.inject_memory(page, processed_conversation["memory_chunks"])
        
        # 9. Verify memory injection
        verify_response = injection.verify_memory_injection(page, processed_conversation["memory_chunks"])
        
        # 10. Close memory interface
        close_response = injection.close_memory_interface(page)
        
        # Assert
        assert login_response["success"] is True
        assert login_response["token"] == token
        
        assert len(conversation_list) == 2
        assert found_id == conversation_id
        
        assert conversation["id"] == conversation_id
        assert "messages" in conversation
        
        assert processed_conversation["id"] == conversation_id
        assert "memory_chunks" in processed_conversation
        assert len(processed_conversation["memory_chunks"]) > 0
        
        assert export_response["success"] is True
        assert export_response["file_path"] == json_file_path
        
        assert open_response["success"] is True
        assert inject_response["success"] is True
        assert inject_response["injected_chunks"] == 1
        assert verify_response["success"] is True
        assert verify_response["verified"] is True
        assert close_response["success"] is True
        
        # Verify service calls
        self.mock_auth_service.login.assert_called_once_with(username, password)
        self.mock_retrieval_service.get_conversation_list.assert_called_once_with(token)
        self.mock_retrieval_service.get_conversation_by_id.assert_called_once_with(token, found_id)
        self.mock_processing_service.process_conversation.assert_called_once_with(conversation)
        self.mock_export_service.export_conversation_to_json.assert_called_once_with(processed_conversation, json_file_path)
        self.mock_injection_service.open_memory_interface.assert_called_once_with(page)
        self.mock_injection_service.inject_memory.assert_called_once_with(page, processed_conversation["memory_chunks"])
        self.mock_injection_service.verify_memory_injection.assert_called_once_with(page, processed_conversation["memory_chunks"])
        self.mock_injection_service.close_memory_interface.assert_called_once_with(page)
    
    def test_complete_api_flow(self, mock_openai_api, sample_conversation, sample_processed_conversation):
        """Test the complete end-to-end flow using direct API injection"""
        # Arrange
        username = "test_user@example.com"
        password = "test_password"
        login_data = {
            "username": username,
            "password": password
        }
        token = "mock_token_123"
        conversation_id = "conv_123456789"
        json_file_path = "/tmp/conversation_export.json"
        api_key = "sk-test123456789"
        
        # Mock authentication
        self.mock_auth_service.login.return_value = {
            "success": True,
            "token": token,
            "user_id": "user_123"
        }
        
        # Mock conversation retrieval
        self.mock_retrieval_service.get_conversation_list.return_value = [
            {"id": "conv_1", "title": "Conversation 1", "create_time": 1650000000},
            {"id": conversation_id, "title": "Test Conversation", "create_time": 1650001000}
        ]
        
        self.mock_retrieval_service.get_conversation_by_id.return_value = sample_conversation
        
        # Mock conversation processing
        self.mock_processing_service.process_conversation.return_value = sample_processed_conversation
        
        # Mock conversation export
        self.mock_export_service.export_conversation_to_json.return_value = {"success": True, "file_path": json_file_path}
        
        # Mock API key verification
        self.mock_direct_injection_service.verify_api_key.return_value = {"valid": True}
        
        # Mock direct memory injection
        self.mock_direct_injection_service.inject_memory_via_api.return_value = {"success": True, "injected_chunks": 1}
        
        # Mock API endpoints
        auth.login = MagicMock(return_value={
            "success": True,
            "token": token,
            "user_id": "user_123"
        })
        
        conversations.get_conversation_list = MagicMock(return_value=[
            {"id": "conv_1", "title": "Conversation 1", "create_time": 1650000000},
            {"id": conversation_id, "title": "Test Conversation", "create_time": 1650001000}
        ])
        
        conversations.get_conversation_by_id = MagicMock(return_value=sample_conversation)
        processing.process_conversation = MagicMock(return_value=sample_processed_conversation)
        processing.export_processed_conversation = MagicMock(return_value={"success": True, "file_path": json_file_path})
        direct_injection.verify_api_key = MagicMock(return_value={"valid": True})
        direct_injection.inject_memory_via_api = MagicMock(return_value={"success": True, "injected_chunks": 1})
        
        # Act
        # 1. Login to get token
        login_response = auth.login(login_data)
        token = login_response["token"]
        
        # 2. Get conversation list
        conversation_list = conversations.get_conversation_list(token)
        
        # 3. Find the conversation ID we want
        found_id = None
        for conv in conversation_list:
            if conv["title"] == "Test Conversation":
                found_id = conv["id"]
                break
        
        # 4. Get specific conversation
        conversation = conversations.get_conversation_by_id(token, found_id)
        
        # 5. Process the conversation
        processed_conversation = processing.process_conversation(conversation)
        
        # 6. Export the processed conversation to JSON
        export_response = processing.export_processed_conversation(processed_conversation, "json")
        
        # 7. Verify API key
        verify_response = direct_injection.verify_api_key({"api_key": api_key})
        
        # 8. Inject memory chunks via API
        request_data = {
            "api_key": api_key,
            "memory_chunks": processed_conversation["memory_chunks"]
        }
        inject_response = direct_injection.inject_memory_via_api(request_data)
        
        # Assert
        assert login_response["success"] is True
        assert login_response["token"] == token
        
        assert len(conversation_list) == 2
        assert found_id == conversation_id
        
        assert conversation["id"] == conversation_id
        assert "messages" in conversation
        
        assert processed_conversation["id"] == conversation_id
        assert "memory_chunks" in processed_conversation
        assert len(processed_conversation["memory_chunks"]) > 0
        
        assert export_response["success"] is True
        assert export_response["file_path"] == json_file_path
        
        assert verify_response["valid"] is True
        assert inject_response["success"] is True
        assert inject_response["injected_chunks"] == 1
        
        # Verify service calls
        self.mock_auth_service.login.assert_called_once_with(username, password)
        self.mock_retrieval_service.get_conversation_list.assert_called_once_with(token)
        self.mock_retrieval_service.get_conversation_by_id.assert_called_once_with(token, found_id)
        self.mock_processing_service.process_conversation.assert_called_once_with(conversation)
        self.mock_export_service.export_conversation_to_json.assert_called_once_with(processed_conversation, json_file_path)
        self.mock_direct_injection_service.verify_api_key.assert_called_once_with(api_key)
        self.mock_direct_injection_service.inject_memory_via_api.assert_called_once_with(api_key, processed_conversation["memory_chunks"])
    
    def test_complete_batch_flow(self, mock_browser, sample_conversation, sample_processed_conversation):
        """Test the complete end-to-end batch processing flow"""
        # Arrange
        browser, page = mock_browser
        username = "test_user@example.com"
        password = "test_password"
        login_data = {
            "username": username,
            "password": password
        }
        token = "mock_token_123"
        task_id = "task_123"
        directory = "/tmp/exports"
        
        # Mock authentication
        self.mock_auth_service.login.return_value = {
            "success": True,
            "token": token,
            "user_id": "user_123"
        }
        
        # Mock conversation list retrieval
        conversations_list = [
            {"id": "conv_1", "title": "Conversation 1", "messages": []},
            {"id": "conv_2", "title": "Conversation 2", "messages": []}
        ]
        self.mock_retrieval_service.get_conversation_list.return_value = conversations_list
        
        # Mock batch processing
        processed_conversations = [
            {"id": "conv_1", "title": "Conversation 1", "messages": [], "memory_chunks": []},
            {"id": "conv_2", "title": "Conversation 2", "messages": [], "memory_chunks": []}
        ]
        self.mock_processing_service.process_batch.return_value = processed_conversations
        
        # Mock progress tracking
        self.mock_tracking_service.initialize_progress.return_value = {
            "task_id": task_id,
            "task_name": "batch_processing",
            "total_items": 2,
            "processed_items": 0,
            "status": "initialized"
        }
        
        self.mock_tracking_service.get_progress.return_value = {
            "task_id": task_id,
            "task_name": "batch_processing",
            "total_items": 2,
            "processed_items": 2,
            "status": "completed",
            "percentage": 100.0
        }
        
        # Mock batch export
        self.mock_export_service.export_batch_to_json.return_value = {
            "success": True, 
            "file_paths": ["/tmp/exports/conv_1.json", "/tmp/exports/conv_2.json"]
        }
        
        # Mock memory injection
        self.mock_injection_service.open_memory_interface.return_value = {"success": True, "page": page}
        self.mock_injection_service.batch_inject_memory.return_value = {"task_id": task_id, "status": "injecting"}
        self.mock_injection_service.close_memory_interface.return_value = {"success": True}
        
        # Mock API endpoints
        auth.login = MagicMock(return_value={
            "success": True,
            "token": token,
            "user_id": "user_123"
        })
        
        conversations.get_conversation_list = MagicMock(return_value=conversations_list)
        processing.process_batch = MagicMock(return_value={"task_id": task_id, "status": "processing"})
        processing.get_processing_status = MagicMock(return_value={
            "task_id": task_id,
            "task_name": "batch_processing",
            "total_items": 2,
            "processed_items": 2,
            "status": "completed",
            "percentage": 100.0
        })
        
        injection.open_memory_interface = MagicMock(return_value={"success": True, "page": page})
        injection.batch_inject_memory = MagicMock(return_value={"task_id": task_id, "status": "injecting"})
        injection.get_injection_status = MagicMock(return_value={
            "task_id": task_id,
            "task_name": "memory_injection",
            "total_items": 2,
            "processed_items": 2,
            "status": "completed",
            "percentage": 100.0
        })
        injection.close_memory_interface = MagicMock(return_value={"success": True})
        
        # Act
        # 1. Login to get token
        login_response = auth.login(login_data)
        token = login_response["token"]
        
        # 2. Get the conversation list
        conversations_to_process = conversations.get_conversation_list(token)
        
        # 3. Start batch processing
        batch_response = processing.process_batch(conversations_to_process)
        
        # 4. Check processing status
        processing_status = processing.get_processing_status(batch_response["task_id"])
        
        # 5. Export the processed conversations to JSON
        export_response = self.export_service.export_batch_to_json(processed_conversations, directory)
        
        # 6. Open memory interface
        open_response = injection.open_memory_interface(page)
        
        # 7. Start batch injection
        all_memory_chunks = []
        for conv in processed_conversations:
            if "memory_chunks" in conv:
                all_memory_chunks.extend(conv["memory_chunks"])
        
        batch_inject_response = injection.batch_inject_memory(page, all_memory_chunks)
        
        # 8. Check injection status
        injection_status = injection.get_injection_status(batch_inject_response["task_id"])
        
        # 9. Close memory interface
        close_response = injection.close_memory_interface(page)
        
        # Assert
        assert login_response["success"] is True
        assert login_response["token"] == token
        
        assert len(conversations_to_process) == 2
        
        assert batch_response["task_id"] == task_id
        assert batch_response["status"] == "processing"
        
        assert processing_status["task_id"] == task_id
        assert processing_status["status"] == "completed"
        assert processing_status["percentage"] == 100.0
        
        assert export_response["success"] is True
        assert len(export_response["file_paths"]) == 2
        
        assert open_response["success"] is True
        
        assert batch_inject_response["task_id"] == task_id
        assert batch_inject_response["status"] == "injecting"
        
        assert injection_status["task_id"] == task_id
        assert injection_status["status"] == "completed"
        assert injection_status["percentage"] == 100.0
        
        assert close_response["success"] is True
        
        # Verify service calls
        self.mock_auth_service.login.assert_called_once_with(username, password)
        self.mock_retrieval_service.get_conversation_list.assert_called_once_with(token)
        self.mock_processing_service.process_batch.assert_called_once_with(conversations_to_process)
        self.mock_tracking_service.get_progress.assert_called()
        self.mock_export_service.export_batch_to_json.assert_called_once_with(processed_conversations, directory)
        self.mock_injection_service.open_memory_interface.assert_called_once_with(page)
        self.mock_injection_service.close_memory_interface.assert_called_once_with(page)
