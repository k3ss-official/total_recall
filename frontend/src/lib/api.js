import axios from 'axios';

/**
 * API client for Total Recall
 * Handles all API requests to the backend and ChatGPT
 */
const api = {
  /**
   * Authenticate with ChatGPT using email and password
   * @param {string} email - User's ChatGPT email
   * @param {string} password - User's ChatGPT password
   * @returns {Promise<Object>} - Authentication response with session token
   */
  authenticateWithChatGPT: async (email, password) => {
    try {
      const response = await axios.post('/api/auth/chatgpt', { email, password });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Authentication failed');
      }
      throw new Error('Network error during authentication');
    }
  },

  /**
   * Check authentication status
   * @param {string} token - ChatGPT session token
   * @returns {Promise<Object>} - Authentication status
   */
  checkAuthStatus: async (token) => {
    try {
      const response = await axios.get('/api/auth/status', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return { authenticated: false };
    }
  },

  /**
   * Fetch conversations from ChatGPT
   * @param {string} token - ChatGPT session token
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Conversations data
   */
  fetchConversations: async (token, params = {}) => {
    try {
      const response = await axios.get('/api/conversations', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch conversations');
      }
      throw new Error('Network error while fetching conversations');
    }
  },

  /**
   * Fetch conversation details
   * @param {string} token - ChatGPT session token
   * @param {string} conversationId - ID of the conversation
   * @returns {Promise<Object>} - Conversation details
   */
  fetchConversationDetails: async (token, conversationId) => {
    try {
      const response = await axios.get(`/api/conversations/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch conversation details');
      }
      throw new Error('Network error while fetching conversation details');
    }
  },

  /**
   * Process conversations for memory injection
   * @param {string} token - ChatGPT session token
   * @param {Array<string>} conversationIds - IDs of conversations to process
   * @param {Object} config - Processing configuration
   * @returns {Promise<Object>} - Processing task info
   */
  processConversations: async (token, conversationIds, config) => {
    try {
      const response = await axios.post('/api/processing', {
        conversation_ids: conversationIds,
        config
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to process conversations');
      }
      throw new Error('Network error during conversation processing');
    }
  },

  /**
   * Check processing status
   * @param {string} token - ChatGPT session token
   * @param {string} taskId - Processing task ID
   * @returns {Promise<Object>} - Processing status
   */
  checkProcessingStatus: async (token, taskId) => {
    try {
      const response = await axios.get(`/api/processing/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to check processing status');
      }
      throw new Error('Network error while checking processing status');
    }
  },

  /**
   * Inject conversations into memory
   * @param {string} token - ChatGPT session token
   * @param {Array<string>} conversationIds - IDs of conversations to inject
   * @param {Object} config - Injection configuration
   * @returns {Promise<Object>} - Injection task info
   */
  injectMemory: async (token, conversationIds, config) => {
    try {
      const response = await axios.post('/api/injection', {
        conversation_ids: conversationIds,
        config
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to inject memory');
      }
      throw new Error('Network error during memory injection');
    }
  },

  /**
   * Check injection status
   * @param {string} token - ChatGPT session token
   * @param {string} taskId - Injection task ID
   * @returns {Promise<Object>} - Injection status
   */
  checkInjectionStatus: async (token, taskId) => {
    try {
      const response = await axios.get(`/api/injection/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to check injection status');
      }
      throw new Error('Network error while checking injection status');
    }
  }
};

export default api;
