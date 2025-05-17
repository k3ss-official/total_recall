import React from 'react';
import { 
  createTheme, 
  ThemeProvider, 
  CssBaseline, 
  Snackbar,
  Button
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import MainApp from './components/MainApp';

// Create Error Boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error information
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          marginTop: '50px',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h2>Something went wrong</h2>
          <p>The application encountered an unexpected error. Please try refreshing the page.</p>
          <details style={{ 
            whiteSpace: 'pre-wrap',
            textAlign: 'left',
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            marginTop: '20px'
          }}>
            <summary>Error details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <Button 
            variant="contained" 
            color="primary" 
            style={{ marginTop: '20px' }}
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create Global Error Handler component
const GlobalErrorHandler = ({ children }) => {
  const [error, setError] = React.useState(null);

  // Set up global error handler
  React.useEffect(() => {
    const handleGlobalError = (event) => {
      event.preventDefault();
      setError(event.error || new Error('An unknown error occurred'));
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', (event) => {
      handleGlobalError({ preventDefault: () => {}, error: event.reason });
    });

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
  }, []);

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <>
      {children}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error">
          {error ? error.message : 'An unknown error occurred'}
        </Alert>
      </Snackbar>
    </>
  );
};

// Main App with error handling
const App = () => {
  // Create default theme
  const theme = createTheme({
    palette: {
      type: 'light',
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#f50057',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <GlobalErrorHandler>
          <MainApp />
        </GlobalErrorHandler>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
