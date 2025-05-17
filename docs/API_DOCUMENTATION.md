# Total Recall API Documentation

## Overview

This document provides comprehensive documentation for the Total Recall API, which enables automatic extraction of historical GPT conversations and injection into GPT's persistent memory. The API is built with FastAPI and provides endpoints for authentication, conversation retrieval, processing, exporting, and memory injection.

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication

Authentication is handled via JWT tokens. All endpoints except the token endpoint require authentication.

### Get Token

```
POST /api/auth/token
```

Authenticates a user and provides an access token.

**Request Body:**
```json
{
  "username": "your_username",
  "password": "your_openai_api_key"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Refresh Token

```
POST /api/auth/refresh
```

Refreshes an existing access token.

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Check Authentication Status

```
GET /api/auth/status
```

Checks the authentication status of the current token.

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "authenticated": true,
  "username": "your_username"
}
```

## Conversations

Endpoints for retrieving and managing conversations.

### List Conversations

```
GET /api/conversations/conversations?page=1&page_size=10
```

Lists conversations with pagination.

**Headers:**
```
Authorization: Bearer your_access_token
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 10, max: 100)
- `start_date`: Filter by start date (ISO format)
- `end_date`: Filter by end date (ISO format)
- `title_contains`: Filter by title containing string

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv1",
      "title": "Discussion about AI ethics",
      "create_time": "2025-04-20T10:30:00",
      "update_time": "2025-04-20T11:45:00"
    },
    {
      "id": "conv2",
      "title": "Python programming tips",
      "create_time": "2025-04-22T14:15:00",
      "update_time": "2025-04-22T15:30:00"
    }
  ],
  "total": 2,
  "page": 1,
  "page_size": 10
}
```

### Get Conversation Detail

```
GET /api/conversations/conversations/{conversation_id}
```

Gets detailed information about a specific conversation.

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "id": "conv1",
  "title": "Discussion about AI ethics",
  "create_time": "2025-04-20T10:30:00",
  "update_time": "2025-04-20T11:45:00",
  "messages": [
    {
      "role": "user",
      "content": "What are the main ethical concerns with AI?"
    },
    {
      "role": "assistant",
      "content": "The main ethical concerns with AI include bias, privacy, job displacement, security, and control issues..."
    }
  ]
}
```

## Processing

Endpoints for processing conversations.

### Process Conversations

```
POST /api/processing/process
```

Processes conversations with specified configuration.

**Headers:**
```
Authorization: Bearer your_access_token
```

**Request Body:**
```json
{
  "conversation_ids": ["conv1", "conv2"],
  "config": {
    "chunking": {
      "chunk_size": 1000,
      "chunk_overlap": 200,
      "include_timestamps": true
    },
    "summarization": {
      "enabled": true,
      "max_length": 500,
      "focus_recent": true
    }
  }
}
```

**Response:**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "progress": 0.0,
  "message": "Task initialized"
}
```

### Get Processing Status

```
GET /api/processing/process/{task_id}
```

Gets the status of a processing task.

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 0.5,
  "message": "Processing conversation 1/2"
}
```

## Memory Injection

Endpoints for injecting memory into ChatGPT.

### Inject Memory

```
POST /api/injection/inject
```

Injects conversations into ChatGPT memory as a background task.

**Headers:**
```
Authorization: Bearer your_access_token
```

**Request Body:**
```json
{
  "conversation_ids": ["conv1", "conv2"],
  "config": {
    "max_tokens_per_request": 4000,
    "retry_attempts": 3,
    "retry_delay": 5,
    "include_timestamps": true,
    "include_titles": true
  }
}
```

**Response:**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "progress": 0.0,
  "message": "Task initialized",
  "successful_injections": 0,
  "failed_injections": 0
}
```

### Direct Inject Memory

```
POST /api/direct-injection/direct-inject
```

Directly injects conversations into ChatGPT memory without a background task.

**Headers:**
```
Authorization: Bearer your_access_token
```

**Request Body:**
```json
{
  "conversation_ids": ["conv1", "conv2"],
  "config": {
    "max_tokens_per_request": 4000,
    "retry_attempts": 3,
    "retry_delay": 5,
    "include_timestamps": true,
    "include_titles": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "total": 2,
  "successful": 2,
  "failed": 0,
  "failures": null
}
```

## WebSocket

WebSocket endpoint for real-time updates.

### Connect to WebSocket

```
WebSocket: /api/ws/{client_id}
```

Establishes a WebSocket connection for real-time updates.

**Events:**

1. Connection Established:
```json
{
  "event": "connection_established",
  "data": {
    "message": "Connected to Total Recall WebSocket"
  }
}
```

2. Progress Update:
```json
{
  "event": "progress_update",
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "task_type": "processing",
    "progress": 0.5,
    "message": "Processing conversation 1/2"
  }
}
```

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages in case of failure.

**Example Error Response:**
```json
{
  "detail": "Conversation not found",
  "code": "not_found"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse. If you exceed the rate limit, you will receive a 429 Too Many Requests response.

## Security Considerations

1. Store access tokens securely
2. Do not expose OpenAI API keys in client-side code
3. Use HTTPS for all API requests
4. Implement proper error handling for failed requests
