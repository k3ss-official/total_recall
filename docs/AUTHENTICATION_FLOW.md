# ChatGPT Authentication Flow Documentation

## Overview

The Total Recall application implements a secure authentication flow that allows users to log in with their ChatGPT credentials to access their conversation history. This document explains how the authentication process works, the security considerations, and how to use it in your implementation.

## Authentication Process

### 1. User Login

The authentication process begins when a user enters their ChatGPT credentials (email and password) in the login form. The frontend component responsible for this is `ChatGPTLoginForm.js`.

```javascript
// ChatGPTLoginForm.js (simplified)
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
```

### 2. Backend Authentication

When the login form is submitted, the credentials are sent to the backend API endpoint `/api/auth/chatgpt`. The backend uses Puppeteer, a headless browser automation library, to perform the actual authentication with ChatGPT.

```javascript
// chatgpt_auth.js (simplified)
router.post('/chatgpt', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Launch browser for authentication
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to ChatGPT login page
    await page.goto('https://chat.openai.com/auth/login', { waitUntil: 'networkidle2' });
    
    // Click the "Log in" button
    const loginButton = await page.waitForSelector('button:has-text("Log in")');
    await loginButton.click();
    
    // Wait for email input field and enter email
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', email);
    
    // Click continue
    await page.click('button[type="submit"]');
    
    // Wait for password input field and enter password
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });
    await page.type('input[name="password"]', password);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForNavigation({ timeout: 10000 });
    
    // Extract cookies
    const cookies = await page.cookies();
    const sessionCookie = cookies.find(cookie => cookie.name === '__Secure-next-auth.session-token');
    
    // Close browser
    await browser.close();
    
    // Return session token
    return res.status(200).json({
      success: true,
      sessionToken: sessionCookie.value,
      expiresAt: new Date(sessionCookie.expires * 1000).toISOString()
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed: ' + (error.message || 'Unknown error') 
    });
  }
});
```

### 3. Session Management

After successful authentication, the session token is stored in the browser's localStorage and used for all subsequent API requests. The `AuthContext.js` file manages this session state.

```javascript
// AuthContext.js (simplified)
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
```

## Security Considerations

1. **Credential Handling**: User credentials are never stored in the application. They are only used once during the authentication process to obtain a session token.

2. **Session Token Storage**: The session token is stored in localStorage, which is accessible only to scripts from the same origin.

3. **Server-Side Security**: The backend uses Puppeteer in headless mode, which means no visible browser window is opened during the authentication process.

4. **HTTPS**: All communication between the frontend and backend should be over HTTPS to prevent man-in-the-middle attacks.

5. **Token Expiration**: The session token has an expiration time set by ChatGPT. The application respects this expiration and requires re-authentication when the token expires.

## Using the Authentication Flow

To use the authentication flow in your application:

1. **Frontend Setup**:
   - Import and use the `AuthProvider` component at the root of your application
   - Use the `useAuth` hook in your components to access authentication state and functions

```javascript
// App.js
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your application components */}
    </AuthProvider>
  );
}
```

```javascript
// YourComponent.js
import { useAuth } from '../context/AuthContext';

function YourComponent() {
  const { currentUser, login, logout, isAuthenticated } = useAuth();
  
  // Use authentication state and functions
}
```

2. **Backend Setup**:
   - Ensure Puppeteer is installed and configured correctly
   - Set up the authentication endpoints as described in the implementation

3. **Protected Routes**:
   - Create a `ProtectedRoute` component to restrict access to authenticated users only

```javascript
// ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
}
```

## Troubleshooting

Common issues and their solutions:

1. **Authentication Fails**: Ensure the email and password are correct. ChatGPT may also have additional security measures like CAPTCHA or two-factor authentication that need to be handled.

2. **Session Token Not Found**: The authentication process might have failed to extract the session token. Check the Puppeteer navigation and cookie extraction logic.

3. **Session Expires Quickly**: ChatGPT may have security measures that invalidate sessions when accessed from unusual locations or through automated means.

4. **Puppeteer Launch Fails**: Ensure your server environment has the necessary dependencies for Puppeteer to run headless Chrome.

## Conclusion

This authentication flow provides a secure way to access ChatGPT's conversation history using the user's credentials. It respects user privacy by not storing credentials and uses standard web security practices to protect the session token.
