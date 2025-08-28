"""
Affine API Routes for Agentic AI BI Platform

This module provides REST API endpoints for Affine integration:
- Document management (BI reports, workflow metadata)
- Business problem tracking
- Workflow template discovery
- Collaboration spaces
"""

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, List, Any, Optional
import json
from affine_service import affine_service
from datetime import datetime

router = APIRouter(prefix="/api/affine", tags=["affine"])

@router.get("/status")
async def get_affine_status():
    """Get Affine integration status and test connection"""
    try:
        status = await affine_service.test_connection()
        return JSONResponse(content=status)
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.post("/documents/bi-report")
async def create_bi_report(request: Request):
    """Create a new BI report document in Affine"""
    try:
        data = await request.json()
        
        # Validate required fields
        required_fields = ["title", "content", "workflow_id", "user_id"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        result = await affine_service.create_bi_report(
            title=data["title"],
            content=data["content"],
            workflow_id=data["workflow_id"],
            user_id=data["user_id"],
            tags=data.get("tags", [])
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.post("/documents/workflow-metadata")
async def store_workflow_metadata(request: Request):
    """Store workflow metadata in Affine"""
    try:
        data = await request.json()
        
        # Validate required fields
        required_fields = ["workflow_id", "name", "description", "category"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        result = await affine_service.store_workflow_metadata(
            workflow_id=data["workflow_id"],
            name=data["name"],
            description=data["description"],
            category=data["category"],
            tags=data.get("tags", []),
            parameters=data.get("parameters", {})
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.post("/documents/business-problem")
async def track_business_problem(request: Request):
    """Track a business problem in Affine"""
    try:
        data = await request.json()
        
        # Validate required fields
        required_fields = ["problem_description", "user_id", "category"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        result = await affine_service.track_business_problem(
            problem_description=data["problem_description"],
            user_id=data["user_id"],
            category=data["category"],
            priority=data.get("priority", "medium"),
            workflow_solution=data.get("workflow_solution")
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.get("/documents/search")
async def search_documents(
    query: str,
    document_type: Optional[str] = None,
    tags: Optional[str] = None,
    limit: int = 20
):
    """Search for documents in Affine workspace"""
    try:
        # Parse tags from comma-separated string
        tag_list = tags.split(",") if tags else None
        
        result = await affine_service.search_documents(
            query=query,
            document_type=document_type,
            tags=tag_list,
            limit=limit
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.get("/workflows/templates")
async def get_workflow_templates(category: Optional[str] = None):
    """Get available workflow templates from Affine"""
    try:
        result = await affine_service.get_workflow_templates(category=category)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.patch("/documents/{document_id}")
async def update_document(document_id: str, request: Request):
    """Update an existing document in Affine"""
    try:
        data = await request.json()
        
        if not data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        result = await affine_service.update_document(
            document_id=document_id,
            updates=data
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.post("/collaboration/spaces")
async def create_collaboration_space(request: Request):
    """Create a collaboration space in Affine"""
    try:
        data = await request.json()
        
        # Validate required fields
        required_fields = ["name", "description"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        result = await affine_service.create_collaboration_space(
            name=data["name"],
            description=data["description"],
            members=data.get("members", []),
            tags=data.get("tags", [])
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.get("/documents/types")
async def get_document_types():
    """Get available document types in Affine workspace"""
    try:
        # Search for documents with different types to discover what's available
        result = await affine_service.search_documents(
            query="",
            limit=100
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Extract unique document types
        documents = result.get("results", [])
        document_types = set()
        
        for doc in documents:
            doc_type = doc.get("properties", {}).get("document_type")
            if doc_type:
                document_types.add(doc_type)
        
        return JSONResponse(content={
            "status": "success",
            "document_types": list(document_types),
            "total_types": len(document_types)
        })
        
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.get("/documents/categories")
async def get_document_categories():
    """Get available document categories in Affine workspace"""
    try:
        # Search for workflow metadata to get categories
        result = await affine_service.get_workflow_templates()
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Extract unique categories
        templates = result.get("templates", [])
        categories = set()
        
        for template in templates:
            category = template.get("properties", {}).get("category")
            if category:
                categories.add(category)
        
        return JSONResponse(content={
            "status": "success",
            "categories": list(categories),
            "total_categories": len(categories)
        })
        
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.get("/health")
async def health_check():
    """Health check endpoint for Affine integration"""
    try:
        enabled = await affine_service.is_enabled()
        if not enabled:
            return JSONResponse(content={
                "status": "disabled",
                "message": "Affine integration not configured",
                "timestamp": "2024-12-19T00:00:00Z"
            })
        
        # Test connection
        connection_status = await affine_service.test_connection()
        
        return JSONResponse(content={
            "status": "healthy",
            "affine_integration": connection_status,
            "timestamp": "2024-12-19T00:00:00Z"
        })
        
    except Exception as e:
        return JSONResponse(
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": "2024-12-19T00:00:00Z"
            },
            status_code=500
        )

@router.post("/documents/workflow-execution")
async def save_workflow_execution(request: Request):
    """Save workflow execution results to Affine"""
    try:
        data = await request.json()
        
        # Validate required fields
        required_fields = ["workflow_id", "workflow_name", "execution_id", "status"]
        for field in required_fields:
            if field not in data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        result = await affine_service.create_document({
            "title": f"Workflow Execution: {data['workflow_name']} - {data['execution_id']}",
            "content": f"""
Workflow Execution Report

Workflow: {data['workflow_name']}
Execution ID: {data['execution_id']}
Status: {data['status']}
Start Time: {data.get('start_time', 'Unknown')}
End Time: {data.get('end_time', 'Unknown')}

Parameters: {json.dumps(data.get('parameters', {}), indent=2)}

Results: {json.dumps(data.get('results', {}), indent=2)}

{f"Error: {data.get('error', '')}" if data.get('error') else ''}
            """.strip(),
            "document_type": "workflow_execution",
            "properties": {
                "workflow_id": data["workflow_id"],
                "execution_id": data["execution_id"],
                "status": data["status"],
                "start_time": data.get("start_time"),
                "end_time": data.get("end_time"),
                "parameters": data.get("parameters", {}),
                "results": data.get("results", {}),
                "error": data.get("error"),
                "created_at": datetime.now().isoformat()
            }
        })
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )
