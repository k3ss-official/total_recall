# Total Recall: GUI Feature List

## Overview

Total Recall is a powerful application that allows users to access and re-inject their pre-May 8th, 2025 ChatGPT conversations into the new conversation recall feature for EU and UK users. This document outlines the GUI features for the M4 phase of development.

## GUI UX/UI Features (for M4 App Build)

### Core UX Features (Must-Haves)

#### 1. Live Auth Status Bar
- Positioned in top corner
- Color-coded status indicators (green = connected, yellow = needs reauth)
- One-click access to authentication actions
- Visual countdown for token expiration
- Unobtrusive yet informative design

#### 2. Token Viewer Modal
- Comprehensive display of all auth/debug info
- Copy-to-clipboard functionality for each field
- JWT decoder for token inspection
- Historical token usage tracking
- Security recommendations

#### 3. Conversation Timeline Panel
- Interactive slider to visualize ideas over time
- Chronological view of all conversations
- Highlight key moments and insights
- Filter and zoom capabilities
- Conversation branching visualization

#### 4. Chunk Preview Tray
- Shows formatted memory before backloading
- Live token count and optimization suggestions
- Edit capabilities for fine-tuning
- Side-by-side comparison with original
- Validation against backload schema

### Magic Touches (Jobs-style "oh damn that's clever")

#### 1. "What do I know about..." Search
- Natural language query interface
- Pulls best-matching chunks across all memory
- Relevance scoring and highlighting
- Interactive refinement of search results
- Visual representation of knowledge connections

#### 2. Memory Inspector Mode
- Visual UI for exploring stored memory
- Sortable by source (chat ID), date, topic, and novelty
- Drill-down capabilities for detailed exploration
- Filtering and tagging tools
- Export selected memories

#### 3. Chunk Weight Radar
- Radar chart or gradient bars showing topic distribution
- Visual representation of memory allocation
- Interactive elements to adjust weights
- Recommendations for balancing memory
- Historical tracking of weight changes

#### 4. Recall Map
- Interactive graph visualization of conversations
- Shows threads, branches, and key decisions
- Zoom and focus capabilities
- Highlight important nodes
- Path tracing between related concepts

#### 5. Drop-to-Backload Zone
- Drag-and-drop interface for .json files
- Paste JSON directly for instant preview
- Live validation and error highlighting
- One-click loading into memory
- Format conversion for non-standard inputs

#### 6. Pin-to-Memory
- Highlight any conversation part
- Pin it to long-term memory with tags
- Priority setting for pinned memories
- Visual indicators for pinned content
- Quick access to all pinned memories

## Implementation Details

### GUI Framework
- Tauri as the preferred framework
- React/TypeScript for frontend components
- Modular design for component reusability

### Layout Structure
- Dashboard as the main entry point
- Left navigation for workflow steps
- Timeline view for conversation history
- Recall Map for visual exploration
- Backload Tray for memory injection

### Integration Points
- Token Viewer component integrated with CLI token tools
- Endpoint Tester integrated with CLI endpoint testing
- Backload Visualizer integrated with CLI backload tools
