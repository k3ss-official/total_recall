import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import OpenAILoginForm from './OpenAILoginForm';
import { 
  Typography, 
  Paper, 
  Container, 
  Box, 
  Fade,
  CircularProgress,
  Chip
} from '@material-ui/core';
import { styled } from '@material-ui/core/styles';
import { CheckCircle, Error } from '@material-ui/icons';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: theme.spacing(8),
  position: 'relative',
  overflow: 'hidden',
}));

const StatusIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
}));

const AuthenticationPage = ({ onAuthenticate, isAuthenticated }) => {
  const [authStatus, setAuthStatus] = useState({
    state: isAuthenticated ? 'authenticated' : 'unauthenticated', // 'unauthenticated', 'authenticating', 'authenticated', 'error'
    message: isAuthenticated ? 'Authenticated with OpenAI' : '',
  });
  
  // Check for stored token on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('openai_session_token');
    if (storedToken && !isAuthenticated) {
      setAuthStatus({
        state: 'stored',
        message: 'Token found in storage. Please authenticate to continue.',
      });
    }
  }, [isAuthenticated]);

  const handleAuthenticate = async (token) => {
    setAuthStatus({
      state: 'authenticating',
      message: 'Authenticating with OpenAI...',
    });
    
    try {
      // Call the parent's onAuthenticate function
      await onAuthenticate(token);
      
      setAuthStatus({
        state: 'authenticated',
        message: 'Successfully authenticated with OpenAI',
      });
    } catch (error) {
      setAuthStatus({
        state: 'error',
        message: error.message || 'Authentication failed. Please try again.',
      });
    }
  };

  const getStatusColor = () => {
    switch (authStatus.state) {
      case 'authenticated':
        return 'primary';
      case 'error':
        return 'secondary';
      case 'stored':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (authStatus.state) {
      case 'authenticated':
        return <CheckCircle fontSize="small" />;
      case 'error':
        return <Error fontSize="small" />;
      case 'authenticating':
        return <CircularProgress size={16} />;
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <StyledPaper elevation={3}>
        <StatusIndicator>
          {authStatus.state !== 'unauthenticated' && (
            <Fade in={true}>
              <Chip
                icon={getStatusIcon()}
                label={authStatus.state === 'authenticating' ? 'Authenticating...' : authStatus.state}
                color={getStatusColor()}
                size="small"
              />
            </Fade>
          )}
        </StatusIndicator>
        
        <Typography component="h1" variant="h4" gutterBottom>
          Total Recall
        </Typography>
        
        <Typography variant="subtitle1" align="center" gutterBottom>
          Extract and inject your ChatGPT conversation history
        </Typography>
        
        <Box mt={3} width="100%">
          {isAuthenticated ? (
            <Box textAlign="center" p={2}>
              <CheckCircle color="primary" style={{ fontSize: 48, marginBottom: 16 }} />
              <Typography variant="body1" color="primary" gutterBottom>
                Successfully authenticated with OpenAI
              </Typography>
              <Typography variant="body2" color="textSecondary">
                You can now proceed to retrieve your conversations
              </Typography>
            </Box>
          ) : (
            <OpenAILoginForm onAuthenticate={handleAuthenticate} />
          )}
        </Box>
        
        {authStatus.state === 'error' && (
          <Box mt={2} p={2} bgcolor="rgba(244, 67, 54, 0.1)" borderRadius={1} width="100%">
            <Typography variant="body2" color="error">
              {authStatus.message}
            </Typography>
          </Box>
        )}
        
        <Box mt={4} width="100%">
          <Typography variant="body2" color="textSecondary" align="center">
            Total Recall securely processes your conversations locally.
            Your data never leaves your device except when communicating with OpenAI.
          </Typography>
        </Box>
      </StyledPaper>
    </Container>
  );
};

AuthenticationPage.propTypes = {
  onAuthenticate: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
};

export default AuthenticationPage;
