import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationList } from '../../../app/components/conversations/ConversationList';

// Mock the conversation service
jest.mock('../../../app/services/conversation_retrieval_service', () => ({
  getConversationList: jest.fn(),
}));

describe('ConversationList Component', () => {
  const mockGetConversationList = require('../../../app/services/conversation_retrieval_service').getConversationList;
  const mockOnSelectConversation = jest.fn();
  const mockToken = 'test-token-123';
  
  const mockConversations = [
    { id: 'conv1', title: 'Conversation 1', create_time: 1650000000 },
    { id: 'conv2', title: 'Conversation 2', create_time: 1650001000 },
    { id: 'conv3', title: 'Conversation 3', create_time: 1650002000 }
  ];
  
  beforeEach(() => {
    // Reset mocks before each test
    mockGetConversationList.mockReset();
    mockOnSelectConversation.mockReset();
  });
  
  test('renders loading state initially', () => {
    // Mock pending promise
    mockGetConversationList.mockReturnValueOnce(new Promise(() => {}));
    
    render(
      <ConversationList 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Check if loading indicator is shown
    expect(screen.getByText(/loading conversations/i)).toBeInTheDocument();
  });
  
  test('renders conversation list when data is loaded', async () => {
    // Mock successful response
    mockGetConversationList.mockResolvedValueOnce(mockConversations);
    
    render(
      <ConversationList 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Check if service was called with correct token
    expect(mockGetConversationList).toHaveBeenCalledWith(mockToken);
    
    // Wait for conversations to load
    await waitFor(() => {
      expect(screen.getByText('Conversation 1')).toBeInTheDocument();
      expect(screen.getByText('Conversation 2')).toBeInTheDocument();
      expect(screen.getByText('Conversation 3')).toBeInTheDocument();
    });
  });
  
  test('displays formatted dates for conversations', async () => {
    // Mock successful response
    mockGetConversationList.mockResolvedValueOnce(mockConversations);
    
    render(
      <ConversationList 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Wait for conversations to load and check for formatted dates
    await waitFor(() => {
      // The exact format will depend on the implementation, but we can check for date elements
      const dateElements = screen.getAllByTestId('conversation-date');
      expect(dateElements.length).toBe(3);
    });
  });
  
  test('calls onSelectConversation when a conversation is clicked', async () => {
    // Mock successful response
    mockGetConversationList.mockResolvedValueOnce(mockConversations);
    
    render(
      <ConversationList 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Wait for conversations to load
    await waitFor(() => {
      expect(screen.getByText('Conversation 2')).toBeInTheDocument();
    });
    
    // Click on a conversation
    fireEvent.click(screen.getByText('Conversation 2'));
    
    // Check if callback was called with correct conversation
    expect(mockOnSelectConversation).toHaveBeenCalledWith(mockConversations[1]);
  });
  
  test('displays error message when loading fails', async () => {
    // Mock failed response
    mockGetConversationList.mockRejectedValueOnce(new Error('Failed to load conversations'));
    
    render(
      <ConversationList 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/error loading conversations/i)).toBeInTheDocument();
    });
  });
  
  test('displays empty state when no conversations exist', async () => {
    // Mock empty response
    mockGetConversationList.mockResolvedValueOnce([]);
    
    render(
      <ConversationList 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Wait for empty state message
    await waitFor(() => {
      expect(screen.getByText(/no conversations found/i)).toBeInTheDocument();
    });
  });
  
  test('sorts conversations by date in descending order', async () => {
    // Mock unsorted response
    const unsortedConversations = [
      { id: 'conv2', title: 'Conversation 2', create_time: 1650001000 },
      { id: 'conv3', title: 'Conversation 3', create_time: 1650002000 },
      { id: 'conv1', title: 'Conversation 1', create_time: 1650000000 }
    ];
    
    mockGetConversationList.mockResolvedValueOnce(unsortedConversations);
    
    render(
      <ConversationList 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Wait for conversations to load
    await waitFor(() => {
      const conversationItems = screen.getAllByTestId('conversation-item');
      
      // First item should be the most recent (Conversation 3)
      expect(conversationItems[0]).toHaveTextContent('Conversation 3');
      
      // Last item should be the oldest (Conversation 1)
      expect(conversationItems[2]).toHaveTextContent('Conversation 1');
    });
  });
  
  test('refreshes conversation list when refresh button is clicked', async () => {
    // Mock successful responses
    mockGetConversationList.mockResolvedValueOnce(mockConversations);
    
    // Updated list for second call
    const updatedConversations = [
      ...mockConversations,
      { id: 'conv4', title: 'Conversation 4', create_time: 1650003000 }
    ];
    
    mockGetConversationList.mockResolvedValueOnce(updatedConversations);
    
    render(
      <ConversationList 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Wait for initial conversations to load
    await waitFor(() => {
      expect(screen.getByText('Conversation 3')).toBeInTheDocument();
    });
    
    // Click refresh button
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    
    // Service should be called again
    expect(mockGetConversationList).toHaveBeenCalledTimes(2);
    
    // Wait for updated list to load
    await waitFor(() => {
      expect(screen.getByText('Conversation 4')).toBeInTheDocument();
    });
  });
});
