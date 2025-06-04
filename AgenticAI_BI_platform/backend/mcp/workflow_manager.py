from typing import Dict, List, Any, Optional
from pydantic import BaseModel
import aiohttp
import json
from datetime import datetime

class WorkflowDefinition(BaseModel):
    id: str
    name: str
    description: str
    trigger_type: str
    parameters: Dict[str, Any]
    version: str
    is_active: bool

class WorkflowExecution(BaseModel):
    execution_id: str
    workflow_id: str
    status: str
    start_time: datetime
    end_time: Optional[datetime]
    parameters: Dict[str, Any]
    result: Optional[Dict[str, Any]]
    error: Optional[str]

class WorkflowManager:
    def __init__(self, n8n_base_url: str, n8n_api_key: str):
        self.n8n_base_url = n8n_base_url.rstrip('/')
        self.n8n_api_key = n8n_api_key
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={"X-N8N-API-KEY": self.n8n_api_key}
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def get_workflow_definitions(self) -> List[WorkflowDefinition]:
        """Retrieve all available workflow definitions from n8n"""
        if not self.session:
            raise RuntimeError("WorkflowManager must be used as an async context manager")
            
        async with self.session.get(f"{self.n8n_base_url}/workflows") as response:
            if response.status != 200:
                raise Exception(f"Failed to fetch workflows: {response.status}")
                
            workflows_data = await response.json()
            return [WorkflowDefinition(**wf) for wf in workflows_data]

    async def execute_workflow(self, workflow_id: str, parameters: Dict[str, Any]) -> WorkflowExecution:
        """Execute a specific workflow with given parameters"""
        if not self.session:
            raise RuntimeError("WorkflowManager must be used as an async context manager")

        execution = WorkflowExecution(
            execution_id=f"exec_{datetime.now().timestamp()}",
            workflow_id=workflow_id,
            status="pending",
            start_time=datetime.now(),
            parameters=parameters,
            result=None,
            error=None
        )

        try:
            async with self.session.post(
                f"{self.n8n_base_url}/workflows/{workflow_id}/execute",
                json=parameters
            ) as response:
                if response.status != 200:
                    execution.status = "failed"
                    execution.error = f"Workflow execution failed: {response.status}"
                    return execution

                result = await response.json()
                execution.status = "completed"
                execution.end_time = datetime.now()
                execution.result = result
                return execution

        except Exception as e:
            execution.status = "failed"
            execution.error = str(e)
            execution.end_time = datetime.now()
            return execution

    async def get_workflow_status(self, execution_id: str) -> WorkflowExecution:
        """Get the status of a workflow execution"""
        if not self.session:
            raise RuntimeError("WorkflowManager must be used as an async context manager")

        async with self.session.get(
            f"{self.n8n_base_url}/executions/{execution_id}"
        ) as response:
            if response.status != 200:
                raise Exception(f"Failed to fetch execution status: {response.status}")

            execution_data = await response.json()
            return WorkflowExecution(**execution_data)

    async def register_webhook(self, workflow_id: str, webhook_path: str) -> str:
        """Register a webhook for a workflow"""
        if not self.session:
            raise RuntimeError("WorkflowManager must be used as an async context manager")

        webhook_data = {
            "path": webhook_path,
            "workflowId": workflow_id
        }

        async with self.session.post(
            f"{self.n8n_base_url}/webhooks",
            json=webhook_data
        ) as response:
            if response.status != 200:
                raise Exception(f"Failed to register webhook: {response.status}")

            webhook_info = await response.json()
            return webhook_info["url"] 