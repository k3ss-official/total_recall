import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and makes auth object available
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('chatgpt_session');
        
        if (token) {
          // Verify the token is still valid
          const response = await api.checkAuthStatus(token);
          
          if (response.authenticated) {
            setCurrentUser({
              email: response.email,
              sessionToken: token
            });
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('chatgpt_session');
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        localStorage.removeItem('chatgpt_session');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the authentication API
      const response = await api.authenticateWithChatGPT(email, password);
      
      // Store the session token
      localStorage.setItem('chatgpt_session', response.sessionToken);
      
      // Update user state
      setCurrentUser({
        email: email,
        sessionToken: response.sessionToken
      });
      
      // Redirect to conversations page
      navigate('/conversations');
      
      return response;
    } catch (err) {
      setError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('chatgpt_session');
    setCurrentUser(null);
    navigate('/login');
  };

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
