import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  TextField, 
  Button, 
  FormControlLabel, 
  Checkbox, 
  Typography, 
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
  Collapse,
  Alert
} from '@material-ui/core';
import { Visibility, VisibilityOff, Error, CheckCircle } from '@material-ui/icons';
import { styled } from '@material-ui/core/styles';

const FormContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const StatusAlert = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const OpenAILoginForm = ({ onAuthenticate }) => {
  const [sessionToken, setSessionToken] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null); // null, 'success', 'error'
  const [statusMessage, setStatusMessage] = useState('');

  // Check for stored token on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('openai_session_token');
    if (storedToken) {
      setSessionToken(storedToken);
      setRememberMe(true);
      setStatusMessage('Token loaded from storage. Click Authenticate to continue.');
    }
  }, []);

  const validateToken = (token) => {
    // Basic validation - token should be non-empty and follow expected format
    if (!token.trim()) {
      return false;
    }
    
    // Check if token follows expected pattern (this is a simplified example)
    // In a real implementation, you might check for specific prefixes or formats
    return token.length > 10;
  };

  const handleTokenChange = (e) => {
    const newToken = e.target.value;
    setSessionToken(newToken);
    
    // Clear validation status when user is typing
    if (validationStatus) {
      setValidationStatus(null);
      setStatusMessage('');
    }
    
    // Clear error when user starts typing again
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate token
    if (!validateToken(sessionToken)) {
      setError('Please enter a valid OpenAI session token');
      setValidationStatus('error');
      setStatusMessage('Invalid token format. Please check and try again.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    setValidationStatus(null);
    
    try {
      // Use the username as "openai_user" and the session token as the password
      // This matches the API's expected format
      await onAuthenticate('openai_user', sessionToken);
      
      // Store token if remember me is checked (now handled in AuthContext)
      if (!rememberMe) {
        localStorage.removeItem('openai_session_token');
      }
      
      setValidationStatus('success');
      setStatusMessage('Authentication successful!');
    } catch (err) {
      setValidationStatus('error');
      setError('Authentication failed. Please check your session token and try again.');
      setStatusMessage('Could not authenticate with OpenAI. Please verify your token is correct and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getHelperText = () => {
    if (error) return error;
    if (!sessionToken) return "Enter your OpenAI session token to authenticate";
    return "Your token will be used to access your ChatGPT conversations";
  };

  return (
    <FormContainer component="form" onSubmit={handleSubmit}>
      <Typography variant="h6">OpenAI Authentication</Typography>
      
      <TextField
        variant="outlined"
        fullWidth
        label="OpenAI Session Token"
        value={sessionToken}
        onChange={handleTokenChange}
        error={!!error}
        helperText={getHelperText()}
        type={showToken ? "text" : "password"}
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle token visibility"
                onClick={() => setShowToken(!showToken)}
                edge="end"
              >
                {showToken ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      <FormControlLabel
        control={
          <Checkbox
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            color="primary"
          />
        }
        label="Remember Me"
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Authenticate'}
      </Button>
      
      <Collapse in={!!validationStatus}>
        <StatusAlert 
          bgcolor={validationStatus === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'}
          color={validationStatus === 'success' ? 'success.main' : 'error.main'}
        >
          {validationStatus === 'success' ? (
            <CheckCircle color="success" fontSize="small" />
          ) : (
            <Error color="error" fontSize="small" />
          )}
          <Typography variant="body2">
            {statusMessage}
          </Typography>
        </StatusAlert>
      </Collapse>
      
      <Typography variant="body2" color="textSecondary" align="center">
        Your token is stored securely and only used to access your ChatGPT conversations.
      </Typography>
    </FormContainer>
  );
};

OpenAILoginForm.propTypes = {
  onAuthenticate: PropTypes.func.isRequired,
};

export default OpenAILoginForm;
