# Total Recall: Architecture Documentation

## Overview

Total Recall is designed with a modular, privacy-first architecture that follows the CLI-first, GUI-ready approach. This document outlines the architectural principles, component structure, and data flow of the application.

## Architectural Principles

### CLI-First, GUI-Ready
- Core functionality implemented as CLI tools first
- GUI components built on top of CLI functionality
- Clear separation between business logic and presentation

### Privacy by Design
- All data stored and processed locally
- No cloud dependencies or data transmission
- Secure token storage with encryption

### Modular Component Design
- Loosely coupled components with well-defined interfaces
- Each component responsible for a specific domain
- Easy to extend, replace, or upgrade individual components

### File System Transparency
- Clear, predictable file organization
- User always knows where data is stored
- No hidden files or obscure data structures

## Component Architecture

### Authentication Module
- Handles OAuth authentication with OpenAI
- Manages token lifecycle (acquisition, refresh, expiry)
- Provides secure token storage
- Exposes token status and validation APIs

### Conversation Extraction Module
- Retrieves conversations from ChatGPT
- Handles pagination and rate limiting
- Provides filtering and search capabilities
- Manages local conversation cache

### NLP Processing Module
- Analyzes conversations for topics, sentiment, and importance
- Detects conversation threads and relationships
- Clusters related conversations
- Generates metadata for optimal memory organization

### Chunking Engine
- Breaks conversations into optimal chunks for memory injection
- Ensures semantic coherence within chunks
- Manages token limits and optimization
- Provides chunk visualization and editing

### Memory Management Module
- Organizes processed memories in structured storage
- Handles versioning and snapshots
- Provides search and retrieval capabilities
- Manages memory bundles for export/import

### Memory Injection Module
- Verifies GPT-4o session before injection
- Formats memories for optimal injection
- Handles the injection process
- Confirms successful memory acceptance

### GUI Layer
- Provides visual interface for all functionality
- Implements reactive components for real-time feedback
- Ensures consistent user experience
- Supports both desktop and mobile views

## Data Flow

1. **Authentication Flow**
   - User initiates authentication
   - OAuth process captures tokens
   - Tokens stored securely locally
   - Token status monitored and refreshed as needed

2. **Conversation Extraction Flow**
   - Authenticated session used to retrieve conversations
   - Conversations stored in local cache
   - Metadata extracted and indexed
   - User can browse, search, and filter conversations

3. **Processing Flow**
   - Selected conversations sent to NLP module
   - Topics, threads, and importance identified
   - Conversations chunked according to strategy
   - Processed chunks prepared for memory injection

4. **Memory Injection Flow**
   - GPT-4o session verified
   - Memory chunks formatted for injection
   - Chunks injected via selected method
   - Confirmation received from GPT

## Directory Structure

```
total_recall/
├── docs/                 # Documentation
├── src/                  # Source code
│   ├── cli/              # Command-line interface tools
│   ├── nlp/              # Natural language processing
│   ├── ui/               # User interface components
│   └── core/             # Core functionality
├── memory/               # Memory storage
│   ├── samples/          # Sample memories
│   ├── archive/          # Archived memories
│   └── backload_templates/ # Templates for backloading
├── tests/                # Test suite
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
└── public/               # Public assets
```

## Technology Stack

### Backend
- Python for CLI tools and core functionality
- NLP libraries for conversation processing
- SQLite for local data storage
- JWT for token handling

### Frontend
- Tauri for desktop application framework
- React/TypeScript for UI components
- Monaco/Ace for code editing
- D3.js for data visualization

## Security Considerations

- Tokens stored with encryption at rest
- No transmission of user data to external services
- Regular validation of token integrity
- Clear session management and timeout handling

## Performance Considerations

- Efficient data structures for large conversation sets
- Background processing for intensive operations
- Caching strategies for frequently accessed data
- Lazy loading of UI components and data

## Extensibility

The architecture is designed to be extensible in several ways:

1. **New Processing Strategies**: Additional NLP algorithms can be added
2. **Alternative Injection Methods**: New methods for memory injection can be implemented
3. **Custom Visualizations**: Additional visualization components can be created
4. **Plugin System**: Future versions may support a plugin architecture

## Conclusion

Total Recall's architecture prioritizes user privacy, modularity, and a smooth transition from CLI to GUI. By maintaining clear separation of concerns and well-defined interfaces between components, the system remains flexible and maintainable as it evolves.
