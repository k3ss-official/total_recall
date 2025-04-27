import React, { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { authAPI } from '../lib/api';

// Create Authentication Context
const AuthContext = createContext();

// Authentication Provider Component
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    token: null,
    error: null,
    loading: false
  });

  // Check for stored token on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('openai_session_token');
    if (storedToken) {
      // Validate token before setting authenticated state
      validateToken(storedToken)
        .then(() => {
          setAuthState({
            isAuthenticated: true,
            token: storedToken,
            error: null,
            loading: false
          });
        })
        .catch(() => {
          // Token validation failed, remove from storage
          localStorage.removeItem('openai_session_token');
        });
    }
  }, []);

  // Validate token with API
  const validateToken = async (token) => {
    try {
      // Store token temporarily for the API call
      localStorage.setItem('openai_session_token', token);
      const response = await authAPI.checkStatus();
      if (response.authenticated) {
        return true;
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      localStorage.removeItem('openai_session_token');
      throw error;
    }
  };

  // Authenticate user
  const authenticate = async (username, password) => {
    setAuthState({
      ...authState,
      loading: true,
      error: null
    });

    try {
      const response = await authAPI.login(username, password);
      const token = response.access_token;
      
      // Store token in localStorage
      localStorage.setItem('openai_session_token', token);
      
      setAuthState({
        isAuthenticated: true,
        token,
        error: null,
        loading: false
      });
      
      return true;
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        token: null,
        error: error.response?.data?.detail || error.message,
        loading: false
      });
      
      throw error;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('openai_session_token');
    
    setAuthState({
      isAuthenticated: false,
      token: null,
      error: null,
      loading: false
    });
  };

  // Context value
  const value = {
    ...authState,
    authenticate,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
