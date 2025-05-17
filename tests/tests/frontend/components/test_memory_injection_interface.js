import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryInjectionInterface } from '../../../app/components/injection/MemoryInjectionInterface';

// Mock the injection service
jest.mock('../../../app/services/memory_injection_service', () => ({
  openMemoryInterface: jest.fn(),
  injectMemory: jest.fn(),
  verifyMemoryInjection: jest.fn(),
  closeMemoryInterface: jest.fn(),
}));

describe('MemoryInjectionInterface Component', () => {
  const mockOpenMemoryInterface = require('../../../app/services/memory_injection_service').openMemoryInterface;
  const mockInjectMemory = require('../../../app/services/memory_injection_service').injectMemory;
  const mockVerifyMemoryInjection = require('../../../app/services/memory_injection_service').verifyMemoryInjection;
  const mockCloseMemoryInterface = require('../../../app/services/memory_injection_service').closeMemoryInterface;
  
  const mockOnComplete = jest.fn();
  const mockMemoryChunks = [
    "User: Hello, how are you?\nAssistant: I am doing well, thank you for asking!",
    "User: What's the weather like?\nAssistant: It's sunny today."
  ];
  
  beforeEach(() => {
    // Reset mocks before each test
    mockOpenMemoryInterface.mockReset();
    mockInjectMemory.mockReset();
    mockVerifyMemoryInjection.mockReset();
    mockCloseMemoryInterface.mockReset();
    mockOnComplete.mockReset();
  });
  
  test('renders initial state correctly', () => {
    render(
      <MemoryInjectionInterface 
        memoryChunks={mockMemoryChunks} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Check if start button is rendered
    expect(screen.getByRole('button', { name: /start injection/i })).toBeInTheDocument();
    expect(screen.getByText(/2 memory chunks ready/i)).toBeInTheDocument();
  });
  
  test('starts injection process when start button is clicked', async () => {
    // Mock successful open interface
    mockOpenMemoryInterface.mockResolvedValueOnce({
      success: true,
      page: { /* mock page object */ }
    });
    
    render(
      <MemoryInjectionInterface 
        memoryChunks={mockMemoryChunks} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Click start button
    fireEvent.click(screen.getByRole('button', { name: /start injection/i }));
    
    // Check if openMemoryInterface was called
    expect(mockOpenMemoryInterface).toHaveBeenCalled();
    
    // Wait for interface to open
    await waitFor(() => {
      expect(screen.getByText(/interface opened/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /inject memory/i })).toBeInTheDocument();
    });
  });
  
  test('injects memory when inject button is clicked', async () => {
    // Mock successful open interface
    mockOpenMemoryInterface.mockResolvedValueOnce({
      success: true,
      page: { /* mock page object */ }
    });
    
    // Mock successful memory injection
    mockInjectMemory.mockResolvedValueOnce({
      success: true,
      injected_chunks: 2
    });
    
    render(
      <MemoryInjectionInterface 
        memoryChunks={mockMemoryChunks} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Click start button
    fireEvent.click(screen.getByRole('button', { name: /start injection/i }));
    
    // Wait for interface to open
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /inject memory/i })).toBeInTheDocument();
    });
    
    // Click inject button
    fireEvent.click(screen.getByRole('button', { name: /inject memory/i }));
    
    // Check if injectMemory was called with correct parameters
    expect(mockInjectMemory).toHaveBeenCalledWith(
      expect.anything(), // page object
      mockMemoryChunks
    );
    
    // Wait for injection to complete
    await waitFor(() => {
      expect(screen.getByText(/2 chunks injected/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /verify injection/i })).toBeInTheDocument();
    });
  });
  
  test('verifies injection when verify button is clicked', async () => {
    // Mock successful open interface
    mockOpenMemoryInterface.mockResolvedValueOnce({
      success: true,
      page: { /* mock page object */ }
    });
    
    // Mock successful memory injection
    mockInjectMemory.mockResolvedValueOnce({
      success: true,
      injected_chunks: 2
    });
    
    // Mock successful verification
    mockVerifyMemoryInjection.mockResolvedValueOnce({
      success: true,
      verified: true
    });
    
    render(
      <MemoryInjectionInterface 
        memoryChunks={mockMemoryChunks} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Click start button
    fireEvent.click(screen.getByRole('button', { name: /start injection/i }));
    
    // Wait for interface to open
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /inject memory/i })).toBeInTheDocument();
    });
    
    // Click inject button
    fireEvent.click(screen.getByRole('button', { name: /inject memory/i }));
    
    // Wait for injection to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify injection/i })).toBeInTheDocument();
    });
    
    // Click verify button
    fireEvent.click(screen.getByRole('button', { name: /verify injection/i }));
    
    // Check if verifyMemoryInjection was called
    expect(mockVerifyMemoryInjection).toHaveBeenCalledWith(
      expect.anything(), // page object
      mockMemoryChunks
    );
    
    // Wait for verification to complete
    await waitFor(() => {
      expect(screen.getByText(/verification successful/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close interface/i })).toBeInTheDocument();
    });
  });
  
  test('closes interface and calls onComplete when close button is clicked', async () => {
    // Mock successful open interface
    mockOpenMemoryInterface.mockResolvedValueOnce({
      success: true,
      page: { /* mock page object */ }
    });
    
    // Mock successful memory injection
    mockInjectMemory.mockResolvedValueOnce({
      success: true,
      injected_chunks: 2
    });
    
    // Mock successful verification
    mockVerifyMemoryInjection.mockResolvedValueOnce({
      success: true,
      verified: true
    });
    
    // Mock successful close
    mockCloseMemoryInterface.mockResolvedValueOnce({
      success: true
    });
    
    render(
      <MemoryInjectionInterface 
        memoryChunks={mockMemoryChunks} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Click start button
    fireEvent.click(screen.getByRole('button', { name: /start injection/i }));
    
    // Wait for interface to open
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /inject memory/i })).toBeInTheDocument();
    });
    
    // Click inject button
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
    
    // Check if closeMemoryInterface was called
    expect(mockCloseMemoryInterface).toHaveBeenCalled();
    
    // Wait for interface to close
    await waitFor(() => {
      expect(screen.getByText(/interface closed/i)).toBeInTheDocument();
      expect(screen.getByText(/injection completed/i)).toBeInTheDocument();
    });
    
    // Check if onComplete callback was called
    expect(mockOnComplete).toHaveBeenCalledWith({
      success: true,
      injected_chunks: 2,
      verified: true
    });
  });
  
  test('displays error message when opening interface fails', async () => {
    // Mock failed open interface
    mockOpenMemoryInterface.mockResolvedValueOnce({
      success: false,
      error: 'Failed to open interface'
    });
    
    render(
      <MemoryInjectionInterface 
        memoryChunks={mockMemoryChunks} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Click start button
    fireEvent.click(screen.getByRole('button', { name: /start injection/i }));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to open interface/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
  
  test('displays error message when injection fails', async () => {
    // Mock successful open interface
    mockOpenMemoryInterface.mockResolvedValueOnce({
      success: true,
      page: { /* mock page object */ }
    });
    
    // Mock failed injection
    mockInjectMemory.mockResolvedValueOnce({
      success: false,
      error: 'Failed to inject memory'
    });
    
    render(
      <MemoryInjectionInterface 
        memoryChunks={mockMemoryChunks} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Click start button
    fireEvent.click(screen.getByRole('button', { name: /start injection/i }));
    
    // Wait for interface to open
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /inject memory/i })).toBeInTheDocument();
    });
    
    // Click inject button
    fireEvent.click(screen.getByRole('button', { name: /inject memory/i }));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to inject memory/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
  
  test('disables buttons during operations', async () => {
    // Mock open interface with delay to simulate network request
    mockOpenMemoryInterface.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            success: true,
            page: { /* mock page object */ }
          });
        }, 100);
      });
    });
    
    render(
      <MemoryInjectionInterface 
        memoryChunks={mockMemoryChunks} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Click start button
    fireEvent.click(screen.getByRole('button', { name: /start injection/i }));
    
    // Button should be disabled during operation
    expect(screen.getByRole('button', { name: /opening/i })).toBeDisabled();
    expect(screen.getByText(/opening interface/i)).toBeInTheDocument();
    
    // Wait for interface to open
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /inject memory/i })).toBeInTheDocument();
    });
  });
});
