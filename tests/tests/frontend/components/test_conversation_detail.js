import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationDetail } from '../../../app/components/conversations/ConversationDetail';

// Mock the conversation service
jest.mock('../../../app/services/conversation_retrieval_service', () => ({
  getConversationById: jest.fn(),
}));

describe('ConversationDetail Component', () => {
  const mockGetConversationById = require('../../../app/services/conversation_retrieval_service').getConversationById;
  const mockToken = 'test-token-123';
  const mockConversationId = 'conv123';
  
  const mockConversation = {
    id: mockConversationId,
    title: 'Test Conversation',
    create_time: 1650000000,
    update_time: 1650001000,
    messages: [
      { role: 'user', content: 'Hello, how are you?', timestamp: 1650000100 },
      { role: 'assistant', content: 'I am doing well, thank you for asking!', timestamp: 1650000200 },
      { role: 'user', content: 'What can you help me with today?', timestamp: 1650000300 },
      { role: 'assistant', content: 'I can help you with a variety of tasks. What do you have in mind?', timestamp: 1650000400 }
    ]
  };
  
  beforeEach(() => {
    // Reset mocks before each test
    mockGetConversationById.mockReset();
  });
  
  test('renders loading state initially', () => {
    // Mock pending promise
    mockGetConversationById.mockReturnValueOnce(new Promise(() => {}));
    
    render(
      <ConversationDetail 
        token={mockToken} 
        conversationId={mockConversationId} 
      />
    );
    
    // Check if loading indicator is shown
    expect(screen.getByText(/loading conversation/i)).toBeInTheDocument();
  });
  
  test('renders conversation details when data is loaded', async () => {
    // Mock successful response
    mockGetConversationById.mockResolvedValueOnce(mockConversation);
    
    render(
      <ConversationDetail 
        token={mockToken} 
        conversationId={mockConversationId} 
      />
    );
    
    // Check if service was called with correct parameters
    expect(mockGetConversationById).toHaveBeenCalledWith(mockToken, mockConversationId);
    
    // Wait for conversation to load
    await waitFor(() => {
      // Check for conversation title
      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
      
      // Check for messages
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
      expect(screen.getByText('I am doing well, thank you for asking!')).toBeInTheDocument();
      expect(screen.getByText('What can you help me with today?')).toBeInTheDocument();
      expect(screen.getByText('I can help you with a variety of tasks. What do you have in mind?')).toBeInTheDocument();
    });
  });
  
  test('displays formatted timestamps for messages', async () => {
    // Mock successful response
    mockGetConversationById.mockResolvedValueOnce(mockConversation);
    
    render(
      <ConversationDetail 
        token={mockToken} 
        conversationId={mockConversationId} 
      />
    );
    
    // Wait for conversation to load and check for formatted timestamps
    await waitFor(() => {
      // The exact format will depend on the implementation, but we can check for timestamp elements
      const timestampElements = screen.getAllByTestId('message-timestamp');
      expect(timestampElements.length).toBe(4);
    });
  });
  
  test('displays different styling for user and assistant messages', async () => {
    // Mock successful response
    mockGetConversationById.mockResolvedValueOnce(mockConversation);
    
    render(
      <ConversationDetail 
        token={mockToken} 
        conversationId={mockConversationId} 
      />
    );
    
    // Wait for conversation to load
    await waitFor(() => {
      // Check for user message elements
      const userMessages = screen.getAllByTestId('user-message');
      expect(userMessages.length).toBe(2);
      
      // Check for assistant message elements
      const assistantMessages = screen.getAllByTestId('assistant-message');
      expect(assistantMessages.length).toBe(2);
      
      // User and assistant messages should have different styling classes
      expect(userMessages[0].className).not.toBe(assistantMessages[0].className);
    });
  });
  
  test('displays error message when loading fails', async () => {
    // Mock failed response
    mockGetConversationById.mockRejectedValueOnce(new Error('Failed to load conversation'));
    
    render(
      <ConversationDetail 
        token={mockToken} 
        conversationId={mockConversationId} 
      />
    );
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/error loading conversation/i)).toBeInTheDocument();
    });
  });
  
  test('displays empty state when conversation has no messages', async () => {
    // Mock empty conversation
    const emptyConversation = {
      id: mockConversationId,
      title: 'Empty Conversation',
      create_time: 1650000000,
      update_time: 1650001000,
      messages: []
    };
    
    mockGetConversationById.mockResolvedValueOnce(emptyConversation);
    
    render(
      <ConversationDetail 
        token={mockToken} 
        conversationId={mockConversationId} 
      />
    );
    
    // Wait for empty state message
    await waitFor(() => {
      expect(screen.getByText(/no messages in this conversation/i)).toBeInTheDocument();
    });
  });
  
  test('reloads conversation when conversationId prop changes', async () => {
    // Mock successful responses for different conversation IDs
    mockGetConversationById.mockResolvedValueOnce(mockConversation);
    
    const secondConversation = {
      id: 'conv456',
      title: 'Second Conversation',
      create_time: 1650010000,
      update_time: 1650011000,
      messages: [
        { role: 'user', content: 'This is a different conversation', timestamp: 1650010100 },
        { role: 'assistant', content: 'Indeed it is!', timestamp: 1650010200 }
      ]
    };
    
    mockGetConversationById.mockResolvedValueOnce(secondConversation);
    
    const { rerender } = render(
      <ConversationDetail 
        token={mockToken} 
        conversationId={mockConversationId} 
      />
    );
    
    // Wait for first conversation to load
    await waitFor(() => {
      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    });
    
    // Rerender with different conversation ID
    rerender(
      <ConversationDetail 
        token={mockToken} 
        conversationId="conv456" 
      />
    );
    
    // Service should be called again with new ID
    expect(mockGetConversationById).toHaveBeenCalledWith(mockToken, 'conv456');
    
    // Wait for second conversation to load
    await waitFor(() => {
      expect(screen.getByText('Second Conversation')).toBeInTheDocument();
      expect(screen.getByText('This is a different conversation')).toBeInTheDocument();
      expect(screen.getByText('Indeed it is!')).toBeInTheDocument();
    });
  });
});
