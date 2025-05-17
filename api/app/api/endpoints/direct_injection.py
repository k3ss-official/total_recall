from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any
import asyncio

from app.api.endpoints.auth import get_current_user, User
from app.models.schemas import InjectionConfig

router = APIRouter(tags=["direct_injection"])


@router.post("/direct-inject")
async def direct_inject_memory(
    conversation_ids: List[str] = Body(..., description="List of conversation IDs to inject"),
    config: InjectionConfig = Body(InjectionConfig(), description="Injection configuration"),
    current_user: User = Depends(get_current_user)
):
    """
    Directly inject conversations into ChatGPT memory without background task
    
    This endpoint is for immediate injection when background processing is not needed.
    It blocks until the injection is complete.
    
    Args:
        conversation_ids: List of conversation IDs to inject
        config: Injection configuration
        current_user: Current authenticated user
        
    Returns:
        Injection result
        
    Raises:
        HTTPException: If injection fails
    """
    # Simulated conversation database - in production, fetch from real database
    fake_conversations_db = {
        "conv1": {
            "id": "conv1",
            "title": "Discussion about AI ethics",
            "messages": [
                {"role": "user", "content": "What are the main ethical concerns with AI?"},
                {"role": "assistant", "content": "The main ethical concerns with AI include bias, privacy, job displacement, security, and control issues..."}
            ]
        },
        "conv2": {
            "id": "conv2",
            "title": "Python programming tips",
            "messages": [
                {"role": "user", "content": "What are some best practices for Python?"},
                {"role": "assistant", "content": "Some Python best practices include using virtual environments, following PEP 8 style guide..."}
            ]
        }
    }
    
    # Filter conversations to inject
    conversations_to_inject = {
        conv_id: fake_conversations_db[conv_id]
        for conv_id in conversation_ids
        if conv_id in fake_conversations_db
    }
    
    if not conversations_to_inject:
        raise HTTPException(status_code=404, detail="No valid conversations found")
    
    successful = 0
    failed = 0
    failures = []
    
    # Process each conversation
    for conv_id, conv in conversations_to_inject.items():
        # Format conversation for injection
        formatted_conversation = {
            "title": conv["title"] if config.include_titles else None,
            "messages": conv["messages"]
        }
        
        # Simulate API call to inject memory
        try:
            # Simulate processing time
            await asyncio.sleep(1)
            
            # Simulate success (90% chance)
            if conv_id != "conv2":  # Simulate failure for conv2
                successful += 1
            else:
                failed += 1
                failures.append({"id": conv_id, "reason": "API rate limit exceeded"})
        except Exception as e:
            failed += 1
            failures.append({"id": conv_id, "reason": str(e)})
    
    # Return results
    return {
        "success": failed == 0,
        "total": len(conversations_to_inject),
        "successful": successful,
        "failed": failed,
        "failures": failures if failures else None
    }


@router.post("/direct-inject/single/{conversation_id}")
async def direct_inject_single_conversation(
    conversation_id: str,
    config: InjectionConfig = Body(InjectionConfig(), description="Injection configuration"),
    current_user: User = Depends(get_current_user)
):
    """
    Directly inject a single conversation into ChatGPT memory
    
    Args:
        conversation_id: Conversation ID to inject
        config: Injection configuration
        current_user: Current authenticated user
        
    Returns:
        Injection result
        
    Raises:
        HTTPException: If conversation not found or injection fails
    """
    # Simulated conversation database - in production, fetch from real database
    fake_conversations_db = {
        "conv1": {
            "id": "conv1",
            "title": "Discussion about AI ethics",
            "messages": [
                {"role": "user", "content": "What are the main ethical concerns with AI?"},
                {"role": "assistant", "content": "The main ethical concerns with AI include bias, privacy, job displacement, security, and control issues..."}
            ]
        },
        "conv2": {
            "id": "conv2",
            "title": "Python programming tips",
            "messages": [
                {"role": "user", "content": "What are some best practices for Python?"},
                {"role": "assistant", "content": "Some Python best practices include using virtual environments, following PEP 8 style guide..."}
            ]
        }
    }
    
    if conversation_id not in fake_conversations_db:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conv = fake_conversations_db[conversation_id]
    
    # Format conversation for injection
    formatted_conversation = {
        "title": conv["title"] if config.include_titles else None,
        "messages": conv["messages"]
    }
    
    # Simulate API call to inject memory
    try:
        # Simulate processing time
        await asyncio.sleep(1)
        
        # Simulate success (90% chance)
        if conversation_id != "conv2":  # Simulate failure for conv2
            return {"success": True, "message": "Conversation injected successfully"}
        else:
            raise HTTPException(status_code=429, detail="API rate limit exceeded")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Injection failed: {str(e)}")
