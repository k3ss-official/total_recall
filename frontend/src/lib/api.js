// API client for Total Recall
import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('openai_session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('openai_session_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await apiClient.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  
  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },
  
  checkStatus: async () => {
    const response = await apiClient.get('/auth/status');
    return response.data;
  },
  
  validateOpenAIKey: async (apiKey) => {
    const response = await apiClient.post(`/auth/validate-openai-key?api_key=${apiKey}`);
    return response.data;
  }
};

// Conversations API
export const conversationsAPI = {
  list: async (page = 1, pageSize = 10, filters = {}) => {
    const params = new URLSearchParams({
      page,
      page_size: pageSize,
      ...filters
    });
    
    const response = await apiClient.get(`/conversations/conversations?${params}`);
    return response.data;
  },
  
  getDetail: async (conversationId) => {
    const response = await apiClient.get(`/conversations/conversations/${conversationId}`);
    return response.data;
  },
  
  filter: async (criteria, page = 1, pageSize = 10) => {
    const params = new URLSearchParams({
      page,
      page_size: pageSize
    });
    
    const response = await apiClient.post(`/conversations/conversations/filter?${params}`, criteria);
    return response.data;
  },
  
  search: async (query, page = 1, pageSize = 10) => {
    const params = new URLSearchParams({
      page,
      page_size: pageSize
    });
    
    const response = await apiClient.get(`/conversations/conversations/search/${query}?${params}`);
    return response.data;
  }
};

// Processing API
export const processingAPI = {
  process: async (conversationIds, config) => {
    const response = await apiClient.post('/processing/process', {
      conversation_ids: conversationIds,
      config
    });
    return response.data;
  },
  
  getStatus: async (taskId) => {
    const response = await apiClient.get(`/processing/process/${taskId}`);
    return response.data;
  },
  
  cancelTask: async (taskId) => {
    const response = await apiClient.post(`/processing/process/cancel/${taskId}`);
    return response.data;
  }
};

// Export API
export const exportAPI = {
  export: async (conversationIds, format, includeMetadata) => {
    const response = await apiClient.post('/export/export', {
      conversation_ids: conversationIds,
      format,
      include_metadata: includeMetadata
    });
    return response.data;
  },
  
  getStatus: async (exportId) => {
    const response = await apiClient.get(`/export/export/status/${exportId}`);
    return response.data;
  },
  
  download: async (exportId) => {
    const response = await apiClient.get(`/export/export/download/${exportId}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// Memory Injection API
export const injectionAPI = {
  inject: async (conversationIds, config) => {
    const response = await apiClient.post('/injection/inject', {
      conversation_ids: conversationIds,
      config
    });
    return response.data;
  },
  
  getStatus: async (taskId) => {
    const response = await apiClient.get(`/injection/inject/${taskId}`);
    return response.data;
  },
  
  cancelTask: async (taskId) => {
    const response = await apiClient.post(`/injection/inject/cancel/${taskId}`);
    return response.data;
  },
  
  directInject: async (conversationIds, config) => {
    const response = await apiClient.post('/direct-injection/direct-inject', {
      conversation_ids: conversationIds,
      config
    });
    return response.data;
  },
  
  directInjectSingle: async (conversationId, config) => {
    const response = await apiClient.post(`/direct-injection/direct-inject/single/${conversationId}`, config);
    return response.data;
  }
};

// WebSocket connection
export const connectWebSocket = (clientId, onMessage) => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/api/ws/${clientId}`;
  
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
  };
  
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  
  socket.onclose = () => {
    console.log('WebSocket connection closed');
    // Attempt to reconnect after a delay
    setTimeout(() => connectWebSocket(clientId, onMessage), 5000);
  };
  
  // Send ping every 30 seconds to keep connection alive
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        event: 'ping',
        data: {
          timestamp: new Date().toISOString()
        }
      }));
    } else if (socket.readyState === WebSocket.CLOSED) {
      clearInterval(pingInterval);
    }
  }, 30000);
  
  return {
    socket,
    close: () => {
      clearInterval(pingInterval);
      socket.close();
    }
  };
};

export default {
  auth: authAPI,
  conversations: conversationsAPI,
  processing: processingAPI,
  export: exportAPI,
  injection: injectionAPI,
  connectWebSocket
};
