"""
Simple SQLite database for session persistence
"""
import aiosqlite
import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path

# Database file path
DB_PATH = Path(__file__).parent / "sessions.db"

class SessionDB:
    """Simple session database using SQLite"""
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or str(DB_PATH)
        self._initialized = False
    
    async def initialize(self):
        """Initialize database and create tables"""
        if self._initialized:
            return
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    agent_id TEXT NOT NULL,
                    agent_name TEXT NOT NULL,
                    messages TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    last_activity TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            await db.commit()
        
        self._initialized = True
    
    async def save_session(self, session_data: Dict[str, Any]) -> bool:
        """Save a session to the database"""
        await self.initialize()
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                # Convert messages to JSON string
                messages_json = json.dumps([
                    {
                        "id": msg.get("id"),
                        "role": msg.get("role"),
                        "content": msg.get("content"),
                        "timestamp": msg.get("timestamp"),
                        "agentId": msg.get("agentId"),
                        "agentName": msg.get("agentName")
                    }
                    for msg in session_data.get("messages", [])
                ], default=str)
                
                # Convert dates to ISO strings
                start_time = session_data.get("startTime")
                last_activity = session_data.get("lastActivity")
                
                if isinstance(start_time, datetime):
                    start_time = start_time.isoformat()
                elif isinstance(start_time, str):
                    pass  # Already a string
                else:
                    start_time = datetime.now().isoformat()
                
                if isinstance(last_activity, datetime):
                    last_activity = last_activity.isoformat()
                elif isinstance(last_activity, str):
                    pass  # Already a string
                else:
                    last_activity = datetime.now().isoformat()
                
                now = datetime.now().isoformat()
                
                await db.execute("""
                    INSERT OR REPLACE INTO sessions 
                    (session_id, agent_id, agent_name, messages, start_time, last_activity, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 
                        COALESCE((SELECT created_at FROM sessions WHERE session_id = ?), ?),
                        ?)
                """, (
                    session_data.get("sessionId"),
                    session_data.get("agentId"),
                    session_data.get("agentName"),
                    messages_json,
                    start_time,
                    last_activity,
                    session_data.get("sessionId"),  # For COALESCE
                    now,  # created_at if new
                    now   # updated_at
                ))
                await db.commit()
                return True
        except Exception as e:
            print(f"Error saving session: {e}")
            return False
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a session by ID"""
        await self.initialize()
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(
                    "SELECT * FROM sessions WHERE session_id = ?",
                    (session_id,)
                ) as cursor:
                    row = await cursor.fetchone()
                    if not row:
                        return None
                    
                    # Parse messages from JSON
                    messages = json.loads(row["messages"])
                    # Convert timestamp strings back to Date objects (as ISO strings for JSON)
                    
                    return {
                        "sessionId": row["session_id"],
                        "agentId": row["agent_id"],
                        "agentName": row["agent_name"],
                        "messages": messages,
                        "startTime": row["start_time"],
                        "lastActivity": row["last_activity"],
                        "createdAt": row["created_at"],
                        "updatedAt": row["updated_at"]
                    }
        except Exception as e:
            print(f"Error getting session: {e}")
            return None
    
    async def list_sessions(self, limit: int = 50) -> List[Dict[str, Any]]:
        """List all sessions, ordered by last activity"""
        await self.initialize()
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(
                    "SELECT * FROM sessions ORDER BY last_activity DESC LIMIT ?",
                    (limit,)
                ) as cursor:
                    rows = await cursor.fetchall()
                    
                    sessions = []
                    for row in rows:
                        messages = json.loads(row["messages"])
                        sessions.append({
                            "sessionId": row["session_id"],
                            "agentId": row["agent_id"],
                            "agentName": row["agent_name"],
                            "messageCount": len(messages),
                            "startTime": row["start_time"],
                            "lastActivity": row["last_activity"],
                            "createdAt": row["created_at"],
                            "updatedAt": row["updated_at"]
                        })
                    
                    return sessions
        except Exception as e:
            print(f"Error listing sessions: {e}")
            return []
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        await self.initialize()
        
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    "DELETE FROM sessions WHERE session_id = ?",
                    (session_id,)
                )
                await db.commit()
                return True
        except Exception as e:
            print(f"Error deleting session: {e}")
            return False

# Global database instance
db = SessionDB()

