import json
import asyncio
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
from mcp_client import N8nMCPClient
from datahub_mcp_client import DataHubMCPClient

class WorkflowSequenceType(Enum):
    """Types of workflow sequences for BI processes"""
    METADATA_DISCOVERY = "metadata_discovery"
    DATA_CATALOGING = "data_cataloging"
    DATA_VAULT_GENERATION = "data_vault_generation"
    BUSINESS_INTELLIGENCE = "business_intelligence"
    FULL_BI_PIPELINE = "full_bi_pipeline"

class AgentType(Enum):
    """Types of n8n workflow agents"""
    INCEPTION = "inception"
    GLOSSARY = "glossary"
    BUSINESS_CONCEPT = "business_concept"
    STORY = "story"
    PHYSICAL_METADATA = "physical_metadata"
    SCHEMA_ATTRIBUTION = "schema_attribution"
    DATABASE_ASSISTANT = "database_assistant"

@dataclass
class WorkflowRequest:
    """Request for workflow execution"""
    agent_type: AgentType
    payload: Dict[str, Any]
    session_id: str
    context: Dict[str, Any] = None
    priority: int = 1

@dataclass
class WorkflowResponse:
    """Response from workflow execution"""
    success: bool
    result: Dict[str, Any]
    agent_type: AgentType
    execution_time: float
    error: str = None
    metadata: Dict[str, Any] = None

@dataclass
class SequenceRequest:
    """Request for workflow sequence execution"""
    sequence_type: WorkflowSequenceType
    payload: Dict[str, Any]
    session_id: str
    context: Dict[str, Any] = None
    parallel_execution: bool = False

@dataclass
class SequenceResponse:
    """Response from workflow sequence execution"""
    success: bool
    results: List[WorkflowResponse]
    sequence_type: WorkflowSequenceType
    total_execution_time: float
    errors: List[str] = None
    metadata: Dict[str, Any] = None

class WorkflowOrchestrationEngine:
    """
    Orchestrates complex multi-step BI workflows using n8n agents with DataHub context
    """
    
    def __init__(self):
        self.n8n_client = N8nMCPClient()
        self.datahub_client = DataHubMCPClient()
        
        # Workflow registry mapping agent types to n8n workflow IDs
        self.workflow_registry = {
            AgentType.INCEPTION: "inception-agent-workflow-id",
            AgentType.GLOSSARY: "glossary-agent-workflow-id", 
            AgentType.BUSINESS_CONCEPT: "business-concept-agent-workflow-id",
            AgentType.STORY: "story-agent-workflow-id",
            AgentType.PHYSICAL_METADATA: "physical-metadata-agent-workflow-id",
            AgentType.SCHEMA_ATTRIBUTION: "schema-attribution-agent-workflow-id",
            AgentType.DATABASE_ASSISTANT: "database-assistant-agent-workflow-id"
        }
        
        # Workflow sequences for different BI processes
        self.workflow_sequences = {
            WorkflowSequenceType.METADATA_DISCOVERY: [
                AgentType.INCEPTION,
                AgentType.GLOSSARY,
                AgentType.BUSINESS_CONCEPT
            ],
            WorkflowSequenceType.DATA_CATALOGING: [
                AgentType.PHYSICAL_METADATA,
                AgentType.SCHEMA_ATTRIBUTION
            ],
            WorkflowSequenceType.DATA_VAULT_GENERATION: [
                AgentType.DATABASE_ASSISTANT
            ],
            WorkflowSequenceType.BUSINESS_INTELLIGENCE: [
                AgentType.STORY
            ],
            WorkflowSequenceType.FULL_BI_PIPELINE: [
                AgentType.INCEPTION,
                AgentType.GLOSSARY,
                AgentType.BUSINESS_CONCEPT,
                AgentType.PHYSICAL_METADATA,
                AgentType.SCHEMA_ATTRIBUTION,
                AgentType.DATABASE_ASSISTANT,
                AgentType.STORY
            ]
        }
    
    async def execute_workflow(self, request: WorkflowRequest) -> WorkflowResponse:
        """Execute a single workflow with DataHub context enhancement"""
        start_time = datetime.now()
        
        try:
            # Get DataHub context for this agent type
            datahub_context = await self._get_datahub_context(request.agent_type, request.payload)
            
            # Enhance payload with DataHub context
            enhanced_payload = {
                **request.payload,
                "datahub_context": datahub_context,
                "session_id": request.session_id,
                "agent_type": request.agent_type.value,
                "timestamp": datetime.now().isoformat()
            }
            
            # Get workflow ID for this agent type
            workflow_id = self.workflow_registry.get(request.agent_type)
            if not workflow_id:
                return WorkflowResponse(
                    success=False,
                    result={},
                    agent_type=request.agent_type,
                    execution_time=0,
                    error=f"No workflow ID found for agent type: {request.agent_type.value}"
                )
            
            # Execute n8n workflow
            n8n_result = self.n8n_client.trigger_webhook_workflow(
                f"https://n8n.casamccartney.link/webhook/{workflow_id}",
                enhanced_payload
            )
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            if n8n_result.get("status") == "success":
                return WorkflowResponse(
                    success=True,
                    result=n8n_result.get("result", {}),
                    agent_type=request.agent_type,
                    execution_time=execution_time,
                    metadata={
                        "workflow_id": workflow_id,
                        "datahub_context_used": bool(datahub_context),
                        "n8n_result": n8n_result
                    }
                )
            else:
                return WorkflowResponse(
                    success=False,
                    result={},
                    agent_type=request.agent_type,
                    execution_time=execution_time,
                    error=n8n_result.get("message", "Unknown n8n error")
                )
                
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            return WorkflowResponse(
                success=False,
                result={},
                agent_type=request.agent_type,
                execution_time=execution_time,
                error=str(e)
            )
    
    async def execute_workflow_sequence(self, request: SequenceRequest) -> SequenceResponse:
        """Execute a sequence of workflows with optional parallel execution"""
        start_time = datetime.now()
        
        try:
            # Get the workflow sequence
            agent_sequence = self.workflow_sequences.get(request.sequence_type)
            if not agent_sequence:
                return SequenceResponse(
                    success=False,
                    results=[],
                    sequence_type=request.sequence_type,
                    total_execution_time=0,
                    errors=[f"No sequence found for type: {request.sequence_type.value}"]
                )
            
            # Prepare workflow requests
            workflow_requests = []
            for i, agent_type in enumerate(agent_sequence):
                # Pass results from previous workflows as context
                context = request.context or {}
                if i > 0:
                    context["previous_results"] = [r.result for r in workflow_requests[:i]]
                
                workflow_request = WorkflowRequest(
                    agent_type=agent_type,
                    payload=request.payload,
                    session_id=request.session_id,
                    context=context,
                    priority=i + 1
                )
                workflow_requests.append(workflow_request)
            
            # Execute workflows
            if request.parallel_execution:
                # Execute all workflows in parallel
                tasks = [self.execute_workflow(req) for req in workflow_requests]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Handle exceptions
                workflow_results = []
                errors = []
                for i, result in enumerate(results):
                    if isinstance(result, Exception):
                        errors.append(f"Workflow {i} failed: {str(result)}")
                        workflow_results.append(WorkflowResponse(
                            success=False,
                            result={},
                            agent_type=workflow_requests[i].agent_type,
                            execution_time=0,
                            error=str(result)
                        ))
                    else:
                        workflow_results.append(result)
                        if not result.success:
                            errors.append(f"Workflow {result.agent_type.value} failed: {result.error}")
            else:
                # Execute workflows sequentially
                workflow_results = []
                errors = []
                for workflow_request in workflow_requests:
                    result = await self.execute_workflow(workflow_request)
                    workflow_results.append(result)
                    
                    if not result.success:
                        errors.append(f"Workflow {result.agent_type.value} failed: {result.error}")
                        # Optionally stop on first error
                        # break
            
            total_execution_time = (datetime.now() - start_time).total_seconds()
            success = len(errors) == 0
            
            return SequenceResponse(
                success=success,
                results=workflow_results,
                sequence_type=request.sequence_type,
                total_execution_time=total_execution_time,
                errors=errors if errors else None,
                metadata={
                    "parallel_execution": request.parallel_execution,
                    "total_workflows": len(workflow_requests),
                    "successful_workflows": len([r for r in workflow_results if r.success])
                }
            )
            
        except Exception as e:
            total_execution_time = (datetime.now() - start_time).total_seconds()
            return SequenceResponse(
                success=False,
                results=[],
                sequence_type=request.sequence_type,
                total_execution_time=total_execution_time,
                errors=[str(e)]
            )
    
    async def _get_datahub_context(self, agent_type: AgentType, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Get relevant DataHub context for a specific agent type"""
        try:
            context = {}
            
            if agent_type == AgentType.PHYSICAL_METADATA:
                # Get dataset metadata and schema information
                if "dataset_urn" in payload:
                    dataset_result = self.datahub_client.get_dataset_metadata(payload["dataset_urn"])
                    if dataset_result["status"] == "success":
                        context["dataset_metadata"] = dataset_result["dataset"]
                
                # Get column metadata
                if "dataset_urn" in payload:
                    columns_result = self.datahub_client.get_column_metadata(payload["dataset_urn"])
                    if columns_result["status"] == "success":
                        context["column_metadata"] = columns_result["columns"]
            
            elif agent_type == AgentType.SCHEMA_ATTRIBUTION:
                # Get business context and lineage
                if "dataset_urn" in payload:
                    business_context = self.datahub_client.get_business_context(payload["dataset_urn"])
                    if business_context["status"] == "success":
                        context["business_context"] = business_context["business_context"]
                    
                    lineage = self.datahub_client.get_data_lineage(payload["dataset_urn"])
                    if lineage["status"] == "success":
                        context["lineage"] = lineage["lineage"]
            
            elif agent_type == AgentType.GLOSSARY:
                # Get glossary terms
                glossary_result = self.datahub_client.get_glossary_terms()
                if glossary_result["status"] == "success":
                    context["glossary_terms"] = glossary_result["terms"]
            
            elif agent_type == AgentType.BUSINESS_CONCEPT:
                # Get business entities and their relationships
                entities_result = self.datahub_client.get_business_entities("DATASET")
                if entities_result["status"] == "success":
                    context["business_entities"] = entities_result["entities"]
            
            elif agent_type == AgentType.DATABASE_ASSISTANT:
                # Get comprehensive metadata for data vault generation
                if "dataset_urn" in payload:
                    dataset_result = self.datahub_client.get_dataset_metadata(payload["dataset_urn"])
                    if dataset_result["status"] == "success":
                        context["dataset_metadata"] = dataset_result["dataset"]
                    
                    lineage = self.datahub_client.get_data_lineage(payload["dataset_urn"])
                    if lineage["status"] == "success":
                        context["lineage"] = lineage["lineage"]
            
            return context
            
        except Exception as e:
            print(f"Error getting DataHub context for {agent_type.value}: {e}")
            return {}
    
    def register_workflow(self, agent_type: AgentType, workflow_id: str) -> bool:
        """Register a new workflow ID for an agent type"""
        try:
            self.workflow_registry[agent_type] = workflow_id
            return True
        except Exception as e:
            print(f"Error registering workflow for {agent_type.value}: {e}")
            return False
    
    def get_available_sequences(self) -> Dict[str, List[str]]:
        """Get available workflow sequences"""
        return {
            sequence_type.value: [agent_type.value for agent_type in agent_sequence]
            for sequence_type, agent_sequence in self.workflow_sequences.items()
        }
    
    def get_workflow_registry(self) -> Dict[str, str]:
        """Get current workflow registry"""
        return {
            agent_type.value: workflow_id
            for agent_type, workflow_id in self.workflow_registry.items()
        }

# Create a global workflow orchestration engine instance
workflow_orchestration_engine = WorkflowOrchestrationEngine()
