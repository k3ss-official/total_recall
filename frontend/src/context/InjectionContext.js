import React, { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { injectionAPI } from '../lib/api';

// Create Memory Injection Context
const InjectionContext = createContext();

// Memory Injection Provider Component
export const InjectionProvider = ({ children }) => {
  const [injectionState, setInjectionState] = useState({
    isInjecting: false,
    isPaused: false,
    progress: 0,
    injectedCount: 0,
    totalCount: 0,
    rateLimit: 3, // Default rate limit (requests per minute)
    statusMessage: '',
    errors: [],
    startTime: null,
    endTime: null,
    taskId: null
  });

  // Poll for task status when injection is active
  useEffect(() => {
    let statusInterval;
    
    if (injectionState.isInjecting && injectionState.taskId && !injectionState.isPaused) {
      statusInterval = setInterval(async () => {
        try {
          const statusResponse = await injectionAPI.getStatus(injectionState.taskId);
          
          // Update progress based on API response
          updateProgress(
            statusResponse.progress * 100,
            statusResponse.successful_injections || 0
          );
          
          // If injection is complete or failed, stop polling
          if (statusResponse.status === 'completed') {
            clearInterval(statusInterval);
            completeInjection();
          } else if (statusResponse.status === 'failed') {
            clearInterval(statusInterval);
            addError(statusResponse.message || 'Injection failed');
            cancelInjection();
          }
        } catch (error) {
          console.error('Error polling task status:', error);
          addError(error.message || 'Failed to get injection status');
        }
      }, 2000);
    }
    
    return () => {
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [injectionState.isInjecting, injectionState.taskId, injectionState.isPaused]);

  // Start injection
  const startInjection = async (conversationIds, config) => {
    setInjectionState({
      ...injectionState,
      isInjecting: true,
      isPaused: false,
      progress: 0,
      injectedCount: 0,
      totalCount: conversationIds.length,
      statusMessage: 'Injection started',
      errors: [],
      startTime: new Date(),
      endTime: null
    });

    try {
      // Apply rate limit to config
      const injectionConfig = {
        ...config,
        rate_limit: injectionState.rateLimit
      };
      
      // Call API to start injection
      const response = await injectionAPI.inject(conversationIds, injectionConfig);
      
      setInjectionState(prevState => ({
        ...prevState,
        taskId: response.task_id,
        statusMessage: response.message || `Injection task ${response.task_id} started`
      }));
    } catch (error) {
      addError(error.response?.data?.detail || error.message || 'Failed to start injection');
      cancelInjection();
    }
  };

  // Update injection progress
  const updateProgress = (progress, injectedCount) => {
    setInjectionState(prevState => ({
      ...prevState,
      progress,
      injectedCount,
      statusMessage: `Injecting memories (${injectedCount}/${prevState.totalCount})`
    }));
  };

  // Pause injection
  const pauseInjection = async () => {
    if (injectionState.taskId) {
      try {
        // In a real implementation, you would call an API to pause the task
        // For now, we'll just update the local state
        setInjectionState({
          ...injectionState,
          isPaused: true,
          statusMessage: 'Paused'
        });
      } catch (error) {
        addError(error.message || 'Failed to pause injection');
      }
    }
  };

  // Resume injection
  const resumeInjection = async () => {
    if (injectionState.taskId) {
      try {
        // In a real implementation, you would call an API to resume the task
        // For now, we'll just update the local state
        setInjectionState({
          ...injectionState,
          isPaused: false,
          statusMessage: `Injecting memories (${injectionState.injectedCount}/${injectionState.totalCount})`
        });
      } catch (error) {
        addError(error.message || 'Failed to resume injection');
      }
    }
  };

  // Cancel injection
  const cancelInjection = async () => {
    if (injectionState.taskId) {
      try {
        // Call API to cancel the task
        await injectionAPI.cancelTask(injectionState.taskId);
      } catch (error) {
        addError(error.message || 'Failed to cancel injection');
      }
    }
    
    setInjectionState(prevState => ({
      ...prevState,
      isInjecting: false,
      isPaused: false,
      statusMessage: 'Cancelled',
      endTime: new Date()
    }));
  };

  // Complete injection
  const completeInjection = () => {
    setInjectionState(prevState => ({
      ...prevState,
      isInjecting: false,
      isPaused: false,
      progress: 100,
      statusMessage: 'Injection complete',
      endTime: new Date()
    }));
  };

  // Direct inject (without background task)
  const directInject = async (conversationIds, config) => {
    setInjectionState({
      ...injectionState,
      isInjecting: true,
      isPaused: false,
      progress: 0,
      injectedCount: 0,
      totalCount: conversationIds.length,
      statusMessage: 'Direct injection started',
      errors: [],
      startTime: new Date(),
      endTime: null
    });

    try {
      // Apply rate limit to config
      const injectionConfig = {
        ...config,
        rate_limit: injectionState.rateLimit
      };
      
      // Call API for direct injection
      const response = await injectionAPI.directInject(conversationIds, injectionConfig);
      
      updateProgress(100, response.successful);
      
      if (response.failed > 0) {
        response.failures?.forEach(failure => {
          addError(`Failed to inject conversation ${failure.conversation_id}: ${failure.reason}`);
        });
      }
      
      completeInjection();
    } catch (error) {
      addError(error.response?.data?.detail || error.message || 'Failed to perform direct injection');
      cancelInjection();
    }
  };

  // Update rate limit
  const updateRateLimit = (rateLimit) => {
    setInjectionState({
      ...injectionState,
      rateLimit
    });
  };

  // Add error
  const addError = (error) => {
    setInjectionState(prevState => ({
      ...prevState,
      errors: [...prevState.errors, error]
    }));
  };

  // Get injection duration in seconds
  const getInjectionDuration = () => {
    if (!injectionState.startTime) return 0;
    
    const endTime = injectionState.endTime || new Date();
    return Math.round((endTime - injectionState.startTime) / 1000);
  };

  // Get estimated time remaining in seconds
  const getEstimatedTimeRemaining = () => {
    if (!injectionState.startTime || injectionState.progress === 0) return 0;
    
    const elapsedTime = (new Date() - injectionState.startTime) / 1000;
    const totalEstimatedTime = (elapsedTime / injectionState.progress) * 100;
    return Math.round(totalEstimatedTime - elapsedTime);
  };

  // Context value
  const value = {
    ...injectionState,
    startInjection,
    updateProgress,
    pauseInjection,
    resumeInjection,
    cancelInjection,
    completeInjection,
    directInject,
    updateRateLimit,
    addError,
    getInjectionDuration,
    getEstimatedTimeRemaining
  };

  return <InjectionContext.Provider value={value}>{children}</InjectionContext.Provider>;
};

InjectionProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use the injection context
export const useInjection = () => {
  const context = useContext(InjectionContext);
  if (context === undefined) {
    throw new Error('useInjection must be used within an InjectionProvider');
  }
  return context;
};

export default InjectionContext;
