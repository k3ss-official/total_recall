from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Body
from typing import List, Dict, Any
import uuid
import asyncio
import json
import csv
import io

from app.api.endpoints.auth import get_current_user, User
from app.models.schemas import ExportFormat, ExportRequest, ExportResponse, ProcessingStatus

router = APIRouter(tags=["export"])

# Simulated export database - in production, use a real database
export_tasks = {}
export_files = {}


async def export_conversations_task(task_id: str, conversation_ids: List[str], format: ExportFormat, include_metadata: bool):
    """
    Background task to export conversations
    
    Args:
        task_id: Task ID
        conversation_ids: List of conversation IDs to export
        format: Export format (JSON, CSV, TXT)
        include_metadata: Whether to include metadata in export
    """
    # Simulated conversation database - in production, fetch from real database
    fake_conversations_db = {
        "conv1": {
            "id": "conv1",
            "title": "Discussion about AI ethics",
            "create_time": "2025-04-20T10:30:00",
            "update_time": "2025-04-20T11:45:00",
            "messages": [
                {"role": "user", "content": "What are the main ethical concerns with AI?"},
                {"role": "assistant", "content": "The main ethical concerns with AI include bias, privacy, job displacement, security, and control issues..."}
            ]
        },
        "conv2": {
            "id": "conv2",
            "title": "Python programming tips",
            "create_time": "2025-04-22T14:15:00",
            "update_time": "2025-04-22T15:30:00",
            "messages": [
                {"role": "user", "content": "What are some best practices for Python?"},
                {"role": "assistant", "content": "Some Python best practices include using virtual environments, following PEP 8 style guide..."}
            ]
        }
    }
    
    # Update task status
    export_tasks[task_id] = {
        "status": ProcessingStatus.PROCESSING,
        "progress": 0.0,
        "message": "Starting export"
    }
    
    # Filter conversations to export
    conversations_to_export = {
        conv_id: fake_conversations_db[conv_id]
        for conv_id in conversation_ids
        if conv_id in fake_conversations_db
    }
    
    # Simulate processing time
    await asyncio.sleep(2)
    
    # Update progress
    export_tasks[task_id]["progress"] = 0.5
    export_tasks[task_id]["message"] = "Formatting data"
    
    # Format data based on requested format
    if format == ExportFormat.JSON:
        # JSON export
        export_data = []
        for conv_id, conv in conversations_to_export.items():
            export_item = {
                "id": conv["id"],
                "title": conv["title"],
                "messages": [
                    {
                        "role": msg["role"],
                        "content": msg["content"]
                    }
                    for msg in conv["messages"]
                ]
            }
            
            if include_metadata:
                export_item["create_time"] = conv["create_time"]
                export_item["update_time"] = conv["update_time"]
            
            export_data.append(export_item)
        
        # Convert to JSON string
        export_content = json.dumps(export_data, indent=2)
    
    elif format == ExportFormat.CSV:
        # CSV export
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        header = ["Conversation ID", "Title", "Role", "Content"]
        if include_metadata:
            header.extend(["Create Time", "Update Time"])
        writer.writerow(header)
        
        # Write data
        for conv_id, conv in conversations_to_export.items():
            for msg in conv["messages"]:
                row = [conv["id"], conv["title"], msg["role"], msg["content"]]
                if include_metadata:
                    row.extend([conv["create_time"], conv["update_time"]])
                writer.writerow(row)
        
        export_content = output.getvalue()
    
    else:  # TXT format
        # TXT export
        export_content = ""
        for conv_id, conv in conversations_to_export.items():
            export_content += f"Conversation: {conv['title']}\n"
            if include_metadata:
                export_content += f"ID: {conv['id']}\n"
                export_content += f"Created: {conv['create_time']}\n"
                export_content += f"Updated: {conv['update_time']}\n"
            export_content += "=" * 50 + "\n\n"
            
            for msg in conv["messages"]:
                export_content += f"{msg['role'].upper()}: {msg['content']}\n\n"
            
            export_content += "\n" + "=" * 50 + "\n\n"
    
    # Store export file
    file_id = f"export_{task_id}"
    export_files[file_id] = {
        "content": export_content,
        "format": format.value
    }
    
    # Update task status
    export_tasks[task_id] = {
        "status": ProcessingStatus.COMPLETED,
        "progress": 1.0,
        "message": "Export completed",
        "file_id": file_id
    }


@router.post("/export", response_model=ExportResponse)
async def export_conversations(
    export_request: ExportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Export conversations in specified format
    
    Args:
        export_request: Export request with conversation IDs and format
        background_tasks: FastAPI background tasks
        current_user: Current authenticated user
        
    Returns:
        ExportResponse with export ID and download URL
    """
    # Create a new export task
    task_id = str(uuid.uuid4())
    
    # Initialize task
    export_tasks[task_id] = {
        "status": ProcessingStatus.PENDING,
        "progress": 0.0,
        "message": "Task initialized"
    }
    
    # Start background export
    background_tasks.add_task(
        export_conversations_task,
        task_id=task_id,
        conversation_ids=export_request.conversation_ids,
        format=export_request.format,
        include_metadata=export_request.include_metadata
    )
    
    # Generate download URL
    download_url = f"/api/export/download/{task_id}"
    
    return ExportResponse(
        export_id=task_id,
        download_url=download_url
    )


@router.get("/export/status/{export_id}")
async def get_export_status(
    export_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get status of an export task
    
    Args:
        export_id: Export task ID
        current_user: Current authenticated user
        
    Returns:
        Export task status
        
    Raises:
        HTTPException: If export task not found
    """
    if export_id not in export_tasks:
        raise HTTPException(status_code=404, detail="Export task not found")
    
    return export_tasks[export_id]


@router.get("/export/download/{export_id}")
async def download_export(
    export_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Download exported file
    
    Args:
        export_id: Export task ID
        current_user: Current authenticated user
        
    Returns:
        Exported file content
        
    Raises:
        HTTPException: If export task not found or not completed
    """
    if export_id not in export_tasks:
        raise HTTPException(status_code=404, detail="Export task not found")
    
    task = export_tasks[export_id]
    
    if task["status"] != ProcessingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Export not yet completed")
    
    if "file_id" not in task or task["file_id"] not in export_files:
        raise HTTPException(status_code=404, detail="Export file not found")
    
    file_info = export_files[task["file_id"]]
    
    # In a real implementation, this would return a FileResponse
    # For this example, we'll just return the content with appropriate headers
    return {
        "content": file_info["content"],
        "format": file_info["format"],
        "filename": f"export_{export_id}.{file_info['format']}"
    }
