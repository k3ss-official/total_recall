import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Button, TextField, Typography, Paper, CircularProgress, Alert } from '@mui/material';

/**
 * ChatGPT Login Form Component
 * 
 * This component provides a form for users to enter their ChatGPT credentials
 * to authenticate and access their conversation history.
 */
const ChatGPTLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      // Call the login function from AuthContext
      await login(email, password);
      
      // Login successful - AuthContext will handle redirect
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Log in to ChatGPT
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Enter your ChatGPT credentials to access your conversation history.
        Your credentials are only used to establish a session and are not stored.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
        This application only accesses your ChatGPT conversations and does not modify your account.
      </Typography>
    </Paper>
  );
};

export default ChatGPTLoginForm;
