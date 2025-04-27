from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Optional
from datetime import datetime

from app.api.endpoints.auth import get_current_user, User
from app.models.schemas import ConversationBase, ConversationDetail, ConversationList, ConversationFilter

router = APIRouter(tags=["conversations"])

# Simulated conversation database - in production, use a real database
fake_conversations_db = {
    "conv1": {
        "id": "conv1",
        "title": "Discussion about AI ethics",
        "create_time": datetime(2025, 4, 20, 10, 30),
        "update_time": datetime(2025, 4, 20, 11, 45),
        "messages": [
            {"role": "user", "content": "What are the main ethical concerns with AI?"},
            {"role": "assistant", "content": "The main ethical concerns with AI include bias, privacy, job displacement, security, and control issues..."}
        ]
    },
    "conv2": {
        "id": "conv2",
        "title": "Python programming tips",
        "create_time": datetime(2025, 4, 22, 14, 15),
        "update_time": datetime(2025, 4, 22, 15, 30),
        "messages": [
            {"role": "user", "content": "What are some best practices for Python?"},
            {"role": "assistant", "content": "Some Python best practices include using virtual environments, following PEP 8 style guide..."}
        ]
    }
}


@router.get("/conversations", response_model=ConversationList)
async def list_conversations(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    title_contains: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    List conversations with pagination and filtering
    
    Args:
        page: Page number (starts at 1)
        page_size: Number of items per page
        start_date: Filter by start date
        end_date: Filter by end date
        title_contains: Filter by title containing string
        current_user: Current authenticated user
        
    Returns:
        ConversationList with paginated conversations
    """
    # Apply filters
    filtered_conversations = list(fake_conversations_db.values())
    
    if start_date:
        filtered_conversations = [c for c in filtered_conversations if c["create_time"] >= start_date]
    
    if end_date:
        filtered_conversations = [c for c in filtered_conversations if c["create_time"] <= end_date]
    
    if title_contains:
        filtered_conversations = [c for c in filtered_conversations if title_contains.lower() in c["title"].lower()]
    
    # Sort by update_time (newest first)
    filtered_conversations.sort(key=lambda x: x["update_time"], reverse=True)
    
    # Paginate
    total = len(filtered_conversations)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_conversations = filtered_conversations[start_idx:end_idx]
    
    # Convert to ConversationBase objects
    conversation_bases = [
        ConversationBase(
            id=conv["id"],
            title=conv["title"],
            create_time=conv["create_time"],
            update_time=conv["update_time"]
        ) for conv in paginated_conversations
    ]
    
    return ConversationList(
        conversations=conversation_bases,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str = Path(..., description="Conversation ID"),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed conversation by ID
    
    Args:
        conversation_id: ID of the conversation to retrieve
        current_user: Current authenticated user
        
    Returns:
        ConversationDetail with full conversation data
        
    Raises:
        HTTPException: If conversation not found
    """
    if conversation_id not in fake_conversations_db:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conv = fake_conversations_db[conversation_id]
    
    return ConversationDetail(
        id=conv["id"],
        title=conv["title"],
        create_time=conv["create_time"],
        update_time=conv["update_time"],
        messages=conv["messages"]
    )


@router.post("/conversations/filter", response_model=ConversationList)
async def filter_conversations(
    filter_params: ConversationFilter,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user)
):
    """
    Filter conversations with advanced criteria
    
    Args:
        filter_params: Filter parameters
        page: Page number (starts at 1)
        page_size: Number of items per page
        current_user: Current authenticated user
        
    Returns:
        ConversationList with filtered and paginated conversations
    """
    # Apply filters
    filtered_conversations = list(fake_conversations_db.values())
    
    if filter_params.start_date:
        filtered_conversations = [c for c in filtered_conversations if c["create_time"] >= filter_params.start_date]
    
    if filter_params.end_date:
        filtered_conversations = [c for c in filtered_conversations if c["create_time"] <= filter_params.end_date]
    
    if filter_params.title_contains:
        filtered_conversations = [c for c in filtered_conversations if filter_params.title_contains.lower() in c["title"].lower()]
    
    # Sort by update_time (newest first)
    filtered_conversations.sort(key=lambda x: x["update_time"], reverse=True)
    
    # Paginate
    total = len(filtered_conversations)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_conversations = filtered_conversations[start_idx:end_idx]
    
    # Convert to ConversationBase objects
    conversation_bases = [
        ConversationBase(
            id=conv["id"],
            title=conv["title"],
            create_time=conv["create_time"],
            update_time=conv["update_time"]
        ) for conv in paginated_conversations
    ]
    
    return ConversationList(
        conversations=conversation_bases,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/conversations/search/{query}", response_model=ConversationList)
async def search_conversations(
    query: str = Path(..., description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user)
):
    """
    Search conversations by content
    
    Args:
        query: Search query string
        page: Page number (starts at 1)
        page_size: Number of items per page
        current_user: Current authenticated user
        
    Returns:
        ConversationList with search results
    """
    # Search in both title and message content
    query = query.lower()
    search_results = []
    
    for conv in fake_conversations_db.values():
        # Check title
        if query in conv["title"].lower():
            search_results.append(conv)
            continue
        
        # Check message content
        for message in conv["messages"]:
            if query in message["content"].lower():
                search_results.append(conv)
                break
    
    # Sort by relevance (simple implementation - in production use proper ranking)
    search_results.sort(key=lambda x: x["update_time"], reverse=True)
    
    # Paginate
    total = len(search_results)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_results = search_results[start_idx:end_idx]
    
    # Convert to ConversationBase objects
    conversation_bases = [
        ConversationBase(
            id=conv["id"],
            title=conv["title"],
            create_time=conv["create_time"],
            update_time=conv["update_time"]
        ) for conv in paginated_results
    ]
    
    return ConversationList(
        conversations=conversation_bases,
        total=total,
        page=page,
        page_size=page_size
    )
