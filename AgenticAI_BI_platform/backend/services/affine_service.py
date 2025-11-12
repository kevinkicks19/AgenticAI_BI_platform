"""
Affine Integration Service for Agentic AI BI Platform

This service provides integration with Affine's REST API to support:
- Document management for BI reports and insights
- Workflow metadata storage and templates
- Business problem tracking and solutions
- Team collaboration and knowledge sharing
"""

import httpx
import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AffineService:
    """
    Service class for integrating with Affine REST API
    """
    
    def __init__(self):
        """Initialize Affine service with configuration"""
        self.base_url = os.getenv("AFFINE_API_URL", "https://app.affine.pro")
        self.api_key = os.getenv("AFFINE_API_KEY")
        self.workspace_id = os.getenv("AFFINE_WORKSPACE_ID")
        
        if not self.api_key:
            logger.warning("AFFINE_API_KEY not set - Affine integration will be disabled")
            self.enabled = False
        else:
            self.enabled = True
            
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Affine-Workspace-Id": self.workspace_id
        } if self.enabled else {}
    
    async def is_enabled(self) -> bool:
        """Check if Affine integration is enabled"""
        return self.enabled
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to Affine API"""
        if not self.enabled:
            return {"status": "disabled", "message": "Affine integration not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/workspaces",
                    headers=self.headers,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return {"status": "connected", "message": "Successfully connected to Affine"}
                else:
                    return {"status": "error", "message": f"API returned status {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error testing Affine connection: {e}")
            return {"status": "error", "message": str(e)}
    
    async def create_bi_report(
        self, 
        title: str, 
        content: str, 
        workflow_id: str,
        user_id: str,
        tags: List[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new BI report document in Affine
        
        Args:
            title: Report title
            content: Report content (can be markdown)
            workflow_id: Associated n8n workflow ID
            user_id: User who created the report
            tags: Optional tags for categorization
        """
        if not self.enabled:
            return {"error": "Affine integration not enabled"}
        
        try:
            document_data = {
                "title": title,
                "content": content,
                "properties": {
                    "workflow_id": workflow_id,
                    "user_id": user_id,
                    "created_at": datetime.utcnow().isoformat(),
                    "document_type": "bi_report",
                    "tags": tags or []
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/documents",
                    headers=self.headers,
                    json=document_data,
                    timeout=30.0
                )
                
                if response.status_code == 201:
                    result = response.json()
                    logger.info(f"Created BI report: {title}")
                    return {
                        "status": "success",
                        "document_id": result.get("id"),
                        "message": "BI report created successfully"
                    }
                else:
                    logger.error(f"Failed to create BI report: {response.status_code}")
                    return {"error": f"Failed to create document: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error creating BI report: {e}")
            return {"error": str(e)}
    
    async def store_workflow_metadata(
        self,
        workflow_id: str,
        name: str,
        description: str,
        category: str,
        tags: List[str] = None,
        parameters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Store workflow metadata in Affine for easy discovery and management
        
        Args:
            workflow_id: n8n workflow ID
            name: Workflow name
            description: Workflow description
            category: Business category (e.g., 'financial_analysis', 'customer_insights')
            tags: Optional tags for filtering
            parameters: Workflow input parameters
        """
        if not self.enabled:
            return {"error": "Affine integration not enabled"}
        
        try:
            metadata = {
                "title": f"Workflow: {name}",
                "content": description,
                "properties": {
                    "workflow_id": workflow_id,
                    "workflow_name": name,
                    "category": category,
                    "tags": tags or [],
                    "parameters": parameters or {},
                    "document_type": "workflow_metadata",
                    "created_at": datetime.utcnow().isoformat(),
                    "status": "active"
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/documents",
                    headers=self.headers,
                    json=metadata,
                    timeout=30.0
                )
                
                if response.status_code == 201:
                    result = response.json()
                    logger.info(f"Stored workflow metadata: {name}")
                    return {
                        "status": "success",
                        "document_id": result.get("id"),
                        "message": "Workflow metadata stored successfully"
                    }
                else:
                    logger.error(f"Failed to store workflow metadata: {response.status_code}")
                    return {"error": f"Failed to store metadata: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error storing workflow metadata: {e}")
            return {"error": str(e)}
    
    async def track_business_problem(
        self,
        problem_description: str,
        user_id: str,
        category: str,
        priority: str = "medium",
        workflow_solution: str = None
    ) -> Dict[str, Any]:
        """
        Track business problems and their solutions in Affine
        
        Args:
            problem_description: Description of the business problem
            user_id: User who reported the problem
            category: Problem category
            priority: Problem priority (low, medium, high, critical)
            workflow_solution: Associated workflow solution if available
        """
        if not self.enabled:
            return {"error": "Affine integration not enabled"}
        
        try:
            problem_data = {
                "title": f"Business Problem: {category}",
                "content": problem_description,
                "properties": {
                    "user_id": user_id,
                    "category": category,
                    "priority": priority,
                    "workflow_solution": workflow_solution,
                    "status": "open",
                    "document_type": "business_problem",
                    "created_at": datetime.utcnow().isoformat(),
                    "tags": [category, priority, "business_problem"]
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/documents",
                    headers=self.headers,
                    json=problem_data,
                    timeout=30.0
                )
                
                if response.status_code == 201:
                    result = response.json()
                    logger.info(f"Tracked business problem: {category}")
                    return {
                        "status": "success",
                        "document_id": result.get("id"),
                        "message": "Business problem tracked successfully"
                    }
                else:
                    logger.error(f"Failed to track business problem: {response.status_code}")
                    return {"error": f"Failed to track problem: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error tracking business problem: {e}")
            return {"error": str(e)}
    
    async def search_documents(
        self,
        query: str,
        document_type: str = None,
        tags: List[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Search for documents in Affine workspace
        
        Args:
            query: Search query text
            document_type: Filter by document type
            tags: Filter by tags
            limit: Maximum number of results
        """
        if not self.enabled:
            return {"error": "Affine integration not enabled"}
        
        try:
            search_params = {
                "query": query,
                "limit": limit
            }
            
            if document_type:
                search_params["document_type"] = document_type
            if tags:
                search_params["tags"] = tags
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/search",
                    headers=self.headers,
                    params=search_params,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    results = response.json()
                    logger.info(f"Search completed: {len(results.get('documents', []))} results")
                    return {
                        "status": "success",
                        "results": results.get("documents", []),
                        "total": results.get("total", 0)
                    }
                else:
                    logger.error(f"Search failed: {response.status_code}")
                    return {"error": f"Search failed: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error searching documents: {e}")
            return {"error": str(e)}
    
    async def get_workflow_templates(self, category: str = None) -> Dict[str, Any]:
        """
        Get available workflow templates from Affine
        
        Args:
            category: Optional category filter
        """
        if not self.enabled:
            return {"error": "Affine integration not enabled"}
        
        try:
            search_params = {
                "document_type": "workflow_metadata",
                "limit": 50
            }
            
            if category:
                search_params["category"] = category
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/search",
                    headers=self.headers,
                    params=search_params,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    results = response.json()
                    templates = results.get("documents", [])
                    logger.info(f"Retrieved {len(templates)} workflow templates")
                    return {
                        "status": "success",
                        "templates": templates,
                        "total": len(templates)
                    }
                else:
                    logger.error(f"Failed to get workflow templates: {response.status_code}")
                    return {"error": f"Failed to get templates: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error getting workflow templates: {e}")
            return {"error": str(e)}
    
    async def update_document(
        self,
        document_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing document in Affine
        
        Args:
            document_id: Document ID to update
            updates: Dictionary of fields to update
        """
        if not self.enabled:
            return {"error": "Affine integration not enabled"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/api/documents/{document_id}",
                    headers=self.headers,
                    json=updates,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Updated document: {document_id}")
                    return {
                        "status": "success",
                        "message": "Document updated successfully"
                    }
                else:
                    logger.error(f"Failed to update document: {response.status_code}")
                    return {"error": f"Failed to update document: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error updating document: {e}")
            return {"error": str(e)}
    
    async def create_collaboration_space(
        self,
        name: str,
        description: str,
        members: List[str] = None,
        tags: List[str] = None
    ) -> Dict[str, Any]:
        """
        Create a collaboration space for team-based workflow management
        
        Args:
            name: Space name
            description: Space description
            members: List of member user IDs
            tags: Optional tags
        """
        if not self.enabled:
            return {"error": "Affine integration not enabled"}
        
        try:
            space_data = {
                "title": f"Collaboration Space: {name}",
                "content": description,
                "properties": {
                    "space_name": name,
                    "members": members or [],
                    "document_type": "collaboration_space",
                    "created_at": datetime.utcnow().isoformat(),
                    "tags": tags or []
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/documents",
                    headers=self.headers,
                    json=space_data,
                    timeout=30.0
                )
                
                if response.status_code == 201:
                    result = response.json()
                    logger.info(f"Created collaboration space: {name}")
                    return {
                        "status": "success",
                        "space_id": result.get("id"),
                        "message": "Collaboration space created successfully"
                    }
                else:
                    logger.error(f"Failed to create collaboration space: {response.status_code}")
                    return {"error": f"Failed to create space: {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Error creating collaboration space: {e}")
            return {"error": str(e)}

# Create a singleton instance
affine_service = AffineService()
