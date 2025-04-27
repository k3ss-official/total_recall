const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

/**
 * Processing API
 * Handles processing conversations for memory injection
 */

// Start processing conversations
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
  const taskId = `process_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  // Start the processing in the background
  processConversationsBackground(token, conversation_ids, config, taskId);
  
  // Return the task ID for status checking
  return res.status(202).json({
    success: true,
    message: 'Processing started',
    taskId
  });
});

// Check processing status
router.get('/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  // In a real implementation, this would check a database or cache
  // For this demo, we'll simulate status updates
  const status = getProcessingStatus(taskId);
  
  return res.status(200).json({
    success: true,
    taskId,
    status
  });
});

// Background processing function
async function processConversationsBackground(token, conversationIds, config, taskId) {
  try {
    // Update status to started
    updateProcessingStatus(taskId, {
      status: 'started',
      message: 'Processing started',
      progress: 0,
      total: conversationIds.length,
      processed: 0,
      results: []
    });
    
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
    
    // Process each conversation
    const results = [];
    for (let i = 0; i < conversationIds.length; i++) {
      const conversationId = conversationIds[i];
      
      // Update status
      updateProcessingStatus(taskId, {
        status: 'processing',
        message: `Processing conversation ${i+1} of ${conversationIds.length}`,
        progress: Math.round((i / conversationIds.length) * 100),
        total: conversationIds.length,
        processed: i,
        results
      });
      
      try {
        // Navigate to the conversation
        await page.goto(`https://chat.openai.com/c/${conversationId}`, { waitUntil: 'networkidle2' });
        
        // Wait for conversation to load
        await page.waitForSelector('[data-testid="conversation-turn"]', { timeout: 10000 }).catch(() => {});
        
        // Extract conversation details
        const conversation = await page.evaluate(async (convId) => {
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
            const rootNode = data.current_node;
            const messageIds = [];
            
            // Build message chain from the root node
            let currentId = rootNode;
            while (currentId && data.mapping[currentId]) {
              const node = data.mapping[currentId];
              if (node.message) {
                messageIds.unshift(currentId);
              }
              currentId = node.parent;
            }
            
            // Format messages
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
        }, conversationId);
        
        // Process the conversation based on config
        const processed = processConversation(conversation, config);
        
        // Add to results
        results.push({
          id: conversationId,
          title: conversation.title,
          status: 'success',
          processed
        });
        
      } catch (error) {
        console.error(`Error processing conversation ${conversationId}:`, error);
        
        // Add failed result
        results.push({
          id: conversationId,
          status: 'failed',
          error: error.message || 'Unknown error'
        });
      }
    }
    
    // Close browser
    await browser.close();
    
    // Update status to completed
    updateProcessingStatus(taskId, {
      status: 'completed',
      message: 'Processing completed',
      progress: 100,
      total: conversationIds.length,
      processed: conversationIds.length,
      results
    });
    
  } catch (error) {
    console.error('Processing error:', error);
    
    // Update status to failed
    updateProcessingStatus(taskId, {
      status: 'failed',
      message: `Processing failed: ${error.message || 'Unknown error'}`
    });
  }
}

// Process a conversation based on config
function processConversation(conversation, config) {
  const { chunk_size = 1000, chunk_overlap = 200, summarize = true } = config || {};
  
  // Format the conversation
  let formattedText = `Title: ${conversation.title}\n\n`;
  
  // Add messages
  for (const message of conversation.messages) {
    const role = message.role === 'assistant' ? 'ChatGPT' : 'User';
    formattedText += `${role}: ${message.content}\n\n`;
  }
  
  // Create chunks if needed
  let chunks = [];
  if (formattedText.length > chunk_size) {
    chunks = createChunks(formattedText, chunk_size, chunk_overlap);
  } else {
    chunks = [formattedText];
  }
  
  // Create summary if requested
  let summary = null;
  if (summarize) {
    summary = generateSummary(conversation);
  }
  
  return {
    original_length: formattedText.length,
    chunks: chunks.map((chunk, index) => ({
      index,
      content: chunk,
      length: chunk.length
    })),
    summary,
    chunk_count: chunks.length
  };
}

// Create chunks from text
function createChunks(text, size, overlap) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.substring(start, end));
    start = end - overlap;
  }
  
  return chunks;
}

// Generate a summary of the conversation
function generateSummary(conversation) {
  // In a real implementation, this would use an LLM or similar
  // For this demo, we'll create a simple summary
  
  const messageCount = conversation.messages.length;
  const userMessages = conversation.messages.filter(m => m.role === 'user').length;
  const assistantMessages = conversation.messages.filter(m => m.role === 'assistant').length;
  
  const firstDate = new Date(conversation.create_time);
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const lastDate = new Date(lastMessage.create_time);
  
  return {
    title: conversation.title,
    message_count: messageCount,
    user_messages: userMessages,
    assistant_messages: assistantMessages,
    first_date: firstDate.toISOString(),
    last_date: lastDate.toISOString(),
    duration_minutes: Math.round((lastDate - firstDate) / (1000 * 60)),
    summary: `This conversation titled "${conversation.title}" contains ${messageCount} messages (${userMessages} from user, ${assistantMessages} from ChatGPT) and took place over ${Math.round((lastDate - firstDate) / (1000 * 60))} minutes.`
  };
}

// In-memory storage for processing status (would be a database in production)
const processingStatus = {};

// Update processing status
function updateProcessingStatus(taskId, status) {
  processingStatus[taskId] = {
    ...status,
    updatedAt: new Date().toISOString()
  };
}

// Get processing status
function getProcessingStatus(taskId) {
  return processingStatus[taskId] || {
    status: 'unknown',
    message: 'Task not found'
  };
}

module.exports = router;
