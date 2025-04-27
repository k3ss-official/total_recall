import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Paper, 
  Typography, 
  Box, 
  LinearProgress, 
  Button, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Collapse,
  Chip
} from '@material-ui/core';
import { 
  PauseCircleOutline, 
  PlayCircleOutline, 
  Cancel, 
  Error as ErrorIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Refresh
} from '@material-ui/icons';
import { styled } from '@material-ui/core/styles';
import { useProcessing } from '../context/ProcessingContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const ControlsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const StatsContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
}));

const ErrorItem = styled(ListItem)(({ theme }) => ({
  backgroundColor: 'rgba(244, 67, 54, 0.08)',
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
}));

const formatTime = (seconds) => {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ${seconds % 60} seconds`;
  return `${Math.floor(seconds / 3600)} hours ${Math.floor((seconds % 3600) / 60)} minutes`;
};

const ConversationProcessingStatus = () => {
  const { 
    isProcessing,
    isPaused,
    progress,
    processedCount,
    totalCount,
    tokensProcessed,
    chunksCreated,
    statusMessage,
    errors,
    startProcessing,
    pauseProcessing,
    resumeProcessing,
    cancelProcessing,
    getProcessingDuration,
    getEstimatedTimeRemaining
  } = useProcessing();
  
  const [showErrors, setShowErrors] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  // Update times every second when processing
  useEffect(() => {
    if (!isProcessing) return;
    
    const timer = setInterval(() => {
      setProcessingTime(getProcessingDuration());
      setRemainingTime(getEstimatedTimeRemaining());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isProcessing, getProcessingDuration, getEstimatedTimeRemaining]);

  // Simulate processing for demo purposes
  const handleStartProcessing = () => {
    startProcessing(25); // Simulate 25 conversations
    
    // Simulate progress updates
    let currentProgress = 0;
    let processedItems = 0;
    let tokens = 0;
    let chunks = 0;
    
    const interval = setInterval(() => {
      currentProgress += 4; // Increment by 4% each time
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        currentProgress = 100;
      }
      
      // Calculate processed items based on progress
      processedItems = Math.floor((currentProgress / 100) * 25);
      tokens = processedItems * 500; // Simulate ~500 tokens per conversation
      chunks = processedItems * 3; // Simulate ~3 chunks per conversation
      
      // Randomly add an error (10% chance)
      if (Math.random() < 0.1 && errors.length < 3) {
        const errorTypes = [
          'Token limit exceeded',
          'Rate limit reached',
          'Parsing error in conversation'
        ];
        
        const randomError = {
          message: errorTypes[Math.floor(Math.random() * errorTypes.length)],
          conversationId: `conv-${Math.floor(Math.random() * 25) + 1}`,
          timestamp: new Date().toISOString()
        };
        
        // Add error
        // addError(randomError);
      }
      
      // Update progress
      // updateProgress(currentProgress, processedItems, tokens, chunks);
    }, 800);
  };

  return (
    <StyledPaper elevation={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Conversation Processing
        </Typography>
        {errors.length > 0 && (
          <Tooltip title="View Errors">
            <Chip
              icon={<ErrorIcon />}
              label={`${errors.length} ${errors.length === 1 ? 'Error' : 'Errors'}`}
              color="secondary"
              onClick={() => setShowErrors(!showErrors)}
            />
          </Tooltip>
        )}
      </Box>
      
      {isProcessing && (
        <ProgressContainer>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="body2">
              {statusMessage || 'Processing conversations...'}
            </Typography>
            <Typography variant="body2">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color={isPaused ? "secondary" : "primary"}
          />
          <Typography variant="body2" color="textSecondary" align="center" style={{ marginTop: 8 }}>
            {processedCount} of {totalCount} conversations processed
          </Typography>
        </ProgressContainer>
      )}
      
      <ControlsContainer>
        {!isProcessing ? (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleStartProcessing}
          >
            Start Processing
          </Button>
        ) : (
          <>
            {!isPaused ? (
              <Button 
                variant="outlined" 
                startIcon={<PauseCircleOutline />} 
                onClick={pauseProcessing}
              >
                Pause
              </Button>
            ) : (
              <Button 
                variant="outlined" 
                color="primary"
                startIcon={<PlayCircleOutline />} 
                onClick={resumeProcessing}
              >
                Resume
              </Button>
            )}
            <Button 
              variant="outlined" 
              color="secondary" 
              startIcon={<Cancel />} 
              onClick={cancelProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant="outlined"
              startIcon={<Refresh />}
              disabled={!isPaused}
            >
              Retry Failed
            </Button>
          </>
        )}
      </ControlsContainer>

      <Collapse in={showErrors}>
        <Box mb={3}>
          <Typography variant="subtitle1" color="error" gutterBottom>
            Errors Encountered
          </Typography>
          <List dense>
            {errors.map((error, index) => (
              <ErrorItem key={index}>
                <ListItemText 
                  primary={error.message} 
                  secondary={`Conversation ID: ${error.conversationId || 'N/A'} • ${new Date(error.timestamp).toLocaleTimeString()}`} 
                />
                <Button size="small" variant="outlined">
                  Retry
                </Button>
              </ErrorItem>
            ))}
          </List>
        </Box>
      </Collapse>

      <Typography variant="subtitle1" gutterBottom>
        Processing Statistics
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TimerIcon color="primary" style={{ marginRight: 8 }} />
                <Typography variant="subtitle2">Processing Time</Typography>
              </Box>
              <Typography variant="h6">
                {formatTime(processingTime)}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SpeedIcon color="primary" style={{ marginRight: 8 }} />
                <Typography variant="subtitle2">Processing Rate</Typography>
              </Box>
              <Typography variant="h6">
                {isProcessing && processingTime > 0 
                  ? `${(processedCount / processingTime).toFixed(2)} conv/sec` 
                  : '0 conv/sec'}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <InfoIcon color="primary" style={{ marginRight: 8 }} />
                <Typography variant="subtitle2">Tokens Processed</Typography>
              </Box>
              <Typography variant="h6">
                {tokensProcessed.toLocaleString()}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <InfoIcon color="primary" style={{ marginRight: 8 }} />
                <Typography variant="subtitle2">Memory Chunks</Typography>
              </Box>
              <Typography variant="h6">
                {chunksCreated.toLocaleString()}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
      
      {isProcessing && (
        <Box mt={3} p={2} bgcolor="rgba(0, 0, 0, 0.03)" borderRadius={1}>
          <Typography variant="subtitle2" gutterBottom>
            Estimated Time Remaining
          </Typography>
          <Typography variant="body1">
            {formatTime(remainingTime)}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            style={{ marginTop: 8, height: 4 }}
          />
        </Box>
      )}
    </StyledPaper>
  );
};

export default ConversationProcessingStatus;
