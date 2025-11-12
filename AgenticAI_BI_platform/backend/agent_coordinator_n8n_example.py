"""
Example: Agent Coordinator with Full N8N MCP Access

This example shows how to integrate the enhanced N8nMCPClient
into your agent coordinator for complete n8n workflow management.
"""

import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from openai import OpenAI
from mcp_client import N8nMCPClient, n8n_list_workflows, n8n_health_check

load_dotenv()

class N8nEnabledAgentCoordinator:
    """
    Agent Coordinator with full N8N MCP-style access.
    
    This coordinator can:
    - List and discover available n8n workflows
    - Execute workflows via webhooks
    - Monitor workflow executions
    - Create and manage workflows dynamically
    - Provide health checks
    """
    
    def __init__(self):
        # Initialize OpenAI client
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Initialize N8N client with MCP-equivalent methods
        self.n8n_client = N8nMCPClient()
        
        # Session management
        self.session_contexts = {}
        
        # Workflow cache for performance
        self.workflow_cache = {}
        self.last_cache_update = None
        
    def initialize(self) -> Dict[str, Any]:
        """Initialize the coordinator and check n8n connectivity"""
        print("🚀 Initializing Agent Coordinator with N8N MCP Access...")
        
        # Check n8n health
        health = self.n8n_client.health_check()
        
        if health.get("status") == "healthy":
            print(f"✅ N8N is healthy: {health.get('message')}")
            print(f"   API URL: {health.get('api_url')}")
            print(f"   Workflows available: {health.get('workflows_count')}")
            
            # Load workflows into cache
            self._refresh_workflow_cache()
            
            return {
                "status": "initialized",
                "n8n_healthy": True,
                "workflows_loaded": len(self.workflow_cache),
                "health": health
            }
        else:
            print(f"❌ N8N health check failed: {health.get('message')}")
            return {
                "status": "initialized_with_warnings",
                "n8n_healthy": False,
                "error": health.get("message")
            }
    
    def _refresh_workflow_cache(self):
        """Refresh the workflow cache"""
        result = self.n8n_client.list_workflows()
        
        if result.get("status") == "success":
            self.workflow_cache = {
                wf["id"]: wf for wf in result.get("workflows", [])
            }
            self.last_cache_update = datetime.now()
            print(f"📋 Loaded {len(self.workflow_cache)} workflows into cache")
        else:
            print(f"⚠️ Failed to refresh workflow cache: {result.get('message')}")
    
    def list_available_workflows(self, include_inactive: bool = False) -> List[Dict]:
        """List available n8n workflows"""
        result = self.n8n_client.list_workflows()
        
        if result.get("status") != "success":
            print(f"Error listing workflows: {result.get('message')}")
            return []
        
        workflows = result.get("workflows", [])
        
        if not include_inactive:
            workflows = [wf for wf in workflows if wf.get("active", False)]
        
        return workflows
    
    def get_workflow_by_name(self, name: str) -> Optional[Dict]:
        """Find a workflow by name (case-insensitive)"""
        name_lower = name.lower()
        
        for workflow in self.workflow_cache.values():
            if workflow.get("name", "").lower() == name_lower:
                # Get full details
                result = self.n8n_client.get_workflow(workflow["id"])
                if result.get("status") == "success":
                    return result.get("workflow")
        
        return None
    
    def execute_workflow_by_name(self, 
                                  workflow_name: str, 
                                  user_input: str,
                                  session_id: str = None) -> Dict[str, Any]:
        """Execute a workflow by name"""
        # Find the workflow
        workflow = self.get_workflow_by_name(workflow_name)
        
        if not workflow:
            return {
                "status": "error",
                "message": f"Workflow '{workflow_name}' not found"
            }
        
        return self.execute_workflow(workflow["id"], user_input, session_id)
    
    def execute_workflow(self, 
                        workflow_id: str, 
                        user_input: str,
                        session_id: str = None) -> Dict[str, Any]:
        """Execute a workflow via webhook"""
        # Get workflow details
        workflow_result = self.n8n_client.get_workflow(workflow_id)
        
        if workflow_result.get("status") != "success":
            return {
                "status": "error",
                "message": f"Failed to get workflow details: {workflow_result.get('message')}"
            }
        
        workflow = workflow_result.get("workflow", {})
        
        # Extract webhook URL from workflow
        webhook_url = self._extract_webhook_url(workflow)
        
        if not webhook_url:
            return {
                "status": "error",
                "message": "No webhook trigger found in workflow"
            }
        
        # Prepare webhook data
        webhook_data = {
            "message": user_input,
            "chatInput": user_input,
            "sessionId": session_id or f"session-{datetime.now().timestamp()}",
            "timestamp": datetime.now().isoformat(),
            "workflow_id": workflow_id
        }
        
        # Trigger the workflow
        print(f"🎯 Triggering workflow '{workflow.get('name')}' via webhook...")
        result = self.n8n_client.trigger_webhook_workflow(webhook_url, webhook_data)
        
        if result.get("status") == "success":
            print(f"✅ Workflow executed successfully")
            return {
                "status": "success",
                "workflow_id": workflow_id,
                "workflow_name": workflow.get("name"),
                "result": result.get("result"),
                "execution_time": datetime.now().isoformat()
            }
        else:
            print(f"❌ Workflow execution failed: {result.get('message')}")
            return result
    
    def _extract_webhook_url(self, workflow: Dict) -> Optional[str]:
        """Extract webhook URL from workflow definition"""
        # Look for webhook nodes in the workflow
        nodes = workflow.get("nodes", [])
        
        for node in nodes:
            # Check for webhook trigger node
            if "webhook" in node.get("type", "").lower():
                # You'll need to construct the webhook URL based on your n8n setup
                # This is a placeholder - adjust based on your n8n configuration
                webhook_path = node.get("parameters", {}).get("path", "")
                if webhook_path:
                    base_url = os.getenv("N8N_WEBHOOK_URL", os.getenv("N8N_API_URL"))
                    return f"{base_url}/webhook/{webhook_path}"
        
        return None
    
    def monitor_workflow_execution(self, 
                                   workflow_id: str, 
                                   limit: int = 10) -> List[Dict]:
        """Monitor recent executions for a workflow"""
        result = self.n8n_client.list_executions(
            workflow_id=workflow_id,
            limit=limit
        )
        
        if result.get("status") == "success":
            executions = result.get("executions", [])
            
            print(f"📊 Recent executions for workflow {workflow_id}:")
            for execution in executions:
                status = execution.get("status", "unknown")
                exec_id = execution.get("id", "unknown")
                print(f"   - Execution {exec_id}: {status}")
            
            return executions
        else:
            print(f"⚠️ Failed to get executions: {result.get('message')}")
            return []
    
    def get_execution_details(self, execution_id: str) -> Optional[Dict]:
        """Get detailed information about a specific execution"""
        result = self.n8n_client.get_execution(execution_id, include_data=True)
        
        if result.get("status") == "success":
            return result.get("execution")
        else:
            print(f"⚠️ Failed to get execution details: {result.get('message')}")
            return None
    
    def process_user_message(self, 
                            message: str, 
                            session_id: str,
                            turn: int = 0) -> Dict[str, Any]:
        """Process user message with n8n workflow awareness"""
        # Initialize session context if needed
        if session_id not in self.session_contexts:
            self.session_contexts[session_id] = {
                "session_id": session_id,
                "created_at": datetime.now().isoformat(),
                "messages": [],
                "turn": 0
            }
        
        session_context = self.session_contexts[session_id]
        session_context["turn"] = turn
        
        # Check if user is asking about workflows
        message_lower = message.lower()
        
        if any(kw in message_lower for kw in ["workflow", "workflows", "list", "available"]):
            workflows = self.list_available_workflows()
            
            response = f"I have access to {len(workflows)} active n8n workflows:\n\n"
            for wf in workflows[:10]:  # Show first 10
                response += f"• {wf.get('name', 'Unnamed')}\n"
            
            if len(workflows) > 10:
                response += f"\n... and {len(workflows) - 10} more."
            
            return {
                "status": "workflow_list",
                "session_id": session_id,
                "response": response,
                "workflows": workflows,
                "turn": turn + 1
            }
        
        # Check if user wants to execute a specific workflow
        elif any(kw in message_lower for kw in ["execute", "run", "trigger", "start"]):
            # Try to identify which workflow to execute
            # This is simplified - you'd want better intent detection
            workflows = self.list_available_workflows()
            
            for workflow in workflows:
                if workflow.get("name", "").lower() in message_lower:
                    # Execute this workflow
                    result = self.execute_workflow(
                        workflow["id"],
                        message,
                        session_id
                    )
                    
                    return {
                        "status": "workflow_executed",
                        "session_id": session_id,
                        "response": f"Executed workflow '{workflow['name']}'",
                        "execution_result": result,
                        "turn": turn + 1
                    }
            
            return {
                "status": "error",
                "session_id": session_id,
                "response": "Could not identify which workflow to execute. Please specify the workflow name.",
                "turn": turn + 1
            }
        
        else:
            # Use OpenAI for general guidance
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful BI assistant with access to n8n workflows."},
                    {"role": "user", "content": message}
                ],
                max_tokens=500
            )
            
            return {
                "status": "guidance",
                "session_id": session_id,
                "response": response.choices[0].message.content,
                "turn": turn + 1
            }
    
    def create_dynamic_workflow(self, 
                               workflow_name: str,
                               workflow_config: Dict) -> Dict[str, Any]:
        """Create a new workflow dynamically"""
        result = self.n8n_client.create_workflow(workflow_config)
        
        if result.get("status") == "success":
            print(f"✅ Created workflow: {workflow_name}")
            self._refresh_workflow_cache()  # Refresh cache
            return result
        else:
            print(f"❌ Failed to create workflow: {result.get('message')}")
            return result
    
    def activate_workflow(self, workflow_id: str) -> bool:
        """Activate a workflow"""
        result = self.n8n_client.activate_workflow(workflow_id)
        
        if result.get("status") == "success":
            print(f"✅ Activated workflow {workflow_id}")
            self._refresh_workflow_cache()
            return True
        else:
            print(f"❌ Failed to activate workflow: {result.get('message')}")
            return False
    
    def deactivate_workflow(self, workflow_id: str) -> bool:
        """Deactivate a workflow"""
        result = self.n8n_client.deactivate_workflow(workflow_id)
        
        if result.get("status") == "success":
            print(f"✅ Deactivated workflow {workflow_id}")
            self._refresh_workflow_cache()
            return True
        else:
            print(f"❌ Failed to deactivate workflow: {result.get('message')}")
            return False

# Example usage
if __name__ == "__main__":
    # Initialize coordinator
    coordinator = N8nEnabledAgentCoordinator()
    init_result = coordinator.initialize()
    
    print(f"\n📊 Initialization result:")
    print(f"   Status: {init_result.get('status')}")
    print(f"   N8N Healthy: {init_result.get('n8n_healthy')}")
    print(f"   Workflows Loaded: {init_result.get('workflows_loaded')}")
    
    # List workflows
    print(f"\n📋 Available Workflows:")
    workflows = coordinator.list_available_workflows()
    for wf in workflows:
        print(f"   - {wf.get('name')} (ID: {wf.get('id')}, Active: {wf.get('active')})")
    
    # Example: Process user message
    print(f"\n💬 Processing user message...")
    result = coordinator.process_user_message(
        message="Show me available workflows",
        session_id="example-session-123",
        turn=1
    )
    print(f"   Response: {result.get('response')[:100]}...")
    
    # Example: Execute a workflow (if you have one)
    if workflows:
        first_workflow = workflows[0]
        print(f"\n🎯 Executing workflow: {first_workflow.get('name')}")
        
        # Note: This will only work if the workflow has a webhook trigger
        # execution_result = coordinator.execute_workflow(
        #     workflow_id=first_workflow.get('id'),
        #     user_input="Test message from coordinator",
        #     session_id="example-session-123"
        # )
        # print(f"   Execution result: {execution_result}")
    
    print(f"\n✅ Example complete!")

