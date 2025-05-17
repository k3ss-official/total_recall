import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TokenManager } from '../../../app/components/auth/TokenManager';

// Mock the auth service
jest.mock('../../../app/services/auth_service', () => ({
  verifyToken: jest.fn(),
  refreshToken: jest.fn(),
}));

describe('TokenManager Component', () => {
  const mockVerifyToken = require('../../../app/services/auth_service').verifyToken;
  const mockRefreshToken = require('../../../app/services/auth_service').refreshToken;
  const mockOnTokenExpired = jest.fn();
  const mockOnTokenRefreshed = jest.fn();
  const mockToken = 'test-token-123';
  
  beforeEach(() => {
    // Reset mocks before each test
    mockVerifyToken.mockReset();
    mockRefreshToken.mockReset();
    mockOnTokenExpired.mockReset();
    mockOnTokenRefreshed.mockReset();
    
    // Mock the timer
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    // Restore timer
    jest.useRealTimers();
  });
  
  test('verifies token on mount', async () => {
    // Mock successful token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: true,
      user_id: 'user123'
    });
    
    render(
      <TokenManager 
        token={mockToken} 
        onTokenExpired={mockOnTokenExpired} 
        onTokenRefreshed={mockOnTokenRefreshed} 
      />
    );
    
    // Check if verification was called with correct token
    expect(mockVerifyToken).toHaveBeenCalledWith(mockToken);
    
    // Wait for verification to complete
    await waitFor(() => {
      // No callbacks should be called for valid token
      expect(mockOnTokenExpired).not.toHaveBeenCalled();
      expect(mockOnTokenRefreshed).not.toHaveBeenCalled();
    });
  });
  
  test('calls onTokenExpired when token is invalid', async () => {
    // Mock failed token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: false,
      error: 'Token expired'
    });
    
    render(
      <TokenManager 
        token={mockToken} 
        onTokenExpired={mockOnTokenExpired} 
        onTokenRefreshed={mockOnTokenRefreshed} 
      />
    );
    
    // Check if verification was called
    expect(mockVerifyToken).toHaveBeenCalledWith(mockToken);
    
    // Wait for verification to complete
    await waitFor(() => {
      expect(mockOnTokenExpired).toHaveBeenCalled();
      expect(mockOnTokenRefreshed).not.toHaveBeenCalled();
    });
  });
  
  test('refreshes token when refresh interval is reached', async () => {
    // Mock successful token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: true,
      user_id: 'user123'
    });
    
    // Mock successful token refresh
    mockRefreshToken.mockResolvedValueOnce({
      success: true,
      token: 'new-token-456'
    });
    
    render(
      <TokenManager 
        token={mockToken} 
        refreshInterval={5000} // 5 seconds
        onTokenExpired={mockOnTokenExpired} 
        onTokenRefreshed={mockOnTokenRefreshed} 
      />
    );
    
    // Fast-forward time to trigger refresh
    jest.advanceTimersByTime(5000);
    
    // Check if refresh was called
    expect(mockRefreshToken).toHaveBeenCalledWith(mockToken);
    
    // Wait for refresh to complete
    await waitFor(() => {
      expect(mockOnTokenRefreshed).toHaveBeenCalledWith('new-token-456');
      expect(mockOnTokenExpired).not.toHaveBeenCalled();
    });
  });
  
  test('calls onTokenExpired when refresh fails', async () => {
    // Mock successful token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: true,
      user_id: 'user123'
    });
    
    // Mock failed token refresh
    mockRefreshToken.mockResolvedValueOnce({
      success: false,
      error: 'Refresh token expired'
    });
    
    render(
      <TokenManager 
        token={mockToken} 
        refreshInterval={5000} // 5 seconds
        onTokenExpired={mockOnTokenExpired} 
        onTokenRefreshed={mockOnTokenRefreshed} 
      />
    );
    
    // Fast-forward time to trigger refresh
    jest.advanceTimersByTime(5000);
    
    // Check if refresh was called
    expect(mockRefreshToken).toHaveBeenCalledWith(mockToken);
    
    // Wait for refresh to complete
    await waitFor(() => {
      expect(mockOnTokenExpired).toHaveBeenCalled();
      expect(mockOnTokenRefreshed).not.toHaveBeenCalled();
    });
  });
  
  test('clears timer on unmount', async () => {
    // Mock successful token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: true,
      user_id: 'user123'
    });
    
    const { unmount } = render(
      <TokenManager 
        token={mockToken} 
        refreshInterval={5000} // 5 seconds
        onTokenExpired={mockOnTokenExpired} 
        onTokenRefreshed={mockOnTokenRefreshed} 
      />
    );
    
    // Spy on clearInterval
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    // Unmount component
    unmount();
    
    // Check if clearInterval was called
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    // Fast-forward time
    jest.advanceTimersByTime(5000);
    
    // Refresh should not be called after unmount
    expect(mockRefreshToken).not.toHaveBeenCalled();
    
    // Clean up spy
    clearIntervalSpy.mockRestore();
  });
  
  test('updates timer when refreshInterval prop changes', async () => {
    // Mock successful token verification
    mockVerifyToken.mockResolvedValueOnce({
      valid: true,
      user_id: 'user123'
    }).mockResolvedValueOnce({
      valid: true,
      user_id: 'user123'
    });
    
    // Mock successful token refresh
    mockRefreshToken.mockResolvedValueOnce({
      success: true,
      token: 'new-token-456'
    });
    
    const { rerender } = render(
      <TokenManager 
        token={mockToken} 
        refreshInterval={10000} // 10 seconds
        onTokenExpired={mockOnTokenExpired} 
        onTokenRefreshed={mockOnTokenRefreshed} 
      />
    );
    
    // Fast-forward time but not enough to trigger refresh
    jest.advanceTimersByTime(5000);
    
    // Refresh should not be called yet
    expect(mockRefreshToken).not.toHaveBeenCalled();
    
    // Rerender with shorter interval
    rerender(
      <TokenManager 
        token={mockToken} 
        refreshInterval={2000} // 2 seconds
        onTokenExpired={mockOnTokenExpired} 
        onTokenRefreshed={mockOnTokenRefreshed} 
      />
    );
    
    // Fast-forward time to trigger refresh with new interval
    jest.advanceTimersByTime(2000);
    
    // Check if refresh was called
    expect(mockRefreshToken).toHaveBeenCalledWith(mockToken);
    
    // Wait for refresh to complete
    await waitFor(() => {
      expect(mockOnTokenRefreshed).toHaveBeenCalledWith('new-token-456');
    });
  });
});
