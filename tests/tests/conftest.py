import pytest
import os
import sys
from unittest.mock import MagicMock, patch

# Add the app directory to the path so we can import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../app')))

# Common fixtures for all tests

@pytest.fixture
def mock_openai_api():
    """Mock for OpenAI API interactions"""
    with patch('app.services.conversation_retrieval_service.openai') as mock_openai:
        # Configure the mock as needed
        mock_openai.ChatCompletion.create.return_value = {
            'choices': [{'message': {'content': 'Mock response'}}]
        }
        yield mock_openai

@pytest.fixture
def mock_browser():
    """Mock for browser interactions"""
    browser_mock = MagicMock()
    page_mock = MagicMock()
    browser_mock.new_page.return_value = page_mock
    
    with patch('playwright.sync_api.sync_playwright') as mock_playwright:
        mock_playwright.return_value.__enter__.return_value.chromium.launch.return_value = browser_mock
        yield browser_mock, page_mock

@pytest.fixture
def mock_filesystem():
    """Mock for file system operations"""
    with patch('builtins.open', new_callable=MagicMock), \
         patch('os.path.exists', return_value=True), \
         patch('os.makedirs'):
        yield

@pytest.fixture
def sample_conversation():
    """Sample conversation data for testing"""
    return {
        'id': 'conv_123456789',
        'title': 'Test Conversation',
        'create_time': 1650000000,
        'update_time': 1650001000,
        'messages': [
            {
                'id': 'msg_1',
                'role': 'user',
                'content': {'parts': ['Hello, how are you?']},
                'create_time': 1650000000
            },
            {
                'id': 'msg_2',
                'role': 'assistant',
                'content': {'parts': ['I am doing well, thank you for asking!']},
                'create_time': 1650000010
            }
        ]
    }

@pytest.fixture
def sample_processed_conversation():
    """Sample processed conversation data for testing"""
    return {
        'id': 'conv_123456789',
        'title': 'Test Conversation',
        'create_time': '2022-04-15T12:00:00Z',
        'update_time': '2022-04-15T12:16:40Z',
        'messages': [
            {
                'id': 'msg_1',
                'role': 'user',
                'content': 'Hello, how are you?',
                'create_time': '2022-04-15T12:00:00Z'
            },
            {
                'id': 'msg_2',
                'role': 'assistant',
                'content': 'I am doing well, thank you for asking!',
                'create_time': '2022-04-15T12:00:10Z'
            }
        ],
        'memory_chunks': [
            'User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!'
        ]
    }

@pytest.fixture
def mock_websocket():
    """Mock for WebSocket communications"""
    websocket_mock = MagicMock()
    with patch('websockets.connect', return_value=websocket_mock):
        yield websocket_mock
