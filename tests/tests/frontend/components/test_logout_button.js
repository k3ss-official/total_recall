import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LogoutButton } from '../../../app/components/auth/LogoutButton';

// Mock the auth service
jest.mock('../../../app/services/auth_service', () => ({
  logout: jest.fn(),
}));

describe('LogoutButton Component', () => {
  const mockLogout = require('../../../app/services/auth_service').logout;
  const mockOnLogoutSuccess = jest.fn();
  const mockToken = 'test-token-123';
  
  beforeEach(() => {
    // Reset mocks before each test
    mockLogout.mockReset();
    mockOnLogoutSuccess.mockReset();
  });
  
  test('renders logout button correctly', () => {
    render(<LogoutButton token={mockToken} onLogoutSuccess={mockOnLogoutSuccess} />);
    
    // Check if button is rendered
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
  
  test('calls logout service when clicked', async () => {
    // Mock successful logout response
    mockLogout.mockResolvedValueOnce({
      success: true
    });
    
    render(<LogoutButton token={mockToken} onLogoutSuccess={mockOnLogoutSuccess} />);
    
    // Get logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    
    // Click the button
    fireEvent.click(logoutButton);
    
    // Check if logout service was called with correct token
    expect(mockLogout).toHaveBeenCalledWith(mockToken);
    
    // Wait for the async logout to complete
    await waitFor(() => {
      expect(mockOnLogoutSuccess).toHaveBeenCalled();
    });
  });
  
  test('displays error message on logout failure', async () => {
    // Mock failed logout response
    mockLogout.mockResolvedValueOnce({
      success: false,
      error: 'Session expired'
    });
    
    render(<LogoutButton token={mockToken} onLogoutSuccess={mockOnLogoutSuccess} />);
    
    // Get logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    
    // Click the button
    fireEvent.click(logoutButton);
    
    // Check if logout service was called
    expect(mockLogout).toHaveBeenCalledWith(mockToken);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/session expired/i)).toBeInTheDocument();
    });
    
    // Check that success callback was not called
    expect(mockOnLogoutSuccess).not.toHaveBeenCalled();
  });
  
  test('disables button during logout process', async () => {
    // Mock logout with delay to simulate network request
    mockLogout.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            success: true
          });
        }, 100);
      });
    });
    
    render(<LogoutButton token={mockToken} onLogoutSuccess={mockOnLogoutSuccess} />);
    
    // Get logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    
    // Click the button
    fireEvent.click(logoutButton);
    
    // Check if button is disabled during logout process
    expect(logoutButton).toBeDisabled();
    expect(screen.getByText(/logging out/i)).toBeInTheDocument();
    
    // Wait for the logout to complete
    await waitFor(() => {
      expect(mockOnLogoutSuccess).toHaveBeenCalled();
    });
  });
  
  test('handles case when token is not provided', () => {
    // Render without token
    render(<LogoutButton onLogoutSuccess={mockOnLogoutSuccess} />);
    
    // Get logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    
    // Button should be disabled
    expect(logoutButton).toBeDisabled();
    expect(screen.getByText(/no active session/i)).toBeInTheDocument();
  });
});
