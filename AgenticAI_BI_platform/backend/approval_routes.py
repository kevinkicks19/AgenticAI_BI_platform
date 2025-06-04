from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import redis.asyncio as redis
import json
import os

router = APIRouter()

# Redis connection
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url)

class ChatMessage(BaseModel):
    sessionId: str
    action: str
    chatInput: str

class ApprovalRequest(BaseModel):
    requestId: str
    message: str
    options: List[str]
    created_at: datetime = datetime.now()
    status: str = "pending"
    session_id: Optional[str] = None

# In-memory store for pending requests (we'll move this to Redis in production)
pending_requests = {}

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@router.get("/pending")
async def get_pending_approval():
    """Get the next pending approval request"""
    if not pending_requests:
        return None
    oldest_request = min(
        (req for req in pending_requests.values() if req["status"] == "pending"),
        key=lambda x: x["created_at"],
        default=None
    )
    if oldest_request:
        return oldest_request
    return None

@router.get("/{request_id}")
async def submit_approval_response(request_id: str, response: str):
    """Submit a response for an approval request"""
    if request_id not in pending_requests:
        raise HTTPException(status_code=404, detail="Request not found")
    request = pending_requests[request_id]
    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    request["status"] = "completed"
    request["response"] = response
    request["responded_at"] = datetime.now()
    await redis_client.set(
        f"approval:{request_id}",
        json.dumps(request, default=str),
        ex=3600
    )
    return {"status": "success", "message": "Response recorded"}

@router.post("/create")
async def create_approval_request(messages: List[ChatMessage]):
    """Create a new approval request (this is what n8n will call)"""
    if not messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    message = messages[0]
    request_id = str(uuid.uuid4())
    request = ApprovalRequest(
        requestId=request_id,
        message=f"Please approve or reject this action: {message.chatInput}",
        options=["Approve", "Reject"],
        session_id=message.sessionId
    )
    pending_requests[request_id] = request.dict()
    await redis_client.set(
        f"approval:{request_id}",
        json.dumps(request.dict(), default=str),
        ex=3600
    )
    return {
        "status": "success",
        "request_id": request_id,
        "message": "Approval request created",
        "session_id": message.sessionId
    } 