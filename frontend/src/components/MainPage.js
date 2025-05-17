import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Button,
  AppBar,
  Toolbar,
  IconButton,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel
} from '@material-ui/core';
import { 
  Menu as MenuIcon, 
  LockOpen, 
  Storage, 
  Build, 
  CheckCircle, 
  CloudUpload,
  Brightness4,
  Brightness7
} from '@material-ui/icons';
import { styled, useTheme, ThemeProvider, createTheme } from '@material-ui/core/styles';

import AuthenticationPage from './AuthenticationPage';
import ConversationRetrievalStatus from './ConversationRetrievalStatus';
import ConversationProcessingStatus from './ConversationProcessingStatus';
import ConversationViewer from './ConversationViewer';
import MemoryInjectionStatus from './MemoryInjectionStatus';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const steps = [
  'Authentication',
  'Conversation Retrieval',
  'Processing',
  'Verification',
  'Memory Injection'
];

const MainPage = ({ 
  isAuthenticated, 
  onAuthenticate, 
  onLogout,
  darkMode,
  onToggleDarkMode
}) => {
  const [activeStep, setActiveStep] = useState(isAuthenticated ? 1 : 0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Sample data for demonstration
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [retrievalProgress, setRetrievalProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [injectionProgress, setInjectionProgress] = useState(0);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (step) => {
    if (step <= activeStep) {
      setActiveStep(step);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
    >
      <Box p={2} display="flex" alignItems="center" justifyContent="center">
        <Typography variant="h6">Total Recall</Typography>
      </Box>
      <Divider />
      <List>
        {steps.map((text, index) => (
          <ListItem 
            button 
            key={text} 
            onClick={() => {
              handleStepClick(index);
              if (isMobile) toggleDrawer();
            }}
            disabled={index > activeStep}
            selected={index === activeStep}
          >
            <ListItemIcon>
              {index === 0 && <LockOpen />}
              {index === 1 && <Storage />}
              {index === 2 && <Build />}
              {index === 3 && <CheckCircle />}
              {index === 4 && <CloudUpload />}
            </ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box p={2}>
        <FormControlLabel
          control={
            <Switch
              checked={darkMode}
              onChange={onToggleDarkMode}
              name="darkMode"
              color="primary"
            />
          }
          label="Dark Mode"
        />
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Total Recall
          </Typography>
          <IconButton color="inherit" onClick={onToggleDarkMode}>
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          {isAuthenticated && (
            <Button color="inherit" onClick={onLogout}>
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        {drawerContent}
      </Drawer>

      <Container maxWidth="lg">
        <StyledPaper elevation={3}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label} completed={activeStep > index}>
                <StepLabel 
                  onClick={() => handleStepClick(index)}
                  style={{ cursor: index <= activeStep ? 'pointer' : 'default' }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box mt={4}>
            {activeStep === 0 && (
              <AuthenticationPage 
                onAuthenticate={onAuthenticate} 
                isAuthenticated={isAuthenticated} 
              />
            )}
            
            {activeStep === 1 && (
              <ConversationRetrievalStatus 
                isRetrieving={isRetrieving}
                progress={retrievalProgress}
                conversations={conversations}
                onPreviewConversation={(id) => {
                  const conversation = conversations.find(c => c.id === id);
                  setSelectedConversation(conversation);
                  setActiveStep(3); // Move to verification step
                }}
                onRefresh={() => {
                  // Simulate refresh
                  setIsRetrieving(true);
                  setRetrievalProgress(0);
                  const interval = setInterval(() => {
                    setRetrievalProgress(prev => {
                      if (prev >= 100) {
                        clearInterval(interval);
                        setIsRetrieving(false);
                        return 100;
                      }
                      return prev + 10;
                    });
                  }, 500);
                }}
              />
            )}
            
            {activeStep === 2 && (
              <ConversationProcessingStatus 
                isProcessing={isProcessing}
                progress={processingProgress}
                processedCount={0}
                totalCount={conversations.length}
                tokensProcessed={0}
                chunksCreated={0}
                onPause={() => {}}
                onResume={() => {}}
                onCancel={() => {}}
              />
            )}
            
            {activeStep === 3 && (
              <ConversationViewer 
                conversation={selectedConversation}
                onEdit={() => {}}
                onExport={() => {}}
                onInclude={() => {}}
                onExclude={() => {}}
              />
            )}
            
            {activeStep === 4 && (
              <MemoryInjectionStatus 
                isInjecting={isInjecting}
                progress={injectionProgress}
                injectedCount={0}
                totalCount={conversations.length}
                rateLimit={3}
                onRateLimitChange={() => {}}
                onPause={() => {}}
                onResume={() => {}}
                onCancel={() => {}}
              />
            )}
          </Box>

          <Box mt={4} display="flex" justifyContent="space-between">
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={activeStep === steps.length - 1 || (activeStep === 0 && !isAuthenticated)}
            >
              {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </Box>
        </StyledPaper>
      </Container>
    </>
  );
};

MainPage.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  onAuthenticate: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  darkMode: PropTypes.bool.isRequired,
  onToggleDarkMode: PropTypes.func.isRequired,
};

export default MainPage;
