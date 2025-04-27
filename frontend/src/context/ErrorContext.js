import React, { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';

// Create Error Context
const ErrorContext = createContext();

// Error types
export const ERROR_TYPES = {
  AUTHENTICATION: 'authentication',
  RETRIEVAL: 'retrieval',
  PROCESSING: 'processing',
  VERIFICATION: 'verification',
  INJECTION: 'injection',
  NETWORK: 'network',
  UNKNOWN: 'unknown'
};

// Error Provider Component
export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);
  const [globalError, setGlobalError] = useState(null);

  // Add error
  const addError = (error) => {
    const newError = {
      id: Date.now(),
      timestamp: new Date(),
      ...error
    };
    
    setErrors(prevErrors => [...prevErrors, newError]);
    
    // If error is critical, set as global error
    if (error.critical) {
      setGlobalError(newError);
    }
    
    return newError.id;
  };

  // Remove error
  const removeError = (errorId) => {
    setErrors(prevErrors => prevErrors.filter(error => error.id !== errorId));
    
    // If removing global error, clear it
    if (globalError && globalError.id === errorId) {
      setGlobalError(null);
    }
  };

  // Clear all errors
  const clearErrors = () => {
    setErrors([]);
    setGlobalError(null);
  };

  // Clear global error
  const clearGlobalError = () => {
    setGlobalError(null);
  };

  // Get errors by type
  const getErrorsByType = (type) => {
    return errors.filter(error => error.type === type);
  };

  // Context value
  const value = {
    errors,
    globalError,
    addError,
    removeError,
    clearErrors,
    clearGlobalError,
    getErrorsByType
  };

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

ErrorProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use the error context
export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext;
