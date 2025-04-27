# Conversation Extraction and Processing Documentation

## Overview

The Total Recall application provides functionality to extract conversations from ChatGPT, process them for optimal memory injection, and inject them back into ChatGPT's memory. This document explains how these processes work and how to use them in your implementation.

## Conversation Extraction

### 1. Fetching Conversations List

The application first retrieves a list of all conversations from the user's ChatGPT account. This is handled by the `/api/conversations` endpoint.

```javascript
// conversations.js (simplified)
router.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  
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
    
    // Navigate to ChatGPT
    await page.goto('https://chat.openai.com/', { waitUntil: 'networkidle2' });
    
    // Extract conversations using ChatGPT's API
    const conversations = await page.evaluate(async () => {
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
    });
    
    // Close browser
    await browser.close();
    
    // Return conversations
    return res.status(200).json({
      success: true,
      conversations
    });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversations: ' + (error.message || 'Unknown error') 
    });
  }
});
```

### 2. Fetching Conversation Details

Once the user selects a conversation, the application fetches the complete conversation details, including all messages. This is handled by the `/api/conversations/:conversationId` endpoint.

```javascript
// conversations.js (simplified)
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
    
    // Extract conversation details using ChatGPT's API
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
    }, conversationId);
    
    // Close browser
    await browser.close();
    
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
```

## Conversation Processing

Before injecting conversations into ChatGPT's memory, they need to be processed to optimize for memory retention. This is handled by the `/api/processing` endpoint.

```javascript
// processing.js (simplified)
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
```

### Processing Logic

The processing logic includes:

1. **Chunking**: Breaking long conversations into smaller, manageable pieces
2. **Summarization**: Creating concise summaries of conversations
3. **Formatting**: Structuring the conversation in a way that's optimal for memory injection

```javascript
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
```

## Memory Injection

The final step is injecting the processed conversations into ChatGPT's memory. This is handled by the `/api/injection` endpoint.

```javascript
// injection.js (simplified)
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
```

### Injection Process

The injection process involves:

1. **Formatting**: Preparing the conversation in a format that ChatGPT can understand and remember
2. **Injection**: Creating a new chat and sending the formatted conversation as a message
3. **Confirmation**: Waiting for ChatGPT to confirm it has stored the conversation in memory

```javascript
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
```

## Using the Conversation Features

To use these features in your application:

1. **Fetching Conversations**:
   - Use the `ConversationContext` to manage conversation state
   - Call the API to fetch conversations and conversation details

```javascript
// ConversationContext.js (simplified)
export const ConversationProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Fetch conversations
  const fetchConversations = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getConversations(currentUser.sessionToken);
      setConversations(response.conversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversation details
  const fetchConversationDetails = async (conversationId) => {
    if (!currentUser || !conversationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getConversationDetails(currentUser.sessionToken, conversationId);
      setSelectedConversation(response.conversation);
    } catch (err) {
      console.error('Error fetching conversation details:', err);
      setError(err.message || 'Failed to fetch conversation details');
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    conversations,
    selectedConversation,
    loading,
    error,
    fetchConversations,
    fetchConversationDetails,
    selectConversation: fetchConversationDetails
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};
```

2. **Processing Conversations**:
   - Use the `ProcessingContext` to manage processing state and operations

```javascript
// ProcessingContext.js (simplified)
export const ProcessingProvider = ({ children }) => {
  const [processingTasks, setProcessingTasks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Start processing
  const processConversations = async (conversationIds, config) => {
    if (!currentUser || !conversationIds || conversationIds.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.processConversations(
        currentUser.sessionToken, 
        conversationIds, 
        config
      );
      
      // Add task to tracking
      setProcessingTasks(prev => ({
        ...prev,
        [response.taskId]: {
          id: response.taskId,
          status: 'started',
          conversationIds,
          config,
          startTime: new Date().toISOString()
        }
      }));
      
      return response.taskId;
    } catch (err) {
      console.error('Error processing conversations:', err);
      setError(err.message || 'Failed to process conversations');
    } finally {
      setLoading(false);
    }
  };

  // Check processing status
  const checkProcessingStatus = async (taskId) => {
    if (!currentUser || !taskId) return;
    
    try {
      const response = await api.getProcessingStatus(currentUser.sessionToken, taskId);
      
      // Update task status
      setProcessingTasks(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          ...response.status,
          lastChecked: new Date().toISOString()
        }
      }));
      
      return response.status;
    } catch (err) {
      console.error('Error checking processing status:', err);
    }
  };

  // Context value
  const value = {
    processingTasks,
    loading,
    error,
    processConversations,
    checkProcessingStatus
  };

  return (
    <ProcessingContext.Provider value={value}>
      {children}
    </ProcessingContext.Provider>
  );
};
```

3. **Injecting Memory**:
   - Use the `InjectionContext` to manage memory injection operations

```javascript
// InjectionContext.js (simplified)
export const InjectionProvider = ({ children }) => {
  const [injectionTasks, setInjectionTasks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  // Start memory injection
  const injectMemory = async (conversationIds, config) => {
    if (!currentUser || !conversationIds || conversationIds.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.injectMemory(
        currentUser.sessionToken, 
        conversationIds, 
        config
      );
      
      // Add task to tracking
      setInjectionTasks(prev => ({
        ...prev,
        [response.taskId]: {
          id: response.taskId,
          status: 'started',
          conversationIds,
          config,
          startTime: new Date().toISOString()
        }
      }));
      
      return response.taskId;
    } catch (err) {
      console.error('Error injecting memory:', err);
      setError(err.message || 'Failed to inject memory');
    } finally {
      setLoading(false);
    }
  };

  // Check injection status
  const checkInjectionStatus = async (taskId) => {
    if (!currentUser || !taskId) return;
    
    try {
      const response = await api.getInjectionStatus(currentUser.sessionToken, taskId);
      
      // Update task status
      setInjectionTasks(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          ...response.status,
          lastChecked: new Date().toISOString()
        }
      }));
      
      return response.status;
    } catch (err) {
      console.error('Error checking injection status:', err);
    }
  };

  // Context value
  const value = {
    injectionTasks,
    loading,
    error,
    injectMemory,
    checkInjectionStatus
  };

  return (
    <InjectionContext.Provider value={value}>
      {children}
    </InjectionContext.Provider>
  );
};
```

## Best Practices

1. **Selective Injection**: Don't inject all conversations at once. Select the most relevant ones for your current task.

2. **Chunking Strategy**: For very long conversations, adjust the chunk size and overlap based on the content complexity.

3. **Summarization**: Use summaries for quick reference and full conversations for detailed context.

4. **Verification**: Always verify that ChatGPT has successfully stored the conversation by asking it to recall specific details.

5. **Rate Limiting**: Be mindful of ChatGPT's rate limits and avoid injecting too many conversations in a short period.

## Troubleshooting

Common issues and their solutions:

1. **Conversation Not Found**: Ensure the conversation ID is correct and the user has access to it.

2. **Processing Fails**: Check if the conversation structure is unusual or contains unsupported content.

3. **Injection Not Working**: Verify that the formatted text is not too long for ChatGPT to process in a single message.

4. **Memory Not Retained**: ChatGPT has memory limitations. Try injecting smaller chunks or more focused content.

## Conclusion

The conversation extraction, processing, and memory injection features provide a powerful way to enhance ChatGPT's context awareness by giving it access to your past conversations. By following the patterns and best practices outlined in this document, you can effectively implement these features in your own applications.
