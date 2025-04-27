import React from 'react';
import PropTypes from 'prop-types';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Snackbar,
  Paper
} from '@material-ui/core';
import { 
  Error as ErrorIcon, 
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@material-ui/icons';
import { Alert, AlertTitle } from '@material-ui/lab';
import { useError, ERROR_TYPES } from '../context/ErrorContext';

// Error severity mapping
const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'error':
      return <ErrorIcon color="error" />;
    case 'warning':
      return <WarningIcon style={{ color: '#ff9800' }} />;
    case 'info':
      return <InfoIcon color="primary" />;
    default:
      return <ErrorIcon color="error" />;
  }
};

// Error type to human-readable mapping
const getErrorTypeText = (type) => {
  switch (type) {
    case ERROR_TYPES.AUTHENTICATION:
      return 'Authentication Error';
    case ERROR_TYPES.RETRIEVAL:
      return 'Conversation Retrieval Error';
    case ERROR_TYPES.PROCESSING:
      return 'Processing Error';
    case ERROR_TYPES.VERIFICATION:
      return 'Verification Error';
    case ERROR_TYPES.INJECTION:
      return 'Memory Injection Error';
    case ERROR_TYPES.NETWORK:
      return 'Network Error';
    case ERROR_TYPES.UNKNOWN:
    default:
      return 'Unknown Error';
  }
};

// Error Notification component
export const ErrorNotification = ({ error, onClose }) => {
  if (!error) return null;
  
  return (
    <Snackbar
      open={true}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        severity={error.severity || 'error'} 
        onClose={onClose}
        variant="filled"
      >
        <AlertTitle>{getErrorTypeText(error.type)}</AlertTitle>
        {error.message}
      </Alert>
    </Snackbar>
  );
};

ErrorNotification.propTypes = {
  error: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    severity: PropTypes.string,
    timestamp: PropTypes.instanceOf(Date)
  }),
  onClose: PropTypes.func.isRequired
};

// Error Dialog component
export const ErrorDialog = ({ open, error, onClose, onRetry }) => {
  if (!error) return null;
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="error-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="error-dialog-title">
        <Box display="flex" alignItems="center">
          {getSeverityIcon(error.severity || 'error')}
          <Typography variant="h6" style={{ marginLeft: 8 }}>
            {getErrorTypeText(error.type)}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {error.message}
        </Typography>
        {error.details && (
          <Paper 
            variant="outlined" 
            style={{ 
              padding: 16, 
              marginTop: 16, 
              backgroundColor: '#f5f5f5',
              maxHeight: 200,
              overflow: 'auto'
            }}
          >
            <Typography variant="body2" component="pre" style={{ whiteSpace: 'pre-wrap' }}>
              {error.details}
            </Typography>
          </Paper>
        )}
        {error.recoverySteps && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Suggested Recovery Steps:
            </Typography>
            <List dense>
              {error.recoverySteps.map((step, index) => (
                <ListItem key={index}>
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <Typography variant="body2">{index + 1}.</Typography>
                  </ListItemIcon>
                  <ListItemText primary={step} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="default">
          Dismiss
        </Button>
        {error.retryable && onRetry && (
          <Button onClick={onRetry} color="primary" variant="contained">
            Retry
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

ErrorDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  error: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    severity: PropTypes.string,
    details: PropTypes.string,
    recoverySteps: PropTypes.arrayOf(PropTypes.string),
    retryable: PropTypes.bool,
    timestamp: PropTypes.instanceOf(Date)
  }),
  onClose: PropTypes.func.isRequired,
  onRetry: PropTypes.func
};

// Error List component
export const ErrorList = ({ errors, onDismiss, onDismissAll }) => {
  if (!errors || errors.length === 0) {
    return (
      <Box p={2} textAlign="center">
        <Typography variant="body1" color="textSecondary">
          No errors to display
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
        <Typography variant="subtitle1">
          Recent Errors ({errors.length})
        </Typography>
        <Button size="small" onClick={onDismissAll}>
          Clear All
        </Button>
      </Box>
      <List>
        {errors.map((error) => (
          <ListItem key={error.id} divider>
            <ListItemIcon>
              {getSeverityIcon(error.severity || 'error')}
            </ListItemIcon>
            <ListItemText
              primary={getErrorTypeText(error.type)}
              secondary={
                <>
                  {error.message}
                  <Typography variant="caption" display="block" color="textSecondary">
                    {error.timestamp.toLocaleTimeString()}
                  </Typography>
                </>
              }
            />
            <IconButton edge="end" size="small" onClick={() => onDismiss(error.id)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

ErrorList.propTypes = {
  errors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      severity: PropTypes.string,
      timestamp: PropTypes.instanceOf(Date)
    })
  ).isRequired,
  onDismiss: PropTypes.func.isRequired,
  onDismissAll: PropTypes.func.isRequired
};

// Global Error Handler component
export const GlobalErrorHandler = () => {
  const { globalError, clearGlobalError } = useError();
  
  const handleRetry = () => {
    // Implement retry logic based on error type
    clearGlobalError();
  };
  
  return (
    <ErrorDialog
      open={!!globalError}
      error={globalError}
      onClose={clearGlobalError}
      onRetry={globalError?.retryable ? handleRetry : undefined}
    />
  );
};

export default {
  ErrorNotification,
  ErrorDialog,
  ErrorList,
  GlobalErrorHandler
};
