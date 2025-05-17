const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

/**
 * Memory Injection API
 * Handles injecting processed conversations into ChatGPT memory
 */

// Start memory injection process
router.post('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'No authentication token provided' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  const { conversation_ids, config } = req.body;
  
  if (!conversation_ids || !Array.isArray(conversation_ids) || conversation_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one conversation ID is required'
    });
  }
  
  // Generate a task ID for tracking
  const taskId = `inject_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  // Start the injection process in the background
  injectMemoryBackground(token, conversation_ids, config, taskId);
  
  // Return the task ID for status checking
  return res.status(202).json({
    success: true,
    message: 'Memory injection started',
    taskId
  });
});

// Check injection status
router.get('/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  // In a real implementation, this would check a database or cache
  // For this demo, we'll simulate status updates
  const status = getInjectionStatus(taskId);
  
  return res.status(200).json({
    success: true,
    taskId,
    status
  });
});

// Background injection process
async function injectMemoryBackground(token, conversationIds, config, taskId) {
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
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="text-input-button"]', { timeout: 10000 }).catch(() => {});
    
    // For each conversation, create a memory injection message
    for (const conversationId of conversationIds) {
      // Update status
      updateInjectionStatus(taskId, {
        status: 'processing',
        current: conversationIds.indexOf(conversationId) + 1,
        total: conversationIds.length,
        message: `Injecting conversation ${conversationId}`
      });
      
      // Get conversation details
      const conversation = await fetchConversationDetails(page, conversationId);
      
      if (!conversation) {
        console.error(`Failed to fetch conversation ${conversationId}`);
        continue;
      }
      
      // Format the conversation for memory injection
      const memoryText = formatConversationForMemory(conversation, config);
      
      // Type the memory injection message
      await page.type('[data-testid="text-input"]', memoryText);
      
      // Send the message
      await page.click('[data-testid="text-input-button"]');
      
      // Wait for response
      await page.waitForSelector('[data-testid="conversation-turn"]', { timeout: 30000 }).catch(() => {});
      
      // Wait a bit before the next injection
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Update status to completed
    updateInjectionStatus(taskId, {
      status: 'completed',
      message: 'Memory injection completed successfully'
    });
    
    // Close browser
    await browser.close();
    
  } catch (error) {
    console.error('Memory injection error:', error);
    
    // Update status to failed
    updateInjectionStatus(taskId, {
      status: 'failed',
      message: `Memory injection failed: ${error.message || 'Unknown error'}`
    });
  }
}

// Fetch conversation details
async function fetchConversationDetails(page, conversationId) {
  try {
    return await page.evaluate(async (convId) => {
      const response = await fetch(`https://chat.openai.com/backend-api/conversation/${convId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation details');
      }
      
      return await response.json();
    }, conversationId);
  } catch (error) {
    console.error(`Error fetching conversation ${conversationId}:`, error);
    return null;
  }
}

// Format conversation for memory injection
function formatConversationForMemory(conversation, config) {
  let memoryText = `Please remember the following conversation from ${new Date(conversation.create_time * 1000).toLocaleString()}:\n\n`;
  
  // Add title
  memoryText += `Title: ${conversation.title}\n\n`;
  
  // Add messages
  if (conversation.mapping) {
    const rootNode = conversation.current_node;
    const messageIds = [];
    
    // Build message chain from the root node
    let currentId = rootNode;
    while (currentId && conversation.mapping[currentId]) {
      const node = conversation.mapping[currentId];
      if (node.message) {
        messageIds.unshift(currentId);
      }
      currentId = node.parent;
    }
    
    // Format messages
    for (const id of messageIds) {
      const messageData = conversation.mapping[id].message;
      if (messageData) {
        const role = messageData.author.role === 'assistant' ? 'ChatGPT' : 'User';
        const content = messageData.content.parts.join('\n');
        memoryText += `${role}: ${content}\n\n`;
      }
    }
  }
  
  // Add memory instruction
  memoryText += "Please confirm you've stored this conversation in your memory.";
  
  return memoryText;
}

// In-memory storage for injection status (would be a database in production)
const injectionStatus = {};

// Update injection status
function updateInjectionStatus(taskId, status) {
  injectionStatus[taskId] = {
    ...status,
    updatedAt: new Date().toISOString()
  };
}

// Get injection status
function getInjectionStatus(taskId) {
  return injectionStatus[taskId] || {
    status: 'unknown',
    message: 'Task not found'
  };
}

module.exports = router;
