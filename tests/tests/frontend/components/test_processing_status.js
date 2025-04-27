import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProcessingStatus } from '../../../app/components/processing/ProcessingStatus';

// Mock the processing service
jest.mock('../../../app/services/progress_tracking_service', () => ({
  getProgress: jest.fn(),
}));

describe('ProcessingStatus Component', () => {
  const mockGetProgress = require('../../../app/services/progress_tracking_service').getProgress;
  const mockOnComplete = jest.fn();
  const mockTaskId = 'task-123';
  
  beforeEach(() => {
    // Reset mocks before each test
    mockGetProgress.mockReset();
    mockOnComplete.mockReset();
    
    // Setup interval mocking
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    // Restore timers
    jest.useRealTimers();
  });
  
  test('renders initial loading state', () => {
    // Mock pending promise
    mockGetProgress.mockReturnValueOnce(new Promise(() => {}));
    
    render(
      <ProcessingStatus 
        taskId={mockTaskId} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Check if loading indicator is shown
    expect(screen.getByText(/loading status/i)).toBeInTheDocument();
  });
  
  test('displays processing status information', async () => {
    // Mock status response
    const mockStatus = {
      task_id: mockTaskId,
      task_name: 'batch_processing',
      total_items: 10,
      processed_items: 4,
      status: 'in_progress',
      percentage: 40.0
    };
    
    mockGetProgress.mockResolvedValueOnce(mockStatus);
    
    render(
      <ProcessingStatus 
        taskId={mockTaskId} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Check if service was called with correct task ID
    expect(mockGetProgress).toHaveBeenCalledWith(mockTaskId);
    
    // Wait for status to load
    await waitFor(() => {
      // Check for status information
      expect(screen.getByText(/batch_processing/i)).toBeInTheDocument();
      expect(screen.getByText(/40%/i)).toBeInTheDocument();
      expect(screen.getByText(/4 of 10/i)).toBeInTheDocument();
      expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    });
  });
  
  test('updates status periodically', async () => {
    // Mock status responses for multiple calls
    const mockStatus1 = {
      task_id: mockTaskId,
      task_name: 'batch_processing',
      total_items: 10,
      processed_items: 4,
      status: 'in_progress',
      percentage: 40.0
    };
    
    const mockStatus2 = {
      task_id: mockTaskId,
      task_name: 'batch_processing',
      total_items: 10,
      processed_items: 7,
      status: 'in_progress',
      percentage: 70.0
    };
    
    mockGetProgress.mockResolvedValueOnce(mockStatus1);
    mockGetProgress.mockResolvedValueOnce(mockStatus2);
    
    render(
      <ProcessingStatus 
        taskId={mockTaskId} 
        onComplete={mockOnComplete} 
        refreshInterval={5000} // 5 seconds
      />
    );
    
    // Wait for initial status to load
    await waitFor(() => {
      expect(screen.getByText(/40%/i)).toBeInTheDocument();
    });
    
    // Fast-forward time to trigger refresh
    jest.advanceTimersByTime(5000);
    
    // Service should be called again
    expect(mockGetProgress).toHaveBeenCalledTimes(2);
    
    // Wait for updated status
    await waitFor(() => {
      expect(screen.getByText(/70%/i)).toBeInTheDocument();
    });
  });
  
  test('calls onComplete when processing is completed', async () => {
    // Mock completed status
    const mockCompletedStatus = {
      task_id: mockTaskId,
      task_name: 'batch_processing',
      total_items: 10,
      processed_items: 10,
      status: 'completed',
      percentage: 100.0
    };
    
    mockGetProgress.mockResolvedValueOnce(mockCompletedStatus);
    
    render(
      <ProcessingStatus 
        taskId={mockTaskId} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Wait for status to load
    await waitFor(() => {
      expect(screen.getByText(/100%/i)).toBeInTheDocument();
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });
    
    // Check if onComplete callback was called
    expect(mockOnComplete).toHaveBeenCalledWith(mockCompletedStatus);
  });
  
  test('displays error message when loading fails', async () => {
    // Mock failed response
    mockGetProgress.mockRejectedValueOnce(new Error('Failed to load status'));
    
    render(
      <ProcessingStatus 
        taskId={mockTaskId} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/error loading status/i)).toBeInTheDocument();
    });
  });
  
  test('stops polling when component unmounts', async () => {
    // Mock status response
    const mockStatus = {
      task_id: mockTaskId,
      task_name: 'batch_processing',
      total_items: 10,
      processed_items: 4,
      status: 'in_progress',
      percentage: 40.0
    };
    
    mockGetProgress.mockResolvedValueOnce(mockStatus);
    
    // Spy on clearInterval
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const { unmount } = render(
      <ProcessingStatus 
        taskId={mockTaskId} 
        onComplete={mockOnComplete} 
        refreshInterval={5000} // 5 seconds
      />
    );
    
    // Wait for status to load
    await waitFor(() => {
      expect(screen.getByText(/40%/i)).toBeInTheDocument();
    });
    
    // Unmount component
    unmount();
    
    // Check if clearInterval was called
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    // Fast-forward time
    jest.advanceTimersByTime(5000);
    
    // Service should not be called again after unmount
    expect(mockGetProgress).toHaveBeenCalledTimes(1);
    
    // Clean up spy
    clearIntervalSpy.mockRestore();
  });
  
  test('renders progress bar with correct percentage', async () => {
    // Mock status response
    const mockStatus = {
      task_id: mockTaskId,
      task_name: 'batch_processing',
      total_items: 10,
      processed_items: 6,
      status: 'in_progress',
      percentage: 60.0
    };
    
    mockGetProgress.mockResolvedValueOnce(mockStatus);
    
    render(
      <ProcessingStatus 
        taskId={mockTaskId} 
        onComplete={mockOnComplete} 
      />
    );
    
    // Wait for status to load
    await waitFor(() => {
      // Check for progress bar
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      
      // Check progress bar styling (width should be 60%)
      const progressBarInner = screen.getByTestId('progress-bar-inner');
      expect(progressBarInner.style.width).toBe('60%');
    });
  });
});
