import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Paper, 
  Typography, 
  Box, 
  LinearProgress, 
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Card,
  CardContent,
  Collapse,
  Badge
} from '@material-ui/core';
import { 
  Search, 
  FilterList, 
  Refresh, 
  Sort, 
  ArrowUpward, 
  ArrowDownward,
  CheckCircle,
  Cancel,
  Visibility
} from '@material-ui/icons';
import { styled } from '@material-ui/core/styles';
import { useConversation } from '../context/ConversationContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const FilterContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const PaginationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
}));

const ConversationItem = styled(ListItem)(({ theme, selected }) => ({
  borderLeft: selected ? `4px solid ${theme.palette.primary.main}` : 'none',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const NoResultsContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4),
}));

const ConversationRetrievalStatus = ({ onPreviewConversation }) => {
  const { 
    conversations,
    isRetrieving, 
    retrievalProgress,
    retrieveConversations,
    filters,
    updateFilters,
    pagination,
    updatePagination,
    getFilteredConversations,
    getPaginatedConversations
  } = useConversation();
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Retrieve conversations on component mount
  useEffect(() => {
    if (conversations.length === 0 && !isRetrieving) {
      retrieveConversations();
    }
  }, [conversations.length, isRetrieving, retrieveConversations]);

  const handleSearchChange = (e) => {
    updateFilters({ searchTerm: e.target.value });
  };

  const handleSortChange = (field) => {
    if (filters.sortBy === field) {
      // Toggle direction if same field
      updateFilters({ 
        sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc' 
      });
    } else {
      // New field, default to descending for date, ascending for title
      updateFilters({ 
        sortBy: field,
        sortDirection: field === 'date' ? 'desc' : 'asc'
      });
    }
  };

  const handleStatusFilterChange = (e) => {
    updateFilters({ status: e.target.value });
  };

  const handlePageChange = (newPage) => {
    updatePagination({ currentPage: newPage });
  };

  const handleItemsPerPageChange = (e) => {
    updatePagination({ 
      itemsPerPage: parseInt(e.target.value, 10),
      currentPage: 1 // Reset to first page
    });
  };

  const handlePreviewConversation = (id) => {
    setSelectedId(id);
    onPreviewConversation(id);
  };

  const filteredConversations = getFilteredConversations();
  const paginatedConversations = getPaginatedConversations();
  const totalPages = Math.ceil(filteredConversations.length / pagination.itemsPerPage);

  return (
    <StyledPaper elevation={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Conversation Retrieval
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<Refresh />}
          onClick={retrieveConversations}
          disabled={isRetrieving}
          size="small"
        >
          Refresh
        </Button>
      </Box>
      
      {isRetrieving && (
        <ProgressContainer>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="body2">
              Retrieving conversations...
            </Typography>
            <Typography variant="body2">
              {Math.round(retrievalProgress)}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={retrievalProgress} />
        </ProgressContainer>
      )}
      
      <FilterContainer>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              label="Search Conversations"
              variant="outlined"
              size="small"
              fullWidth
              value={filters.searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <Search color="action" fontSize="small" style={{ marginRight: 8 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
                style={{ marginRight: 8 }}
              >
                Filters
              </Button>
              <Badge 
                color="primary" 
                variant="dot" 
                invisible={filters.sortBy === 'date' && filters.sortDirection === 'desc'}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Sort />}
                  onClick={() => handleSortChange(filters.sortBy)}
                >
                  {filters.sortBy === 'date' ? 'Date' : 'Title'}
                  {filters.sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                </Button>
              </Badge>
            </Box>
          </Grid>
        </Grid>
        
        <Collapse in={showFilters}>
          <Card variant="outlined" style={{ marginTop: 16 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl variant="outlined" size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={handleStatusFilterChange}
                      label="Status"
                    >
                      <MenuItem value="all">All Conversations</MenuItem>
                      <MenuItem value="included">Included Only</MenuItem>
                      <MenuItem value="excluded">Excluded Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" justifyContent="space-between">
                    <Button
                      size="small"
                      onClick={() => handleSortChange('date')}
                      variant={filters.sortBy === 'date' ? 'contained' : 'outlined'}
                      color={filters.sortBy === 'date' ? 'primary' : 'default'}
                    >
                      Sort by Date
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleSortChange('title')}
                      variant={filters.sortBy === 'title' ? 'contained' : 'outlined'}
                      color={filters.sortBy === 'title' ? 'primary' : 'default'}
                    >
                      Sort by Title
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>
      </FilterContainer>
      
      {filteredConversations.length > 0 ? (
        <>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Showing {paginatedConversations.length} of {filteredConversations.length} conversations
          </Typography>
          
          <List>
            {paginatedConversations.map((conversation) => (
              <React.Fragment key={conversation.id}>
                <ConversationItem 
                  button 
                  onClick={() => handlePreviewConversation(conversation.id)}
                  selected={selectedId === conversation.id}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        {conversation.title}
                        {conversation.included ? 
                          <CheckCircle fontSize="small" color="primary" style={{ marginLeft: 8 }} /> : 
                          <Cancel fontSize="small" color="action" style={{ marginLeft: 8 }} />
                        }
                      </Box>
                    }
                    secondary={`${new Date(conversation.date).toLocaleDateString()} • ${conversation.messageCount} messages`}
                  />
                  <Box>
                    <Chip 
                      label={conversation.status} 
                      size="small"
                      color={conversation.status === 'Ready' ? 'primary' : 'default'}
                    />
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewConversation(conversation.id);
                      }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Box>
                </ConversationItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
          
          <PaginationContainer>
            <FormControl variant="outlined" size="small" style={{ minWidth: 120 }}>
              <InputLabel>Per Page</InputLabel>
              <Select
                value={pagination.itemsPerPage}
                onChange={handleItemsPerPageChange}
                label="Per Page"
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
            
            <Box display="flex" alignItems="center">
              <Button
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                size="small"
              >
                Previous
              </Button>
              <Typography variant="body2" style={{ margin: '0 16px' }}>
                Page {pagination.currentPage} of {totalPages || 1}
              </Typography>
              <Button
                disabled={pagination.currentPage === totalPages || totalPages === 0}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                size="small"
              >
                Next
              </Button>
            </Box>
          </PaginationContainer>
        </>
      ) : (
        <NoResultsContainer>
          {isRetrieving ? (
            <Typography variant="body1">Loading conversations...</Typography>
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                {filters.searchTerm ? 'No conversations match your search' : 'No conversations found'}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={retrieveConversations}
                style={{ marginTop: 16 }}
              >
                Refresh Conversations
              </Button>
            </>
          )}
        </NoResultsContainer>
      )}
    </StyledPaper>
  );
};

ConversationRetrievalStatus.propTypes = {
  onPreviewConversation: PropTypes.func.isRequired,
};

export default ConversationRetrievalStatus;
