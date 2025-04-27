import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@material-ui/core';
import { 
  Menu as MenuIcon, 
  LockOpen, 
  Storage, 
  Build, 
  CheckCircle, 
  CloudUpload,
  Brightness4,
  Brightness7,
  ExitToApp
} from '@material-ui/icons';
import { styled } from '@material-ui/core/styles';

import AuthenticationPage from './AuthenticationPage';
import ConversationRetrievalStatus from './ConversationRetrievalStatus';
import ConversationProcessingStatus from './ConversationProcessingStatus';
import ConversationViewer from './ConversationViewer';
import MemoryInjectionStatus from './MemoryInjectionStatus';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ConversationProvider, useConversation } from '../context/ConversationContext';
import { ProcessingProvider } from '../context/ProcessingContext';
import { VerificationProvider } from '../context/VerificationContext';
import { InjectionProvider } from '../context/InjectionContext';

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

const MainApp = () => {
  const [darkMode, setDarkMode] = useState(false);
  
  // Create theme based on dark mode preference
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          type: darkMode ? 'dark' : 'light',
          primary: {
            main: '#3f51b5',
          },
          secondary: {
            main: '#f50057',
          },
        },
      }),
    [darkMode],
  );
  
  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ConversationProvider>
          <ProcessingProvider>
            <VerificationProvider>
              <InjectionProvider>
                <MainPage 
                  darkMode={darkMode}
                  onToggleDarkMode={handleToggleDarkMode}
                />
              </InjectionProvider>
            </VerificationProvider>
          </ProcessingProvider>
        </ConversationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const MainPage = ({ darkMode, onToggleDarkMode }) => {
  const { isAuthenticated, authenticate, logout } = useAuth();
  const { selectConversation } = useConversation();
  const [activeStep, setActiveStep] = useState(isAuthenticated ? 1 : 0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = createTheme(); // Use this for accessing theme properties
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Update active step when authentication state changes
  useEffect(() => {
    if (!isAuthenticated && activeStep > 0) {
      setActiveStep(0);
    } else if (isAuthenticated && activeStep === 0) {
      setActiveStep(1);
    }
  }, [isAuthenticated, activeStep]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (step) => {
    if (isAuthenticated && step <= Math.max(activeStep, 1)) {
      setActiveStep(step);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handlePreviewConversation = (id) => {
    selectConversation(id);
    setActiveStep(3); // Move to verification step
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
            disabled={!isAuthenticated || index > Math.max(activeStep, 1)}
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
            <Button 
              color="inherit" 
              onClick={logout}
              startIcon={<ExitToApp />}
            >
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
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel
            style={{ overflowX: 'auto', padding: '8px 0' }}
          >
            {steps.map((label, index) => (
              <Step key={label} completed={isAuthenticated && activeStep > index}>
                <StepLabel 
                  onClick={() => handleStepClick(index)}
                  style={{ 
                    cursor: isAuthenticated && index <= Math.max(activeStep, 1) ? 'pointer' : 'default',
                    padding: '0 8px'
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box mt={4}>
            {activeStep === 0 && (
              <AuthenticationPage 
                onAuthenticate={authenticate} 
                isAuthenticated={isAuthenticated} 
              />
            )}
            
            {activeStep === 1 && (
              <ConversationRetrievalStatus 
                onPreviewConversation={handlePreviewConversation}
              />
            )}
            
            {activeStep === 2 && (
              <ConversationProcessingStatus />
            )}
            
            {activeStep === 3 && (
              <ConversationViewer />
            )}
            
            {activeStep === 4 && (
              <MemoryInjectionStatus />
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

export default MainApp;
