import React, { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';

// Create Verification Context
const VerificationContext = createContext();

// Verification Provider Component
export const VerificationProvider = ({ children }) => {
  const [verificationState, setVerificationState] = useState({
    selectedConversation: null,
    editedContent: null,
    isEditing: false,
    exportFormat: 'json', // 'json', 'csv', 'txt'
    exportInProgress: false,
    exportError: null
  });

  // Select conversation for verification
  const selectConversation = (conversation) => {
    setVerificationState({
      ...verificationState,
      selectedConversation: conversation,
      editedContent: null,
      isEditing: false
    });
  };

  // Start editing conversation
  const startEditing = () => {
    if (!verificationState.selectedConversation) return;
    
    setVerificationState({
      ...verificationState,
      editedContent: JSON.stringify(verificationState.selectedConversation.content, null, 2),
      isEditing: true
    });
  };

  // Update edited content
  const updateEditedContent = (content) => {
    setVerificationState({
      ...verificationState,
      editedContent: content
    });
  };

  // Save edited content
  const saveEditedContent = () => {
    if (!verificationState.selectedConversation || !verificationState.editedContent) return;
    
    try {
      const parsedContent = JSON.parse(verificationState.editedContent);
      
      const updatedConversation = {
        ...verificationState.selectedConversation,
        content: parsedContent
      };
      
      setVerificationState({
        ...verificationState,
        selectedConversation: updatedConversation,
        isEditing: false,
        editedContent: null
      });
      
      return updatedConversation;
    } catch (error) {
      // Handle JSON parse error
      return null;
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setVerificationState({
      ...verificationState,
      isEditing: false,
      editedContent: null
    });
  };

  // Set export format
  const setExportFormat = (format) => {
    setVerificationState({
      ...verificationState,
      exportFormat: format
    });
  };

  // Export conversation
  const exportConversation = async () => {
    if (!verificationState.selectedConversation) return null;
    
    setVerificationState({
      ...verificationState,
      exportInProgress: true,
      exportError: null
    });
    
    try {
      const { selectedConversation, exportFormat } = verificationState;
      let exportData;
      let fileName;
      let mimeType;
      
      // Format data based on export format
      switch (exportFormat) {
        case 'json':
          exportData = JSON.stringify(selectedConversation, null, 2);
          fileName = `conversation_${selectedConversation.id}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          // Simple CSV conversion for messages
          const headers = 'role,content\n';
          const rows = selectedConversation.content.messages.map(
            msg => `"${msg.role}","${msg.content.replace(/"/g, '""')}"`
          ).join('\n');
          exportData = headers + rows;
          fileName = `conversation_${selectedConversation.id}.csv`;
          mimeType = 'text/csv';
          break;
        case 'txt':
          // Simple text conversion for messages
          exportData = selectedConversation.content.messages.map(
            msg => `${msg.role.toUpperCase()}: ${msg.content}`
          ).join('\n\n');
          fileName = `conversation_${selectedConversation.id}.txt`;
          mimeType = 'text/plain';
          break;
        default:
          throw new Error('Unsupported export format');
      }
      
      // In a real implementation, this would trigger a download
      // For now, we'll just return the data
      
      setVerificationState({
        ...verificationState,
        exportInProgress: false
      });
      
      return {
        data: exportData,
        fileName,
        mimeType
      };
    } catch (error) {
      setVerificationState({
        ...verificationState,
        exportInProgress: false,
        exportError: error.message
      });
      
      return null;
    }
  };

  // Context value
  const value = {
    ...verificationState,
    selectConversation,
    startEditing,
    updateEditedContent,
    saveEditedContent,
    cancelEditing,
    setExportFormat,
    exportConversation
  };

  return <VerificationContext.Provider value={value}>{children}</VerificationContext.Provider>;
};

VerificationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use the verification context
export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};

export default VerificationContext;
