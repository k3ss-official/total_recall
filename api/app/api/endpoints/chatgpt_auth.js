const express = require('express');
const axios = require('axios');
const puppeteer = require('puppeteer');
const router = express.Router();

/**
 * ChatGPT Authentication API
 * Handles authentication with ChatGPT and session management
 */

// Authenticate with ChatGPT using email and password
router.post('/chatgpt', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }

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
    try {
      await page.waitForNavigation({ timeout: 10000 });
    } catch (error) {
      // Check if there's an error message
      const errorElement = await page.$('.text-red');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        await browser.close();
        return res.status(401).json({ 
          success: false, 
          message: errorText || 'Authentication failed' 
        });
      }
    }
    
    // Extract cookies
    const cookies = await page.cookies();
    const sessionCookie = cookies.find(cookie => cookie.name === '__Secure-next-auth.session-token');
    
    if (!sessionCookie) {
      await browser.close();
      return res.status(401).json({ 
        success: false, 
        message: 'Failed to obtain session token' 
      });
    }
    
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

// Check authentication status
router.get('/status', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      authenticated: false, 
      message: 'No authentication token provided' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Make a request to ChatGPT API to verify token
    const response = await axios.get('https://chat.openai.com/api/auth/session', {
      headers: {
        Cookie: `__Secure-next-auth.session-token=${token}`
      }
    });
    
    if (response.data && response.data.user) {
      return res.status(200).json({
        authenticated: true,
        email: response.data.user.email,
        name: response.data.user.name
      });
    } else {
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Invalid or expired token' 
      });
    }
    
  } catch (error) {
    console.error('Auth status check error:', error);
    return res.status(401).json({ 
      authenticated: false, 
      message: 'Failed to verify authentication status' 
    });
  }
});

module.exports = router;
