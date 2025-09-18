from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
import requests
import prioritization_manager
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
import time
import logging

# Import models
from models import (
    BaseResponse, ErrorResponse, ChatRequest, ChatResponse, ChatMessage,
    WorkflowResponse, WorkflowRegistrationRequest, WorkflowInfo, WorkflowStatus,
    DocumentUploadResponse, UserProfile, ApprovalRequest, ApprovalResponse,
    GuardrailCheckRequest, GuardrailCheckResponse, GuardrailStatusResponse,
    DataHubContextRequest, DataHubContextResponse, AffineDocumentRequest,
    AffineDocumentResponse, HealthCheckResponse, SystemMetrics, MetricsResponse,
    AgentType, MessageRole, ChatStatus
)

# Import existing routes
from approval_routes import router as approval_router
from enhanced_agent_coordinator import EnhancedAgentCoordinator
from handoff_routes import router as handoff_router
from guardrails import guardrails_manager
from affine_routes import router as affine_router
from file_upload_routes import router as upload_router
from affine_service import affine_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create enhanced agent coordinator instance
agent_coordinator = EnhancedAgentCoordinator()

# Application metadata
APP_TITLE = "Agentic AI BI Platform"
APP_DESCRIPTION = """
## Agentic AI Business Intelligence Platform

A comprehensive AI-powered business intelligence platform that combines document processing, 
natural language querying, and intelligent workflow automation.

### Features

* **AI Chat Interface**: Interactive chat with AI coordinators and specialized agents
* **Document Processing**: Upload and analyze business documents (PDF, DOCX, XLSX, CSV, TXT)
* **Workflow Automation**: n8n integration for automated business processes
* **Guardrails System**: Built-in safety and compliance checks
* **DataHub Integration**: Enterprise data catalog and lineage tracking
* **Affine Integration**: Document creation and management
* **Real-time Analytics**: System metrics and performance monitoring

### API Endpoints

The API is organized into several main categories:

* **Chat**: AI conversation and coordination
* **Workflows**: n8n workflow management and execution
* **Documents**: File upload and processing
* **Approvals**: Workflow approval system
* **Guardrails**: Safety and compliance checking
* **DataHub**: Enterprise data context and search
* **Affine**: Document creation and management
* **System**: Health checks and metrics

### Authentication

Currently, the API operates without authentication for development purposes. 
In production, implement proper authentication and authorization.

### Rate Limiting

API requests are subject to rate limiting to ensure system stability.
"""
APP_VERSION = "1.0.0"
APP_CONTACT = {
    "name": "Agentic AI BI Platform Support",
    "email": "support@agenticai.com",
}
APP_LICENSE_INFO = {
    "name": "MIT License",
    "url": "https://opensource.org/licenses/MIT",
}

# Create FastAPI application with enhanced metadata
app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    contact=APP_CONTACT,
    license_info=APP_LICENSE_INFO,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for the frontend
static_dir = "/app/static"
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    # Also mount assets at the root level for the frontend
    assets_dir = "/app/static/assets"
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    # Mount vite.svg at root level
    vite_svg_path = "/app/static/vite.svg"
    if os.path.exists(vite_svg_path):
        @app.get("/vite.svg")
        async def get_vite_svg():
            return FileResponse(vite_svg_path)
    logger.info(f"✅ Static files mounted from {static_dir}")
else:
    logger.warning(f"⚠️  Static directory {static_dir} not found")

# Include existing routers
app.include_router(approval_router, prefix="/api/approval", tags=["Approvals"])
app.include_router(affine_router, tags=["Affine"])
app.include_router(upload_router, tags=["Documents"])
app.include_router(handoff_router, tags=["Handoffs"])

# Application startup time for uptime calculation
startup_time = time.time()

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=APP_TITLE,
        version=APP_VERSION,
        description=APP_DESCRIPTION,
        routes=app.routes,
    )
    
    # Add custom tags
    openapi_schema["tags"] = [
        {
            "name": "Chat",
            "description": "AI conversation and coordination endpoints"
        },
        {
            "name": "Workflows",
            "description": "n8n workflow management and execution"
        },
        {
            "name": "Documents",
            "description": "File upload and document processing"
        },
        {
            "name": "Approvals",
            "description": "Workflow approval system"
        },
        {
            "name": "Guardrails",
            "description": "Safety and compliance checking"
        },
        {
            "name": "DataHub",
            "description": "Enterprise data context and search"
        },
        {
            "name": "Affine",
            "description": "Document creation and management"
        },
        {
            "name": "System",
            "description": "Health checks, metrics, and system information"
        }
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Health Check Endpoints
@app.get("/health", response_model=HealthCheckResponse, tags=["System"])
async def health_check():
    """
    Check the health status of the application and its dependencies.
    
    Returns:
        HealthCheckResponse: Current health status and system information
    """
    try:
        uptime = time.time() - startup_time
        
        # Check dependencies
        dependencies = {
            "agent_coordinator": "healthy",
            "guardrails": "healthy",
            "static_files": "healthy" if os.path.exists(static_dir) else "unhealthy"
        }
        
        return HealthCheckResponse(
            status="healthy",
            version=APP_VERSION,
            uptime=uptime,
            dependencies=dependencies
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/api/health", response_model=HealthCheckResponse, tags=["System"])
async def api_health_check():
    """API-specific health check endpoint."""
    return await health_check()

# Metrics Endpoint
@app.get("/api/metrics", response_model=MetricsResponse, tags=["System"])
async def get_system_metrics():
    """
    Get system performance metrics and statistics.
    
    Returns:
        MetricsResponse: Current system metrics and performance data
    """
    try:
        # Get workflow information
        workflow_info = agent_coordinator.get_available_workflows()
        
        # Calculate metrics (these would be real metrics in production)
        metrics = SystemMetrics(
            active_workflows=len([w for w in workflow_info.get("n8n_workflows", []) if w.get("status") == "active"]),
            documents_processed=1247,  # This would come from a database
            chat_sessions=89,  # This would come from session tracking
            success_rate=94.2,
            average_response_time=1.2,
            total_requests=15420,  # This would come from request tracking
            error_rate=2.1
        )
        
        return MetricsResponse(
            status="success",
            message="Metrics retrieved successfully",
            metrics=metrics
        )
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve metrics")

# Enhanced Chat API
@app.post("/api/chat", response_model=ChatResponse, tags=["Chat"])
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint with enhanced workflow integration.
    
    Args:
        request: Chat request containing message and session information
        
    Returns:
        ChatResponse: AI response with workflow integration details
    """
    try:
        logger.info(f"Chat request: session={request.session_id}, turn={request.turn}, message='{request.message[:100]}...'")
        
        # Process message through the enhanced agent coordinator
        result = await agent_coordinator.process_bi_request(
            request.message, 
            request.session_id, 
            request.turn
        )
        
        # Create response
        response = ChatResponse(
            status="success",
            message="Message processed successfully",
            response=result.get("response", "I've processed your request."),
            session_id=request.session_id,
            turn=request.turn + 1,
            current_agent=result.get("current_agent"),
            agent_info=result.get("agent_info"),
            violations=result.get("violations"),
            workflow_trigger=result.get("mcp_action_executed", False),
            workflow_id=result.get("mcp_result", {}).get("workflow_id"),
            workflow_name=result.get("mcp_result", {}).get("workflow_name"),
            parameters=result.get("mcp_result", {}).get("parameters", {})
        )
        
        logger.info(f"Chat response generated successfully for session {request.session_id}")
        return response
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat request: {str(e)}"
        )

@app.get("/api/chat", response_model=ChatResponse, tags=["Chat"])
async def chat_init():
    """
    Initialize a new chat session.
    
    Returns:
        ChatResponse: Initial welcome message and session information
    """
    return ChatResponse(
        status="success",
        message="Chat session initialized",
        response="Hello! I'm your AI Business Intelligence Coordinator. I can help you analyze data, execute workflows, and solve business problems. What would you like to work on today?",
        session_id="default",
        turn=0,
        current_agent="triage"
    )

# Enhanced Workflow API
@app.get("/api/chat/workflows", response_model=WorkflowResponse, tags=["Workflows"])
async def get_available_workflows():
    """
    Get available workflows for the chat interface.
    
    Returns:
        WorkflowResponse: List of available workflows and sequences
    """
    try:
        # Get workflows from the enhanced agent coordinator
        workflow_info = agent_coordinator.get_available_workflows()
        
        return WorkflowResponse(
            status="success",
            message="Workflows retrieved successfully",
            n8n_workflows=workflow_info.get("n8n_workflows", []),
            workflow_sequences=workflow_info.get("workflow_sequences", {}),
            workflow_registry=workflow_info.get("workflow_registry", {}),
            total_n8n_workflows=workflow_info.get("total_n8n_workflows", 0)
        )
    except Exception as e:
        logger.error(f"Error fetching workflows: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve workflows: {str(e)}"
        )

@app.post("/api/bi/register-workflow", response_model=BaseResponse, tags=["Workflows"])
async def register_workflow(request: WorkflowRegistrationRequest):
    """
    Register a new workflow ID for an agent type.
    
    Args:
        request: Workflow registration request
        
    Returns:
        BaseResponse: Registration status
    """
    try:
        success = agent_coordinator.register_workflow(
            request.agent_type.value, 
            request.workflow_id
        )
        
        if success:
            return BaseResponse(
                status="success",
                message=f"Workflow {request.workflow_id} registered for agent type {request.agent_type.value}"
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to register workflow for agent type {request.agent_type.value}"
            )
    except Exception as e:
        logger.error(f"Error registering workflow: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error registering workflow: {str(e)}"
        )

# Enhanced Guardrails API
@app.get("/api/guardrails/status", response_model=GuardrailStatusResponse, tags=["Guardrails"])
async def get_guardrails_status():
    """
    Get current guardrails status and violations summary.
    
    Returns:
        GuardrailStatusResponse: Current guardrails status and violation summary
    """
    try:
        violations_summary = guardrails_manager.get_violations_summary()
        
        return GuardrailStatusResponse(
            status="success",
            message="Guardrails status retrieved successfully",
            total_violations=violations_summary.get("total_violations", 0),
            violations_by_type=violations_summary.get("violations_by_type", {}),
            recent_violations=violations_summary.get("recent_violations", [])
        )
    except Exception as e:
        logger.error(f"Error getting guardrails status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get guardrails status: {str(e)}"
        )

@app.post("/api/guardrails/check", response_model=GuardrailCheckResponse, tags=["Guardrails"])
async def check_guardrails(request: GuardrailCheckRequest):
    """
    Check if a message violates any guardrails.
    
    Args:
        request: Guardrail check request
        
    Returns:
        GuardrailCheckResponse: Guardrail check results
    """
    try:
        result = guardrails_manager.check_guardrails(
            request.message, 
            request.context or {}
        )
        
        return GuardrailCheckResponse(
            status="success",
            message="Guardrails check completed",
            violations=result.get("violations", []),
            passed=result.get("passed", True)
        )
    except Exception as e:
        logger.error(f"Error checking guardrails: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check guardrails: {str(e)}"
        )

# Enhanced DataHub API
@app.get("/api/datahub/context/{entity_urn}", response_model=DataHubContextResponse, tags=["DataHub"])
async def get_datahub_context(entity_urn: str):
    """
    Get DataHub context for an entity.
    
    Args:
        entity_urn: DataHub entity URN
        
    Returns:
        DataHubContextResponse: DataHub context information
    """
    try:
        context = await agent_coordinator.get_datahub_context(entity_urn=entity_urn)
        
        return DataHubContextResponse(
            status="success",
            message="DataHub context retrieved successfully",
            entity_urn=entity_urn,
            context=context
        )
    except Exception as e:
        logger.error(f"Error getting DataHub context: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get DataHub context: {str(e)}"
        )

@app.get("/api/datahub/search", response_model=DataHubContextResponse, tags=["DataHub"])
async def search_datahub(query: Optional[str] = None):
    """
    Search DataHub for entities.
    
    Args:
        query: Search query string
        
    Returns:
        DataHubContextResponse: Search results
    """
    try:
        context = await agent_coordinator.get_datahub_context(query=query)
        
        return DataHubContextResponse(
            status="success",
            message="DataHub search completed",
            query=query,
            context=context,
            search_results=context.get("search_results", [])
        )
    except Exception as e:
        logger.error(f"Error searching DataHub: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search DataHub: {str(e)}"
        )

# Enhanced Affine API
@app.post("/api/inception/create-document", response_model=AffineDocumentResponse, tags=["Affine"])
async def create_inception_document(request: AffineDocumentRequest):
    """
    Create an inception document in Affine from n8n workflow.
    
    Args:
        request: Affine document creation request
        
    Returns:
        AffineDocumentResponse: Created document information
    """
    try:
        logger.info(f"Creating inception document for session {request.session_id}")
        
        # Create document title
        title = f"Inception Report - Session {request.session_id} - {request.timestamp.strftime('%Y-%m-%d')}"
        
        # Prepare tags for categorization
        tags = ["inception", "business-problem", "dad-methodology", f"workflow-{request.workflow_id}"]
        
        # Create the document in Affine
        result = await affine_service.create_bi_report(
            title=title,
            content=request.content,
            workflow_id=request.workflow_id,
            user_id=f"session-{request.session_id}",
            tags=tags
        )
        
        if "error" in result:
            logger.error(f"Error creating document in Affine: {result['error']}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create document in Affine: {result['error']}"
            )
        
        logger.info(f"✅ Document created successfully in Affine: {result.get('document_id')}")
        
        return AffineDocumentResponse(
            status="success",
            message="Inception document created successfully in Affine",
            document_id=result.get("document_id"),
            affine_url=result.get("affine_url"),
            session_id=request.session_id,
            workflow_id=request.workflow_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in create_inception_document: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create inception document: {str(e)}"
        )

# Legacy endpoints for backward compatibility
@app.get("/api/data", tags=["Legacy"])
async def get_data():
    """Legacy data endpoint for backward compatibility."""
    data = {
        "sales": 1000,
        "customers": 500,
        "products": 200
    }
    return data

@app.get("/api/agents", tags=["Legacy"])
async def get_agents():
    """Legacy agents endpoint for backward compatibility."""
    # Dummy criteria values for demonstration
    criteria_values = {
        "impact": 0.7,
        "urgency": 0.8,
        "effort": 0.3,
        "confidence": 0.9,
        "risk": 0.2,
    }
    agents = [
        {
            "id": 1, 
            "name": "Agent 1", 
            "status": "active", 
            "priority": prioritization_manager.calculate_priority_score(
                "agent_action_1", 
                criteria_values, 
                prioritization_manager.criteria_weights
            )
        },
        {
            "id": 2, 
            "name": "Agent 2", 
            "status": "idle", 
            "priority": prioritization_manager.calculate_priority_score(
                "agent_action_2", 
                criteria_values, 
                prioritization_manager.criteria_weights
            )
        }
    ]
    return agents

@app.get("/api/user", response_model=UserProfile, tags=["Legacy"])
async def get_user_profile():
    """Get user profile information."""
    return UserProfile(
        user_id="user_123",
        username="demo_user",
        role="admin",
        notification_preferences={"email": True, "sms": False},
        default_workflow="https://bmccartn.app.n8n.cloud/webhook/b3ddae7d-fffe-4e50-b242-744e822f7b58/chat",
        persistence_parameters={"session_timeout": 3600, "persist_conversation": True},
        llm_model_preferences={"model": "gpt-4", "temperature": 0.7}
    )

# Root endpoint
@app.get("/", tags=["System"])
async def root():
    """
    Root endpoint that serves the frontend or returns API information.
    
    Returns:
        FileResponse or dict: Frontend index.html or API information
    """
    # Try to serve the frontend index.html file
    index_path = "/app/static/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    else:
        return {
            "message": "Welcome to AgenticAI BI Platform API",
            "version": APP_VERSION,
            "docs": "/docs",
            "redoc": "/redoc",
            "health": "/health",
            "frontend": "not found"
        }

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content=ErrorResponse(
            status="error",
            message="Resource not found",
            error_code="NOT_FOUND",
            details={"path": str(request.url)}
        ).dict()
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            status="error",
            message="Internal server error",
            error_code="INTERNAL_ERROR",
            details={"error": str(exc)}
        ).dict()
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=5000,
        log_level="info"
    )
