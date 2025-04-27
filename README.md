# Total Recall

A tool for automatically extracting historical ChatGPT conversations and injecting them into GPT's persistent memory.

## Overview

Total Recall is a standalone application that allows users to:
1. Log in privately to their ChatGPT account
2. Extract all conversations from their account using the browser session
3. Process and prepare conversations for memory injection
4. Inject selected conversations into GPT's persistent memory

This approach works directly with the user's existing login session without requiring external APIs.

## Features

- **Secure Authentication**: Log in to your ChatGPT account privately
- **Conversation Extraction**: Automatically extract all your ChatGPT conversations
- **Conversation Processing**: Process conversations with configurable chunking and summarization
- **Memory Injection**: Inject selected conversations into GPT's persistent memory
- **User-Friendly Interface**: Simple and intuitive web interface

## Installation

### Option 1: Using Conda (Recommended)

1. Clone this repository:
   ```bash
   git clone https://github.com/k3ss-official/Total-Recall.git
   cd Total-Recall
   ```

2. Run the installation script:
   ```bash
   ./install_conda.sh
   ```

3. The script will:
   - Create a conda environment with all required dependencies
   - Install frontend dependencies
   - Set up configuration files

### Option 2: Using Docker

1. Clone this repository:
   ```bash
   git clone https://github.com/k3ss-official/Total-Recall.git
   cd Total-Recall
   ```

2. Run the installation script:
   ```bash
   ./install_docker.sh
   ```

3. The script will:
   - Check for Docker and Docker Compose
   - Set up configuration files
   - Build and start the Docker containers

## Usage

1. Start the application:
   - If using Conda: `conda activate total-recall && python run.py`
   - If using Docker: The application starts automatically after installation

2. Open your browser and navigate to `http://localhost:8000`

3. Log in with your ChatGPT credentials

4. Follow the three-step process:
   - Retrieve Conversations: Extract and view your ChatGPT conversations
   - Process Conversations: Select and process conversations for memory injection
   - Inject Memory: Inject selected conversations into GPT's persistent memory

## Configuration

Edit the `.env` file to customize your configuration:

```
# Server Configuration
PORT=8000
HOST=0.0.0.0

# Processing Configuration
DEFAULT_CHUNK_SIZE=1000
DEFAULT_CHUNK_OVERLAP=200
ENABLE_SUMMARIZATION=true
MAX_SUMMARY_LENGTH=500

# Injection Configuration
MAX_TOKENS_PER_REQUEST=4000
RETRY_ATTEMPTS=3
RETRY_DELAY=5
```

## Documentation

For more detailed information, please refer to the documentation in the `docs` directory:

- [Integration Documentation](docs/INTEGRATION.md) - Technical details about the integration process
- [User Guide](docs/USER_GUIDE.md) - End-user instructions for using the application
- [API Documentation](docs/API_DOCUMENTATION.md) - Reference for the API endpoints

## Development

### Project Structure

```
Total-Recall/
├── api/                # Backend API components
├── frontend/           # Frontend React components
├── tests/              # Testing framework
├── docs/               # Documentation
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose configuration
├── environment.yml     # Conda environment configuration
├── install_conda.sh    # Conda installation script
├── install_docker.sh   # Docker installation script
└── README.md           # This file
```

### Running Tests

To run the tests:

```bash
./run_test_suite.sh
```

## License

This project is private and proprietary.

## Support

For issues or questions, please refer to the troubleshooting section in the documentation.
