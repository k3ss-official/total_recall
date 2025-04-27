const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

/**
 * Conversation API
 * Handles fetching conversations from ChatGPT
 */

// Get list of conversations
router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'No authentication token provided' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  const { offset = 0, limit = 20 } = req.query;
  
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set session cookie
    await page.setCookie({
      name: '__Secure-next-auth.session-token',
      value: token,
      domain: 'chat.openai.com',
      path: '/',
      httpOnly: true,
      secure: true
    });
    
    // Navigate to ChatGPT
    await page.goto('https://chat.openai.com/', { waitUntil: 'networkidle2' });
    
    // Wait for conversations to load
    await page.waitForSelector('[data-testid="conversation-turn"]', { timeout: 10000 }).catch(() => {});
    
    // Extract conversations using ChatGPT's API
    const conversations = await page.evaluate(async () => {
      // This function runs in the browser context
      const response = await fetch('https://chat.openai.com/backend-api/conversations?offset=0&limit=100&order=updated', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      return data.items.map(item => ({
        id: item.id,
        title: item.title,
        create_time: item.create_time,
        update_time: item.update_time
      }));
    }).catch(error => {
      console.error('Error extracting conversations:', error);
      return [];
    });
    
    // Close browser
    await browser.close();
    
    // Return conversations
    return res.status(200).json({
      success: true,
      conversations,
      total: conversations.length,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversations: ' + (error.message || 'Unknown error') 
    });
  }
});

// Get conversation details
router.get('/:conversationId', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { conversationId } = req.params;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'No authentication token provided' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set session cookie
    await page.setCookie({
      name: '__Secure-next-auth.session-token',
      value: token,
      domain: 'chat.openai.com',
      path: '/',
      httpOnly: true,
      secure: true
    });
    
    // Navigate to the specific conversation
    await page.goto(`https://chat.openai.com/c/${conversationId}`, { waitUntil: 'networkidle2' });
    
    // Wait for conversation to load
    await page.waitForSelector('[data-testid="conversation-turn"]', { timeout: 10000 }).catch(() => {});
    
    // Extract conversation details using ChatGPT's API
    const conversation = await page.evaluate(async (convId) => {
      // This function runs in the browser context
      const response = await fetch(`https://chat.openai.com/backend-api/conversation/${convId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation details');
      }
      
      const data = await response.json();
      
      // Extract messages
      const messages = [];
      if (data.mapping) {
        const messageIds = Object.keys(data.mapping).filter(key => 
          data.mapping[key].message && data.mapping[key].parent === data.current_node
        );
        
        for (const id of messageIds) {
          const messageData = data.mapping[id].message;
          if (messageData) {
            messages.push({
              role: messageData.author.role,
              content: messageData.content.parts.join('\n'),
              create_time: new Date(messageData.create_time * 1000).toISOString()
            });
          }
        }
      }
      
      return {
        id: data.conversation_id,
        title: data.title,
        create_time: data.create_time ? new Date(data.create_time * 1000).toISOString() : null,
        update_time: data.update_time ? new Date(data.update_time * 1000).toISOString() : null,
        messages
      };
    }, conversationId).catch(error => {
      console.error('Error extracting conversation details:', error);
      return null;
    });
    
    // Close browser
    await browser.close();
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Conversation not found or could not be loaded' 
      });
    }
    
    // Return conversation details
    return res.status(200).json({
      success: true,
      conversation
    });
    
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversation details: ' + (error.message || 'Unknown error') 
    });
  }
});

module.exports = router;
