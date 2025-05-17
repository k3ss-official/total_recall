<div align="center">
  <img src="/public/logo.png" alt="Total Recall Logo" width="200" height="200">
  <h1>TOTAL RECALL</h1>
  <img src="/public/header.png" alt="Total Recall Header" width="800">
  <p><em>Developed by k3ss, Rae(4o) and manus</em></p>
  <p>
    <a href="https://github.com/k3ss-official/Total-Recall/issues">Report Bug</a>
    ·
    <a href="https://github.com/k3ss-official/Total-Recall/issues">Request Feature</a>
  </p>
</div>

---

A powerful tool for accessing and re-injecting pre-May 8th, 2025 ChatGPT conversations into the new conversation recall feature for EU and UK users.

## Overview

Total Recall allows users to:
1. Securely authenticate with their OpenAI account
2. Extract their historical ChatGPT conversations
3. Process conversations with NLP for optimal organization
4. Create memory chunks with semantic boundaries
5. Inject selected memories back into ChatGPT's persistent memory

## Features

### Authentication & Session Management
- Secure OAuth authentication with OpenAI
- Token lifecycle management with automatic refresh
- Session persistence for convenience

### Conversation Management
- Comprehensive conversation extraction
- Filtering by date, topic, or content
- Conversation search and browsing
- Metadata extraction and organization

### NLP Processing
- Topic clustering and thread detection
- Importance ranking of conversations
- Semantic chunking for optimal memory injection
- Token-safe processing with boundary preservation

### Memory Management
- Structured storage of processed memories
- Memory bundles for organization
- Version control and snapshots
- Search and retrieval capabilities

### Memory Injection
- GPT-4o session verification
- Optimized memory formatting
- Injection confirmation and validation
- Multiple injection methods

## Getting Started

### Prerequisites
- Python 3.9+ (3.12+ recommended)
- Conda environment manager
- Node.js 16+ (for GUI, coming soon)
- Rust (for Tauri, coming soon)

### Installation

#### Automated Setup (Recommended)

We provide a setup script that handles environment creation and dependency installation:

1. Clone this repository:
   ```bash
   git clone https://github.com/k3ss-official/Total-Recall.git
   cd Total-Recall
   ```

2. Run the setup script:
   ```bash
   ./setup.sh
   ```
   
   The script will:
   - Check if you're in the correct directory
   - Prompt to create a new conda environment or use an existing one
   - Install all dependencies with proper flags
   - Verify the installation

3. Activate your environment before using Total Recall:
   ```bash
   conda activate total_recall  # Or your custom environment name
   ```

#### Manual Installation

If you prefer manual installation:

1. Clone this repository:
   ```bash
   git clone https://github.com/k3ss-official/Total-Recall.git
   cd Total-Recall
   ```

2. Create and activate a conda environment:
   ```bash
   conda create -n total_recall python=3.12
   conda activate total_recall
   ```

3. Install dependencies:
   ```bash
   pip install --force-reinstall --no-cache-dir -r requirements.txt
   ```

## Usage

### CLI Usage

The CLI tools provide core functionality for token management, endpoint testing, and memory processing:

```bash
# Token debugging
python -m src.cli.token_debugger view-token
python -m src.cli.token_debugger decode-token

# Endpoint testing
python -m src.cli.endpoint_tester test-endpoints

# Chunking engine
python -m src.cli.chunker_engine process --file conversations.json

# Recall testing
python -m src.cli.recall_tester ask-question --query "What did we discuss about AI safety?" --file memory_file.json
```

### GUI Usage (Coming Soon)

The GUI application provides a user-friendly interface for all Total Recall functionality:

1. Launch the application
2. Authenticate with your OpenAI account
3. Browse and select conversations
4. Process and organize memories
5. Inject selected memories into ChatGPT

## Project Structure

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
├── public/               # Public assets
├── setup.sh              # Environment setup script
└── requirements.txt      # Python dependencies
```

## Development

### Architecture

Total Recall follows a modular, privacy-first architecture with a CLI-first, GUI-ready approach. See [architecture.md](docs/architecture.md) for details.

### Roadmap

For information about the development roadmap and upcoming features, see [roadmap.md](docs/roadmap.md).

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for creating ChatGPT
- The EU and UK for their data protection regulations
- All contributors to this project

---

<div align="center">
  <img src="/public/logo.png" alt="Total Recall Logo" width="100">
  <p>© 2025 Total Recall Team</p>
</div>
