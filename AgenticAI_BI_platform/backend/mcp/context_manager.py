from typing import Dict, Any, Optional
import redis.asyncio as redis
import json
from datetime import datetime
from pydantic import BaseModel
import pickle

class ContextManager:
    def __init__(self, redis_url: str):
        self.redis_client = redis.from_url(redis_url)
        self.context_ttl = 3600  # 1 hour TTL for context

    async def store_context(self, session_id: str, context_data: Dict[str, Any]) -> None:
        """Store context data in Redis with TTL"""
        context_key = f"context:{session_id}"
        
        # Add timestamp to context
        context_data["last_updated"] = datetime.now().isoformat()
        
        # Serialize context data
        serialized_data = pickle.dumps(context_data)
        
        # Store in Redis with TTL
        await self.redis_client.set(
            context_key,
            serialized_data,
            ex=self.context_ttl
        )

    async def get_context(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve context data from Redis"""
        context_key = f"context:{session_id}"
        
        # Get context data
        serialized_data = await self.redis_client.get(context_key)
        
        if not serialized_data:
            return None
            
        # Deserialize and return
        return pickle.loads(serialized_data)

    async def update_context(self, session_id: str, updates: Dict[str, Any]) -> None:
        """Update specific fields in the context"""
        current_context = await self.get_context(session_id)
        
        if current_context:
            # Update the context with new data
            current_context.update(updates)
            current_context["last_updated"] = datetime.now().isoformat()
            
            # Store updated context
            await self.store_context(session_id, current_context)

    async def delete_context(self, session_id: str) -> None:
        """Delete context data from Redis"""
        context_key = f"context:{session_id}"
        await self.redis_client.delete(context_key)

    async def extend_context_ttl(self, session_id: str) -> None:
        """Extend the TTL of the context"""
        context_key = f"context:{session_id}"
        await self.redis_client.expire(context_key, self.context_ttl)

    async def store_conversation_history(self, session_id: str, messages: list) -> None:
        """Store conversation history separately from main context"""
        history_key = f"history:{session_id}"
        
        # Serialize messages
        serialized_messages = pickle.dumps(messages)
        
        # Store in Redis with TTL
        await self.redis_client.set(
            history_key,
            serialized_messages,
            ex=self.context_ttl
        )

    async def get_conversation_history(self, session_id: str) -> Optional[list]:
        """Retrieve conversation history"""
        history_key = f"history:{session_id}"
        
        # Get history data
        serialized_data = await self.redis_client.get(history_key)
        
        if not serialized_data:
            return None
            
        # Deserialize and return
        return pickle.loads(serialized_data)

    async def append_to_conversation_history(self, session_id: str, message: Dict[str, Any]) -> None:
        """Append a new message to the conversation history"""
        current_history = await self.get_conversation_history(session_id) or []
        
        # Add timestamp to message
        message["timestamp"] = datetime.now().isoformat()
        
        # Append new message
        current_history.append(message)
        
        # Store updated history
        await self.store_conversation_history(session_id, current_history) 