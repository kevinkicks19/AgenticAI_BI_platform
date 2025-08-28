import json
import uuid
import os
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from openai import OpenAI
from mcp_client import N8nMCPClient
from datahub_mcp_client import DataHubMCPClient
from workflow_orchestration_engine import (
    WorkflowOrchestrationEngine, 
    WorkflowSequenceType, 
    AgentType,
    WorkflowRequest,
    SequenceRequest
)

# Load environment variables
load_dotenv()

class EnhancedAgentCoordinator:
    """
    Enhanced AI Agent Coordinator with DataHub integration and workflow orchestration
    """
    
    def __init__(self):
        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("Warning: OPENAI_API_KEY not found in environment variables")
        self.client = OpenAI(api_key=api_key)
        
        # Initialize MCP clients
        self.n8n_client = N8nMCPClient()
        self.datahub_client = DataHubMCPClient()
        
        # Initialize workflow orchestration engine
        self.workflow_engine = WorkflowOrchestrationEngine()
        
        # Session context for maintaining conversation state
        self.session_contexts = {}
        
        # BI Workflow knowledge base
        self.bi_workflow_knowledge = {
            "phases": [
                "Metadata Discovery",
                "Data Cataloging", 
                "Data Vault Generation",
                "Business Intelligence"
            ],
            "agents": [
                "Inception Agent",
                "Glossary Agent", 
                "Business Concept Agent",
                "Story Agent",
                "Physical Metadata Agent",
                "Schema Attribution Agent",
                "Database Assistant"
            ],
            "concepts": {
                "hub": "Central business entity tables that contain business keys",
                "link": "Tables that connect multiple hubs to represent relationships",
                "satellite": "Tables that store descriptive attributes and historical changes",
                "business_key": "Unique identifier for a business entity",
                "grain": "Level of detail at which data is stored",
                "degenerate": "Attributes that don't fit into hub/link/satellite patterns"
            }
        }
    
    async def process_bi_request(self, message: str, session_id: str, turn: int = 0) -> Dict:
        """Process BI requests with enhanced workflow orchestration"""
        try:
            # Initialize or get session context
            if session_id not in self.session_contexts:
                self.session_contexts[session_id] = {
                    "session_id": session_id,
                    "created_at": datetime.now().isoformat(),
                    "messages": [],
                    "current_phase": "discovery",
                    "turn": 0,
                    "workflow_history": [],
                    "datahub_context": {}
                }
            
            session_context = self.session_contexts[session_id]
            session_context["turn"] = turn
            session_context["messages"].append({
                "role": "user",
                "content": message,
                "timestamp": datetime.now().isoformat(),
                "turn": turn
            })
            
            # Analyze user intent and determine workflow sequence
            intent_analysis = await self._analyze_bi_intent(message, session_context)
            
            # Execute appropriate workflow sequence
            if intent_analysis.get("workflow_sequence"):
                sequence_result = await self._execute_workflow_sequence(
                    intent_analysis["workflow_sequence"],
                    message,
                    session_context
                )
                
                # Store workflow result in session context
                session_context["workflow_history"].append({
                    "timestamp": datetime.now().isoformat(),
                    "sequence": intent_analysis["workflow_sequence"],
                    "result": sequence_result,
                    "turn": turn
                })
                
                return {
                    "status": "workflow_executed",
                    "session_id": session_id,
                    "response": sequence_result.get("summary", "Workflow sequence executed successfully"),
                    "workflow_sequence": intent_analysis["workflow_sequence"],
                    "execution_time": sequence_result.get("total_execution_time", 0),
                    "results": sequence_result.get("results", []),
                    "turn": turn + 1,
                    "current_agent": "coordinator"
                }
            else:
                # Provide guidance without executing workflows
                return {
                    "status": "guidance_provided",
                    "session_id": session_id,
                    "response": intent_analysis.get("response", "I can help you with BI workflow guidance."),
                    "guidance": intent_analysis.get("guidance"),
                    "phase": intent_analysis.get("phase"),
                    "turn": turn + 1,
                    "current_agent": "coordinator"
                }
                
        except Exception as e:
            print(f"Error in process_bi_request: {e}")
            return {
                "status": "error",
                "session_id": session_id,
                "response": "Sorry, I encountered an error processing your request. Please try again.",
                "error": str(e),
                "turn": turn + 1,
                "current_agent": "coordinator"
            }
    
    async def _analyze_bi_intent(self, message: str, session_context: Dict) -> Dict:
        """Analyze user intent and determine appropriate workflow sequence"""
        try:
            system_prompt = f"""
You are an AI Business Intelligence Coordinator with access to DataHub metadata and n8n workflow agents.

**Available Workflow Sequences:**
1. **Metadata Discovery** - Inception → Glossary → Business Concept
2. **Data Cataloging** - Physical Metadata → Schema Attribution  
3. **Data Vault Generation** - Database Assistant
4. **Business Intelligence** - Story Agent
5. **Full BI Pipeline** - All agents in sequence

**Available Agents:**
- Inception Agent: Creates and maintains inception reports
- Glossary Agent: Manages business terminology and definitions
- Business Concept Agent: Manages Conceptual Business Elements (CBE)
- Story Agent: Manages data and user story hierarchies
- Physical Metadata Agent: Catalogs datasets with DataHub integration
- Schema Attribution Agent: Identifies business keys and grain
- Database Assistant: Creates data vault objects

**DataHub Integration:**
- Rich metadata context for all physical workflows
- Business context and lineage information
- Glossary terms and business entities
- Dataset schema and column metadata

**Your Role:**
- Analyze user intent to determine appropriate workflow sequence
- Provide guidance on BI concepts and processes
- Execute workflow sequences when appropriate
- Leverage DataHub context for enhanced workflow efficiency

**Response Format:**
- If user wants to execute workflows: Set "workflow_sequence" to appropriate sequence type
- If user wants guidance: Provide educational response with "guidance" field
- Always include relevant "phase" and "guidance" fields

Analyze the user's message and determine the appropriate response.
"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            # Parse the response to determine intent
            response_text = response.choices[0].message.content
            
            # Determine workflow sequence based on keywords and context
            message_lower = message.lower()
            
            # Check for specific workflow sequence requests
            if any(keyword in message_lower for keyword in ["metadata discovery", "discovery", "inception", "glossary", "business concept"]):
                return {
                    "workflow_sequence": WorkflowSequenceType.METADATA_DISCOVERY.value,
                    "response": response_text,
                    "phase": "metadata_discovery",
                    "guidance": "Starting metadata discovery workflow sequence"
                }
            elif any(keyword in message_lower for keyword in ["data cataloging", "catalog", "physical metadata", "schema attribution"]):
                return {
                    "workflow_sequence": WorkflowSequenceType.DATA_CATALOGING.value,
                    "response": response_text,
                    "phase": "data_cataloging", 
                    "guidance": "Starting data cataloging workflow sequence"
                }
            elif any(keyword in message_lower for keyword in ["data vault", "vault", "database assistant", "hub", "link", "satellite"]):
                return {
                    "workflow_sequence": WorkflowSequenceType.DATA_VAULT_GENERATION.value,
                    "response": response_text,
                    "phase": "data_vault_generation",
                    "guidance": "Starting data vault generation workflow sequence"
                }
            elif any(keyword in message_lower for keyword in ["business intelligence", "bi", "story", "analysis", "insights"]):
                return {
                    "workflow_sequence": WorkflowSequenceType.BUSINESS_INTELLIGENCE.value,
                    "response": response_text,
                    "phase": "business_intelligence",
                    "guidance": "Starting business intelligence workflow sequence"
                }
            elif any(keyword in message_lower for keyword in ["full pipeline", "complete workflow", "all agents", "end to end"]):
                return {
                    "workflow_sequence": WorkflowSequenceType.FULL_BI_PIPELINE.value,
                    "response": response_text,
                    "phase": "full_pipeline",
                    "guidance": "Starting full BI pipeline workflow sequence"
                }
            else:
                # Provide guidance without executing workflows
                return {
                    "response": response_text,
                    "phase": "guidance",
                    "guidance": "I can help you with BI workflow guidance and execution"
                }
                
        except Exception as e:
            print(f"Error in intent analysis: {e}")
            return {
                "response": "I'm having trouble understanding your request. Could you please rephrase?",
                "phase": "error",
                "guidance": "Please try asking about specific BI workflow phases or concepts"
            }
    
    async def _execute_workflow_sequence(self, sequence_type: WorkflowSequenceType, message: str, session_context: Dict) -> Dict:
        """Execute a workflow sequence with DataHub context"""
        try:
            # Prepare sequence request
            sequence_request = SequenceRequest(
                sequence_type=sequence_type,
                payload={
                    "message": message,
                    "session_context": session_context,
                    "user_intent": "bi_workflow_execution"
                },
                session_id=session_context["session_id"],
                context=session_context.get("datahub_context", {}),
                parallel_execution=False  # Sequential execution for now
            )
            
            # Execute the sequence
            sequence_result = await self.workflow_engine.execute_workflow_sequence(sequence_request)
            
            # Create summary of results
            summary = self._create_sequence_summary(sequence_result)
            
            return {
                "success": sequence_result.success,
                "summary": summary,
                "results": [
                    {
                        "agent_type": result.agent_type.value,
                        "success": result.success,
                        "execution_time": result.execution_time,
                        "error": result.error,
                        "result": result.result
                    }
                    for result in sequence_result.results
                ],
                "total_execution_time": sequence_result.total_execution_time,
                "errors": sequence_result.errors,
                "metadata": sequence_result.metadata
            }
            
        except Exception as e:
            print(f"Error executing workflow sequence: {e}")
            return {
                "success": False,
                "summary": f"Error executing workflow sequence: {str(e)}",
                "results": [],
                "total_execution_time": 0,
                "errors": [str(e)],
                "metadata": {}
            }
    
    def _create_sequence_summary(self, sequence_result) -> str:
        """Create a human-readable summary of workflow sequence results"""
        if not sequence_result.success:
            return f"Workflow sequence failed with {len(sequence_result.errors or [])} errors. Please check the error details."
        
        successful_workflows = [r for r in sequence_result.results if r.success]
        total_workflows = len(sequence_result.results)
        
        summary = f"Successfully executed {len(successful_workflows)}/{total_workflows} workflows in {sequence_result.total_execution_time:.2f} seconds.\n\n"
        
        for result in successful_workflows:
            summary += f"✅ {result.agent_type.value.replace('_', ' ').title()}: Completed in {result.execution_time:.2f}s\n"
        
        if sequence_result.errors:
            summary += f"\n❌ Errors encountered:\n"
            for error in sequence_result.errors:
                summary += f"  - {error}\n"
        
        return summary
    
    async def get_datahub_context(self, entity_urn: str = None, query: str = None) -> Dict:
        """Get DataHub context for enhanced workflow efficiency"""
        try:
            context = {}
            
            if entity_urn:
                # Get specific entity context
                dataset_result = self.datahub_client.get_dataset_metadata(entity_urn)
                if dataset_result["status"] == "success":
                    context["dataset"] = dataset_result["dataset"]
                
                business_context = self.datahub_client.get_business_context(entity_urn)
                if business_context["status"] == "success":
                    context["business_context"] = business_context["business_context"]
            
            if query:
                # Search for relevant entities
                search_result = self.datahub_client.search_datasets(query)
                if search_result["status"] == "success":
                    context["search_results"] = search_result["results"]
            
            return context
            
        except Exception as e:
            print(f"Error getting DataHub context: {e}")
            return {}
    
    def get_available_workflows(self) -> Dict:
        """Get available n8n workflows and workflow sequences"""
        try:
            # Get n8n workflows
            n8n_workflows = self.n8n_client.list_workflows()
            
            # Get workflow sequences
            available_sequences = self.workflow_engine.get_available_sequences()
            
            # Get workflow registry
            workflow_registry = self.workflow_engine.get_workflow_registry()
            
            return {
                "n8n_workflows": n8n_workflows.get("workflows", []),
                "workflow_sequences": available_sequences,
                "workflow_registry": workflow_registry,
                "total_n8n_workflows": n8n_workflows.get("total_count", 0)
            }
            
        except Exception as e:
            print(f"Error getting available workflows: {e}")
            return {
                "n8n_workflows": [],
                "workflow_sequences": {},
                "workflow_registry": {},
                "total_n8n_workflows": 0,
                "error": str(e)
            }
    
    def register_workflow(self, agent_type: str, workflow_id: str) -> bool:
        """Register a new workflow ID for an agent type"""
        try:
            agent_enum = AgentType(agent_type)
            return self.workflow_engine.register_workflow(agent_enum, workflow_id)
        except ValueError:
            print(f"Invalid agent type: {agent_type}")
            return False
        except Exception as e:
            print(f"Error registering workflow: {e}")
            return False

# Create global enhanced coordinator instance
enhanced_agent_coordinator = EnhancedAgentCoordinator()
