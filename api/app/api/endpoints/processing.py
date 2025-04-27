from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Body
from typing import List, Dict, Any
import uuid
import asyncio

from app.api.endpoints.auth import get_current_user, User
from app.models.schemas import ProcessingConfig, ProcessingTask, ProcessingStatus

router = APIRouter(tags=["processing"])

# Simulated task database - in production, use a real database
processing_tasks = {}


async def process_conversations_task(task_id: str, conversation_ids: List[str], config: ProcessingConfig):
    """
    Background task to process conversations
    
    Args:
        task_id: Task ID
        conversation_ids: List of conversation IDs to process
        config: Processing configuration
    """
    # Update task status to processing
    processing_tasks[task_id]["status"] = ProcessingStatus.PROCESSING
    
    total_conversations = len(conversation_ids)
    
    # Simulate processing with progress updates
    for i, conv_id in enumerate(conversation_ids):
        # Simulate processing time
        await asyncio.sleep(1)
        
        # Update progress
        progress = (i + 1) / total_conversations
        processing_tasks[task_id]["progress"] = progress
        processing_tasks[task_id]["message"] = f"Processing conversation {i+1}/{total_conversations}"
        
        # Simulate chunking based on config
        chunk_size = config.chunking.chunk_size
        chunk_overlap = config.chunking.chunk_overlap
        
        # Simulate summarization if enabled
        if config.summarization.enabled:
            # Additional processing time for summarization
            await asyncio.sleep(0.5)
    
    # Complete the task
    processing_tasks[task_id]["status"] = ProcessingStatus.COMPLETED
    processing_tasks[task_id]["progress"] = 1.0
    processing_tasks[task_id]["message"] = "Processing completed"
    processing_tasks[task_id]["result"] = {
        "processed_conversations": total_conversations,
        "total_chunks": total_conversations * 3,  # Simulated chunk count
        "summarization_applied": config.summarization.enabled
    }


@router.post("/process", response_model=ProcessingTask)
async def process_conversations(
    conversation_ids: List[str] = Body(..., description="List of conversation IDs to process"),
    config: ProcessingConfig = Body(ProcessingConfig(), description="Processing configuration"),
    background_tasks: BackgroundTasks = None,
    current_user: User = Depends(get_current_user)
):
    """
    Process conversations with specified configuration
    
    Args:
        conversation_ids: List of conversation IDs to process
        config: Processing configuration
        background_tasks: FastAPI background tasks
        current_user: Current authenticated user
        
    Returns:
        ProcessingTask with task ID and initial status
    """
    # Create a new task
    task_id = str(uuid.uuid4())
    
    # Initialize task
    task = {
        "task_id": task_id,
        "status": ProcessingStatus.PENDING,
        "progress": 0.0,
        "message": "Task initialized",
        "result": None
    }
    
    # Store task
    processing_tasks[task_id] = task
    
    # Start background processing
    background_tasks.add_task(
        process_conversations_task,
        task_id=task_id,
        conversation_ids=conversation_ids,
        config=config
    )
    
    return ProcessingTask(**task)


@router.get("/process/{task_id}", response_model=ProcessingTask)
async def get_processing_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get status of a processing task
    
    Args:
        task_id: Task ID
        current_user: Current authenticated user
        
    Returns:
        ProcessingTask with current status
        
    Raises:
        HTTPException: If task not found
    """
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return ProcessingTask(**processing_tasks[task_id])


@router.post("/process/cancel/{task_id}")
async def cancel_processing_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Cancel a processing task
    
    Args:
        task_id: Task ID
        current_user: Current authenticated user
        
    Returns:
        Cancellation result
        
    Raises:
        HTTPException: If task not found or already completed
    """
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = processing_tasks[task_id]
    
    if task["status"] in [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED]:
        raise HTTPException(status_code=400, detail="Task already completed or failed")
    
    # Update task status
    task["status"] = ProcessingStatus.FAILED
    task["message"] = "Task cancelled by user"
    
    return {"success": True, "message": "Task cancelled successfully"}
