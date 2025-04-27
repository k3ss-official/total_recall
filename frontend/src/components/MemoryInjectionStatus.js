import React, { useState, useEffect } from 'react';
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
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Settings,
  Error as ErrorIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon
} from '@material-ui/icons';
import { styled } from '@material-ui/core/styles';
import { useInjection } from '../context/InjectionContext';
import { useConversation } from '../context/ConversationContext';

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

const RateLimitContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
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

const MemoryInjectionStatus = () => {
  const { 
    isInjecting,
    isPaused,
    progress,
    injectedCount,
    totalCount,
    rateLimit,
    statusMessage,
    errors,
    startInjection,
    pauseInjection,
    resumeInjection,
    cancelInjection,
    updateRateLimit,
    getInjectionDuration,
    getEstimatedTimeRemaining
  } = useInjection();
  
  const { conversations } = useConversation();
  
  const [showRateSettings, setShowRateSettings] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [injectionTime, setInjectionTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  // Update times every second when injecting
  useEffect(() => {
    if (!isInjecting) return;
    
    const timer = setInterval(() => {
      setInjectionTime(getInjectionDuration());
      setRemainingTime(getEstimatedTimeRemaining());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isInjecting, getInjectionDuration, getEstimatedTimeRemaining]);

  // Get count of included conversations
  const getIncludedCount = () => {
    return conversations.filter(conv => conv.included).length;
  };

  // Simulate injection for demo purposes
  const handleStartInjection = () => {
    const includedCount = getIncludedCount();
    startInjection(includedCount);
    
    // Simulate progress updates
    let currentProgress = 0;
    let injectedItems = 0;
    
    const interval = setInterval(() => {
      if (isPaused) return; // Don't update if paused
      
      currentProgress += 2; // Increment by 2% each time (slower than processing)
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        currentProgress = 100;
      }
      
      // Calculate injected items based on progress
      injectedItems = Math.floor((currentProgress / 100) * includedCount);
      
      // Update progress
      updateProgress(currentProgress, injectedItems);
    }, 1000);
  };

  return (
    <StyledPaper elevation={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Memory Injection
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
      
      {isInjecting && (
        <ProgressContainer>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="body2">
              {statusMessage || 'Injecting memories...'}
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
            {injectedCount} of {totalCount} memories injected
          </Typography>
        </ProgressContainer>
      )}
      
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1">Rate Limiting Controls</Typography>
        <IconButton size="small" onClick={() => setShowRateSettings(!showRateSettings)}>
          <Settings fontSize="small" />
        </IconButton>
      </Box>
      
      <RateLimitContainer>
        <Typography id="rate-limit-slider" gutterBottom>
          Requests per minute: {rateLimit}
        </Typography>
        <Slider
          value={rateLimit}
          onChange={(e, newValue) => updateRateLimit(newValue)}
          aria-labelledby="rate-limit-slider"
          step={1}
          marks
          min={1}
          max={10}
          valueLabelDisplay="auto"
        />
        <Typography variant="body2" color="textSecondary">
          Lower values reduce API rate limit errors but increase injection time
        </Typography>
      </RateLimitContainer>
      
      <ControlsContainer>
        {!isInjecting ? (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleStartInjection}
            disabled={getIncludedCount() === 0}
          >
            Start Injection
          </Button>
        ) : (
          <>
            {!isPaused ? (
              <Button 
                variant="outlined" 
                startIcon={<PauseCircleOutline />} 
                onClick={pauseInjection}
              >
                Pause
              </Button>
            ) : (
              <Button 
                variant="outlined" 
                color="primary"
                startIcon={<PlayCircleOutline />} 
                onClick={resumeInjection}
              >
                Resume
              </Button>
            )}
            <Button 
              variant="outlined" 
              color="secondary" 
              startIcon={<Cancel />} 
              onClick={cancelInjection}
            >
              Cancel
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
                  secondary={`Memory ID: ${error.memoryId || 'N/A'} • ${new Date(error.timestamp).toLocaleTimeString()}`} 
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
        Injection Statistics
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TimerIcon color="primary" style={{ marginRight: 8 }} />
                <Typography variant="subtitle2">Injection Time</Typography>
              </Box>
              <Typography variant="h6">
                {formatTime(injectionTime)}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SpeedIcon color="primary" style={{ marginRight: 8 }} />
                <Typography variant="subtitle2">Injection Rate</Typography>
              </Box>
              <Typography variant="h6">
                {isInjecting && injectionTime > 0 
                  ? `${(injectedCount / injectionTime).toFixed(2)} mem/sec` 
                  : '0 mem/sec'}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <InfoIcon color="primary" style={{ marginRight: 8 }} />
                <Typography variant="subtitle2">Current Rate Limit</Typography>
              </Box>
              <Typography variant="h6">
                {rateLimit} req/min
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <InfoIcon color="primary" style={{ marginRight: 8 }} />
                <Typography variant="subtitle2">Memories Selected</Typography>
              </Box>
              <Typography variant="h6">
                {getIncludedCount()} of {conversations.length}
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
      
      {isInjecting && (
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

// Add missing Grid component
const Grid = ({ container, item, xs, sm, md, spacing, children, ...props }) => {
  const style = {
    ...(container && { display: 'flex', flexWrap: 'wrap', margin: -spacing/2 }),
    ...(item && { 
      padding: spacing/2,
      flexBasis: xs ? `${(xs / 12) * 100}%` : undefined,
      flexGrow: xs ? 0 : undefined,
      maxWidth: xs ? `${(xs / 12) * 100}%` : undefined,
      '@media (min-width: 600px)': sm ? {
        flexBasis: `${(sm / 12) * 100}%`,
        flexGrow: 0,
        maxWidth: `${(sm / 12) * 100}%`,
      } : undefined,
      '@media (min-width: 960px)': md ? {
        flexBasis: `${(md / 12) * 100}%`,
        flexGrow: 0,
        maxWidth: `${(md / 12) * 100}%`,
      } : undefined,
    }),
  };
  
  return (
    <Box style={style} {...props}>
      {children}
    </Box>
  );
};

export default MemoryInjectionStatus;
