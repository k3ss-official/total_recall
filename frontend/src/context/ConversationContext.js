import React, { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { conversationsAPI } from '../lib/api';

// Create Conversation Context
const ConversationContext = createContext();

// Conversation Provider Component
export const ConversationProvider = ({ children }) => {
  const [conversationState, setConversationState] = useState({
    conversations: [],
    selectedConversation: null,
    isRetrieving: false,
    retrievalProgress: 0,
    error: null,
    filters: {
      searchTerm: '',
      sortBy: 'date', // 'date', 'title'
      sortDirection: 'desc', // 'asc', 'desc'
      status: 'all' // 'all', 'included', 'excluded'
    },
    pagination: {
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0
    }
  });

  // Retrieve conversations
  const retrieveConversations = async () => {
    setConversationState({
      ...conversationState,
      isRetrieving: true,
      retrievalProgress: 0,
      error: null
    });

    try {
      // Set initial progress
      updateRetrievalProgress(10);
      
      // Get conversations from API
      const filters = {};
      if (conversationState.filters.searchTerm) {
        filters.title_contains = conversationState.filters.searchTerm;
      }
      
      const response = await conversationsAPI.list(
        conversationState.pagination.currentPage,
        conversationState.pagination.itemsPerPage,
        filters
      );
      
      updateRetrievalProgress(50);
      
      // Process conversations
      const conversations = response.conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        date: conv.update_time,
        messageCount: 0, // Will be updated when conversation detail is loaded
        status: 'Ready',
        included: true,
        content: null, // Will be loaded on demand
        metadata: {
          created_at: conv.create_time,
          update_time: conv.update_time
        }
      }));
      
      updateRetrievalProgress(100);

      setConversationState({
        ...conversationState,
        conversations,
        isRetrieving: false,
        retrievalProgress: 100,
        pagination: {
          ...conversationState.pagination,
          totalItems: response.total
        }
      });
    } catch (error) {
      setConversationState({
        ...conversationState,
        isRetrieving: false,
        error: error.response?.data?.detail || error.message || 'Failed to retrieve conversations'
      });
    }
  };

  // Update retrieval progress
  const updateRetrievalProgress = (progress) => {
    setConversationState({
      ...conversationState,
      retrievalProgress: progress
    });
  };

  // Select a conversation
  const selectConversation = async (conversationId) => {
    try {
      // First set the selected conversation from our list (for immediate UI feedback)
      const selectedFromList = conversationState.conversations.find(c => c.id === conversationId);
      setConversationState({
        ...conversationState,
        selectedConversation: selectedFromList,
        isRetrieving: true
      });
      
      // Then fetch the full conversation details from the API
      const conversationDetail = await conversationsAPI.getDetail(conversationId);
      
      // Update the selected conversation with full details
      const updatedConversation = {
        ...selectedFromList,
        messageCount: conversationDetail.messages.length,
        content: {
          messages: conversationDetail.messages
        },
        metadata: {
          ...selectedFromList.metadata,
          model: conversationDetail.model || 'Unknown',
          token_count: conversationDetail.token_count || 0
        }
      };
      
      setConversationState({
        ...conversationState,
        selectedConversation: updatedConversation,
        isRetrieving: false
      });
    } catch (error) {
      setConversationState({
        ...conversationState,
        error: error.response?.data?.detail || error.message || 'Failed to retrieve conversation details',
        isRetrieving: false
      });
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setConversationState({
      ...conversationState,
      filters: {
        ...conversationState.filters,
        ...newFilters
      },
      pagination: {
        ...conversationState.pagination,
        currentPage: 1 // Reset to first page when filters change
      }
    });
  };

  // Update pagination
  const updatePagination = (newPagination) => {
    setConversationState({
      ...conversationState,
      pagination: {
        ...conversationState.pagination,
        ...newPagination
      }
    });
  };

  // Toggle conversation inclusion
  const toggleConversationInclusion = (conversationId) => {
    const updatedConversations = conversationState.conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, included: !conv.included } 
        : conv
    );

    setConversationState({
      ...conversationState,
      conversations: updatedConversations,
      selectedConversation: conversationState.selectedConversation?.id === conversationId
        ? { ...conversationState.selectedConversation, included: !conversationState.selectedConversation.included }
        : conversationState.selectedConversation
    });
  };

  // Get filtered and sorted conversations
  const getFilteredConversations = () => {
    const { searchTerm, sortBy, sortDirection, status } = conversationState.filters;
    
    return conversationState.conversations
      .filter(conv => {
        // Apply search filter
        const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Apply status filter
        const matchesStatus = 
          status === 'all' || 
          (status === 'included' && conv.included) || 
          (status === 'excluded' && !conv.included);
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // Apply sorting
        if (sortBy === 'date') {
          return sortDirection === 'asc' 
            ? new Date(a.date) - new Date(b.date)
            : new Date(b.date) - new Date(a.date);
        } else if (sortBy === 'title') {
          return sortDirection === 'asc'
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }
        return 0;
      });
  };

  // Get paginated conversations
  const getPaginatedConversations = () => {
    const filteredConversations = getFilteredConversations();
    const { currentPage, itemsPerPage } = conversationState.pagination;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return filteredConversations.slice(startIndex, endIndex);
  };

  // Context value
  const value = {
    ...conversationState,
    retrieveConversations,
    selectConversation,
    updateFilters,
    updatePagination,
    toggleConversationInclusion,
    getFilteredConversations,
    getPaginatedConversations
  };

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
};

ConversationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use the conversation context
export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

export default ConversationContext;
