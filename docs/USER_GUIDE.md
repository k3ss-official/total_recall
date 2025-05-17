# User Guide

This guide provides instructions for using the Total Recall application to extract your ChatGPT conversations and inject them into GPT's memory.

## Getting Started

After installing the application (see [Installation Guide](INSTALLATION.md)), you can access it through your web browser.

## Logging In

1. Navigate to the application URL (typically http://localhost:8000 for Docker installation or http://localhost:3000 for local installation)
2. You'll be presented with a login screen
3. Enter your ChatGPT credentials (email and password)
4. Click "Login to ChatGPT"

![Login Screen](../assets/login_screen.png)

**Note**: Your credentials are only used to authenticate with ChatGPT and are never stored by the application.

## Viewing Your Conversations

After successful login, you'll be taken to the Conversations page where you can:

1. View a list of all your ChatGPT conversations
2. Sort conversations by date, title, or length
3. Search for specific conversations by keyword
4. Select conversations for processing and memory injection

![Conversations List](../assets/conversations_list.png)

## Viewing Conversation Details

Click on any conversation to view its details:

1. The full conversation thread between you and ChatGPT
2. Conversation metadata (date, time, number of messages)
3. Options for processing and memory injection

![Conversation Details](../assets/conversation_details.png)

## Processing Conversations

Before injecting conversations into memory, you may want to process them:

1. Select one or more conversations from the list
2. Click the "Process" button
3. Configure processing options:
   - Chunk Size: How to split long conversations (default: 1000 characters)
   - Chunk Overlap: How much overlap between chunks (default: 200 characters)
   - Summarize: Whether to generate a summary (default: enabled)
4. Click "Start Processing"

![Processing Options](../assets/processing_options.png)

Processing happens in the background and may take some time for multiple or long conversations. You can check the status in the Processing tab.

## Injecting Conversations into Memory

After processing (or directly from the conversation list), you can inject conversations into GPT's memory:

1. Select one or more processed conversations
2. Click the "Inject Memory" button
3. Configure injection options:
   - Injection Method: Direct (immediate) or Background (for multiple conversations)
   - Include Summary: Whether to include the generated summary
   - Memory Prompt: Customize how GPT should remember the conversation
4. Click "Start Injection"

![Injection Options](../assets/injection_options.png)

## Verifying Memory Injection

To verify that GPT has successfully stored the conversation in memory:

1. Navigate to the "Verification" tab
2. Select a conversation that was injected
3. Ask a question about the conversation to test recall
4. GPT should be able to reference details from the injected conversation

![Memory Verification](../assets/memory_verification.png)

## Managing Memory

The "Memory Management" tab allows you to:

1. View all conversations currently in GPT's memory
2. See when they were injected and their status
3. Remove conversations from memory if needed
4. Prioritize certain memories over others

![Memory Management](../assets/memory_management.png)

## Settings

The Settings page allows you to customize:

1. UI preferences (dark/light mode, layout)
2. Processing defaults (chunk size, summarization)
3. Injection defaults (method, prompts)
4. Session management (timeout, refresh)

![Settings](../assets/settings.png)

## Logging Out

To log out of the application:

1. Click on your profile icon in the top right
2. Select "Logout"
3. Confirm logout when prompted

This will end your session and remove any temporary data from the browser.

## Privacy and Security

Total Recall is designed with privacy and security in mind:

- Your ChatGPT credentials are never stored
- Session data is stored only in your browser
- No conversation data is sent to third parties
- All processing happens locally or through direct ChatGPT API calls

## Troubleshooting

### Login Issues

- Ensure your ChatGPT credentials are correct
- If you use two-factor authentication, you may need to generate an app password
- Check your internet connection

### Conversation Retrieval Issues

- If conversations aren't loading, try refreshing the page
- Very old conversations may take longer to retrieve
- If you have thousands of conversations, pagination may be required

### Memory Injection Issues

- Very long conversations may need to be chunked into smaller pieces
- GPT has memory limitations and may not retain all details
- If injection fails, try processing with smaller chunk sizes

### General Issues

- Clear your browser cache and cookies
- Ensure you're using a supported browser (Chrome, Firefox, Edge)
- Check the application logs for error messages

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub repository](https://github.com/k3ss-official/Total-Recall) for updates
2. Review open and closed issues for similar problems
3. Submit a new issue with detailed information about your problem
