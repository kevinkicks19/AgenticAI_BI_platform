import json
import uuid
import requests
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
from mcp_client import N8nMCPClient

class HandoffType(Enum):
    """Types of handoffs available"""
    WORKFLOW_AGENT = "workflow_agent"
    SPECIALIZED_AGENT = "specialized_agent"
    HUMAN_AGENT = "human_agent"
    FALLBACK = "fallback"
    N8N_WORKFLOW = "n8n_workflow"

class HandoffStatus(Enum):
    """Status of handoff operations"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    WORKFLOW_EXECUTING = "workflow_executing"

class HandoffManager:
    """
    Enhanced handoff manager that integrates with n8n workflows and provides intelligent routing.
    """
    
    def __init__(self):
        self.active_handoffs = {}
        self.handoff_history = {}
        self.n8n_workflows_cache = {}
        self.last_workflow_refresh = None
        
        # Only n8n workflows - no predefined specialized agents
        self.specialized_agents = {}
    
    def refresh_n8n_workflows(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Refresh the cache of available n8n workflows.
        
        Args:
            force_refresh: Force refresh even if cache is recent
            
        Returns:
            Dictionary of workflows organized by agent type
        """
        try:
            # Check if we need to refresh (cache older than 5 minutes)
            if (not force_refresh and 
                self.last_workflow_refresh and 
                (datetime.now() - self.last_workflow_refresh).seconds < 300):
                return self.n8n_workflows_cache
            
            # Get workflows via MCP
            mcp_client = N8nMCPClient()
            result = mcp_client.list_workflows()
            
            if result.get("status") == "success":
                workflows = result.get("workflows", [])
                print(f"DEBUG: MCP returned {len(workflows)} workflows")
                print(f"DEBUG: First workflow structure: {workflows[0] if workflows else 'No workflows'}")
                
                # Organize workflows by agent type
                organized_workflows = {}
                print(f"DEBUG: Processing {len(workflows)} workflows from MCP")
                
                for workflow in workflows:
                    workflow_name = workflow.get("name", "").lower()
                    workflow_id = workflow.get("id")
                    
                    print(f"DEBUG: Processing workflow: {workflow.get('name')} (ID: {workflow_id})")
                    print(f"DEBUG: Full workflow data: {workflow}")
                
                # Map workflows to agent types based on name patterns
                assigned_agent = self._map_workflow_to_agent(workflow_name, workflow)
                
                print(f"DEBUG: Workflow '{workflow.get('name')}' mapped to agent: {assigned_agent}")
                
                if assigned_agent:
                    if assigned_agent not in organized_workflows:
                        organized_workflows[assigned_agent] = []
                    
                    webhook_path = self._extract_webhook_path(workflow)
                    print(f"DEBUG: Extracted webhook path: {webhook_path}")
                    
                    organized_workflows[assigned_agent].append({
                        "id": workflow_id,
                        "name": workflow.get("name"),
                        "active": workflow.get("active", False),
                        "description": workflow.get("description", ""),
                        "webhook_path": webhook_path
                    })
                else:
                    print(f"DEBUG: Workflow '{workflow.get('name')}' not mapped to any agent")
                
                # Update cache
                self.n8n_workflows_cache = organized_workflows
                self.last_workflow_refresh = datetime.now()
                
                return organized_workflows
            else:
                print(f"Failed to refresh workflows: {result.get('message', 'Unknown error')}")
                return self.n8n_workflows_cache
                
        except Exception as e:
            print(f"Error refreshing n8n workflows: {e}")
            return self.n8n_workflows_cache
    
    def _map_workflow_to_agent(self, workflow_name: str, workflow: Dict) -> Optional[str]:
        """
        Map a workflow to the most appropriate agent type based on name and description.
        
        Args:
            workflow_name: Lowercase workflow name
            workflow: Full workflow object
            
        Returns:
            Agent type string or None if no match
        """
        # Since we no longer have predefined agents, map based on workflow name patterns
        
        # Check for specific workflow names
        if "gerald" in workflow_name or "handoff" in workflow_name:
            return "data_analysis"  # Default to data analysis for test workflows
        
        # Check for home automation workflows
        if "homeautomation" in workflow_name or "home automation" in workflow_name:
            return "home_automation"
        
        # Check for data analysis workflows
        if any(keyword in workflow_name for keyword in ["data", "analysis", "insights", "metrics", "report"]):
            return "data_analysis"
        
        # Check for document processing workflows
        if any(keyword in workflow_name for keyword in ["document", "process", "extract", "upload"]):
            return "document_processing"
        
        # Check for task management workflows
        if any(keyword in workflow_name for keyword in ["task", "project", "manage", "organize"]):
            return "task_management"
        
        # Check for approval workflows
        if any(keyword in workflow_name for keyword in ["approval", "review", "authorize"]):
            return "approval_workflow"
        
        # Check for report generation workflows
        if any(keyword in workflow_name for keyword in ["report", "generate", "create", "document"]):
            return "report_generation"
        
        return None
    
    def _extract_webhook_path(self, workflow: Dict) -> Optional[str]:
        """Extract webhook path from workflow if available"""
        try:
            print(f"DEBUG: Extracting webhook path from workflow: {workflow.get('name', 'Unknown')}")
            
            # Check if workflow has webhook nodes
            nodes = workflow.get("nodes", [])
            for node in nodes:
                if node.get("type") == "n8n-nodes-base.webhook":
                    webhook_path = node.get("parameters", {}).get("path", "")
                    webhook_id = node.get("webhookId")
                    
                    print(f"DEBUG: Found webhook node - path: {webhook_path}, id: {webhook_id}")
                    
                    if webhook_path:
                        # Handle different webhook URL formats
                        if webhook_path.startswith("http"):
                            return webhook_path
                        elif webhook_path.startswith("/"):
                            return f"https://n8n.casamccartney.link{webhook_path}"
                        else:
                            return f"https://n8n.casamccartney.link/webhook/{webhook_path}"
                    
                    if webhook_id:
                        return f"https://n8n.casamccartney.link/webhook/{webhook_id}"
            
            # For Home Automation workflows, use the known chat webhook
            workflow_name = workflow.get("name", "").lower()
            if "homeautomation" in workflow_name or "home automation" in workflow_name:
                print(f"DEBUG: Using known Home Automation webhook for workflow: {workflow.get('name')}")
                return "https://n8n.casamccartney.link/webhook/chat"
            
            # Default fallback
            print(f"DEBUG: No webhook found, using default path")
            return f"https://n8n.casamccartney.link/webhook/{workflow.get('id', 'default')}"
            
        except Exception as e:
            print(f"DEBUG: Error extracting webhook path: {e}")
            return None
    
    def get_available_agents_with_workflows(self) -> Dict[str, Any]:
        """
        Get all available agents with their associated n8n workflows.
        
        Returns:
            Dictionary of agents with workflow information
        """
        # Refresh workflows
        workflows = self.refresh_n8n_workflows()
        
        # Since we no longer have predefined agents, return workflows organized by type
        agents_with_workflows = {}
        for agent_type, agent_workflows in workflows.items():
            if agent_workflows:  # Only include agent types that have workflows
                # Create agent info from the first workflow
                first_workflow = agent_workflows[0]
                agent_data = {
                    "type": agent_type,
                    "name": f"{agent_type.replace('_', ' ').title()} Agent",
                    "description": f"Specialized in {agent_type.replace('_', ' ')} workflows",
                    "capabilities": ["workflow_execution", "n8n_integration"],
                    "keywords": [agent_type.replace('_', ' ')],
                    "available_workflows": agent_workflows,
                    "workflow_count": len(agent_workflows),
                    "fallback_agent": None
                }
                agents_with_workflows[agent_type] = agent_data
        
        return agents_with_workflows
    
    def should_handoff(self, intent_analysis: Dict[str, Any], confidence_threshold: float = 0.7) -> Optional[str]:
        """
        Enhanced handoff decision logic that considers n8n workflow availability.
        
        Args:
            intent_analysis: Analysis of user intent
            confidence_threshold: Minimum confidence for handoff
            
        Returns:
            Target agent type if handoff should occur, None otherwise
        """
        confidence = intent_analysis.get("confidence", 0.0)
        intent_type = intent_analysis.get("intent", "general_inquiry")
        user_message = intent_analysis.get("user_message", "").lower()
        
        # Check if confidence is high enough
        if confidence < confidence_threshold:
            return None
        
        # Refresh workflows to get current availability
        workflows = self.refresh_n8n_workflows()
        
        # Check for direct workflow requests
        if "workflow" in user_message or "run" in user_message or "execute" in user_message:
            # Check if user mentioned a specific workflow
            for agent_type, agent_workflows in workflows.items():
                for workflow in agent_workflows:
                    if workflow["name"].lower() in user_message:
                        return agent_type
        
        # Map intent types to agent types based on available workflows
        # Since we no longer have predefined agents, we'll map based on workflow availability
        intent_to_agent_mapping = {
            "data_analysis": "data_analysis",
            "home_automation": "home_automation",
            "report_generation": "report_generation", 
            "approval_request": "approval_workflow",
            "document_processing": "document_processing",
            "task_management": "task_management"
        }
        
        target_agent = intent_to_agent_mapping.get(intent_type)
        
        # Check if target agent has available workflows
        if target_agent and target_agent in workflows and workflows[target_agent]:
            return target_agent
        
        # No fallback agents since we only have n8n workflows
        return None
        
        return None
    
    def initiate_handoff(self, session_id: str, user_message: str, intent_analysis: Dict[str, Any], 
                        target_agent_type: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Enhanced handoff initiation with n8n workflow integration.
        
        Args:
            session_id: Current session ID
            user_message: The user's message that triggered the handoff
            intent_analysis: Analysis of user intent
            target_agent_type: Type of specialized agent to handoff to
            context: Additional context for the handoff
            
        Returns:
            Handoff result with new session and agent information
        """
        try:
            # Get available workflows for the target agent
            workflows = self.refresh_n8n_workflows()
            agent_workflows = workflows.get(target_agent_type, [])
            
            # Validate target agent type by checking if it has workflows
            if not agent_workflows:
                return {
                    "success": False,
                    "error": f"No workflows available for agent type: {target_agent_type}",
                    "message": f"No workflows available for agent type: {target_agent_type}"
                }
            
            # Create handoff ID
            handoff_id = str(uuid.uuid4())
            
            # Create agent info from workflow data since we no longer have predefined agents
            agent_info = {
                "name": f"{target_agent_type.replace('_', ' ').title()} Agent",
                "description": f"Specialized in {target_agent_type.replace('_', ' ')} workflows",
                "capabilities": ["workflow_execution", "n8n_integration"],
                "keywords": [target_agent_type.replace('_', ' ')],
                "agent_prompt": f"You are a {target_agent_type.replace('_', ' ')} agent. You help users with {target_agent_type.replace('_', ' ')} related tasks."
            }
            
            # Create new session for specialized agent
            specialized_session_id = f"{session_id}_specialized_{target_agent_type}_{handoff_id}"
            
            # Prepare handoff data
            handoff_data = {
                "handoff_id": handoff_id,
                "original_session_id": session_id,
                "specialized_session_id": specialized_session_id,
                "target_agent_type": target_agent_type,
                "agent_info": agent_info,
                "user_message": user_message,
                "intent_analysis": intent_analysis,
                "context": context or {},
                "status": HandoffStatus.IN_PROGRESS.value,
                "created_at": datetime.now().isoformat(),
                "handoff_type": HandoffType.N8N_WORKFLOW.value if agent_workflows else HandoffType.SPECIALIZED_AGENT.value,
                "available_workflows": agent_workflows,
                "workflow_count": len(agent_workflows)
            }
            
            # Store handoff data
            self.active_handoffs[handoff_id] = handoff_data
            
            # Prepare response for user
            if agent_workflows:
                workflow_names = [w["name"] for w in agent_workflows if w["active"]]
                if workflow_names:
                    handoff_response = {
                        "success": True,
                        "handoff_id": handoff_id,
                        "specialized_session_id": specialized_session_id,
                        "agent_name": agent_info["name"],
                        "agent_description": agent_info["description"],
                        "message": f"I'm transferring you to {agent_info['name']} who has {len(workflow_names)} active workflows available: {', '.join(workflow_names)}",
                        "capabilities": agent_info["capabilities"],
                        "agent_prompt": agent_info["agent_prompt"],
                        "available_workflows": workflow_names,
                        "handoff_type": "n8n_workflow"
                    }
                else:
                    handoff_response = {
                        "success": True,
                        "handoff_id": handoff_id,
                        "specialized_session_id": specialized_session_id,
                        "agent_name": agent_info["name"],
                        "agent_description": agent_info["description"],
                        "message": f"I'm transferring you to {agent_info['name']} who specializes in {agent_info['description'].lower()}. Note: No active workflows are currently available.",
                        "capabilities": agent_info["capabilities"],
                        "agent_prompt": agent_info["agent_prompt"],
                        "available_workflows": [],
                        "handoff_type": "specialized_agent"
                    }
            else:
                handoff_response = {
                    "success": True,
                    "handoff_id": handoff_id,
                    "specialized_session_id": specialized_session_id,
                    "agent_name": agent_info["name"],
                    "agent_description": agent_info["description"],
                    "message": f"I'm transferring you to {agent_info['name']} who specializes in {agent_info['description'].lower()}.",
                    "capabilities": agent_info["capabilities"],
                    "agent_prompt": agent_info["agent_prompt"],
                    "available_workflows": [],
                    "handoff_type": "specialized_agent"
                }
            
            # Automatically trigger Gerald's workflow if this is a data_analysis handoff
            if target_agent_type == "data_analysis":
                try:
                    gerald_webhook_result = self._trigger_gerald_workflow(handoff_id, user_message, context)
                    handoff_response["gerald_workflow_triggered"] = gerald_webhook_result["success"]
                    handoff_response["gerald_workflow_message"] = gerald_webhook_result["message"]
                    
                    # Update handoff data with workflow trigger info
                    handoff_data["gerald_workflow_triggered"] = gerald_webhook_result["success"]
                    handoff_data["gerald_webhook_result"] = gerald_webhook_result
                    
                except Exception as e:
                    print(f"Warning: Failed to trigger Gerald workflow: {e}")
                    handoff_response["gerald_workflow_triggered"] = False
                    handoff_response["gerald_workflow_message"] = f"Failed to trigger workflow: {str(e)}"
            
            # Automatically trigger Home Automation Advisor workflow if this is a home_automation handoff
            elif target_agent_type == "home_automation":
                try:
                    home_automation_result = self._trigger_home_automation_workflow(handoff_id, user_message, context)
                    handoff_response["home_automation_workflow_triggered"] = home_automation_result["success"]
                    handoff_response["home_automation_workflow_message"] = home_automation_result["message"]
                    
                    # Pass through the workflow response and execution status
                    handoff_response["workflow_response"] = home_automation_result.get("workflow_response", "No response from workflow")
                    handoff_response["executed"] = home_automation_result.get("executed", False)
                    
                    # Update handoff data with workflow trigger info
                    handoff_data["home_automation_workflow_triggered"] = home_automation_result["success"]
                    handoff_data["home_automation_webhook_result"] = home_automation_result
                    
                except Exception as e:
                    print(f"Warning: Failed to trigger Home Automation workflow: {e}")
                    handoff_response["home_automation_workflow_triggered"] = False
                    handoff_response["home_automation_workflow_message"] = f"Failed to trigger workflow: {str(e)}"
                    handoff_response["workflow_response"] = f"Error: {str(e)}"
                    handoff_response["executed"] = False
            
            return handoff_response
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to initiate handoff: {str(e)}",
                "message": f"Failed to initiate handoff: {str(e)}"
            }
    
    def _trigger_gerald_workflow(self, handoff_id: str, user_message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Trigger Gerald's workflow via webhook.
        
        Args:
            handoff_id: ID of the handoff
            user_message: User's message that triggered the handoff
            context: Additional context
            
        Returns:
            Webhook trigger result
        """
        try:
            # Prepare data for Gerald's workflow
            workflow_data = {
                "handoff_id": handoff_id,
                "user_message": user_message,
                "timestamp": datetime.now().isoformat(),
                "context": context or {},
                "agent_type": "data_analysis",
                "workflow_trigger": "automatic_handoff"
            }
            
            # Make POST request to Gerald's webhook
            webhook_url = "https://n8n.casamccartney.link/webhook/ca361862-55b2-49a0-a765-ff06b90e416a/chat"
            
            print(f"Triggering Gerald's workflow via webhook: {webhook_url}")
            print(f"Workflow data: {workflow_data}")
            
            response = requests.post(
                webhook_url,
                json=workflow_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    return {
                        "success": True,
                        "message": "Gerald's workflow triggered successfully",
                        "webhook_response": result,
                        "status_code": response.status_code
                    }
                except json.JSONDecodeError:
                    return {
                        "success": True,
                        "message": "Gerald's workflow triggered successfully (no JSON response)",
                        "webhook_response": response.text,
                        "status_code": response.status_code
                    }
            else:
                return {
                    "success": False,
                    "message": f"Failed to trigger Gerald's workflow. Status: {response.status_code}",
                    "webhook_response": response.text,
                    "status_code": response.status_code
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Error triggering Gerald's workflow: {str(e)}",
                "error": str(e)
            }
    
    def _trigger_home_automation_workflow(self, handoff_id: str, user_message: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Trigger the Home Automation Advisor workflow and get the actual response.
        
        Args:
            handoff_id: ID of the handoff
            user_message: User's message that triggered the handoff
            context: Additional context
            
        Returns:
            Workflow execution result with actual response
        """
        try:
            # Prepare data for the Home Automation Advisor workflow
            workflow_data = {
                "message": user_message,
                "sessionId": f"handoff_{handoff_id}",
                "turn": 1,
                "timestamp": datetime.now().isoformat(),
                "context": context or {},
                "agent_type": "home_automation",
                "workflow_trigger": "automatic_handoff"
            }
            
            # The Home Automation Advisor uses a chat trigger, so we need to use the chat endpoint
            # Based on the workflow structure, it likely uses a chat webhook
            chat_url = "https://n8n.casamccartney.link/webhook/chat"
            
            print(f"Triggering Home Automation Advisor workflow via chat: {chat_url}")
            print(f"Workflow data: {workflow_data}")
            
            response = requests.post(
                chat_url,
                json=workflow_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    # Extract the actual workflow response
                    workflow_response = result.get("response", "No response from workflow")
                    return {
                        "success": True,
                        "message": "Home Automation Advisor workflow executed successfully",
                        "workflow_response": workflow_response,
                        "chat_response": result,
                        "status_code": response.status_code,
                        "executed": True
                    }
                except json.JSONDecodeError:
                    # Handle text response
                    workflow_response = response.text
                    return {
                        "success": True,
                        "message": "Home Automation Advisor workflow executed successfully",
                        "workflow_response": workflow_response,
                        "chat_response": response.text,
                        "status_code": response.status_code,
                        "executed": True
                    }
            else:
                return {
                    "success": False,
                    "message": f"Failed to execute Home Automation Advisor workflow. Status: {response.status_code}",
                    "workflow_response": f"Error: Workflow returned status {response.status_code}",
                    "chat_response": response.text,
                    "status_code": response.status_code,
                    "executed": False
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Error executing Home Automation Advisor workflow: {str(e)}",
                "workflow_response": f"Error: {str(e)}",
                "error": str(e),
                "executed": False
            }
    
    def execute_workflow_handoff(self, handoff_id: str, workflow_id: str = None, 
                                user_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Execute a workflow as part of a handoff.
        
        Args:
            handoff_id: ID of the handoff
            workflow_id: Specific workflow to execute (optional)
            user_data: Data to send to the workflow
            
        Returns:
            Execution result
        """
        try:
            if handoff_id not in self.active_handoffs:
                return {
                    "success": False,
                    "error": f"Handoff {handoff_id} not found"
                }
            
            handoff_data = self.active_handoffs[handoff_id]
            target_agent = handoff_data["target_agent_type"]
            
            # Get available workflows for the agent
            workflows = self.refresh_n8n_workflows()
            agent_workflows = workflows.get(target_agent, [])
            
            if not agent_workflows:
                return {
                    "success": False,
                    "error": f"No workflows available for agent {target_agent}"
                }
            
            # If no specific workflow specified, use the first available one
            if not workflow_id:
                active_workflows = [w for w in agent_workflows if w["active"]]
                if active_workflows:
                    workflow_id = active_workflows[0]["id"]
                else:
                    return {
                        "success": False,
                        "error": f"No active workflows available for agent {target_agent}"
                    }
            
            # Find the workflow
            target_workflow = None
            for workflow in agent_workflows:
                if workflow["id"] == workflow_id:
                    target_workflow = workflow
                    break
            
            if not target_workflow:
                return {
                    "success": False,
                    "error": f"Workflow {workflow_id} not found for agent {target_agent}"
                }
            
            # Update handoff status
            handoff_data["status"] = HandoffStatus.WORKFLOW_EXECUTING.value
            handoff_data["executing_workflow"] = {
                "id": workflow_id,
                "name": target_workflow["name"],
                "started_at": datetime.now().isoformat()
            }
            
            # Execute the workflow via MCP
            try:
                mcp_client = N8nMCPClient()
                
                # Prepare data for workflow
                workflow_data = {
                    "message": handoff_data["user_message"],
                    "session_id": handoff_data["specialized_session_id"],
                    "handoff_id": handoff_id,
                    "intent": handoff_data["intent_analysis"].get("intent"),
                    "user_data": user_data or {},
                    "timestamp": datetime.now().isoformat()
                }
                
                # Trigger workflow execution
                if target_workflow.get("webhook_path"):
                    # Use webhook if available
                    webhook_url = f"https://n8n.casamccartney.link/{target_workflow['webhook_path']}"
                    response = requests.post(webhook_url, json=workflow_data, timeout=30)
                    
                    if response.status_code == 200:
                        result = response.json()
                        handoff_data["workflow_result"] = result
                        handoff_data["status"] = HandoffStatus.COMPLETED.value
                        handoff_data["completed_at"] = datetime.now().isoformat()
                        
                        return {
                            "success": True,
                            "workflow_id": workflow_id,
                            "workflow_name": target_workflow["name"],
                            "result": result,
                            "message": f"Workflow '{target_workflow['name']}' executed successfully"
                        }
                    else:
                        raise Exception(f"Workflow execution failed with status {response.status_code}")
                else:
                    # Fallback: use MCP client
                    result = mcp_client.trigger_webhook_workflow(
                        webhook_url=f"https://n8n.casamccartney.link/webhook/{workflow_id}",
                        http_method="POST",
                        data=workflow_data
                    )
                    
                    if result.get("success"):
                        handoff_data["workflow_result"] = result
                        handoff_data["status"] = HandoffStatus.COMPLETED.value
                        handoff_data["completed_at"] = datetime.now().isoformat()
                        
                        return {
                            "success": True,
                            "workflow_id": workflow_id,
                            "workflow_name": target_workflow["name"],
                            "result": result,
                            "message": f"Workflow '{target_workflow['name']}' executed successfully via MCP"
                        }
                    else:
                        raise Exception(f"MCP workflow execution failed: {result.get('message', 'Unknown error')}")
                        
            except Exception as e:
                handoff_data["status"] = HandoffStatus.FAILED.value
                handoff_data["error"] = str(e)
                raise e
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to execute workflow handoff: {str(e)}"
            }
    
    def complete_handoff(self, handoff_id: str, result: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Complete a handoff and return to coordinator agent.
        
        Args:
            handoff_id: ID of the handoff to complete
            result: Result from the specialized agent
            
        Returns:
            Completion result
        """
        try:
            if handoff_id not in self.active_handoffs:
                return {
                    "success": False,
                    "error": f"Handoff {handoff_id} not found"
                }
            
            handoff_data = self.active_handoffs[handoff_id]
            
            # If workflow result exists, use it
            if "workflow_result" in handoff_data:
                result = handoff_data["workflow_result"]
            
            handoff_data["status"] = HandoffStatus.COMPLETED.value
            handoff_data["completed_at"] = datetime.now().isoformat()
            handoff_data["final_result"] = result
            
            # Move to history
            self.handoff_history[handoff_id] = handoff_data
            del self.active_handoffs[handoff_id]
            
            return {
                "success": True,
                "handoff_id": handoff_id,
                "original_session_id": handoff_data["original_session_id"],
                "message": f"Handoff completed. Returning to coordinator agent.",
                "result": result,
                "workflow_executed": "workflow_result" in handoff_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to complete handoff: {str(e)}"
            }
    
    def get_handoff_status(self, handoff_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a specific handoff"""
        if handoff_id in self.active_handoffs:
            return self.active_handoffs[handoff_id]
        elif handoff_id in self.handoff_history:
            return self.handoff_history[handoff_id]
        else:
            return None
    
    def list_active_handoffs(self) -> List[Dict[str, Any]]:
        """List all active handoffs"""
        return list(self.active_handoffs.values())
    
    def get_specialized_agent_info(self, agent_type: str) -> Optional[Dict[str, Any]]:
        """Get information about a specialized agent"""
        workflows = self.refresh_n8n_workflows()
        agent_workflows = workflows.get(agent_type, [])
        
        if agent_workflows:
            return {
                "type": agent_type,
                "name": f"{agent_type.replace('_', ' ').title()} Agent",
                "description": f"Specialized in {agent_type.replace('_', ' ')} workflows",
                "capabilities": ["workflow_execution", "n8n_integration"],
                "keywords": [agent_type.replace('_', ' ')],
                "available_workflows": agent_workflows,
                "workflow_count": len(agent_workflows)
            }
        return None
    
    def list_available_agents(self) -> List[Dict[str, Any]]:
        """List all available specialized agents with workflow information"""
        workflows = self.refresh_n8n_workflows()
        
        agents = []
        for agent_type, agent_workflows in workflows.items():
            if agent_workflows:  # Only include agent types that have workflows
                agents.append({
                    "type": agent_type,
                    "name": f"{agent_type.replace('_', ' ').title()} Agent",
                    "description": f"Specialized in {agent_type.replace('_', ' ')} workflows",
                    "capabilities": ["workflow_execution", "n8n_integration"],
                    "available_workflows": agent_workflows,
                    "workflow_count": len(agent_workflows),
                    "fallback_agent": None
                })
        
        return agents
    
    def prepare_handoff_context(self, session_context: Dict[str, Any], 
                               target_agent_type: str) -> Dict[str, Any]:
        """
        Prepare context for the specialized agent.
        
        Args:
            session_context: Current session context
            target_agent_type: Type of specialized agent
            
        Returns:
            Context prepared for the specialized agent
        """
        workflows = self.refresh_n8n_workflows()
        agent_workflows = workflows.get(target_agent_type, [])
        
        # Create agent info dynamically
        agent_info = {
            "name": f"{target_agent_type.replace('_', ' ').title()} Agent",
            "description": f"Specialized in {target_agent_type.replace('_', ' ')} workflows",
            "capabilities": ["workflow_execution", "n8n_integration"],
            "agent_prompt": f"You are a {target_agent_type.replace('_', ' ')} agent. You help users with {target_agent_type.replace('_', ' ')} related tasks."
        }
        
        return {
            "original_session": session_context,
            "agent_type": target_agent_type,
            "agent_name": agent_info["name"],
            "agent_description": agent_info["description"],
            "agent_capabilities": agent_info["capabilities"],
            "agent_prompt": agent_info["agent_prompt"],
            "available_workflows": agent_workflows,
            "handoff_timestamp": datetime.now().isoformat(),
            "conversation_history": session_context.get("messages", []),
            "user_preferences": session_context.get("user_preferences", {}),
            "project_context": session_context.get("project_context", {})
        }

# Create a global handoff manager instance
handoff_manager = HandoffManager() 