import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginForm } from '../../../app/components/auth/LoginForm';

// Mock the auth service
jest.mock('../../../app/services/auth_service', () => ({
  login: jest.fn(),
}));

describe('LoginForm Component', () => {
  const mockLogin = require('../../../app/services/auth_service').login;
  const mockOnLoginSuccess = jest.fn();
  
  beforeEach(() => {
    // Reset mocks before each test
    mockLogin.mockReset();
    mockOnLoginSuccess.mockReset();
  });
  
  test('renders login form correctly', () => {
    render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);
    
    // Check if form elements are rendered
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
  
  test('handles input changes', () => {
    render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);
    
    // Get form elements
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    // Simulate user input
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Check if inputs have the correct values
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });
  
  test('submits form with correct data', async () => {
    // Mock successful login response
    mockLogin.mockResolvedValueOnce({
      success: true,
      token: 'test-token',
      user_id: 'user123'
    });
    
    render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);
    
    // Get form elements
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    // Fill in the form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if login service was called with correct arguments
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // Wait for the async login to complete
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith({
        token: 'test-token',
        user_id: 'user123'
      });
    });
  });
  
  test('displays error message on login failure', async () => {
    // Mock failed login response
    mockLogin.mockResolvedValueOnce({
      success: false,
      error: 'Invalid credentials'
    });
    
    render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);
    
    // Get form elements
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    // Fill in the form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if login service was called
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
    
    // Check that success callback was not called
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });
  
  test('validates required fields', async () => {
    render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);
    
    // Get submit button
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    // Submit form without filling in fields
    fireEvent.click(submitButton);
    
    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    
    // Check that login service was not called
    expect(mockLogin).not.toHaveBeenCalled();
  });
  
  test('disables submit button during login process', async () => {
    // Mock login with delay to simulate network request
    mockLogin.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            success: true,
            token: 'test-token',
            user_id: 'user123'
          });
        }, 100);
      });
    });
    
    render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);
    
    // Get form elements
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    // Fill in the form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if button is disabled during login process
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
    
    // Wait for the login to complete
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });
});
