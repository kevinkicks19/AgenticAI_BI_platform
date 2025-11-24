"""
Session persistence API routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from database import db

router = APIRouter()

class MessageModel(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    agentId: Optional[str] = None
    agentName: Optional[str] = None

class SessionModel(BaseModel):
    sessionId: str
    agentId: str
    agentName: str
    messages: List[MessageModel]
    startTime: str
    lastActivity: str

@router.post("/api/sessions", response_model=Dict[str, Any])
async def save_session(session: SessionModel):
    """Save a chat session"""
    try:
        session_data = session.dict()
        success = await db.save_session(session_data)
        
        if success:
            return {
                "status": "success",
                "message": "Session saved successfully",
                "sessionId": session.sessionId
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save session")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/sessions/{session_id}", response_model=Dict[str, Any])
async def get_session(session_id: str):
    """Get a session by ID"""
    try:
        session = await db.get_session(session_id)
        
        if session:
            return {
                "status": "success",
                "session": session
            }
        else:
            raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/sessions", response_model=Dict[str, Any])
async def list_sessions(limit: int = 50):
    """List all sessions"""
    try:
        sessions = await db.list_sessions(limit=limit)
        return {
            "status": "success",
            "sessions": sessions,
            "count": len(sessions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/sessions/{session_id}", response_model=Dict[str, Any])
async def delete_session(session_id: str):
    """Delete a session"""
    try:
        success = await db.delete_session(session_id)
        
        if success:
            return {
                "status": "success",
                "message": "Session deleted successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to delete session")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

