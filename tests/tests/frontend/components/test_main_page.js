import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MainPage } from '../../../app/components/main/MainPage';

// Mock all required services
jest.mock('../../../app/services/auth_service', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  verifyToken: jest.fn(),
}));

jest.mock('../../../app/services/conversation_retrieval_service', () => ({
  getConversationList: jest.fn(),
  getConversationById: jest.fn(),
  searchConversations: jest.fn(),
}));

jest.mock('../../../app/services/conversation_processing_service', () => ({
  processConversation: jest.fn(),
}));

jest.mock('../../../app/services/memory_injection_service', () => ({
  openMemoryInterface: jest.fn(),
  injectMemory: jest.fn(),
  verifyMemoryInjection: jest.fn(),
  closeMemoryInterface: jest.fn(),
}));

describe('MainPage Component', () => {
  // Mock service functions
  const mockLogin = require('../../../app/services/auth_service').login;
  const mockLogout = require('../../../app/services/auth_service').logout;
  const mockVerifyToken = require('../../../app/services/auth_service').verifyToken;
  const mockGetConversationList = require('../../../app/services/conversation_retrieval_service').getConversationList;
  const mockGetConversationById = require('../../../app/services/conversation_retrieval_service').getConversationById;
  const mockSearchConversations = require('../../../app/services/conversation_retrieval_service').searchConversations;
  const mockProcessConversation = require('../../../app/services/conversation_processing_service').processConversation;
  const mockOpenMemoryInterface = require('../../../app/services/memory_injection_service').openMemoryInterface;
  const mockInjectMemory = require('../../../app/services/memory_injection_service').injectMemory;
  const mockVerifyMemoryInjection = require('../../../app/services/memory_injection_service').verifyMemoryInjection;
  const mockCloseMemoryInterface = require('../../../app/services/memory_injection_service').closeMemoryInterface;
  
  // Mock data
  const mockToken = 'test-token-123';
  const mockUser = { id: 'user123', name: 'Test User' };
  
  const mockConversations = [
    { id: 'conv1', title: 'Conversation 1', create_time: 1650000000 },
    { id: 'conv2', title: 'Conversation 2', create_time: 1650001000 },
    { id: 'conv3', title: 'Conversation 3', create_time: 1650002000 }
  ];
  
  const mockConversation = {
    id: 'conv1',
    title: 'Conversation 1',
    create_time: 1650000000,
    messages: [
      { role: 'user', content: 'Hello', timestamp: 1650000100 },
      { role: 'assistant', content: 'Hi there!', timestamp: 1650000200 }
    ]
  };
  
  const mockProcessedConversation = {
    id: 'conv1',
    title: 'Conversation 1',
    create_time: 1650000000,
    messages: [
      { role: 'user', content: 'Hello', timestamp: 1650000100 },
      { role: 'assistant', content: 'Hi there!', timestamp: 1650000200 }
    ],
    memory_chunks: [
      "User: Hello\nAssistant: Hi there!"
    ]
  };
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
  });
  
  test('renders login form when not authenticated', () => {
    // Mock localStorage to return no token
    window.localStorage.getItem.mockReturnValueOnce(null);
    
    render(<MainPage />);
    
    // Check if login form is rendered
    expect(screen.getByText(/login to total recall/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
  
  test('logs in and renders main interface', async () => {
    // Mock localStorage to return no token initially
    window.localStorage.getItem.mockReturnValueOnce(null);
    
    // Mock successful login
    mockLogin.mockResolvedValueOnce({
      success: true,
      token: mockToken,
      user: mockUser
    });
    
    // Mock successful conversation list retrieval
    mockGetConversationList.mockResolvedValueOnce(mockConversations);
    
    render(<MainPage />);
    
    // Get login form elements
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });
    
    // Fill in login form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit login form
    fireEvent.click(loginButton);
    
    // Check if login service was called
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // Wait for main interface to render
    await waitFor(() => {
      // Check for main interface elements
      expect(screen.getByText(/total recall dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      
      // Check for conversation list
      expect(screen.getByText('Conversation 1')).toBeInTheDocument();
      expect(screen.getByText('Conversation 2')).toBeInTheDocument();
      expect(screen.getByText('Conversation 3')).toBeInTheDocument();
    });
    
    // Check if token was stored in localStorage
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
  });
  
  test('loads authenticated state from localStorage', async () => {
    // Mock localStorage to return a token
    window.localStorage.getItem.mockReturnValueOnce(mockToken);
    
    // Mock successful token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: true,
      user: mockUser
    });
    
    // Mock successful conversation list retrieval
    mockGetConversationList.mockResolvedValueOnce(mockConversations);
    
    render(<MainPage />);
    
    // Wait for main interface to render
    await waitFor(() => {
      // Check for main interface elements
      expect(screen.getByText(/total recall dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument();
      
      // Check for conversation list
      expect(screen.getByText('Conversation 1')).toBeInTheDocument();
    });
    
    // Check if token verification was called
    expect(mockVerifyToken).toHaveBeenCalledWith(mockToken);
  });
  
  test('logs out and returns to login form', async () => {
    // Mock localStorage to return a token
    window.localStorage.getItem.mockReturnValueOnce(mockToken);
    
    // Mock successful token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: true,
      user: mockUser
    });
    
    // Mock successful conversation list retrieval
    mockGetConversationList.mockResolvedValueOnce(mockConversations);
    
    // Mock successful logout
    mockLogout.mockResolvedValueOnce({
      success: true
    });
    
    render(<MainPage />);
    
    // Wait for main interface to render
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });
    
    // Click logout button
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    
    // Check if logout service was called
    expect(mockLogout).toHaveBeenCalledWith(mockToken);
    
    // Wait for login form to render
    await waitFor(() => {
      expect(screen.getByText(/login to total recall/i)).toBeInTheDocument();
    });
    
    // Check if token was removed from localStorage
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
  });
  
  test('selects and displays a conversation', async () => {
    // Mock localStorage to return a token
    window.localStorage.getItem.mockReturnValueOnce(mockToken);
    
    // Mock successful token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: true,
      user: mockUser
    });
    
    // Mock successful conversation list retrieval
    mockGetConversationList.mockResolvedValueOnce(mockConversations);
    
    // Mock successful conversation retrieval
    mockGetConversationById.mockResolvedValueOnce(mockConversation);
    
    render(<MainPage />);
    
    // Wait for conversation list to render
    await waitFor(() => {
      expect(screen.getByText('Conversation 1')).toBeInTheDocument();
    });
    
    // Click on a conversation
    fireEvent.click(screen.getByText('Conversation 1'));
    
    // Check if conversation retrieval service was called
    expect(mockGetConversationById).toHaveBeenCalledWith(mockToken, 'conv1');
    
    // Wait for conversation detail to render
    await waitFor(() => {
      // Check for conversation messages
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
  });
  
  test('processes a conversation and shows injection interface', async () => {
    // Mock localStorage to return a token
    window.localStorage.getItem.mockReturnValueOnce(mockToken);
    
    // Mock successful token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: true,
      user: mockUser
    });
    
    // Mock successful conversation list retrieval
    mockGetConversationList.mockResolvedValueOnce(mockConversations);
    
    // Mock successful conversation retrieval
    mockGetConversationById.mockResolvedValueOnce(mockConversation);
    
    // Mock successful conversation processing
    mockProcessConversation.mockResolvedValueOnce(mockProcessedConversation);
    
    render(<MainPage />);
    
    // Wait for conversation list to render
    await waitFor(() => {
      expect(screen.getByText('Conversation 1')).toBeInTheDocument();
    });
    
    // Click on a conversation
    fireEvent.click(screen.getByText('Conversation 1'));
    
    // Wait for conversation detail to render
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
    
    // Click process button
    fireEvent.click(screen.getByRole('button', { name: /process conversation/i }));
    
    // Check if processing service was called
    expect(mockProcessConversation).toHaveBeenCalledWith(mockConversation);
    
    // Wait for processing to complete and injection interface to render
    await waitFor(() => {
      expect(screen.getByText(/1 memory chunks ready/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start injection/i })).toBeInTheDocument();
    });
  });
  
  test('completes full injection workflow', async () => {
    // Mock localStorage to return a token
    window.localStorage.getItem.mockReturnValueOnce(mockToken);
    
    // Mock successful token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: true,
      user: mockUser
    });
    
    // Mock successful conversation list retrieval
    mockGetConversationList.mockResolvedValueOnce(mockConversations);
    
    // Mock successful conversation retrieval
    mockGetConversationById.mockResolvedValueOnce(mockConversation);
    
    // Mock successful conversation processing
    mockProcessConversation.mockResolvedValueOnce(mockProcessedConversation);
    
    // Mock successful memory injection steps
    mockOpenMemoryInterface.mockResolvedValueOnce({
      success: true,
      page: { /* mock page object */ }
    });
    
    mockInjectMemory.mockResolvedValueOnce({
      success: true,
      injected_chunks: 1
    });
    
    mockVerifyMemoryInjection.mockResolvedValueOnce({
      success: true,
      verified: true
    });
    
    mockCloseMemoryInterface.mockResolvedValueOnce({
      success: true
    });
    
    render(<MainPage />);
    
    // Wait for conversation list to render
    await waitFor(() => {
      expect(screen.getByText('Conversation 1')).toBeInTheDocument();
    });
    
    // Click on a conversation
    fireEvent.click(screen.getByText('Conversation 1'));
    
    // Wait for conversation detail to render
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
    
    // Click process button
    fireEvent.click(screen.getByRole('button', { name: /process conversation/i }));
    
    // Wait for injection interface to render
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start injection/i })).toBeInTheDocument();
    });
    
    // Click start injection button
    fireEvent.click(screen.getByRole('button', { name: /start injection/i }));
    
    // Wait for interface to open
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /inject memory/i })).toBeInTheDocument();
    });
    
    // Click inject memory button
    fireEvent.click(screen.getByRole('button', { name: /inject memory/i }));
    
    // Wait for injection to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify injection/i })).toBeInTheDocument();
    });
    
    // Click verify button
    fireEvent.click(screen.getByRole('button', { name: /verify injection/i }));
    
    // Wait for verification to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close interface/i })).toBeInTheDocument();
    });
    
    // Click close button
    fireEvent.click(screen.getByRole('button', { name: /close interface/i }));
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/injection completed successfully/i)).toBeInTheDocument();
    });
  });
  
  test('handles search functionality', async () => {
    // Mock localStorage to return a token
    window.localStorage.getItem.mockReturnValueOnce(mockToken);
    
    // Mock successful token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: true,
      user: mockUser
    });
    
    // Mock successful conversation list retrieval
    mockGetConversationList.mockResolvedValueOnce(mockConversations);
    
    // Mock successful search results
    const searchResults = [
      { id: 'conv4', title: 'Python Tutorial', create_time: 1650003000 },
      { id: 'conv5', title: 'Python Projects', create_time: 1650004000 }
    ];
    
    mockSearchConversations.mockResolvedValueOnce(searchResults);
    
    render(<MainPage />);
    
    // Wait for main interface to render
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search conversations/i)).toBeInTheDocument();
    });
    
    // Get search input and button
    const searchInput = screen.getByPlaceholderText(/search conversations/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Enter search query
    fireEvent.change(searchInput, { target: { value: 'python' } });
    
    // Submit search
    fireEvent.click(searchButton);
    
    // Check if search service was called
    expect(mockSearchConversations).toHaveBeenCalledWith(mockToken, 'python');
    
    // Wait for search results to render
    await waitFor(() => {
      expect(screen.getByText('Python Tutorial')).toBeInTheDocument();
      expect(screen.getByText('Python Projects')).toBeInTheDocument();
    });
  });
  
  test('handles navigation between different sections', async () => {
    // Mock localStorage to return a token
    window.localStorage.getItem.mockReturnValueOnce(mockToken);
    
    // Mock successful token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: true,
      user: mockUser
    });
    
    // Mock successful conversation list retrieval
    mockGetConversationList.mockResolvedValueOnce(mockConversations);
    
    render(<MainPage />);
    
    // Wait for main interface to render
    await waitFor(() => {
      expect(screen.getByText(/total recall dashboard/i)).toBeInTheDocument();
    });
    
    // Click on different navigation tabs
    fireEvent.click(screen.getByRole('tab', { name: /conversations/i }));
    expect(screen.getByText('Conversation 1')).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('tab', { name: /processing/i }));
    expect(screen.getByText(/process conversations/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('tab', { name: /injection/i }));
    expect(screen.getByText(/memory injection/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('tab', { name: /settings/i }));
    expect(screen.getByText(/user settings/i)).toBeInTheDocument();
  });
});
