from fastapi import APIRouter, HTTPException, Request, Body
from handoff_manager import handoff_manager
from agent_coordinator import coordinator
from datetime import datetime
import requests
import json

router = APIRouter()

@router.post("/api/handoff/initiate")
async def initiate_handoff(request: Request):
    """Initiate a handoff to a specialized agent"""
    try:
        data = await request.json()
        session_id = data.get("session_id")
        user_message = data.get("user_message")
        intent_analysis = data.get("intent_analysis", {})
        target_agent_type = data.get("target_agent_type")
        context = data.get("context", {})
        
        if not all([session_id, user_message, target_agent_type]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        result = handoff_manager.initiate_handoff(
            session_id=session_id,
            user_message=user_message,
            intent_analysis=intent_analysis,
            target_agent_type=target_agent_type,
            context=context
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/handoff/complete")
async def complete_handoff(request: Request):
    """Complete a handoff and return to coordinator"""
    try:
        data = await request.json()
        handoff_id = data.get("handoff_id")
        result = data.get("result")
        
        if not handoff_id:
            raise HTTPException(status_code=400, detail="Missing handoff_id")
        
        completion_result = handoff_manager.complete_handoff(handoff_id, result)
        return completion_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/handoff/workflow-guidance")
async def get_workflow_guidance(request: Request):
    """Get guidance for a specific workflow from the coordinator"""
    try:
        data = await request.json()
        workflow_id = data.get("workflow_id")
        user_message = data.get("message", "")
        session_context = data.get("session_context", {})
        
        if not workflow_id:
            return {"status": "error", "message": "workflow_id is required"}
        
        print(f"DEBUG: Getting guidance for workflow {workflow_id} via coordinator")
        
        # Use the coordinator to provide workflow guidance instead of execution
        guidance_result = coordinator.get_workflow_guidance(
            workflow_id=workflow_id,
            user_message=user_message,
            session_context=session_context
        )
        
        print(f"DEBUG: Workflow guidance result: {guidance_result}")
        
        if guidance_result.get("success"):
            return {
                "status": "success",
                "message": "Workflow guidance provided successfully",
                "guidance_result": guidance_result,
                "workflow_id": workflow_id
            }
        else:
            return {
                "status": "error",
                "message": guidance_result.get("message", "Failed to provide workflow guidance"),
                "error": guidance_result.get("error"),
                "workflow_id": workflow_id
            }
            
    except Exception as e:
        print(f"ERROR: Failed to execute workflow: {e}")
        import traceback
        print(f"ERROR: Full traceback: {traceback.format_exc()}")
        return {"status": "error", "message": f"Failed to execute workflow: {str(e)}"}

@router.get("/api/handoff/workflow-status/{workflow_id}")
async def get_workflow_status(workflow_id: str):
    """Get the execution status of a specific workflow"""
    try:
        print(f"DEBUG: Getting status for workflow {workflow_id}")
        
        # Use the coordinator to get workflow status via MCP
        status_result = coordinator.get_workflow_execution_status(workflow_id)
        
        print(f"DEBUG: Workflow status result: {status_result}")
        
        return {
            "status": "success",
            "workflow_id": workflow_id,
            "workflow_status": status_result
        }
        
    except Exception as e:
        print(f"ERROR: Failed to get workflow status: {e}")
        return {"status": "error", "message": f"Failed to get workflow status: {str(e)}"}

@router.get("/api/handoff/status/{handoff_id}")
async def get_handoff_status(handoff_id: str):
    """Get the status of a specific handoff"""
    try:
        status = handoff_manager.get_handoff_status(handoff_id)
        if not status:
            raise HTTPException(status_code=404, detail="Handoff not found")
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/handoff/active")
async def list_active_handoffs():
    """List all active handoffs"""
    try:
        handoffs = handoff_manager.list_active_handoffs()
        return {"handoffs": handoffs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/handoff/agents")
async def list_available_agents():
    """List all available specialized agents with workflow information"""
    try:
        agents = handoff_manager.list_available_agents()
        return {"agents": agents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/handoff/agents/{agent_type}")
async def get_agent_info(agent_type: str):
    """Get information about a specific agent"""
    try:
        agent_info = handoff_manager.get_specialized_agent_info(agent_type)
        if not agent_info:
            raise HTTPException(status_code=404, detail="Agent not found")
        return agent_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/handoff/check")
async def check_handoff_needed(request: Request):
    """Check if a handoff should occur based on intent analysis"""
    try:
        data = await request.json()
        intent_analysis = data.get("intent_analysis", {})
        confidence_threshold = data.get("confidence_threshold", 0.7)
        
        if not intent_analysis:
            raise HTTPException(status_code=400, detail="Missing intent_analysis")
        
        target_agent_type = handoff_manager.should_handoff(intent_analysis, confidence_threshold)
        return {
            "should_handoff": target_agent_type is not None,
            "target_agent_type": target_agent_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/handoff/agents-with-workflows")
async def get_agents_with_workflows():
    """Get all available agents with their associated n8n workflows"""
    try:
        agents_with_workflows = handoff_manager.get_available_agents_with_workflows()
        return {"agents": agents_with_workflows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/handoff/refresh-workflows")
async def refresh_workflows():
    """Refresh the n8n workflow cache"""
    try:
        result = handoff_manager.refresh_n8n_workflows()
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/handoff/execute-workflow")
async def execute_workflow_directly(request: Request):
    """Execute a workflow directly via the coordinator using MCP"""
    try:
        data = await request.json()
        workflow_id = data.get("workflow_id")
        user_message = data.get("message", "")
        session_context = data.get("session_context", {})
        
        if not workflow_id:
            return {"status": "error", "message": "workflow_id is required"}
        
        print(f"DEBUG: Executing workflow {workflow_id} directly via coordinator")
        
        # Use the coordinator to execute the workflow via MCP
        execution_result = coordinator.execute_workflow_via_mcp(
            workflow_id=workflow_id,
            user_message=user_message,
            session_context=session_context
        )
        
        print(f"DEBUG: Workflow execution result: {execution_result}")
        
        if execution_result.get("success"):
            return {
                "status": "success",
                "message": "Workflow executed successfully",
                "execution_result": execution_result,
                "workflow_id": workflow_id
            }
        else:
            return {
                "status": "error",
                "message": execution_result.get("message", "Workflow execution failed"),
                "error": execution_result.get("error"),
                "workflow_id": workflow_id
            }
            
    except Exception as e:
        print(f"ERROR: Failed to execute workflow: {e}")
        import traceback
        print(f"ERROR: Full traceback: {traceback.format_exc()}")
        return {"status": "error", "message": f"Failed to execute workflow: {str(e)}"}

@router.post("/api/handoff/chat/home-automation")
async def chat_with_home_automation(request: dict):
    """Chat directly with the Home Automation Advisor workflow"""
    try:
        user_message = request.get("message", "")
        session_id = request.get("session_id", "")
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Prepare data for the Home Automation Advisor workflow
        workflow_data = {
            "message": user_message,
            "sessionId": session_id,
            "turn": 1,  # You can increment this for conversation tracking
            "timestamp": datetime.now().isoformat()
        }
        
        # The workflow expects a chat message format
        chat_url = "https://n8n.casamccartney.link/webhook/chat"
        
        print(f"Chatting with Home Automation Advisor: {user_message}")
        print(f"Chat URL: {chat_url}")
        
        response = requests.post(
            chat_url,
            json=workflow_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            try:
                result = response.json()
                return {
                    "success": True,
                    "response": result.get("response", "No response from workflow"),
                    "session_id": result.get("session_id", session_id),
                    "turn": result.get("turn", 1),
                    "workflow_status": "success"
                }
            except json.JSONDecodeError:
                return {
                    "success": True,
                    "response": response.text,
                    "session_id": session_id,
                    "turn": 1,
                    "workflow_status": "success_text"
                }
        else:
            return {
                "success": False,
                "error": f"Workflow returned status {response.status_code}",
                "response": response.text,
                "session_id": session_id
            }
            
    except Exception as e:
        print(f"Error in home automation chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/handoff/workflows")
async def get_workflows():
    """Get all workflows organized by agent type"""
    try:
        result = handoff_manager.refresh_n8n_workflows()
        
        # Transform the result to match frontend expectations
        workflows = []
        print(f"DEBUG: Transforming {len(result)} agent types to frontend format")
        
        for agent_type, agent_workflows in result.items():
            print(f"DEBUG: Processing agent type: {agent_type} with {len(agent_workflows)} workflows")
            for workflow in agent_workflows:
                workflow_data = {
                    "id": workflow.get("id"),
                    "name": workflow.get("name"),
                    "description": workflow.get("description", ""),
                    "agent_type": agent_type,
                    "webhook_url": workflow.get("webhook_path"),
                    "active": workflow.get("active", False)
                }
                print(f"DEBUG: Workflow '{workflow.get('name')}' -> ID: {workflow_data['id']}, Webhook: {workflow_data['webhook_url']}")
                workflows.append(workflow_data)
        
        print(f"DEBUG: Returning {len(workflows)} workflows to frontend")
        return {"status": "success", "workflows": workflows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 