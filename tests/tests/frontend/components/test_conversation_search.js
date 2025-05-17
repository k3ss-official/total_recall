import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationSearch } from '../../../app/components/conversations/ConversationSearch';

// Mock the conversation service
jest.mock('../../../app/services/conversation_retrieval_service', () => ({
  searchConversations: jest.fn(),
}));

describe('ConversationSearch Component', () => {
  const mockSearchConversations = require('../../../app/services/conversation_retrieval_service').searchConversations;
  const mockOnSelectConversation = jest.fn();
  const mockToken = 'test-token-123';
  
  const mockSearchResults = [
    { id: 'conv1', title: 'Python Programming', create_time: 1650000000 },
    { id: 'conv2', title: 'Python Data Science', create_time: 1650001000 },
    { id: 'conv3', title: 'JavaScript Basics', create_time: 1650002000 }
  ];
  
  beforeEach(() => {
    // Reset mocks before each test
    mockSearchConversations.mockReset();
    mockOnSelectConversation.mockReset();
  });
  
  test('renders search input correctly', () => {
    render(
      <ConversationSearch 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Check if search input is rendered
    expect(screen.getByPlaceholderText(/search conversations/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });
  
  test('performs search when form is submitted', async () => {
    // Mock successful search response
    mockSearchConversations.mockResolvedValueOnce(mockSearchResults);
    
    render(
      <ConversationSearch 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Get form elements
    const searchInput = screen.getByPlaceholderText(/search conversations/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Fill in search query
    fireEvent.change(searchInput, { target: { value: 'python' } });
    
    // Submit the form
    fireEvent.click(searchButton);
    
    // Check if search service was called with correct parameters
    expect(mockSearchConversations).toHaveBeenCalledWith(mockToken, 'python');
    
    // Wait for search results to load
    await waitFor(() => {
      expect(screen.getByText('Python Programming')).toBeInTheDocument();
      expect(screen.getByText('Python Data Science')).toBeInTheDocument();
      expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
    });
  });
  
  test('displays loading state during search', async () => {
    // Mock search with delay to simulate network request
    mockSearchConversations.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(mockSearchResults);
        }, 100);
      });
    });
    
    render(
      <ConversationSearch 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Get form elements
    const searchInput = screen.getByPlaceholderText(/search conversations/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Fill in search query
    fireEvent.change(searchInput, { target: { value: 'python' } });
    
    // Submit the form
    fireEvent.click(searchButton);
    
    // Check if loading indicator is shown
    expect(screen.getByText(/searching/i)).toBeInTheDocument();
    
    // Wait for search results to load
    await waitFor(() => {
      expect(screen.getByText('Python Programming')).toBeInTheDocument();
    });
  });
  
  test('calls onSelectConversation when a search result is clicked', async () => {
    // Mock successful search response
    mockSearchConversations.mockResolvedValueOnce(mockSearchResults);
    
    render(
      <ConversationSearch 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Get form elements
    const searchInput = screen.getByPlaceholderText(/search conversations/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Fill in search query
    fireEvent.change(searchInput, { target: { value: 'python' } });
    
    // Submit the form
    fireEvent.click(searchButton);
    
    // Wait for search results to load
    await waitFor(() => {
      expect(screen.getByText('Python Data Science')).toBeInTheDocument();
    });
    
    // Click on a search result
    fireEvent.click(screen.getByText('Python Data Science'));
    
    // Check if callback was called with correct conversation
    expect(mockOnSelectConversation).toHaveBeenCalledWith(mockSearchResults[1]);
  });
  
  test('displays error message when search fails', async () => {
    // Mock failed search response
    mockSearchConversations.mockRejectedValueOnce(new Error('Search failed'));
    
    render(
      <ConversationSearch 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Get form elements
    const searchInput = screen.getByPlaceholderText(/search conversations/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Fill in search query
    fireEvent.change(searchInput, { target: { value: 'python' } });
    
    // Submit the form
    fireEvent.click(searchButton);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/error performing search/i)).toBeInTheDocument();
    });
  });
  
  test('displays message when no search results found', async () => {
    // Mock empty search results
    mockSearchConversations.mockResolvedValueOnce([]);
    
    render(
      <ConversationSearch 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Get form elements
    const searchInput = screen.getByPlaceholderText(/search conversations/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Fill in search query
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    // Submit the form
    fireEvent.click(searchButton);
    
    // Wait for no results message
    await waitFor(() => {
      expect(screen.getByText(/no conversations found/i)).toBeInTheDocument();
    });
  });
  
  test('does not perform search with empty query', () => {
    render(
      <ConversationSearch 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Get form elements
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Submit the form without entering a query
    fireEvent.click(searchButton);
    
    // Search service should not be called
    expect(mockSearchConversations).not.toHaveBeenCalled();
  });
  
  test('clears search results when clear button is clicked', async () => {
    // Mock successful search response
    mockSearchConversations.mockResolvedValueOnce(mockSearchResults);
    
    render(
      <ConversationSearch 
        token={mockToken} 
        onSelectConversation={mockOnSelectConversation} 
      />
    );
    
    // Get form elements
    const searchInput = screen.getByPlaceholderText(/search conversations/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Fill in search query
    fireEvent.change(searchInput, { target: { value: 'python' } });
    
    // Submit the form
    fireEvent.click(searchButton);
    
    // Wait for search results to load
    await waitFor(() => {
      expect(screen.getByText('Python Programming')).toBeInTheDocument();
    });
    
    // Click clear button
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    
    // Search results should be cleared
    expect(screen.queryByText('Python Programming')).not.toBeInTheDocument();
    
    // Search input should be cleared
    expect(searchInput.value).toBe('');
  });
});
