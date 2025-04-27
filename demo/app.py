#!/usr/bin/env python3
"""
Total Recall Demo API Server

This script sets up a simplified API server to demonstrate the core functionality
of the Total Recall application without requiring Docker.
"""

import json
import os
import time
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

# Create FastAPI app
app = FastAPI(title="Total Recall Demo API", 
              description="Simplified API for demonstrating Total Recall functionality",
              version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data directory
os.makedirs("data", exist_ok=True)

# Mock authentication token
DEMO_TOKEN = "demo_token_12345"

# Mock data
MOCK_CONVERSATIONS = [
    {
        "id": "conv_001",
        "title": "Discussion about AI ethics",
        "create_time": "2025-04-20T10:30:00",
        "update_time": "2025-04-20T11:45:00"
    },
    {
        "id": "conv_002",
        "title": "Python programming tips",
        "create_time": "2025-04-22T14:15:00",
        "update_time": "2025-04-22T15:30:00"
    },
    {
        "id": "conv_003",
        "title": "Machine learning project ideas",
        "create_time": "2025-04-23T09:00:00",
        "update_time": "2025-04-23T10:15:00"
    }
]

MOCK_CONVERSATION_DETAILS = {
    "conv_001": {
        "id": "conv_001",
        "title": "Discussion about AI ethics",
        "create_time": "2025-04-20T10:30:00",
        "update_time": "2025-04-20T11:45:00",
        "messages": [
            {
                "role": "user",
                "content": "What are the main ethical concerns with AI?",
                "create_time": "2025-04-20T10:30:00"
            },
            {
                "role": "assistant",
                "content": "The main ethical concerns with AI include bias, privacy, job displacement, security, and control issues. AI systems can perpetuate and amplify existing biases in data, potentially leading to unfair outcomes. They also raise privacy concerns through data collection and surveillance capabilities. Additionally, automation may lead to job displacement, while security vulnerabilities and questions about human control over increasingly autonomous systems present further challenges.",
                "create_time": "2025-04-20T10:31:00"
            },
            {
                "role": "user",
                "content": "How can we address AI bias?",
                "create_time": "2025-04-20T10:32:00"
            },
            {
                "role": "assistant",
                "content": "Addressing AI bias requires a multi-faceted approach: 1) Diverse and representative training data, 2) Regular bias audits and testing, 3) Diverse development teams, 4) Transparent algorithms and decision-making processes, 5) Clear governance frameworks, 6) Ongoing monitoring after deployment, and 7) Accountability mechanisms when bias is detected. It's an ongoing process rather than a one-time fix.",
                "create_time": "2025-04-20T10:33:00"
            }
        ]
    },
    "conv_002": {
        "id": "conv_002",
        "title": "Python programming tips",
        "create_time": "2025-04-22T14:15:00",
        "update_time": "2025-04-22T15:30:00",
        "messages": [
            {
                "role": "user",
                "content": "What are some Python best practices for clean code?",
                "create_time": "2025-04-22T14:15:00"
            },
            {
                "role": "assistant",
                "content": "Here are some Python best practices for clean code:\n\n1. Follow PEP 8 style guide\n2. Use meaningful variable and function names\n3. Write docstrings for functions and classes\n4. Keep functions small and focused on a single task\n5. Use list comprehensions when appropriate\n6. Leverage Python's built-in functions and libraries\n7. Use exception handling properly\n8. Write unit tests\n9. Use virtual environments\n10. Avoid global variables",
                "create_time": "2025-04-22T14:16:00"
            },
            {
                "role": "user",
                "content": "Can you explain list comprehensions?",
                "create_time": "2025-04-22T14:17:00"
            },
            {
                "role": "assistant",
                "content": "List comprehensions are a concise way to create lists in Python. They consist of brackets containing an expression followed by a for clause, then zero or more for or if clauses.\n\nBasic syntax: [expression for item in iterable if condition]\n\nExamples:\n\n1. Create a list of squares: squares = [x**2 for x in range(10)]\n2. Filter even numbers: evens = [x for x in range(10) if x % 2 == 0]\n3. Transform strings: upper_names = [name.upper() for name in names]\n\nList comprehensions are more readable and often faster than equivalent for loops. They're ideal for simple transformations and filters, but for complex operations, regular for loops might be clearer.",
                "create_time": "2025-04-22T14:18:00"
            }
        ]
    },
    "conv_003": {
        "id": "conv_003",
        "title": "Machine learning project ideas",
        "create_time": "2025-04-23T09:00:00",
        "update_time": "2025-04-23T10:15:00",
        "messages": [
            {
                "role": "user",
                "content": "Can you suggest some beginner-friendly machine learning projects?",
                "create_time": "2025-04-23T09:00:00"
            },
            {
                "role": "assistant",
                "content": "Here are some beginner-friendly machine learning projects:\n\n1. Image classification with MNIST or CIFAR-10 datasets\n2. Sentiment analysis on movie reviews or tweets\n3. Housing price prediction using regression\n4. Customer churn prediction\n5. Music genre classification\n6. Spam email detection\n7. Iris flower classification\n8. Credit card fraud detection\n9. Recommendation system for movies or books\n10. Time series forecasting for stock prices or weather\n\nThese projects have readily available datasets and plenty of tutorials online. Start with simpler models before moving to more complex ones like neural networks.",
                "create_time": "2025-04-23T09:01:00"
            },
            {
                "role": "user",
                "content": "Which libraries should I learn for these projects?",
                "create_time": "2025-04-23T09:02:00"
            },
            {
                "role": "assistant",
                "content": "For machine learning projects, these are the essential libraries to learn:\n\n1. NumPy - For numerical operations and array manipulation\n2. Pandas - For data manipulation and analysis\n3. Matplotlib/Seaborn - For data visualization\n4. Scikit-learn - For traditional ML algorithms and workflows\n5. TensorFlow or PyTorch - For deep learning (start with one)\n\nAdditional useful libraries:\n- NLTK or spaCy for natural language processing\n- OpenCV for computer vision\n- XGBoost for gradient boosting\n- Statsmodels for statistical models\n- Plotly for interactive visualizations\n\nStart with NumPy, Pandas, and Scikit-learn for the beginner projects, then add others as needed.",
                "create_time": "2025-04-23T09:03:00"
            }
        ]
    }
}

# Models
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class TokenRequest(BaseModel):
    username: str
    password: str

class AuthStatus(BaseModel):
    authenticated: bool
    username: Optional[str] = None

class ConversationList(BaseModel):
    conversations: List[Dict]
    total: int
    page: int
    page_size: int

class ProcessingConfig(BaseModel):
    chunking: Dict
    summarization: Dict

class ProcessingRequest(BaseModel):
    conversation_ids: List[str]
    config: ProcessingConfig

class ProcessingResponse(BaseModel):
    task_id: str
    status: str
    progress: float
    message: str

class InjectionConfig(BaseModel):
    max_tokens_per_request: int
    retry_attempts: int
    retry_delay: int
    include_timestamps: bool
    include_titles: bool

class InjectionRequest(BaseModel):
    conversation_ids: List[str]
    config: InjectionConfig

class InjectionResponse(BaseModel):
    task_id: str
    status: str
    progress: float
    message: str
    successful_injections: int
    failed_injections: int

class DirectInjectionResponse(BaseModel):
    success: bool
    total: int
    successful: int
    failed: int
    failures: Optional[List[Dict]] = None

# Authentication dependency
async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme"
        )
    token = authorization.replace("Bearer ", "")
    if token != DEMO_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    return token

# Routes
@app.post("/api/auth/token", response_model=Token)
async def login(request: TokenRequest):
    # Simple mock authentication
    return {
        "access_token": DEMO_TOKEN,
        "token_type": "bearer",
        "expires_in": 3600
    }

@app.get("/api/auth/status", response_model=AuthStatus)
async def auth_status(token: str = Depends(verify_token)):
    return {
        "authenticated": True,
        "username": "demo_user"
    }

@app.get("/api/conversations/conversations", response_model=ConversationList)
async def list_conversations(
    page: int = 1, 
    page_size: int = 10,
    token: str = Depends(verify_token)
):
    return {
        "conversations": MOCK_CONVERSATIONS,
        "total": len(MOCK_CONVERSATIONS),
        "page": page,
        "page_size": page_size
    }

@app.get("/api/conversations/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, token: str = Depends(verify_token)):
    if conversation_id not in MOCK_CONVERSATION_DETAILS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return MOCK_CONVERSATION_DETAILS[conversation_id]

@app.post("/api/processing/process", response_model=ProcessingResponse)
async def process_conversations(request: ProcessingRequest, token: str = Depends(verify_token)):
    # Generate a mock task ID
    task_id = f"task_{int(time.time())}"
    
    # Save task info to file for status checking
    with open(f"data/{task_id}.json", "w") as f:
        json.dump({
            "task_id": task_id,
            "status": "pending",
            "progress": 0.0,
            "message": "Task initialized",
            "conversation_ids": request.conversation_ids,
            "config": request.config.dict()
        }, f)
    
    return {
        "task_id": task_id,
        "status": "pending",
        "progress": 0.0,
        "message": "Task initialized"
    }

@app.get("/api/processing/process/{task_id}", response_model=ProcessingResponse)
async def get_processing_status(task_id: str, token: str = Depends(verify_token)):
    # Check if task exists
    if not os.path.exists(f"data/{task_id}.json"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Read task info
    with open(f"data/{task_id}.json", "r") as f:
        task_info = json.load(f)
    
    # Simulate progress for demo purposes
    current_time = time.time()
    task_id_time = int(task_id.split("_")[1])
    elapsed_seconds = current_time - task_id_time
    
    if elapsed_seconds < 10:
        progress = min(elapsed_seconds / 20, 0.5)
        status = "processing"
        message = f"Processing conversations ({int(progress * len(task_info['conversation_ids']))}/{len(task_info['conversation_ids'])})"
    elif elapsed_seconds < 15:
        progress = min((elapsed_seconds - 10) / 10 + 0.5, 1.0)
        status = "processing"
        message = f"Processing conversations ({int(progress * len(task_info['conversation_ids']))}/{len(task_info['conversation_ids'])})"
    else:
        progress = 1.0
        status = "completed"
        message = "Processing completed successfully"
    
    # Update task info
    task_info["progress"] = progress
    task_info["status"] = status
    task_info["message"] = message
    
    with open(f"data/{task_id}.json", "w") as f:
        json.dump(task_info, f)
    
    return {
        "task_id": task_id,
        "status": status,
        "progress": progress,
        "message": message
    }

@app.post("/api/injection/inject", response_model=InjectionResponse)
async def inject_memory(request: InjectionRequest, token: str = Depends(verify_token)):
    # Generate a mock task ID
    task_id = f"task_{int(time.time())}"
    
    # Save task info to file for status checking
    with open(f"data/{task_id}.json", "w") as f:
        json.dump({
            "task_id": task_id,
            "status": "pending",
            "progress": 0.0,
            "message": "Task initialized",
            "conversation_ids": request.conversation_ids,
            "config": request.config.dict(),
            "successful_injections": 0,
            "failed_injections": 0
        }, f)
    
    return {
        "task_id": task_id,
        "status": "pending",
        "progress": 0.0,
        "message": "Task initialized",
        "successful_injections": 0,
        "failed_injections": 0
    }

@app.get("/api/injection/inject/{task_id}")
async def get_injection_status(task_id: str, token: str = Depends(verify_token)):
    # Check if task exists
    if not os.path.exists(f"data/{task_id}.json"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Read task info
    with open(f"data/{task_id}.json", "r") as f:
        task_info = json.load(f)
    
    # Simulate progress for demo purposes
    current_time = time.time()
    task_id_time = int(task_id.split("_")[1])
    elapsed_seconds = current_time - task_id_time
    
    if elapsed_seconds < 10:
        progress = min(elapsed_seconds / 20, 0.5)
        status = "processing"
        successful = int(progress * len(task_info['conversation_ids']))
        message = f"Injecting memories ({successful}/{len(task_info['conversation_ids'])})"
    elif elapsed_seconds < 15:
        progress = min((elapsed_seconds - 10) / 10 + 0.5, 1.0)
        status = "processing"
        successful = int(progress * len(task_info['conversation_ids']))
        message = f"Injecting memories ({successful}/{len(task_info['conversation_ids'])})"
    else:
        progress = 1.0
        status = "completed"
        successful = len(task_info['conversation_ids'])
        message = "Memory injection completed successfully"
    
    # Update task info
    task_info["progress"] = progress
    task_info["status"] = status
    task_info["message"] = message
    task_info["successful_injections"] = successful
    
    with open(f"data/{task_id}.json", "w") as f:
        json.dump(task_info, f)
    
    return {
        "task_id": task_id,
        "status": status,
        "progress": progress,
        "message": message,
        "successful_injections": successful,
        "failed_injections": 0
    }

@app.post("/api/direct-injection/direct-inject", response_model=DirectInjectionResponse)
async def direct_inject_memory(request: InjectionRequest, token: str = Depends(verify_token)):
    # Simulate direct injection (would connect to ChatGPT in real implementation)
    time.sleep(2)  # Simulate processing time
    
    return {
        "success": True,
        "total": len(request.conversation_ids),
        "successful": len(request.conversation_ids),
        "failed": 0,
        "failures": None
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Create a simple HTML frontend for the demo
@app.get("/", response_class=HTMLResponse)
async def get_demo_ui():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Total Recall Demo</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                line-height: 1.6;
            }
            h1, h2, h3 {
                color: #333;
            }
            .container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .card {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .form-group {
                margin-bottom: 15px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            input, button {
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid #ddd;
            }
            button {
                background-color: #4CAF50;
                color: white;
                border: none;
                cursor: pointer;
                padding: 10px 15px;
            }
            button:hover {
                background-color: #45a049;
            }
            .result {
                margin-top: 15px;
                padding: 15px;
                background-color: #f9f9f9;
                border-radius: 4px;
                white-space: pre-wrap;
            }
            .conversation-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
            }
            .conversation-card {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .conversation-card:hover {
                background-color: #f5f5f5;
            }
            .conversation-card.selected {
                background-color: #e6f7ff;
                border-color: #1890ff;
            }
            .conversation-detail {
                margin-top: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            .message {
                margin-bottom: 15px;
                padding: 10px;
                border-radius: 8px;
            }
            .user {
                background-color: #f0f0f0;
                margin-left: 20px;
            }
            .assistant {
                background-color: #e6f7ff;
                margin-right: 20px;
            }
            .tabs {
                display: flex;
                border-bottom: 1px solid #ddd;
                margin-bottom: 20px;
            }
            .tab {
                padding: 10px 20px;
                cursor: pointer;
                border: 1px solid transparent;
                border-bottom: none;
                border-radius: 4px 4px 0 0;
                margin-right: 5px;
            }
            .tab.active {
                background-color: #fff;
                border-color: #ddd;
                border-bottom: 1px solid #fff;
                margin-bottom: -1px;
            }
            .tab-content {
                display: none;
            }
            .tab-content.active {
                display: block;
            }
            .progress-container {
                width: 100%;
                background-color: #f1f1f1;
                border-radius: 4px;
                margin: 10px 0;
            }
            .progress-bar {
                height: 20px;
                background-color: #4CAF50;
                border-radius: 4px;
                width: 0%;
                transition: width 0.3s;
            }
            .status-message {
                margin-top: 10px;
                font-style: italic;
            }
        </style>
    </head>
    <body>
        <h1>Total Recall Demo</h1>
        <p>This is a simplified demonstration of the Total Recall application, which extracts ChatGPT conversations and injects them into GPT's persistent memory.</p>
        
        <div class="container">
            <div class="card">
                <h2>Authentication</h2>
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input type="text" id="username" value="demo_user">
                </div>
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" value="password">
                </div>
                <button id="login-btn">Login</button>
                <div id="auth-result" class="result"></div>
            </div>
            
            <div id="main-content" style="display: none;">
                <div class="tabs">
                    <div class="tab active" data-tab="retrieve">1. Retrieve Conversations</div>
                    <div class="tab" data-tab="process">2. Process Conversations</div>
                    <div class="tab" data-tab="inject">3. Inject Memory</div>
                </div>
                
                <div id="retrieve-tab" class="tab-content active">
                    <div class="card">
                        <h2>Retrieve Conversations</h2>
                        <button id="retrieve-btn">Retrieve Conversations</button>
                        <div id="conversations-container" style="display: none;">
                            <h3>Your Conversations</h3>
                            <div id="conversation-list" class="conversation-list"></div>
                            <div id="conversation-detail" class="conversation-detail" style="display: none;"></div>
                        </div>
                    </div>
                </div>
                
                <div id="process-tab" class="tab-content">
                    <div class="card">
                        <h2>Process Conversations</h2>
                        <p>Select conversations to process for memory injection.</p>
                        <div class="form-group">
                            <label>Processing Configuration:</label>
                            <div>
                                <input type="checkbox" id="summarization-enabled" checked>
                                <label for="summarization-enabled">Enable summarization</label>
                            </div>
                            <div>
                                <label for="chunk-size">Chunk size:</label>
                                <input type="number" id="chunk-size" value="1000" min="100" max="2000">
                            </div>
                        </div>
                        <button id="process-btn">Process Selected Conversations</button>
                        <div id="processing-status" style="display: none;">
                            <h3>Processing Status</h3>
                            <div class="progress-container">
                                <div id="processing-progress" class="progress-bar"></div>
                            </div>
                            <div id="processing-message" class="status-message"></div>
                        </div>
                    </div>
                </div>
                
                <div id="inject-tab" class="tab-content">
                    <div class="card">
                        <h2>Inject Memory</h2>
                        <p>Inject processed conversations into GPT's memory.</p>
                        <div class="form-group">
                            <label>Injection Configuration:</label>
                            <div>
                                <label for="rate-limit">Rate limit (requests per minute):</label>
                                <input type="number" id="rate-limit" value="3" min="1" max="10">
                            </div>
                            <div>
                                <input type="checkbox" id="include-timestamps" checked>
                                <label for="include-timestamps">Include timestamps</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Injection Method:</label>
                            <div>
                                <input type="radio" id="background-injection" name="injection-method" checked>
                                <label for="background-injection">Background Task</label>
                            </div>
                            <div>
                                <input type="radio" id="direct-injection" name="injection-method">
                                <label for="direct-injection">Direct Injection</label>
                            </div>
                        </div>
                        <button id="inject-btn">Inject Memory</button>
                        <div id="injection-status" style="display: none;">
                            <h3>Injection Status</h3>
                            <div class="progress-container">
                                <div id="injection-progress" class="progress-bar"></div>
                            </div>
                            <div id="injection-message" class="status-message"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            // Global variables
            let authToken = '';
            let selectedConversations = [];
            let processingTaskId = '';
            let injectionTaskId = '';
            
            // DOM elements
            const loginBtn = document.getElementById('login-btn');
            const authResult = document.getElementById('auth-result');
            const mainContent = document.getElementById('main-content');
            const retrieveBtn = document.getElementById('retrieve-btn');
            const conversationsContainer = document.getElementById('conversations-container');
            const conversationList = document.getElementById('conversation-list');
            const conversationDetail = document.getElementById('conversation-detail');
            const processBtn = document.getElementById('process-btn');
            const processingStatus = document.getElementById('processing-status');
            const processingProgress = document.getElementById('processing-progress');
            const processingMessage = document.getElementById('processing-message');
            const injectBtn = document.getElementById('inject-btn');
            const injectionStatus = document.getElementById('injection-status');
            const injectionProgress = document.getElementById('injection-progress');
            const injectionMessage = document.getElementById('injection-message');
            
            // Tab navigation
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    // Remove active class from all tabs and content
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    
                    // Add active class to clicked tab and corresponding content
                    tab.classList.add('active');
                    document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
                });
            });
            
            // Login
            loginBtn.addEventListener('click', async () => {
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                try {
                    const response = await fetch('/api/auth/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        authToken = data.access_token;
                        authResult.textContent = 'Authentication successful!';
                        mainContent.style.display = 'block';
                    } else {
                        authResult.textContent = `Authentication failed: ${data.detail}`;
                    }
                } catch (error) {
                    authResult.textContent = `Error: ${error.message}`;
                }
            });
            
            // Retrieve conversations
            retrieveBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch('/api/conversations/conversations', {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        conversationsContainer.style.display = 'block';
                        conversationList.innerHTML = '';
                        
                        data.conversations.forEach(conv => {
                            const card = document.createElement('div');
                            card.className = 'conversation-card';
                            card.dataset.id = conv.id;
                            card.innerHTML = `
                                <h3>${conv.title}</h3>
                                <p>Created: ${new Date(conv.create_time).toLocaleString()}</p>
                                <p>Updated: ${new Date(conv.update_time).toLocaleString()}</p>
                                <label>
                                    <input type="checkbox" class="conversation-checkbox" data-id="${conv.id}">
                                    Select for processing
                                </label>
                            `;
                            
                            card.addEventListener('click', (e) => {
                                // Don't trigger when clicking the checkbox
                                if (e.target.type === 'checkbox') return;
                                
                                loadConversationDetail(conv.id);
                            });
                            
                            conversationList.appendChild(card);
                        });
                        
                        // Add event listeners to checkboxes
                        document.querySelectorAll('.conversation-checkbox').forEach(checkbox => {
                            checkbox.addEventListener('change', () => {
                                const convId = checkbox.dataset.id;
                                if (checkbox.checked) {
                                    if (!selectedConversations.includes(convId)) {
                                        selectedConversations.push(convId);
                                    }
                                } else {
                                    selectedConversations = selectedConversations.filter(id => id !== convId);
                                }
                            });
                        });
                    } else {
                        alert(`Failed to retrieve conversations: ${data.detail}`);
                    }
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            });
            
            // Load conversation detail
            async function loadConversationDetail(conversationId) {
                try {
                    const response = await fetch(`/api/conversations/conversations/${conversationId}`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        conversationDetail.style.display = 'block';
                        conversationDetail.innerHTML = `
                            <h3>${data.title}</h3>
                            <p>Created: ${new Date(data.create_time).toLocaleString()}</p>
                            <p>Updated: ${new Date(data.update_time).toLocaleString()}</p>
                            <div id="messages"></div>
                        `;
                        
                        const messagesContainer = document.getElementById('messages');
                        data.messages.forEach(msg => {
                            const messageDiv = document.createElement('div');
                            messageDiv.className = `message ${msg.role}`;
                            messageDiv.innerHTML = `
                                <p><strong>${msg.role === 'user' ? 'You' : 'Assistant'}:</strong></p>
                                <p>${msg.content}</p>
                                <small>${new Date(msg.create_time).toLocaleString()}</small>
                            `;
                            messagesContainer.appendChild(messageDiv);
                        });
                        
                        // Highlight selected conversation
                        document.querySelectorAll('.conversation-card').forEach(card => {
                            card.classList.remove('selected');
                            if (card.dataset.id === conversationId) {
                                card.classList.add('selected');
                            }
                        });
                    } else {
                        alert(`Failed to load conversation: ${data.detail}`);
                    }
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
            
            // Process conversations
            processBtn.addEventListener('click', async () => {
                if (selectedConversations.length === 0) {
                    alert('Please select at least one conversation to process.');
                    return;
                }
                
                const chunkSize = parseInt(document.getElementById('chunk-size').value);
                const summarizationEnabled = document.getElementById('summarization-enabled').checked;
                
                try {
                    const response = await fetch('/api/processing/process', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            conversation_ids: selectedConversations,
                            config: {
                                chunking: {
                                    chunk_size: chunkSize,
                                    chunk_overlap: Math.floor(chunkSize * 0.2),
                                    include_timestamps: true
                                },
                                summarization: {
                                    enabled: summarizationEnabled,
                                    max_length: 500,
                                    focus_recent: true
                                }
                            }
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        processingTaskId = data.task_id;
                        processingStatus.style.display = 'block';
                        updateProcessingStatus();
                    } else {
                        alert(`Failed to start processing: ${data.detail}`);
                    }
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            });
            
            // Update processing status
            async function updateProcessingStatus() {
                if (!processingTaskId) return;
                
                try {
                    const response = await fetch(`/api/processing/process/${processingTaskId}`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        const progressPercent = Math.round(data.progress * 100);
                        processingProgress.style.width = `${progressPercent}%`;
                        processingMessage.textContent = data.message;
                        
                        if (data.status === 'completed') {
                            processingMessage.textContent = 'Processing completed successfully!';
                            // Switch to inject tab after completion
                            setTimeout(() => {
                                document.querySelector('.tab[data-tab="inject"]').click();
                            }, 2000);
                        } else {
                            // Continue polling
                            setTimeout(updateProcessingStatus, 1000);
                        }
                    } else {
                        processingMessage.textContent = `Error: ${data.detail}`;
                    }
                } catch (error) {
                    processingMessage.textContent = `Error: ${error.message}`;
                }
            }
            
            // Inject memory
            injectBtn.addEventListener('click', async () => {
                if (selectedConversations.length === 0) {
                    alert('Please select at least one conversation to inject.');
                    return;
                }
                
                const rateLimit = parseInt(document.getElementById('rate-limit').value);
                const includeTimestamps = document.getElementById('include-timestamps').checked;
                const isDirect = document.getElementById('direct-injection').checked;
                
                const endpoint = isDirect ? '/api/direct-injection/direct-inject' : '/api/injection/inject';
                
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            conversation_ids: selectedConversations,
                            config: {
                                max_tokens_per_request: 4000,
                                retry_attempts: 3,
                                retry_delay: 5,
                                include_timestamps: includeTimestamps,
                                include_titles: true
                            }
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        injectionStatus.style.display = 'block';
                        
                        if (isDirect) {
                            // Direct injection completes immediately
                            injectionProgress.style.width = '100%';
                            injectionMessage.textContent = `Direct injection completed: ${data.successful}/${data.total} conversations successfully injected.`;
                        } else {
                            // Background task needs polling
                            injectionTaskId = data.task_id;
                            updateInjectionStatus();
                        }
                    } else {
                        alert(`Failed to start injection: ${data.detail}`);
                    }
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            });
            
            // Update injection status
            async function updateInjectionStatus() {
                if (!injectionTaskId) return;
                
                try {
                    const response = await fetch(`/api/injection/inject/${injectionTaskId}`, {
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        const progressPercent = Math.round(data.progress * 100);
                        injectionProgress.style.width = `${progressPercent}%`;
                        injectionMessage.textContent = data.message;
                        
                        if (data.status === 'completed') {
                            injectionMessage.textContent = 'Memory injection completed successfully!';
                        } else {
                            // Continue polling
                            setTimeout(updateInjectionStatus, 1000);
                        }
                    } else {
                        injectionMessage.textContent = `Error: ${data.detail}`;
                    }
                } catch (error) {
                    injectionMessage.textContent = `Error: ${error.message}`;
                }
            }
        </script>
    </body>
    </html>
    """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
