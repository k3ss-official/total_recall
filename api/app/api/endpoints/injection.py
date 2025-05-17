from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Body
from typing import List, Dict, Any
import uuid
import asyncio

from app.api.endpoints.auth import get_current_user, User
from app.models.schemas import InjectionConfig, InjectionRequest, InjectionStatus, ProcessingStatus

router = APIRouter(tags=["injection"])

# Simulated injection tasks database - in production, use a real database
injection_tasks = {}


async def inject_memory_task(task_id: str, conversation_ids: List[str], config: InjectionConfig):
    """
    Background task to inject memory into ChatGPT
    
    Args:
        task_id: Task ID
        conversation_ids: List of conversation IDs to inject
        config: Injection configuration
    """
    # Update task status to processing
    injection_tasks[task_id]["status"] = ProcessingStatus.PROCESSING
    
    total_conversations = len(conversation_ids)
    successful = 0
    failed = 0
    
    # Simulate processing with progress updates
    for i, conv_id in enumerate(conversation_ids):
        # Simulate processing time
        await asyncio.sleep(1)
        
        # Update progress
        progress = (i + 1) / total_conversations
        injection_tasks[task_id]["progress"] = progress
        injection_tasks[task_id]["message"] = f"Injecting conversation {i+1}/{total_conversations}"
        
        # Simulate injection with retry logic
        success = False
        for attempt in range(config.retry_attempts):
            # Simulate API call
            await asyncio.sleep(0.5)
            
            # Simulate success (90% chance)
            if uuid.uuid4().int % 10 != 0:
                success = True
                break
            
            # Simulate retry delay
            await asyncio.sleep(config.retry_delay)
        
        if success:
            successful += 1
        else:
            failed += 1
        
        # Update task with current stats
        injection_tasks[task_id]["successful_injections"] = successful
        injection_tasks[task_id]["failed_injections"] = failed
    
    # Complete the task
    injection_tasks[task_id]["status"] = ProcessingStatus.COMPLETED
    injection_tasks[task_id]["progress"] = 1.0
    injection_tasks[task_id]["message"] = "Injection completed"


@router.post("/inject", response_model=InjectionStatus)
async def inject_memory(
    injection_request: InjectionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Inject conversations into ChatGPT memory
    
    Args:
        injection_request: Injection request with conversation IDs and configuration
        background_tasks: FastAPI background tasks
        current_user: Current authenticated user
        
    Returns:
        InjectionStatus with task ID and initial status
    """
    # Create a new task
    task_id = str(uuid.uuid4())
    
    # Initialize task
    task = {
        "task_id": task_id,
        "status": ProcessingStatus.PENDING,
        "progress": 0.0,
        "message": "Task initialized",
        "successful_injections": 0,
        "failed_injections": 0
    }
    
    # Store task
    injection_tasks[task_id] = task
    
    # Start background processing
    background_tasks.add_task(
        inject_memory_task,
        task_id=task_id,
        conversation_ids=injection_request.conversation_ids,
        config=injection_request.config
    )
    
    return InjectionStatus(**task)


@router.get("/inject/{task_id}", response_model=InjectionStatus)
async def get_injection_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get status of an injection task
    
    Args:
        task_id: Task ID
        current_user: Current authenticated user
        
    Returns:
        InjectionStatus with current status
        
    Raises:
        HTTPException: If task not found
    """
    if task_id not in injection_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return InjectionStatus(**injection_tasks[task_id])


@router.post("/inject/cancel/{task_id}")
async def cancel_injection_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Cancel an injection task
    
    Args:
        task_id: Task ID
        current_user: Current authenticated user
        
    Returns:
        Cancellation result
        
    Raises:
        HTTPException: If task not found or already completed
    """
    if task_id not in injection_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = injection_tasks[task_id]
    
    if task["status"] in [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED]:
        raise HTTPException(status_code=400, detail="Task already completed or failed")
    
    # Update task status
    task["status"] = ProcessingStatus.FAILED
    task["message"] = "Task cancelled by user"
    
    return {"success": True, "message": "Task cancelled successfully"}
