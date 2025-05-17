from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import time
import os

from app.api.endpoints import auth, conversations, processing, export, injection, direct_injection, websocket

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("total_recall")

# Create FastAPI app
app = FastAPI(
    title="Total Recall API",
    description="API for Total Recall - A tool to extract and inject ChatGPT conversations into persistent memory",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Process the request
    response = await call_next(request)
    
    # Log request details
    process_time = time.time() - start_time
    logger.info(
        f"Request: {request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.4f}s"
    )
    
    return response

# Add global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred", "code": "internal_server_error"}
    )

# Include routers
app.include_router(auth.router, prefix="/api/auth")
app.include_router(conversations.router, prefix="/api/conversations")
app.include_router(processing.router, prefix="/api/processing")
app.include_router(export.router, prefix="/api/export")
app.include_router(injection.router, prefix="/api/injection")
app.include_router(direct_injection.router, prefix="/api/direct-injection")
app.include_router(websocket.router, prefix="/api")

# Root endpoint
@app.get("/")
async def root():
    return {
        "name": "Total Recall API",
        "version": "1.0.0",
        "status": "running",
        "documentation": "/api/docs"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
