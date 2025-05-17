import React, { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { processingAPI } from '../lib/api';

// Create Processing Context
const ProcessingContext = createContext();

// Processing Provider Component
export const ProcessingProvider = ({ children }) => {
  const [processingState, setProcessingState] = useState({
    isProcessing: false,
    isPaused: false,
    progress: 0,
    processedCount: 0,
    totalCount: 0,
    tokensProcessed: 0,
    chunksCreated: 0,
    statusMessage: '',
    errors: [],
    startTime: null,
    endTime: null,
    taskId: null
  });

  // Poll for task status when processing is active
  useEffect(() => {
    let statusInterval;
    
    if (processingState.isProcessing && processingState.taskId && !processingState.isPaused) {
      statusInterval = setInterval(async () => {
        try {
          const statusResponse = await processingAPI.getStatus(processingState.taskId);
          
          // Update progress based on API response
          updateProgress(
            statusResponse.progress * 100,
            Math.floor(statusResponse.progress * processingState.totalCount),
            statusResponse.token_count || 0,
            statusResponse.chunk_count || 0
          );
          
          // If processing is complete or failed, stop polling
          if (statusResponse.status === 'completed') {
            clearInterval(statusInterval);
            completeProcessing();
          } else if (statusResponse.status === 'failed') {
            clearInterval(statusInterval);
            addError(statusResponse.message || 'Processing failed');
            cancelProcessing();
          }
        } catch (error) {
          console.error('Error polling task status:', error);
          addError(error.message || 'Failed to get processing status');
        }
      }, 2000);
    }
    
    return () => {
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [processingState.isProcessing, processingState.taskId, processingState.isPaused]);

  // Start processing
  const startProcessing = async (conversationIds, config) => {
    setProcessingState({
      ...processingState,
      isProcessing: true,
      isPaused: false,
      progress: 0,
      processedCount: 0,
      totalCount: conversationIds.length,
      tokensProcessed: 0,
      chunksCreated: 0,
      statusMessage: 'Processing started',
      errors: [],
      startTime: new Date(),
      endTime: null
    });

    try {
      // Call API to start processing
      const response = await processingAPI.process(conversationIds, config);
      
      setProcessingState(prevState => ({
        ...prevState,
        taskId: response.task_id,
        statusMessage: response.message || `Processing task ${response.task_id} started`
      }));
    } catch (error) {
      addError(error.response?.data?.detail || error.message || 'Failed to start processing');
      cancelProcessing();
    }
  };

  // Update processing progress
  const updateProgress = (progress, processedCount, tokensProcessed, chunksCreated) => {
    setProcessingState(prevState => ({
      ...prevState,
      progress,
      processedCount,
      tokensProcessed,
      chunksCreated,
      statusMessage: `Processing conversations (${processedCount}/${prevState.totalCount})`
    }));
  };

  // Pause processing
  const pauseProcessing = async () => {
    if (processingState.taskId) {
      try {
        // In a real implementation, you would call an API to pause the task
        // For now, we'll just update the local state
        setProcessingState({
          ...processingState,
          isPaused: true,
          statusMessage: 'Paused'
        });
      } catch (error) {
        addError(error.message || 'Failed to pause processing');
      }
    }
  };

  // Resume processing
  const resumeProcessing = async () => {
    if (processingState.taskId) {
      try {
        // In a real implementation, you would call an API to resume the task
        // For now, we'll just update the local state
        setProcessingState({
          ...processingState,
          isPaused: false,
          statusMessage: `Processing conversations (${processingState.processedCount}/${processingState.totalCount})`
        });
      } catch (error) {
        addError(error.message || 'Failed to resume processing');
      }
    }
  };

  // Cancel processing
  const cancelProcessing = async () => {
    if (processingState.taskId) {
      try {
        // Call API to cancel the task
        await processingAPI.cancelTask(processingState.taskId);
      } catch (error) {
        addError(error.message || 'Failed to cancel processing');
      }
    }
    
    setProcessingState(prevState => ({
      ...prevState,
      isProcessing: false,
      isPaused: false,
      statusMessage: 'Cancelled',
      endTime: new Date()
    }));
  };

  // Complete processing
  const completeProcessing = () => {
    setProcessingState(prevState => ({
      ...prevState,
      isProcessing: false,
      isPaused: false,
      progress: 100,
      statusMessage: 'Processing complete',
      endTime: new Date()
    }));
  };

  // Add error
  const addError = (error) => {
    setProcessingState(prevState => ({
      ...prevState,
      errors: [...prevState.errors, error]
    }));
  };

  // Get processing duration in seconds
  const getProcessingDuration = () => {
    if (!processingState.startTime) return 0;
    
    const endTime = processingState.endTime || new Date();
    return Math.round((endTime - processingState.startTime) / 1000);
  };

  // Get estimated time remaining in seconds
  const getEstimatedTimeRemaining = () => {
    if (!processingState.startTime || processingState.progress === 0) return 0;
    
    const elapsedTime = (new Date() - processingState.startTime) / 1000;
    const totalEstimatedTime = (elapsedTime / processingState.progress) * 100;
    return Math.round(totalEstimatedTime - elapsedTime);
  };

  // Context value
  const value = {
    ...processingState,
    startProcessing,
    updateProgress,
    pauseProcessing,
    resumeProcessing,
    cancelProcessing,
    completeProcessing,
    addError,
    getProcessingDuration,
    getEstimatedTimeRemaining
  };

  return <ProcessingContext.Provider value={value}>{children}</ProcessingContext.Provider>;
};

ProcessingProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use the processing context
export const useProcessing = () => {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
};

export default ProcessingContext;
