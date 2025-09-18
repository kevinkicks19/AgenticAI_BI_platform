from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import requests
import prioritization_manager
import json
import os
from datetime import datetime
from approval_routes import router as approval_router
# Import the enhanced agent coordinator with DataHub integration
from enhanced_agent_coordinator import EnhancedAgentCoordinator

# Create enhanced agent coordinator instance
agent_coordinator = EnhancedAgentCoordinator()
from handoff_routes import router as handoff_router

# Import guardrails manager
from guardrails import guardrails_manager

app = FastAPI(title="AgenticAI BI Platform")

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
    print(f"✅ Static files mounted from {static_dir}")
else:
    print(f"⚠️  Static directory {static_dir} not found")

# Include the approval routes
app.include_router(approval_router, prefix="/api/approval")

# Import and include Affine routes
from affine_routes import router as affine_router
app.include_router(affine_router)

# Import and include file upload routes
from file_upload_routes import router as upload_router
app.include_router(upload_router)

# Import Affine service for inception documents
from affine_service import affine_service

# Chat API routes using the real agent coordinator
@app.post("/api/chat")
async def chat_endpoint(request: Request):
    """Main chat endpoint with enhanced workflow integration"""
    try:
        data = await request.json()
        message = data.get("message", "")
        session_id = data.get("session_id", "default")
        turn = data.get("turn", 0)
        
        print(f"Chat request: session={session_id}, turn={turn}, message='{message}'")
        
        # Process message through the enhanced agent coordinator
        result = await agent_coordinator.process_bi_request(message, session_id, turn)
        
        # Enhance response for frontend integration
        enhanced_result = {
            **result,
            "workflow_trigger": result.get("mcp_action_executed", False),
            "workflow_id": result.get("mcp_result", {}).get("workflow_id"),
            "workflow_name": result.get("mcp_result", {}).get("workflow_name"),
            "parameters": result.get("mcp_result", {}).get("parameters", {}),
            "output": result.get("response", "I've processed your request."),
            "session_id": session_id,
            "turn": turn + 1
        }
        
        print(f"Enhanced result: {enhanced_result}")
        return JSONResponse(content=enhanced_result)
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return JSONResponse(
            content={
                "error": str(e), 
                "status": "error",
                "output": "Sorry, I encountered an error processing your request. Please try again.",
                "session_id": data.get("session_id", "default"),
                "turn": data.get("turn", 0)
            }, 
            status_code=500
        )

@app.get("/api/chat")
async def chat_init():
    """Initialize a new chat session"""
    return {
        "status": "ready",
        "message": "Hello! I'm your AI Business Intelligence Coordinator. I can help you analyze data, execute workflows, and solve business problems. What would you like to work on today?",
        "session_id": "default",
        "current_agent": "triage"
    }

@app.get("/api/chat/workflows")
async def get_available_workflows():
    """Get available workflows for the chat interface"""
    try:
        # Get workflows from the enhanced agent coordinator
        workflow_info = agent_coordinator.get_available_workflows()
        
        return {
            "status": "success",
            "n8n_workflows": workflow_info.get("n8n_workflows", []),
            "workflow_sequences": workflow_info.get("workflow_sequences", {}),
            "workflow_registry": workflow_info.get("workflow_registry", {}),
            "total_n8n_workflows": workflow_info.get("total_n8n_workflows", 0)
        }
    except Exception as e:
        print(f"Error fetching workflows: {e}")
        return {
            "status": "error",
            "message": str(e),
            "n8n_workflows": [],
            "workflow_sequences": {},
            "workflow_registry": {},
            "total_n8n_workflows": 0
        }

# Mount the handoff routes
app.include_router(handoff_router)

# Enhanced BI Workflow API endpoints
@app.get("/api/bi/workflow-sequences")
async def get_workflow_sequences():
    """Get available BI workflow sequences"""
    try:
        workflow_info = agent_coordinator.get_available_workflows()
        return {
            "status": "success",
            "workflow_sequences": workflow_info.get("workflow_sequences", {}),
            "workflow_registry": workflow_info.get("workflow_registry", {})
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "workflow_sequences": {},
            "workflow_registry": {}
        }

@app.post("/api/bi/register-workflow")
async def register_workflow(request: Request):
    """Register a new workflow ID for an agent type"""
    try:
        data = await request.json()
        agent_type = data.get("agent_type")
        workflow_id = data.get("workflow_id")
        
        if not agent_type or not workflow_id:
            return JSONResponse(
                status_code=400,
                content={"error": "agent_type and workflow_id are required"}
            )
        
        success = agent_coordinator.register_workflow(agent_type, workflow_id)
        
        if success:
            return {
                "status": "success",
                "message": f"Workflow {workflow_id} registered for agent type {agent_type}"
            }
        else:
            return JSONResponse(
                status_code=400,
                content={"error": f"Failed to register workflow for agent type {agent_type}"}
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/datahub/context/{entity_urn}")
async def get_datahub_context(entity_urn: str):
    """Get DataHub context for an entity"""
    try:
        context = await agent_coordinator.get_datahub_context(entity_urn=entity_urn)
        return {
            "status": "success",
            "entity_urn": entity_urn,
            "context": context
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/datahub/search")
async def search_datahub(query: str = None):
    """Search DataHub for entities"""
    try:
        context = await agent_coordinator.get_datahub_context(query=query)
        return {
            "status": "success",
            "query": query,
            "results": context.get("search_results", [])
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

def call_n8n_workflow(url, data):
    """Makes a POST request to the given n8n workflow URL."""
    try:
        print("\n=== N8N Request Details ===")
        print("URL:", url)
        print("Headers:", {
            'Content-Type': 'application/json'
        })
        print("Request Body:", json.dumps(data, indent=2))
        print("========================\n")
        
        response = requests.post(url, json=data)
        print("\n=== N8N Response Details ===")
        print("Status Code:", response.status_code)
        print("Response Headers:", dict(response.headers))
        print("Response Body:", response.text)
        print("===========================\n")
        
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calling n8n workflow: {e}")
        # Return a default response when n8n is not available
        return {
            "output": "I apologize, but I'm having trouble connecting to my workflow system. Could you please try again in a moment?",
            "turn": data.get('turn', 0)  # Include turn in response
        }

@app.get("/")
async def root():
    # Try to serve the frontend index.html file
    index_path = "/app/static/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    else:
        return {"message": "Welcome to AgenticAI BI Platform API", "frontend": "not found"}

@app.get("/api/data")
async def get_data():
    data = {
        "sales": 1000,
        "customers": 500,
        "products": 200
    }
    return data

@app.get("/api/agents")
async def get_agents():
    # Dummy criteria values for demonstration
    criteria_values = {
        "impact": 0.7,
        "urgency": 0.8,
        "effort": 0.3,
        "confidence": 0.9,
        "risk": 0.2,
    }
    agents = [
        {"id": 1, "name": "Agent 1", "status": "active", "priority": prioritization_manager.calculate_priority_score("agent_action_1", criteria_values, prioritization_manager.criteria_weights)},
        {"id": 2, "name": "Agent 2", "status": "idle", "priority": prioritization_manager.calculate_priority_score("agent_action_2", criteria_values, prioritization_manager.criteria_weights)}
    ]
    return agents

@app.get("/api/user")
async def get_user_profile():
    # Return a dummy user profile
    dummy_user_profile = {
        "user_id": "user_123",
        "username": "demo_user",
        "role": "admin",
        "notification_preferences": { "email": True, "sms": False },
        "default_workflow": "https://bmccartn.app.n8n.cloud/webhook/b3ddae7d-fffe-4e50-b242-744e822f7b58/chat",
        "persistence_parameters": { "session_timeout": 3600, "persist_conversation": True },
        "llm_model_preferences": { "model": "gpt-4", "temperature": 0.7 }
    }
    return dummy_user_profile

@app.post("/api/triggerN8n")
@app.get("/api/triggerN8n")
async def trigger_n8n(request: Request):
    data = await request.json()
    url = data.get("url")
    if not url:
        return JSONResponse(
            status_code=400,
            content={"error": "URL is required"}
        )
    result = call_n8n_workflow(url, data)
    return {"result": result}

@app.post("/api/chat/approval")
async def handle_approval(request: Request):
    data = await request.json()
    session_id = data.get('sessionId')
    approved = data.get('approved')
    
    print("\n=== Received Approval Request ===")
    print("Session ID:", session_id)
    print("Approved:", approved)
    print("==============================\n")
    
    # Replace this URL with your actual n8n workflow webhook URL for approvals
    n8n_webhook_url = "https://bmccartn.app.n8n.cloud/webhook-test/1ca71fb5-6b71-4a82-9376-a5105df7a345"
    
    try:
        result = call_n8n_workflow(n8n_webhook_url, {
            'body': {
                'type': 'approval',
                'sessionId': session_id,
                'approved': approved
            }
        })
        print("\n=== N8N Approval Response ===")
        print("Response:", json.dumps(result, indent=2))
        print("===========================\n")
        return result
    except Exception as e:
        print(f"Error in handle_approval: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Guardrails endpoints
@app.get("/api/guardrails/status")
async def get_guardrails_status():
    """Get current guardrails status and violations summary"""
    return guardrails_manager.get_violations_summary()

@app.post("/api/guardrails/check")
async def check_guardrails(request: Request):
    """Check if a message violates any guardrails"""
    data = await request.json()
    message = data.get("message", "")
    context = data.get("context", {})
    
    result = guardrails_manager.check_guardrails(message, context)
    return result

@app.post("/api/guardrails/reset")
async def reset_guardrails():
    """Reset guardrails violation tracking"""
    guardrails_manager.reset_violations()
    return {"status": "success", "message": "Guardrails violations reset"}

# Inception Document Management
@app.post("/api/inception/create-document")
async def create_inception_document(request: Request):
    """Create an inception document in Affine from n8n workflow"""
    try:
        data = await request.json()
        
        # Extract data from n8n workflow
        content = data.get("content", "")
        session_id = data.get("session_id", "default")
        workflow_id = data.get("workflow_id", "unknown")
        timestamp = data.get("timestamp", datetime.now().isoformat())
        
        print(f"\n=== Creating Inception Document ===")
        print(f"Session ID: {session_id}")
        print(f"Workflow ID: {workflow_id}")
        print(f"Timestamp: {timestamp}")
        print(f"Content Length: {len(content)} characters")
        print("=====================================\n")
        
        # Create document title
        title = f"Inception Report - Session {session_id} - {timestamp[:10]}"
        
        # Prepare tags for categorization
        tags = ["inception", "business-problem", "dad-methodology", f"workflow-{workflow_id}"]
        
        # Create the document in Affine
        result = await affine_service.create_bi_report(
            title=title,
            content=content,
            workflow_id=workflow_id,
            user_id=f"session-{session_id}",
            tags=tags
        )
        
        if "error" in result:
            print(f"Error creating document in Affine: {result['error']}")
            return JSONResponse(
                status_code=500,
                content={
                    "error": f"Failed to create document in Affine: {result['error']}",
                    "session_id": session_id,
                    "workflow_id": workflow_id
                }
            )
        
        print(f"✅ Document created successfully in Affine")
        print(f"Document ID: {result.get('document_id', 'unknown')}")
        print(f"Affine URL: {result.get('affine_url', 'unknown')}")
        
        return JSONResponse(content={
            "status": "success",
            "message": "Inception document created successfully in Affine",
            "document_id": result.get("document_id"),
            "affine_url": result.get("affine_url"),
            "session_id": session_id,
            "workflow_id": workflow_id,
            "timestamp": timestamp
        })
        
    except Exception as e:
        print(f"Error in create_inception_document: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": f"Failed to create inception document: {str(e)}",
                "session_id": data.get("session_id", "unknown"),
                "workflow_id": data.get("workflow_id", "unknown")
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)