"""
n8n Integration Module for Agent Coordinator

This module provides a Python interface to interact with the n8n MCP server,
allowing the coordinator to dynamically call different workflows based on user interactions.
"""

import asyncio
import json
import subprocess
import tempfile
import os
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class N8nMCPIntegration:
    """
    Integration class for n8n MCP server functionality.
    Provides methods to list, create, execute, and manage n8n workflows.
    """
    
    def __init__(self, n8n_api_url: str, n8n_api_key: str):
        self.n8n_api_url = n8n_api_url
        self.n8n_api_key = n8n_api_key
        self.workflow_cache = {}
        self.last_cache_update = None
        self.cache_ttl = 300  # 5 minutes cache TTL
    
    async def list_workflows(self, limit: int = 100) -> List[Dict[str, Any]]:
        """List all available workflows in n8n"""
        try:
            # This would typically call the n8n MCP server
            # For now, we'll simulate the response structure
            result = await self._call_n8n_mcp("list_workflows", {"limit": limit})
            return result.get("workflows", [])
        except Exception as e:
            logger.error(f"Error listing workflows: {e}")
            return []
    
    async def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get details of a specific workflow"""
        try:
            result = await self._call_n8n_mcp("get_workflow", {"id": workflow_id})
            return result
        except Exception as e:
            logger.error(f"Error getting workflow {workflow_id}: {e}")
            return None
    
    async def create_workflow(self, name: str, nodes: List[Dict], connections: Dict, settings: Dict = None) -> Optional[Dict[str, Any]]:
        """Create a new workflow in n8n"""
        try:
            params = {
                "name": name,
                "nodes": nodes,
                "connections": connections,
                "settings": settings or {"executionOrder": "v1"}
            }
            result = await self._call_n8n_mcp("create_workflow", params)
            return result
        except Exception as e:
            logger.error(f"Error creating workflow {name}: {e}")
            return None
    
    async def execute_workflow(self, workflow_id: str, parameters: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """Execute a workflow with given parameters"""
        try:
            params = {
                "workflow_id": workflow_id,
                "parameters": parameters or {}
            }
            result = await self._call_n8n_mcp("execute_workflow", params)
            return result
        except Exception as e:
            logger.error(f"Error executing workflow {workflow_id}: {e}")
            return None
    
    async def trigger_webhook_workflow(self, webhook_url: str, data: Dict[str, Any], method: str = "POST") -> Optional[Dict[str, Any]]:
        """Trigger a workflow via webhook"""
        try:
            params = {
                "webhookUrl": webhook_url,
                "httpMethod": method,
                "data": data
            }
            result = await self._call_n8n_mcp("trigger_webhook_workflow", params)
            return result
        except Exception as e:
            logger.error(f"Error triggering webhook workflow: {e}")
            return None
    
    async def activate_workflow(self, workflow_id: str) -> bool:
        """Activate a workflow"""
        try:
            result = await self._call_n8n_mcp("activate_workflow", {"id": workflow_id})
            return result.get("success", False)
        except Exception as e:
            logger.error(f"Error activating workflow {workflow_id}: {e}")
            return False
    
    async def deactivate_workflow(self, workflow_id: str) -> bool:
        """Deactivate a workflow"""
        try:
            result = await self._call_n8n_mcp("deactivate_workflow", {"id": workflow_id})
            return result.get("success", False)
        except Exception as e:
            logger.error(f"Error deactivating workflow {workflow_id}: {e}")
            return False
    
    async def delete_workflow(self, workflow_id: str) -> bool:
        """Delete a workflow"""
        try:
            result = await self._call_n8n_mcp("delete_workflow", {"id": workflow_id})
            return result.get("success", False)
        except Exception as e:
            logger.error(f"Error deleting workflow {workflow_id}: {e}")
            return False
    
    async def validate_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Validate a workflow configuration"""
        try:
            result = await self._call_n8n_mcp("validate_workflow", {"id": workflow_id})
            return result
        except Exception as e:
            logger.error(f"Error validating workflow {workflow_id}: {e}")
            return {"valid": False, "errors": [str(e)]}
    
    async def get_workflow_executions(self, workflow_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent executions of a workflow"""
        try:
            params = {
                "workflowId": workflow_id,
                "limit": limit
            }
            result = await self._call_n8n_mcp("list_executions", params)
            return result.get("executions", [])
        except Exception as e:
            logger.error(f"Error getting executions for workflow {workflow_id}: {e}")
            return []
    
    async def _call_n8n_mcp(self, method: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call the n8n MCP server with the given method and parameters.
        This is a placeholder implementation that would need to be connected
        to the actual MCP server interface.
        """
        # For now, we'll simulate the MCP server calls
        # In a real implementation, this would use the MCP server's interface
        
        if method == "list_workflows":
            return await self._simulate_list_workflows(parameters)
        elif method == "get_workflow":
            return await self._simulate_get_workflow(parameters)
        elif method == "create_workflow":
            return await self._simulate_create_workflow(parameters)
        elif method == "execute_workflow":
            return await self._simulate_execute_workflow(parameters)
        elif method == "trigger_webhook_workflow":
            return await self._simulate_trigger_webhook(parameters)
        else:
            raise NotImplementedError(f"Method {method} not implemented")
    
    async def _simulate_list_workflows(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate listing workflows"""
        return {
            "workflows": [
                {
                    "id": "manual-trigger-example",
                    "name": "Manual Trigger Example",
                    "active": True,
                    "createdAt": "2025-07-24T21:11:02.046Z",
                    "updatedAt": "2025-07-24T21:14:21.632Z",
                    "tags": [],
                    "nodeCount": 2
                }
            ],
            "returned": 1,
            "hasMore": False
        }
    
    async def _simulate_get_workflow(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate getting workflow details"""
        workflow_id = parameters.get("id")
        return {
            "id": workflow_id,
            "name": "Manual Trigger Example",
            "active": True,
            "nodes": [
                {
                    "id": "1",
                    "name": "Manual Trigger",
                    "type": "n8n-nodes-base.manualTrigger",
                    "typeVersion": 1,
                    "position": [200, 300],
                    "parameters": {}
                },
                {
                    "id": "2",
                    "name": "Set Example Value",
                    "type": "n8n-nodes-base.set",
                    "typeVersion": 1,
                    "position": [400, 300],
                    "parameters": {
                        "values": [
                            {
                                "name": "message",
                                "value": "This workflow was started manually!"
                            }
                        ]
                    }
                }
            ],
            "connections": {
                "Manual Trigger": {
                    "main": [[{"node": "Set Example Value", "type": "main", "index": 0}]]
                }
            }
        }
    
    async def _simulate_create_workflow(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate creating a workflow"""
        return {
            "success": True,
            "data": {
                "id": f"workflow-{datetime.now().timestamp()}",
                "name": parameters.get("name", "New Workflow"),
                "active": False
            },
            "message": f"Workflow '{parameters.get('name')}' created successfully"
        }
    
    async def _simulate_execute_workflow(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate executing a workflow"""
        workflow_id = parameters.get("workflow_id")
        return {
            "success": True,
            "execution_id": f"exec-{datetime.now().timestamp()}",
            "workflow_id": workflow_id,
            "status": "completed",
            "result": {
                "message": "Workflow executed successfully",
                "output": parameters.get("parameters", {})
            }
        }
    
    async def _simulate_trigger_webhook(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate triggering a webhook workflow"""
        return {
            "success": True,
            "execution_id": f"webhook-exec-{datetime.now().timestamp()}",
            "status": "completed",
            "result": {
                "message": "Webhook triggered successfully",
                "data": parameters.get("data", {})
            }
        }

class WorkflowRouter:
    """
    Routes user intents to appropriate n8n workflows based on intent analysis.
    """
    
    def __init__(self, n8n_integration: N8nMCPIntegration):
        self.n8n = n8n_integration
        self.intent_workflow_mapping = {
            "data_analysis": {
                "workflow_name": "Data Analysis Workflow",
                "description": "Analyzes data and generates insights",
                "parameters": ["data_source", "analysis_type", "output_format"]
            },
            "document_processing": {
                "workflow_name": "Document Processing Workflow", 
                "description": "Processes and extracts information from documents",
                "parameters": ["document_type", "extraction_fields", "output_format"]
            },
            "task_management": {
                "workflow_name": "Task Management Workflow",
                "description": "Manages tasks and project workflows",
                "parameters": ["task_type", "priority", "assignee"]
            },
            "approval_request": {
                "workflow_name": "Approval Workflow",
                "description": "Handles approval requests and notifications",
                "parameters": ["approval_type", "approver", "deadline"]
            },
            "notification": {
                "workflow_name": "Notification Workflow",
                "description": "Sends notifications and alerts",
                "parameters": ["notification_type", "recipients", "message"]
            },
            "report_generation": {
                "workflow_name": "Report Generation Workflow",
                "description": "Generates reports and summaries",
                "parameters": ["report_type", "data_source", "format"]
            }
        }
    
    async def route_intent_to_workflow(self, intent_analysis: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Route user intent to appropriate workflow and execute it.
        
        Args:
            intent_analysis: Analysis of user intent
            context: Current session context
            
        Returns:
            Workflow execution result
        """
        intent_type = intent_analysis.get("intent_type", "general_chat")
        confidence = intent_analysis.get("confidence", 0.0)
        
        # If confidence is too low, fall back to general chat
        if confidence < 0.5:
            return {
                "workflow_executed": False,
                "reason": "Low confidence in intent analysis",
                "fallback_response": "I'm not sure I understand. Could you please rephrase your request?"
            }
        
        # Check if we have a mapping for this intent
        if intent_type not in self.intent_workflow_mapping:
            return {
                "workflow_executed": False,
                "reason": f"No workflow mapping for intent type: {intent_type}",
                "fallback_response": "I don't have a specific workflow for that type of request yet."
            }
        
        workflow_config = self.intent_workflow_mapping[intent_type]
        
        # Check if the workflow exists, create if it doesn't
        workflows = await self.n8n.list_workflows()
        workflow_exists = any(wf["name"] == workflow_config["workflow_name"] for wf in workflows)
        
        if not workflow_exists:
            # Create the workflow
            workflow_created = await self._create_intent_workflow(intent_type, workflow_config)
            if not workflow_created:
                return {
                    "workflow_executed": False,
                    "reason": "Failed to create workflow",
                    "fallback_response": "I'm having trouble setting up the workflow for your request."
                }
        
        # Execute the workflow with context parameters
        execution_params = self._prepare_execution_parameters(intent_analysis, context, workflow_config)
        
        try:
            # Find the workflow ID
            workflows = await self.n8n.list_workflows()
            workflow = next((wf for wf in workflows if wf["name"] == workflow_config["workflow_name"]), None)
            
            if not workflow:
                return {
                    "workflow_executed": False,
                    "reason": "Workflow not found after creation",
                    "fallback_response": "I couldn't find the appropriate workflow."
                }
            
            # Execute the workflow
            result = await self.n8n.execute_workflow(workflow["id"], execution_params)
            
            return {
                "workflow_executed": True,
                "workflow_name": workflow_config["workflow_name"],
                "workflow_id": workflow["id"],
                "execution_result": result,
                "intent_type": intent_type,
                "confidence": confidence
            }
            
        except Exception as e:
            logger.error(f"Error executing workflow for intent {intent_type}: {e}")
            return {
                "workflow_executed": False,
                "reason": f"Workflow execution failed: {str(e)}",
                "fallback_response": "I encountered an error while processing your request."
            }
    
    async def _create_intent_workflow(self, intent_type: str, workflow_config: Dict[str, Any]) -> bool:
        """Create a workflow for a specific intent type"""
        try:
            # Create a basic workflow structure based on intent type
            nodes = self._create_workflow_nodes(intent_type, workflow_config)
            connections = self._create_workflow_connections(nodes)
            
            result = await self.n8n.create_workflow(
                name=workflow_config["workflow_name"],
                nodes=nodes,
                connections=connections
            )
            
            return result is not None and result.get("success", False)
            
        except Exception as e:
            logger.error(f"Error creating workflow for intent {intent_type}: {e}")
            return False
    
    def _create_workflow_nodes(self, intent_type: str, workflow_config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create workflow nodes based on intent type"""
        base_nodes = [
            {
                "id": "1",
                "name": "Manual Trigger",
                "type": "n8n-nodes-base.manualTrigger",
                "typeVersion": 1,
                "position": [200, 300],
                "parameters": {}
            }
        ]
        
        # Add intent-specific nodes
        if intent_type == "data_analysis":
            base_nodes.extend([
                {
                    "id": "2",
                    "name": "Set Parameters",
                    "type": "n8n-nodes-base.set",
                    "typeVersion": 1,
                    "position": [400, 300],
                    "parameters": {
                        "values": [
                            {"name": "data_source", "value": "={{$json.data_source}}"},
                            {"name": "analysis_type", "value": "={{$json.analysis_type}}"},
                            {"name": "output_format", "value": "={{$json.output_format}}"}
                        ]
                    }
                },
                {
                    "id": "3",
                    "name": "Data Analysis",
                    "type": "n8n-nodes-base.code",
                    "typeVersion": 1,
                    "position": [600, 300],
                    "parameters": {
                        "jsCode": f"""
                        // Data Analysis Workflow
                        const params = $input.first().json;
                        const result = {{
                            analysis_type: params.analysis_type,
                            data_source: params.data_source,
                            output_format: params.output_format,
                            timestamp: new Date().toISOString(),
                            status: "completed"
                        }};
                        return [{{json: result}}];
                        """
                    }
                }
            ])
        
        elif intent_type == "document_processing":
            base_nodes.extend([
                {
                    "id": "2",
                    "name": "Document Processor",
                    "type": "n8n-nodes-base.code",
                    "typeVersion": 1,
                    "position": [400, 300],
                    "parameters": {
                        "jsCode": f"""
                        // Document Processing Workflow
                        const params = $input.first().json;
                        const result = {{
                            document_type: params.document_type,
                            extraction_fields: params.extraction_fields,
                            output_format: params.output_format,
                            processed_at: new Date().toISOString(),
                            status: "completed"
                        }};
                        return [{{json: result}}];
                        """
                    }
                }
            ])
        
        # Add more intent-specific node configurations as needed
        
        return base_nodes
    
    def _create_workflow_connections(self, nodes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create connections between workflow nodes"""
        connections = {}
        
        for i in range(len(nodes) - 1):
            current_node = nodes[i]["name"]
            next_node = nodes[i + 1]["name"]
            
            connections[current_node] = {
                "main": [[{"node": next_node, "type": "main", "index": 0}]]
            }
        
        return connections
    
    def _prepare_execution_parameters(self, intent_analysis: Dict[str, Any], context: Dict[str, Any], workflow_config: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare parameters for workflow execution"""
        parameters = intent_analysis.get("parameters", {})
        
        # Add context information
        parameters.update({
            "session_id": context.get("session_id"),
            "user_id": context.get("user_id"),
            "timestamp": datetime.now().isoformat(),
            "workflow_type": workflow_config["workflow_name"]
        })
        
        return parameters 