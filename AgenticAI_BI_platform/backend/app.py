from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
import prioritization_manager
import json
from approval_routes import router as approval_router
from mcp.agent_coordinator import router as agent_router

app = FastAPI(title="AgenticAI BI Platform")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the approval routes
app.include_router(approval_router, prefix="/api/approval")

# Mount the agent coordinator routes
app.include_router(agent_router)

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
    return {"message": "Welcome to AgenticAI BI Platform API"}

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

if __name__ == "__main__":
    app.run(debug=True)