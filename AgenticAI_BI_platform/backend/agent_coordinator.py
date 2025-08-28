import json
import uuid
import os
import requests
from datetime import datetime
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from openai import OpenAI
from mcp_client import N8nMCPClient

# Load environment variables
load_dotenv()

class AgentCoordinator:
    """
    AI Agent Coordinator that guides users through workflows and provides BI guidance.
    Focused on guidance and workflow discovery, not execution.
    """
    
    def __init__(self):
        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("Warning: OPENAI_API_KEY not found in environment variables")
        self.client = OpenAI(api_key=api_key)
        
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
    
    def get_n8n_workflows(self) -> List[Dict]:
        """Get list of available n8n workflows using MCP tools"""
        try:
            mcp_client_instance = N8nMCPClient()
            mcp_result = mcp_client_instance.list_workflows()
            
            if mcp_result.get("status") == "success":
                workflows = mcp_result.get("workflows", [])
                print(f"Successfully fetched {len(workflows)} workflows via MCP")
                return workflows
            else:
                print(f"Error fetching workflows via MCP: {mcp_result.get('message')}")
            return []
        except Exception as e:
            print(f"Error fetching workflows via MCP: {e}")
            return []
    
    def get_workflow_details(self, workflow_id: str) -> Optional[Dict]:
        """Get detailed information about a specific workflow by ID or name"""
        try:
            workflows = self.get_n8n_workflows()
            
            # Special case: redirect homeautomation-advisor to the main workflow (now fixed)
            if workflow_id == "homeautomation-advisor":
                # Use the main workflow since it now has the Respond to Webhook node
                main_workflow = next((w for w in workflows if w.get("id") == "V59ZdxTNusKy1Swt"), None)
                if main_workflow:
                    print(f"DEBUG: Redirecting homeautomation-advisor to main workflow: {main_workflow}")
                    return main_workflow
            
            # Special case: redirect business-problem-inception-agent to the inception workflow
            if workflow_id == "business-problem-inception-agent":
                # Use the inception workflow
                inception_workflow = next((w for w in workflows if w.get("id") == "TV0BgrmFtMzDxeFd"), None)
                if inception_workflow:
                    print(f"DEBUG: Redirecting business-problem-inception-agent to inception workflow: {inception_workflow}")
                    return inception_workflow
            
            # First try to find by exact ID
            workflow = next((w for w in workflows if w.get("id") == workflow_id), None)
            
            # If not found by ID, try to find by name (case-insensitive, normalized)
            if not workflow:
                normalized_id = workflow_id.lower().replace('-', ' ').replace('_', ' ')
                workflow = next((w for w in workflows if w.get("name", "").lower().replace('-', ' ').replace('_', ' ') == normalized_id), None)
            
            if workflow:
                print(f"DEBUG: Found workflow details for {workflow_id}: {workflow}")
                return workflow
            else:
                print(f"DEBUG: Workflow {workflow_id} not found by ID or name")
                print(f"DEBUG: Available workflow names: {[w.get('name') for w in workflows[:5]]}...")
                return None
                
        except Exception as e:
            print(f"ERROR: Failed to get workflow details for {workflow_id}: {e}")
            return None
    
    def understand_user_intent(self, message: str, session_context: Dict) -> Dict:
        """Analyze user intent using OpenAI"""
        try:
            system_prompt = f"""
You are an AI Business Intelligence Coordinator. Your role is to guide users through our BI workflow system and help them discover available n8n workflows.

**Available Workflows:**
- We have n8n workflows for various business intelligence tasks
- Users can ask to see available workflows
- You can guide them through our 4-phase BI approach

**BI Workflow Phases:**
1. **Metadata Discovery** - Understanding business concepts and data sources
2. **Data Cataloging** - Organizing and documenting data assets  
3. **Data Vault Generation** - Creating HUB, LINK, and SATELLITE tables
4. **Business Intelligence** - Analysis, reporting, and insights

**Key Concepts:**
- HUB tables: Central business entities with business keys
- LINK tables: Relationships between multiple hubs
- SATELLITE tables: Descriptive attributes and historical changes
- Business Key: Unique identifier for business entities
- Grain: Level of detail for data storage
- Degenerate: Attributes that don't fit standard patterns

**Your Role:**
- Guide users through workflow phases
- Explain data vault concepts
- List available n8n workflows when requested
- Help users understand where to start
- Provide educational content about BI best practices

**CRITICAL RULES:**
- NEVER pretend to be a specialized agent
- ALWAYS use MCP to verify workflow availability
- Focus on guidance and education, not execution
- Help users understand the BI workflow process
- Direct users to appropriate workflows based on their needs

Respond as a helpful BI coordinator who guides users through our workflow system.
"""
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            intent_analysis = {
                "intent": "general_guidance",
                "confidence": 0.8,
                "response": response.choices[0].message.content,
                "suggested_actions": [],
                "workflow_recommendations": []
            }
            
            return intent_analysis
            
        except Exception as e:
            print(f"Error in intent analysis: {e}")
            return {
                "intent": "error",
                "confidence": 0.0,
                "response": "I'm having trouble understanding your request. Could you please rephrase?",
                "error": str(e)
            }
    
    def process_message(self, message: str, session_id: str, turn: int = 0) -> Dict:
        """Process user message and provide guidance"""
        try:
            # Initialize or get session context
            if session_id not in self.session_contexts:
                self.session_contexts[session_id] = {
                    "session_id": session_id,
                    "created_at": datetime.now().isoformat(),
                    "messages": [],
                    "current_phase": "discovery",
                    "turn": 0
                }
            
            session_context = self.session_contexts[session_id]
            session_context["turn"] = turn
            session_context["messages"].append({
                "role": "user",
                "content": message,
                "timestamp": datetime.now().isoformat(),
                "turn": turn
            })
            
            # Check if this is a direct workflow listing request OR BI guidance request
            workflow_or_guidance_result = self.handle_workflow_listing_request(message, session_context)
            if workflow_or_guidance_result:
                print(f"DEBUG: Handling workflow listing or BI guidance request directly")
                
                if workflow_or_guidance_result.get("status") == "bi_guidance":
                    return {
                        "status": "bi_guidance",
                        "session_id": session_id,
                        "response": workflow_or_guidance_result["message"],
                        "guidance": workflow_or_guidance_result.get("guidance"),
                        "phase": workflow_or_guidance_result.get("phase"),
                        "turn": turn + 1,
                        "current_agent": "coordinator"
                    }
                elif workflow_or_guidance_result.get("status") == "workflow_listing":
                    return {
                        "status": "workflow_listing",
                        "session_id": session_id,
                        "response": workflow_or_guidance_result["message"],
                        "workflows": workflow_or_guidance_result.get("workflows", []),
                        "workflow_count": workflow_or_guidance_result.get("workflow_count", 0),
                        "mcp_used": workflow_or_guidance_result.get("mcp_used", False),
                        "turn": turn + 1,
                        "current_agent": "coordinator"
                    }
                else:
                    return {
                        "status": workflow_or_guidance_result.get("status", "success"),
                        "session_id": session_id,
                        "response": workflow_or_guidance_result.get("message", "Request processed successfully"),
                        "turn": turn + 1,
                        "current_agent": "coordinator"
                    }
            
            # Use enhanced intent analysis for general guidance
            intent_analysis = self.understand_user_intent(message, session_context)
            
            # Store the analysis in session context
            session_context["last_intent"] = intent_analysis
            session_context["messages"].append({
                "role": "assistant",
                "content": intent_analysis["response"],
                "timestamp": datetime.now().isoformat(),
                "turn": turn + 1
            })
            
            return {
                "status": "success",
                "session_id": session_id,
                "response": intent_analysis["response"],
                "intent": intent_analysis.get("intent"),
                "confidence": intent_analysis.get("confidence"),
                "turn": turn + 1,
                "current_agent": "coordinator"
            }
            
        except Exception as e:
            print(f"Error in process_message: {e}")
            return {
                "status": "error",
                "session_id": session_id,
                "response": "Sorry, I encountered an error processing your request. Please try again.",
                "error": str(e),
                "turn": turn + 1,
                "current_agent": "coordinator"
            }
    
    def handle_workflow_listing_request(self, message: str, session_context: Dict) -> Dict:
        """Handle workflow listing requests and BI guidance requests"""
        try:
            print(f"DEBUG: ===== handle_workflow_listing_request ENTRY =====")
            print(f"DEBUG: Message: '{message}'")
            print(f"DEBUG: Session context keys: {list(session_context.keys()) if session_context else 'None'}")
            
            # Check if this is a workflow listing request
            workflow_keywords = [
                "workflow", "workflows", "list", "show", "available", "n8n", "execute", "run",
                "what workflows", "which workflows", "available workflows", "workflow list"
            ]
            
            # Check if this is a BI guidance request
            bi_guidance_keywords = [
                "hub", "link", "satellite", "business key", "grain", "degenerate",
                "conceptual business element", "cbe", "physical metadata", "schema attribution",
                "database assistant", "story agent", "analysis", "reporting", "insights",
                "data vault", "business intelligence", "bi workflow", "metadata discovery", 
                "data cataloging", "data vault generation"
            ]
            
            message_lower = message.lower()
            print(f"DEBUG: Checking message: '{message}' (lowercase: '{message_lower}')")
            
            is_workflow_request = any(keyword in message_lower for keyword in workflow_keywords)
            is_bi_guidance_request = any(keyword in message_lower for keyword in bi_guidance_keywords)
            
            print(f"DEBUG: is_workflow_request = {is_workflow_request}, is_bi_guidance_request = {is_bi_guidance_request}")
            
            # Debug: Show which keywords matched
            if is_bi_guidance_request:
                matched_keywords = [kw for kw in bi_guidance_keywords if kw in message_lower]
                print(f"DEBUG: BI guidance keywords matched: {matched_keywords}")
            if is_workflow_request:
                matched_keywords = [kw for kw in workflow_keywords if kw in message_lower]
                print(f"DEBUG: Workflow keywords matched: {matched_keywords}")
            
            # Handle BI workflow guidance requests first
            if is_bi_guidance_request:
                print(f"DEBUG: Detected BI workflow guidance request: {message}")
                guidance_result = self.get_bi_workflow_guidance(message)
                
                if guidance_result.get("success"):
                    return {
                        "status": "bi_guidance",
                        "message": guidance_result["response"],
                        "guidance": guidance_result.get("guidance"),
                        "phase": guidance_result.get("phase")
                    }
                else:
                    return {
                        "status": "bi_guidance",
                        "message": "I can help you understand our BI workflow system. We have a 4-phase approach: Metadata Discovery, Data Cataloging, Data Vault Generation, and Business Intelligence. What specific aspect would you like to learn about?"
                    }
            
            # Handle workflow listing requests
            elif is_workflow_request:
                print(f"DEBUG: Detected workflow listing request: {message}")
                
                try:
                    # Get workflows via MCP
                    workflows = self.get_n8n_workflows()
                    
                    if workflows:
                        workflow_count = len(workflows)
                        workflow_names = [w.get("name", "Unknown") for w in workflows[:10]]  # Show first 10
                        
                        response_message = f"I have access to {workflow_count} n8n workflows:\n\n"
                        response_message += "\n".join([f"• {name}" for name in workflow_names])
                        
                        if workflow_count > 10:
                            response_message += f"\n\n... and {workflow_count - 10} more workflows."
                        
                        response_message += "\n\nYou can ask me to explain specific workflows or get guidance on our BI workflow phases."
                        
                        return {
                            "status": "workflow_listing",
                            "message": response_message,
                            "workflows": workflows,
                            "workflow_count": workflow_count,
                            "mcp_used": True
                        }
                    else:
                        return {
                            "status": "workflow_listing",
                            "message": "I'm having trouble accessing the workflow list right now. You can ask me about our BI workflow phases or specific data vault concepts instead.",
                            "workflows": [],
                            "workflow_count": 0,
                            "mcp_used": False
                        }
                        
                except Exception as mcp_error:
                    print(f"DEBUG: MCP workflow fetch failed: {mcp_error}")
                    return {
                        "status": "workflow_listing",
                        "message": "I'm having trouble accessing the workflow list right now. You can ask me about our BI workflow phases or specific data vault concepts instead.",
                        "workflows": [],
                        "workflow_count": 0,
                        "mcp_used": False,
                        "error": str(mcp_error)
                    }
            else:
                print(f"DEBUG: Not a workflow listing or BI guidance request")
                return None  # Not a workflow listing or BI guidance request
                
        except Exception as e:
            print(f"DEBUG: Error in handle_workflow_listing_request: {e}")
            print(f"DEBUG: Error type: {type(e)}")
            import traceback
            print(f"DEBUG: Error traceback: {traceback.format_exc()}")
            return None
    
    def get_bi_workflow_guidance(self, user_query: str) -> Dict:
        """Provide guidance on BI workflow phases and concepts"""
        try:
            query_lower = user_query.lower()
            
            # Check for phase-specific questions
            if any(phase.lower() in query_lower for phase in ["metadata discovery", "discovery"]):
                return {
                    "success": True,
                    "response": "**Metadata Discovery** is the first phase of our BI workflow system. In this phase, we:\n\n• Identify and document business concepts and entities\n• Map data sources and their relationships\n• Create business glossaries and conceptual models\n• Understand the business context and requirements\n\nThis phase involves our Inception Agent, Glossary Agent, and Business Concept Agent to help catalog business metadata.",
                    "phase": "metadata_discovery",
                    "guidance": "Start by understanding your business domain and key entities"
                }
            
            elif any(phase.lower() in query_lower for phase in ["data cataloging", "cataloging", "catalog"]):
                return {
                    "success": True,
                    "response": "**Data Cataloging** is the second phase where we:\n\n• Document data sources, schemas, and profiles\n• Map business keys and grain levels\n• Identify degenerate dimensions and attributes\n• Create comprehensive data documentation\n\nThis phase uses our Physical Metadata Agent and Schema Attribution Agent to systematically catalog your data assets.",
                    "phase": "data_cataloging", 
                    "guidance": "Focus on understanding your data structure and business keys"
                }
            
            elif any(phase.lower() in query_lower for phase in ["data vault", "vault", "hub", "link", "satellite"]):
                return {
                    "success": True,
                    "response": "**Data Vault Generation** is the third phase where we create:\n\n• **HUB tables**: Central business entities with business keys\n• **LINK tables**: Relationships between multiple hubs\n• **SATELLITE tables**: Descriptive attributes and historical changes\n\nThis phase uses our Database Assistant to generate the actual database objects based on the metadata and cataloging from previous phases.",
                    "phase": "data_vault_generation",
                    "guidance": "Focus on business keys and relationship modeling"
                }
            
            elif any(phase.lower() in query_lower for phase in ["business intelligence", "bi", "analysis", "insights"]):
                return {
                    "success": True,
                    "response": "**Business Intelligence** is the final phase where we:\n\n• Generate reports and dashboards\n• Create data models for analysis\n• Build business vault objects\n• Enable self-service analytics\n\nThis phase leverages all the structured data from previous phases to provide actionable business insights.",
                    "phase": "business_intelligence",
                    "guidance": "Focus on business value and actionable insights"
                }
            
            # Check for concept-specific questions
            elif any(concept in query_lower for concept in ["hub", "link", "satellite"]):
                concept_explanation = self.explain_data_vault_concepts(query_lower)
                return {
                    "success": True,
                    "response": concept_explanation,
                    "phase": "data_vault_generation",
                    "guidance": "Understand the data vault pattern for flexible data modeling"
                }
            
            # General BI workflow guidance
            else:
                return {
                    "success": True,
                    "response": "Our **BI Workflow System** follows a structured 4-phase approach:\n\n1. **Metadata Discovery** - Understanding business concepts and data sources\n2. **Data Cataloging** - Organizing and documenting data assets\n3. **Data Vault Generation** - Creating HUB, LINK, and SATELLITE tables\n4. **Business Intelligence** - Analysis, reporting, and insights\n\nEach phase builds on the previous one, creating a comprehensive foundation for business intelligence. What specific phase or concept would you like to learn more about?",
                    "phase": "overview",
                    "guidance": "Start with understanding your business domain and data sources"
                }
                
        except Exception as e:
            print(f"Error in get_bi_workflow_guidance: {e}")
            return {
                "success": False,
                "response": "I'm having trouble providing guidance right now. Please try asking about a specific BI workflow phase or concept.",
                "error": str(e)
            }
    
    def explain_data_vault_concepts(self, concept: str) -> str:
        """Explain data vault concepts in detail"""
        concept_lower = concept.lower()
        
        if "hub" in concept_lower:
            return """**HUB Tables** are the foundation of the Data Vault pattern:

• **Purpose**: Store the core business entities and their business keys
• **Structure**: Minimal tables with just the business key and metadata
• **Example**: Customer Hub (customer_id, load_date, record_source)
• **Benefits**: 
  - Central source of truth for business entities
  - Easy to track changes over time
  - Supports multiple source systems
  - Flexible for future changes

Think of HUBs as the 'nouns' of your business - the core things you care about."""
        
        elif "link" in concept_lower:
            return """**LINK Tables** represent relationships between business entities:

• **Purpose**: Connect multiple HUBs to show business relationships
• **Structure**: Contains foreign keys to multiple HUBs plus metadata
• **Example**: Order_Product_Link (order_id, product_id, load_date, record_source)
• **Benefits**:
  - Flexible relationship modeling
  - Easy to add new relationship types
  - Supports many-to-many relationships
  - Historical relationship tracking

Think of LINKs as the 'verbs' or relationships between your business entities."""
        
        elif "satellite" in concept_lower:
            return """**SATELLITE Tables** store descriptive attributes and historical changes:

• **Purpose**: Hold all the descriptive data about business entities
• **Structure**: Foreign key to HUB/LINK plus attributes and change tracking
• **Example**: Customer_Satellite (customer_id, name, email, address, load_date, record_source)
• **Benefits**:
  - Complete historical tracking
  - Flexible attribute management
  - Easy to add new attributes
  - Supports multiple source systems

Think of SATELLITEs as the 'adjectives' - all the descriptive information about your entities."""
        
        elif "business key" in concept_lower:
            return """**Business Keys** are the unique identifiers that business users understand:

• **Purpose**: Uniquely identify business entities in business terms
• **Characteristics**: 
  - Stable over time
  - Meaningful to business users
  - Independent of technical implementation
• **Examples**: 
  - Customer: customer_number, email_address
  - Product: product_code, sku
  - Order: order_number, invoice_number
• **Benefits**:
  - Business users can relate to the data
  - Stable across system changes
  - Supports data lineage tracking

Business keys are what make your data vault 'business-driven' rather than 'technically-driven'."""
        
        elif "grain" in concept_lower:
            return """**Grain** refers to the level of detail at which data is stored:

• **Purpose**: Define the atomic level of data storage
• **Examples**:
  - Daily sales (grain: day)
  - Monthly summaries (grain: month)
  - Transaction-level (grain: transaction)
• **Importance**:
  - Determines what questions you can answer
  - Affects storage and performance
  - Influences data modeling decisions
• **Best Practices**:
  - Store at the lowest practical grain
  - Aggregate up rather than down
  - Document grain clearly in metadata

The grain should match your business requirements and analytical needs."""
        
        elif "degenerate" in concept_lower:
            return """**Degenerate Dimensions** are attributes that don't fit standard patterns:

• **Purpose**: Store attributes that are unique to specific business events
• **Characteristics**:
  - Often single-use or event-specific
  - Don't warrant their own dimension table
  - May be high-cardinality
• **Examples**:
  - Order line number
  - Invoice line sequence
  - Transaction timestamp
  - Batch ID
• **Benefits**:
  - Maintains data integrity
  - Supports detailed analysis
  - Flexible for future requirements

Degenerate dimensions help capture the full context of business events without over-normalizing."""
        
        else:
            return """**Data Vault** is a modeling methodology designed for:

• **Flexibility**: Easy to add new data sources and attributes
• **Auditability**: Complete historical tracking of all changes
• **Scalability**: Handles large volumes of data efficiently
• **Business Alignment**: Models business concepts directly

**Key Components**:
1. **HUBs** - Core business entities (nouns)
2. **LINKS** - Business relationships (verbs)  
3. **SATELLITEs** - Descriptive attributes (adjectives)

**When to Use**:
• Complex, changing business environments
• Multiple source systems
• Need for historical tracking
• Business-driven modeling approach

This pattern is particularly effective for data warehouses and analytical systems that need to adapt to changing business requirements."""

    def get_workflow_guidance(self, workflow_id: str, user_message: str, session_context: Dict = None) -> Dict:
        """Provide guidance for a specific workflow instead of executing it"""
        try:
            # Get workflow details to provide context
            workflows = self.get_n8n_workflows()
            workflow = next((w for w in workflows if w.get("id") == workflow_id), None)
            
            if not workflow:
                return {
                    "success": False,
                    "status": "not_found",
                    "message": f"Workflow {workflow_id} not found",
                    "guidance": "Please check the workflow ID or ask me to list available workflows."
                }
            
            workflow_name = workflow.get("name", "Unknown Workflow")
            
            # Provide guidance based on workflow type
            if "home automation" in workflow_name.lower():
                guidance = f"""I can help guide you through the **{workflow_name}** workflow!

This workflow is designed for home automation tasks. To use it:
1. **Click "Start Chat"** in the frontend to open a dedicated chat interface
2. **Ask questions** about home automation, smart devices, or IoT setup
3. **The workflow will respond** directly through the n8n integration

**What you can ask about:**
• Smart lighting setup and recommendations
• Home security system configuration
• Thermostat and HVAC automation
• Smart home hub integration
• Device troubleshooting and optimization

Would you like me to explain more about this workflow or help you get started?"""
            else:
                guidance = f"""I can help guide you through the **{workflow_name}** workflow!

This appears to be a business intelligence or data processing workflow. To use it:
1. **Click "Start Chat"** in the frontend to open a dedicated chat interface
2. **Ask questions** related to the workflow's purpose
3. **The workflow will respond** directly through the n8n integration

**What you can ask about:**
• Workflow capabilities and features
• How to use the workflow effectively
• Best practices for the workflow
• Troubleshooting common issues

Would you like me to explain more about this workflow or help you get started?"""
            
            return {
                "success": True,
                "status": "guidance_provided",
                "message": "Workflow guidance provided successfully",
                "workflow_name": workflow_name,
                "workflow_id": workflow_id,
                "guidance": guidance,
                "execution_method": "guidance_only"
            }
            
        except Exception as e:
            print(f"Error providing workflow guidance: {e}")
            return {
                "success": False,
                "status": "error",
                "message": f"Error providing workflow guidance: {str(e)}",
                "error": str(e)
            }

    def execute_workflow_via_mcp(self, workflow_id: str, user_message: str, session_context: dict = None) -> dict:
        """Execute a workflow via MCP and return the result"""
        try:
            print(f"DEBUG: Executing workflow {workflow_id} via MCP")
            
            # Get workflow details to determine the webhook URL
            workflow_details = self.get_workflow_details(workflow_id)
            if not workflow_details:
                return {
                    "success": False,
                    "message": f"Workflow {workflow_id} not found",
                    "error": "Workflow not found"
                }
            
            # Map workflow to agent type for webhook URL
            agent_type = self._map_workflow_to_agent_type(workflow_id)
            if not agent_type:
                return {
                    "success": False,
                    "message": f"Could not determine agent type for workflow {workflow_id}",
                    "error": "Agent type mapping failed"
                }
            
            # Prepare the message payload
            message_payload = {
                "message": user_message,
                "sessionId": session_context.get("session_id", "default") if session_context else "default",
                "action": "sendMessage",
                "chatInput": user_message,
                "turn": session_context.get("turn", 1) if session_context else 1,
                "timestamp": datetime.now().isoformat()
            }
            
            # Trigger the workflow webhook
            webhook_result = self._trigger_workflow_webhook(agent_type, message_payload)
            
            if webhook_result.get("success"):
                return {
                    "success": True,
                    "message": webhook_result.get("response", "Workflow executed successfully"),
                    "workflow_id": workflow_id,
                    "response": webhook_result.get("response"),
                    "session_id": webhook_result.get("session_id")
                }
            else:
                return {
                    "success": False,
                    "message": "Workflow execution failed",
                    "error": webhook_result.get("error"),
                    "workflow_id": workflow_id
                }
                
        except Exception as e:
            print(f"ERROR: Failed to execute workflow {workflow_id}: {e}")
            return {
                "success": False,
                "message": f"Workflow execution failed: {str(e)}",
                "error": str(e),
                "workflow_id": workflow_id
            }
    
    def _map_workflow_to_agent_type(self, workflow_id: str) -> str:
        """Map a workflow ID or name to an agent type for webhook routing"""
        # This maps workflow IDs and names to agent types for webhook URL determination
        workflow_agent_mapping = {
            # Gerald workflows
            "0MJnXDF8dnJiiU6l": "gerald",  # Gerald - AI Agent Handoff Test
            "gerald": "gerald",
            "gerald-ai-agent-handoff-test": "gerald",
            
            # Home Automation workflows
            "V59ZdxTNusKy1Swt": "homeautomation",  # homeautomation advisor (OLD - no response)
            "UX89r3MaqIlMZxj8": "homeautomation",  # homeautomation advisor copy (FIXED - has response)
            "MlVMLQ5WeM1vthTL": "homeautomation",  # homeautomation advisor webapp copy (NEW - FIXED)
            "qEEj6zJeen9azsgc": "homeautomation",  # Home Automation Advisor - Chat
            "d2uRmsz36XsQePg1": "homeautomation",  # Home Automation Advisor - Simple
            "YWEsjHDaEStwlrZO": "homeautomation",  # Home Automation Advisor - Fixed
            "kVmJVQpGNV2GhXAA": "homeautomation",  # Home Automation Advisor - Basic
            
            # Handle workflow names
            "homeautomation-advisor": "homeautomation",  # Will use the FIXED copy
            "home-automation-advisor": "homeautomation",
            "homeautomation": "homeautomation",
            
            # Inception workflows
            "GgtIp2s248TE9ppd": "inception",  # Inception Agent Restored
            "3Qm6jbbc8jhlZayR": "inception",  # Business Problem Inception Agent - Advanced
            "business-problem-inception-agent": "inception",
            "business problem inception agent": "inception",  # Handle spaces
            "inception-agent": "inception",
        }
        
        return workflow_agent_mapping.get(workflow_id)
    
    def _trigger_workflow_webhook(self, agent_type: str, message_payload: dict) -> dict:
        """Trigger the appropriate workflow webhook based on agent type"""
        try:
            if agent_type == "gerald":
                webhook_url = "https://n8n.casamccartney.link/webhook/ca361862-55b2-49a0-a765-ff06b90e416a/chat"
            elif agent_type == "homeautomation":
                webhook_url = "https://n8n.casamccartney.link/webhook/ca361862-55b2-49a0-a765-ff06b90e416a/chat"
            elif agent_type == "inception":
                webhook_url = "https://n8n.casamccartney.link/webhook/1269a389-347f-44ae-918e-840c26918584/chat"
            else:
                return {
                    "success": False,
                    "error": f"Unknown agent type: {agent_type}"
                }
            
            print(f"DEBUG: Triggering {agent_type} workflow webhook: {webhook_url}")
            print(f"DEBUG: Payload: {message_payload}")
            
            # Convert message format for LangChain Chat Triggers
            if agent_type == "inception":
                # LangChain Chat Trigger expects chatInput and sessionId
                langchain_payload = {
                    "chatInput": message_payload.get("message", message_payload.get("user_input", "")),
                    "sessionId": message_payload.get("session_id", f"session-{hash(str(message_payload))}")
                }
                webhook_payload = langchain_payload
            else:
                # Regular webhook format for other agents
                webhook_payload = message_payload
            
            print(f"DEBUG: Converted payload for {agent_type}: {webhook_payload}")
            
            response = requests.post(
                webhook_url,
                json=webhook_payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    
                    # Handle n8n webhook response format
                    ai_response = "Workflow executed successfully"  # Default fallback
                    
                    # Handle LangChain Chat Agent response format (for inception agents)
                    if agent_type == "inception" and "output" in result:
                        ai_response = result["output"]
                    # Check for 'output' field (common n8n response format)
                    elif "output" in result:
                        output = result["output"]
                        # If output is a JSON string, parse it
                        if isinstance(output, str):
                            try:
                                parsed_output = json.loads(output)
                                ai_response = parsed_output.get("response", output)
                            except json.JSONDecodeError:
                                ai_response = output
                        else:
                            ai_response = output
                    # Fallback to direct response/message fields
                    elif "response" in result:
                        ai_response = result["response"]
                    elif "message" in result:
                        ai_response = result["message"]
                    
                    print(f"DEBUG: Parsed AI response: {ai_response}")
                    
                    return {
                        "success": True,
                        "response": ai_response,
                        "session_id": result.get("session_id", message_payload.get("sessionId"))
                    }
                except json.JSONDecodeError:
                    return {
                        "success": True,
                        "response": response.text,
                        "session_id": message_payload.get("sessionId")
                    }
            else:
                return {
                    "success": False,
                    "error": f"Webhook returned status {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            print(f"ERROR: Failed to trigger webhook for {agent_type}: {e}")
            return {
                "success": False,
                "error": str(e)
            }

# Create global coordinator instance
coordinator = AgentCoordinator() 