# Total Recall User Guide

## Introduction

Total Recall is a powerful tool that automatically extracts your historical ChatGPT conversations and injects them into GPT's persistent memory. This allows your AI assistant to remember and reference your past interactions, providing a more personalized and contextually aware experience.

## Getting Started

### Installation

Total Recall can be installed and run using Docker, which makes the setup process simple and consistent across different environments.

#### Prerequisites

- Docker (version 20.10.0 or later)
- Docker Compose (version 2.0.0 or later)

#### Installation Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd total-recall
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. Deploy the application:
   ```bash
   ./deploy.sh
   ```

4. Access the application:
   - The application will be available at http://localhost:8000

### First-Time Setup

When you first access Total Recall, you'll need to:

1. Log in with your OpenAI session token
2. Allow the application to retrieve your conversation history
3. Configure your processing and memory injection preferences

## Features

### Conversation Retrieval

Total Recall can retrieve all your ChatGPT conversations, allowing you to:

- View your entire conversation history in one place
- Search for specific conversations by content or date
- Filter conversations based on various criteria
- Preview conversation content before processing

### Conversation Processing

Once your conversations are retrieved, Total Recall processes them to prepare for memory injection:

- Chunks conversations into manageable pieces
- Summarizes long conversations (optional)
- Formats conversations for optimal memory injection
- Tracks processing progress in real-time

### Memory Injection

The core feature of Total Recall is injecting your processed conversations into GPT's persistent memory:

- Control the rate of memory injection
- Monitor injection progress
- Pause and resume injection as needed
- Verify successful memory injection

### Direct Memory Injection

For immediate results, Total Recall offers a direct memory injection option:

- Inject specific conversations directly into the current session
- Immediately test if the AI remembers the injected conversations
- Bypass the background task system for faster results

## Using the Interface

### Authentication Page

The authentication page is where you'll enter your OpenAI session token:

1. Enter your token in the provided field
2. Toggle visibility to verify your token
3. Check "Remember Me" to save your token for future sessions
4. Click "Authenticate" to proceed

### Main Interface

The main interface is organized as a step-by-step wizard:

1. **Conversation Retrieval**: View and select conversations
2. **Processing**: Configure and monitor conversation processing
3. **Verification**: Review processed conversations
4. **Memory Injection**: Configure and monitor memory injection

### Settings

Total Recall offers various settings to customize your experience:

- **Processing Settings**: Configure chunking and summarization options
- **Injection Settings**: Set rate limits and retry options
- **Display Settings**: Toggle between light and dark mode
- **Export Settings**: Configure export formats and options

## Troubleshooting

### Common Issues

1. **Authentication Failures**:
   - Ensure your OpenAI session token is valid and current
   - Try logging out and back in to OpenAI to get a fresh token

2. **Conversation Retrieval Issues**:
   - Check your internet connection
   - Verify you have access to the conversations in your OpenAI account

3. **Processing or Injection Failures**:
   - Check the error messages for specific issues
   - Try reducing the rate limit for memory injection
   - Process fewer conversations at once

### Getting Help

If you encounter issues not covered in this guide:

1. Check the error logs in the application
2. Refer to the troubleshooting section in the documentation
3. Contact support with details about your issue

## Privacy and Security

Total Recall takes your privacy seriously:

- Your OpenAI session token is stored securely and only used to access your conversations
- All data processing happens locally on your machine
- No conversation data is sent to third-party servers
- You can delete all stored data at any time through the settings

## Conclusion

Total Recall enhances your AI experience by giving your assistant access to your conversation history. By following this guide, you'll be able to set up and use Total Recall effectively, creating a more personalized and contextually aware AI assistant.
