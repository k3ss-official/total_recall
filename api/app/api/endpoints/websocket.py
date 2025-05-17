from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
import json
import asyncio

from app.models.schemas import WebSocketMessage

router = APIRouter(tags=["websocket"])

# Store active connections
active_connections: Dict[str, WebSocket] = {}


async def send_progress_update(client_id: str, event: str, data: Dict[str, Any]):
    """
    Send progress update to client
    
    Args:
        client_id: Client ID
        event: Event name
        data: Event data
    """
    if client_id in active_connections:
        message = WebSocketMessage(event=event, data=data)
        await active_connections[client_id].send_text(json.dumps(message.dict()))


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for real-time updates
    
    Args:
        websocket: WebSocket connection
        client_id: Client ID
    """
    await websocket.accept()
    active_connections[client_id] = websocket
    
    try:
        # Send initial connection confirmation
        await send_progress_update(
            client_id=client_id,
            event="connection_established",
            data={"message": "Connected to Total Recall WebSocket"}
        )
        
        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                
                # Handle ping messages to keep connection alive
                if message.get("event") == "ping":
                    await send_progress_update(
                        client_id=client_id,
                        event="pong",
                        data={"timestamp": message.get("data", {}).get("timestamp")}
                    )
            except json.JSONDecodeError:
                # Ignore invalid JSON
                pass
            
    except WebSocketDisconnect:
        # Remove connection when client disconnects
        if client_id in active_connections:
            del active_connections[client_id]
    except Exception as e:
        # Handle other exceptions
        if client_id in active_connections:
            try:
                await send_progress_update(
                    client_id=client_id,
                    event="error",
                    data={"message": f"Error: {str(e)}"}
                )
            except:
                pass
            
            del active_connections[client_id]


# Function to broadcast message to all clients
async def broadcast_message(event: str, data: Dict[str, Any]):
    """
    Broadcast message to all connected clients
    
    Args:
        event: Event name
        data: Event data
    """
    disconnected_clients = []
    
    for client_id, connection in active_connections.items():
        try:
            message = WebSocketMessage(event=event, data=data)
            await connection.send_text(json.dumps(message.dict()))
        except:
            disconnected_clients.append(client_id)
    
    # Clean up disconnected clients
    for client_id in disconnected_clients:
        if client_id in active_connections:
            del active_connections[client_id]
