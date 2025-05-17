import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Paper, 
  Typography, 
  Box, 
  Card,
  CardContent,
  Button,
  Chip,
  Tabs,
  Tab,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Snackbar,
  Alert
} from '@material-ui/core';
import { 
  Edit, 
  GetApp, 
  CheckCircle, 
  Cancel, 
  Code,
  Message,
  Info,
  FileCopy,
  Save
} from '@material-ui/icons';
import { styled } from '@material-ui/core/styles';
import { useVerification } from '../context/VerificationContext';
import { useConversation } from '../context/ConversationContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

const ConversationCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const ActionContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
}));

const CodeEditor = styled(TextField)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  '& .MuiInputBase-root': {
    fontFamily: '"Roboto Mono", monospace',
  }
}));

const MessageBubble = styled(Box)(({ theme, isUser }) => ({
  backgroundColor: isUser ? theme.palette.grey[100] : theme.palette.primary.light,
  color: isUser ? theme.palette.text.primary : theme.palette.primary.contrastText,
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(2),
  maxWidth: '80%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    [isUser ? 'right' : 'left']: -8,
    width: 0,
    height: 0,
    border: '8px solid transparent',
    borderTopColor: isUser ? theme.palette.grey[100] : theme.palette.primary.light,
    borderBottom: 0,
    marginBottom: 0,
  }
}));

const ConversationViewer = () => {
  const { 
    selectedConversation,
    editedContent,
    isEditing,
    exportFormat,
    exportInProgress,
    exportError,
    selectConversation,
    startEditing,
    updateEditedContent,
    saveEditedContent,
    cancelEditing,
    setExportFormat,
    exportConversation
  } = useVerification();
  
  const { 
    conversations,
    toggleConversationInclusion
  } = useConversation();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Select first conversation if none selected
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      selectConversation(conversations[0]);
    }
  }, [conversations, selectedConversation, selectConversation]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleEditClick = () => {
    startEditing();
  };

  const handleSaveEdit = () => {
    try {
      const updatedConversation = saveEditedContent();
      if (updatedConversation) {
        setSnackbarMessage('Conversation updated successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        throw new Error('Failed to parse JSON');
      }
    } catch (error) {
      setSnackbarMessage('Invalid JSON format. Please check your edits.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleExportClick = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportFormatSelect = (format) => {
    setExportFormat(format);
    handleExportMenuClose();
    setExportDialogOpen(true);
  };

  const handleExportConfirm = async () => {
    const result = await exportConversation();
    if (result) {
      // In a real app, this would trigger a download
      // For now, just show a success message
      setSnackbarMessage(`Exported as ${result.fileName}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage('Export failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    setExportDialogOpen(false);
  };

  const handleIncludeExclude = () => {
    if (selectedConversation) {
      toggleConversationInclusion(selectedConversation.id);
    }
  };

  const renderConversationContent = () => {
    if (!selectedConversation) return null;
    
    switch (currentTab) {
      case 0: // Chat View
        return (
          <Box display="flex" flexDirection="column" p={2}>
            {selectedConversation.content.messages.map((message, index) => (
              <MessageBubble 
                key={index} 
                isUser={message.role === 'user'}
              >
                <Typography variant="body1">
                  {message.content}
                </Typography>
                <Typography variant="caption" color="textSecondary" style={{ marginTop: 8, display: 'block' }}>
                  {message.role.toUpperCase()}
                </Typography>
              </MessageBubble>
            ))}
          </Box>
        );
      
      case 1: // JSON View
        return isEditing ? (
          <>
            <CodeEditor
              fullWidth
              multiline
              variant="outlined"
              value={editedContent}
              onChange={(e) => updateEditedContent(e.target.value)}
              rows={15}
              error={false}
              helperText="Edit the JSON representation of this conversation"
            />
            <ActionContainer>
              <Button 
                variant="contained" 
                color="primary" 
                size="small"
                onClick={handleSaveEdit}
                startIcon={<Save />}
              >
                Save
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={cancelEditing}
                startIcon={<Cancel />}
              >
                Cancel
              </Button>
            </ActionContainer>
          </>
        ) : (
          <Box position="relative">
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              overflowX: 'auto',
              backgroundColor: '#f5f5f5',
              padding: '16px',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              {JSON.stringify(selectedConversation.content, null, 2)}
            </pre>
            <IconButton 
              style={{ position: 'absolute', top: 8, right: 8 }}
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(selectedConversation.content, null, 2));
                setSnackbarMessage('Copied to clipboard');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
              }}
            >
              <FileCopy fontSize="small" />
            </IconButton>
          </Box>
        );
      
      case 2: // Metadata
        return (
          <Box p={2}>
            <Typography variant="subtitle2" gutterBottom>Conversation Metadata</Typography>
            <Divider style={{ marginBottom: 16 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">ID</Typography>
                <Typography variant="body1" gutterBottom>{selectedConversation.id}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Created</Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(selectedConversation.date).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Message Count</Typography>
                <Typography variant="body1" gutterBottom>{selectedConversation.messageCount}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Status</Typography>
                <Typography variant="body1" gutterBottom>{selectedConversation.status}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Model</Typography>
                <Typography variant="body1" gutterBottom>{selectedConversation.metadata.model}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Token Count</Typography>
                <Typography variant="body1" gutterBottom>{selectedConversation.metadata.token_count}</Typography>
              </Grid>
            </Grid>
          </Box>
        );
      
      default:
        return null;
    }
  };

  if (!selectedConversation) {
    return (
      <StyledPaper elevation={2}>
        <Typography variant="body1" align="center">
          Select a conversation to view
        </Typography>
      </StyledPaper>
    );
  }

  return (
    <StyledPaper elevation={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{selectedConversation.title}</Typography>
        <Chip 
          label={selectedConversation.included ? 'Included' : 'Excluded'} 
          color={selectedConversation.included ? 'primary' : 'default'}
          onClick={handleIncludeExclude}
          icon={selectedConversation.included ? <CheckCircle /> : <Cancel />}
        />
      </Box>
      
      <Typography variant="body2" color="textSecondary">
        {new Date(selectedConversation.date).toLocaleString()} • {selectedConversation.messageCount} messages
      </Typography>
      
      <Box mt={2}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<Message />} label="Chat View" />
          <Tab icon={<Code />} label="JSON View" />
          <Tab icon={<Info />} label="Metadata" />
        </Tabs>
      </Box>
      
      <ConversationCard>
        <CardContent>
          {renderConversationContent()}
        </CardContent>
      </ConversationCard>
      
      <ActionContainer>
        {!isEditing && (
          <>
            <Button 
              variant="outlined" 
              startIcon={<Edit />} 
              onClick={handleEditClick}
              disabled={currentTab !== 1} // Only enable edit in JSON view
            >
              Edit
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<GetApp />} 
              onClick={handleExportClick}
            >
              Export
            </Button>
            {selectedConversation.included ? (
              <Button 
                variant="outlined" 
                color="secondary" 
                startIcon={<Cancel />} 
                onClick={handleIncludeExclude}
              >
                Exclude
              </Button>
            ) : (
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<CheckCircle />} 
                onClick={handleIncludeExclude}
              >
                Include
              </Button>
            )}
          </>
        )}
      </ActionContainer>
      
      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
      >
        <MenuItem onClick={() => handleExportFormatSelect('json')}>JSON Format</MenuItem>
        <MenuItem onClick={() => handleExportFormatSelect('csv')}>CSV Format</MenuItem>
        <MenuItem onClick={() => handleExportFormatSelect('txt')}>Text Format</MenuItem>
      </Menu>
      
      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Conversation</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Export "{selectedConversation?.title}" as {exportFormat.toUpperCase()}
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <MenuItem value="json">JSON Format</MenuItem>
              <MenuItem value="csv">CSV Format</MenuItem>
              <MenuItem value="txt">Text Format</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)} color="default">
            Cancel
          </Button>
          <Button 
            onClick={handleExportConfirm} 
            color="primary"
            disabled={exportInProgress}
            startIcon={exportInProgress ? <CircularProgress size={20} /> : <GetApp />}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </StyledPaper>
  );
};

// Add missing Grid component
const Grid = ({ container, item, xs, sm, md, spacing, children, ...props }) => {
  const style = {
    ...(container && { display: 'flex', flexWrap: 'wrap', margin: -spacing/2 }),
    ...(item && { 
      padding: spacing/2,
      flexBasis: xs ? `${(xs / 12) * 100}%` : undefined,
      flexGrow: xs ? 0 : undefined,
      maxWidth: xs ? `${(xs / 12) * 100}%` : undefined,
      '@media (min-width: 600px)': sm ? {
        flexBasis: `${(sm / 12) * 100}%`,
        flexGrow: 0,
        maxWidth: `${(sm / 12) * 100}%`,
      } : undefined,
      '@media (min-width: 960px)': md ? {
        flexBasis: `${(md / 12) * 100}%`,
        flexGrow: 0,
        maxWidth: `${(md / 12) * 100}%`,
      } : undefined,
    }),
  };
  
  return (
    <Box style={style} {...props}>
      {children}
    </Box>
  );
};

Grid.propTypes = {
  container: PropTypes.bool,
  item: PropTypes.bool,
  xs: PropTypes.number,
  sm: PropTypes.number,
  md: PropTypes.number,
  spacing: PropTypes.number,
  children: PropTypes.node,
};

export default ConversationViewer;
