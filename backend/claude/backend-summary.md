# Total Recall Backend Build Summary

## Overview
This summary outlines the backend implementation for the Total Recall project - a tool that allows users to extract, process, and re-inject their ChatGPT conversation history into GPT-4o's memory feature. The backend handles data scraping, formatting, NLP processing with crawl4ai, and chunking conversations for memory backload.

## Directory Structure
```
total-recall-backend/
├── README.md
├── requirements.txt
├── start.sh
├── start.bat
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   └── error_handler.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── request.py
│   │   │   └── response.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── scrape.py
│   │       ├── process.py
│   │       └── status.py
│   └── src/
│       ├── __init__.py
│       ├── cli/
│       │   ├── __init__.py
│       │   ├── scrape_cli.py
│       │   └── process_cli.py
│       ├── config/
│       │   ├── __init__.py
│       │   └── settings.py
│       ├── services/
│       │   ├── __init__.py
│       │   ├── scraper.py
│       │   └── processor.py
│       └── utils/
│           ├── __init__.py
│           ├── token_counter.py
│           ├── date_filter.py
│           └── logger.py
├── config/
│   └── chat_clean.yaml
├── data/
│   ├── raw_conversations/
│   ├── processed/
│   └── output_chunks/
└── tests/
    ├── __init__.py
    ├── test_scraper.py
    ├── test_processor.py
    └── test_api.py
```

## API Endpoints

### 1. POST /api/scrape
Accepts the user's OpenAI token and scrapes their entire conversation history.

**Request:**
```json
{
  "openai_token": "your-openai-token",
  "date_filter": "pre_may_8_2025"  // or "all_chats"
}
```

**Response:**
```json
{
  "request_id": "unique-id",
  "status": "in_progress",
  "message": "Scraping started. Check status endpoint for progress."
}
```

### 2. POST /api/process
Processes the scraped conversations using crawl4ai, transforming and chunking for memory injection.

**Request:**
```json
{
  "input_directory": "data/raw_conversations",
  "output_directory": "data/output_chunks",
  "chunk_token_limit": 3900,
  "date_filter": "pre_may_8_2025"
}
```

**Response:**
```json
{
  "request_id": "unique-id",
  "status": "in_progress",
  "message": "Processing started. Check status endpoint for progress."
}
```

### 3. GET /api/status
Returns the current state of scraping and processing operations.

**Response:**
```json
{
  "system_status": {
    "scrape": {
      "status": "completed",
      "total_conversations": 120,
      "earliest_date": "2024-01-01T00:00:00Z",
      "latest_date": "2025-05-07T23:59:59Z",
      "errors": null,
      "filenames": null
    },
    "process": {
      "status": "completed",
      "total_chunks": 350,
      "total_tokens": 1365000,
      "conversations_processed": 120,
      "errors": null,
      "output_files": null
    },
    "memory_usage_mb": 156.25,
    "disk_space_raw_mb": 12.5,
    "disk_space_chunks_mb": 25.0
  },
  "message": "System status retrieved successfully"
}
```

## Key Files and Their Functions

### API Layer
- **backend/api/main.py**: FastAPI application entry point that configures middleware, routes, and CORS settings.
- **backend/api/models/request.py**: Pydantic models for API request validation.
- **backend/api/models/response.py**: Pydantic models for API response formatting.
- **backend/api/routes/scrape.py**: Handles the /api/scrape endpoint, initiating background scraping tasks.
- **backend/api/routes/process.py**: Handles the /api/process endpoint, managing crawl4ai processing tasks.
- **backend/api/routes/status.py**: Provides comprehensive status information about system operations.
- **backend/api/middleware/error_handler.py**: Global error handling middleware for consistent error responses.

### Core Services
- **backend/src/services/scraper.py**: OpenAIScraper service that authenticates with OpenAI's API and extracts conversation history.
- **backend/src/services/processor.py**: Uses crawl4ai to process, clean, and chunk conversations, adding RECALL MARKER formatting.

### Utilities
- **backend/src/utils/token_counter.py**: Handles token counting for precise chunking, using tiktoken when available.
- **backend/src/utils/date_filter.py**: Manages date filtering for pre-May 8th 2025 conversations.
- **backend/src/utils/logger.py**: Configures logging throughout the application.
- **backend/src/config/settings.py**: Application settings and directory management.

### CLI Tools
- **backend/src/cli/scrape_cli.py**: Command-line tool for scraping conversations.
- **backend/src/cli/process_cli.py**: Command-line tool for processing conversations.

### Configuration
- **config/chat_clean.yaml**: Configuration for the crawl4ai processing pipeline, defining how conversations are cleaned and normalized.

## crawl4ai Configuration

The NLP pipeline is configured in `config/chat_clean.yaml`:

```yaml
processors:
  # Clean message content
  - name: clean_message_content
    config:
      remove_urls: false
      remove_email: false
      remove_phone: false
      remove_special_chars: false
      trim_whitespace: true
      normalize_linebreaks: true
      remove_html: false
  
  # Filter messages
  - name: filter_messages
    config:
      min_length: 1
      max_length: 100000
      allowed_roles: ["user", "assistant", "system"]
  
  # Normalize conversation structure
  - name: normalize_conversation
    config:
      role_mapping:
        human: "user"
        ai: "assistant"
        bot: "assistant"
        user: "user"
        assistant: "assistant"
        system: "system"
      sort_by_timestamp: true
      add_missing_timestamps: true
  
  # Handle code blocks properly
  - name: extract_code_blocks
    config:
      preserve_formatting: true
      languages: ["python", "javascript", "bash", "json", "html", "css", "sql"]
```

This configuration tells crawl4ai how to:
1. Clean and normalize message content
2. Filter messages by length and role
3. Standardize role names
4. Preserve code blocks and formatting

## crawl4ai Integration

The processor.py file integrates with crawl4ai using a Python script that:

1. Creates a pipeline using the chat_clean.yaml configuration
2. Loads each conversation from raw JSON files
3. Processes them through the crawl4ai pipeline
4. Adds RECALL MARKER formatting
5. Chunks conversations into ~3900-token segments
6. Saves the processed chunks as JSON files

## Output Format

Each processed chunk includes RECALL MARKERs for memory injection:

```
## RECALL MARKER START
Title: Stock Oracle Research
Date: 2025-04-07T13:00:00Z
Tags: stock, ai, oracle
## RECALL MARKER END

User: What do you know about edge suppliers in the AI infra sector?
Assistant: Let's look at optical fiber vendors first...
```

## Setup and Run Instructions

### Prerequisites
- Python 3.8+
- pip

### Installation
1. Extract the backend code to your project directory
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Backend
#### Via Scripts
Use the provided startup scripts:
- On Linux/macOS: `./start.sh`
- On Windows: `start.bat`

#### Manually
Start the FastAPI server:
```bash
cd backend
uvicorn api.main:app --reload
```

The API server will be available at http://localhost:8000

### Using the CLI Tools
For direct access to scraping and processing:

**Scrape conversations:**
```bash
python -m src.cli.scrape_cli --token your-openai-token --output-dir data/raw_conversations --date-filter pre_may_8_2025
```

**Process conversations:**
```bash
python -m src.cli.process_cli --input-dir data/raw_conversations --output-dir data/output_chunks --config config/chat_clean.yaml
```

## Additional Information

The backend system:
- Processes conversations asynchronously in the background
- Provides detailed status information for frontend consumption
- Handles errors gracefully with proper logging
- Supports date filtering for pre-May 8th 2025 conversations
- Uses tiktoken for accurate token counting
- Maintains RECALL MARKER formatting across chunks

This implementation follows a clean, modular architecture that can operate independently from the frontend while providing the necessary APIs for integration.
