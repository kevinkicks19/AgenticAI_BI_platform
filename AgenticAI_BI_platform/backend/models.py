from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Enums
class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"

class ChatStatus(str, Enum):
    IDLE = "idle"
    WAITING = "waiting"
    ERROR = "error"

class WorkflowStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    RUNNING = "running"
    ERROR = "error"

class AgentType(str, Enum):
    TRIAGE = "triage"
    DATA_ANALYST = "data_analyst"
    DOCUMENT_PROCESSOR = "document_processor"
    WORKFLOW_ORCHESTRATOR = "workflow_orchestrator"

class GuardrailViolationType(str, Enum):
    SECURITY = "security"
    COMPLIANCE = "compliance"
    DATA_PRIVACY = "data_privacy"
    BUSINESS_RULE = "business_rule"

# Base Models
class BaseResponse(BaseModel):
    status: str = Field(..., description="Response status")
    message: Optional[str] = Field(None, description="Response message")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")

class ErrorResponse(BaseResponse):
    status: str = Field(default="error", description="Error status")
    error_code: Optional[str] = Field(None, description="Error code")
    details: Optional[Dict[str, Any]] = Field(None, description="Error details")

# Chat Models
class AgentInfo(BaseModel):
    name: str = Field(..., description="Agent name")
    description: str = Field(..., description="Agent description")
    capabilities: Optional[List[str]] = Field(None, description="Agent capabilities")

class GuardrailViolation(BaseModel):
    guardrail: str = Field(..., description="Guardrail identifier")
    name: str = Field(..., description="Guardrail name")
    description: str = Field(..., description="Guardrail description")
    severity: str = Field(default="medium", description="Violation severity")
    type: GuardrailViolationType = Field(..., description="Violation type")

class ChatMessage(BaseModel):
    role: MessageRole = Field(..., description="Message role")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.now, description="Message timestamp")
    agent_info: Optional[AgentInfo] = Field(None, description="Agent information")
    guardrail_violation: Optional[GuardrailViolation] = Field(None, description="Guardrail violation info")
    status: Optional[str] = Field(None, description="Message status")

class ChatRequest(BaseModel):
    message: str = Field(..., description="User message", min_length=1, max_length=4000)
    session_id: Optional[str] = Field("default", description="Session identifier")
    turn: Optional[int] = Field(0, description="Turn number")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")

class ChatResponse(BaseResponse):
    response: str = Field(..., description="AI response")
    session_id: str = Field(..., description="Session identifier")
    turn: int = Field(..., description="Turn number")
    current_agent: Optional[str] = Field(None, description="Current active agent")
    agent_info: Optional[AgentInfo] = Field(None, description="Agent information")
    violations: Optional[List[GuardrailViolation]] = Field(None, description="Guardrail violations")
    workflow_trigger: Optional[bool] = Field(None, description="Whether workflow was triggered")
    workflow_id: Optional[str] = Field(None, description="Workflow identifier")
    workflow_name: Optional[str] = Field(None, description="Workflow name")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Workflow parameters")

# Workflow Models
class WorkflowInfo(BaseModel):
    id: str = Field(..., description="Workflow identifier")
    name: str = Field(..., description="Workflow name")
    description: str = Field(..., description="Workflow description")
    agent_type: AgentType = Field(..., description="Associated agent type")
    webhook_url: str = Field(..., description="Webhook URL")
    status: WorkflowStatus = Field(..., description="Workflow status")
    last_run: Optional[datetime] = Field(None, description="Last execution time")
    success_rate: Optional[float] = Field(None, description="Success rate percentage")
    created_at: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update timestamp")

class WorkflowSequence(BaseModel):
    name: str = Field(..., description="Sequence name")
    description: str = Field(..., description="Sequence description")
    steps: List[str] = Field(..., description="Workflow step identifiers")
    estimated_duration: Optional[int] = Field(None, description="Estimated duration in minutes")

class WorkflowRegistry(BaseModel):
    agent_type: AgentType = Field(..., description="Agent type")
    workflow_id: str = Field(..., description="Workflow identifier")
    priority: Optional[int] = Field(1, description="Execution priority")

class WorkflowResponse(BaseResponse):
    n8n_workflows: List[WorkflowInfo] = Field(default_factory=list, description="Available n8n workflows")
    workflow_sequences: Dict[str, WorkflowSequence] = Field(default_factory=dict, description="Workflow sequences")
    workflow_registry: Dict[str, str] = Field(default_factory=dict, description="Workflow registry")
    total_n8n_workflows: int = Field(0, description="Total number of workflows")

class WorkflowRegistrationRequest(BaseModel):
    agent_type: AgentType = Field(..., description="Agent type")
    workflow_id: str = Field(..., description="Workflow identifier")

# Document Models
class DocumentInfo(BaseModel):
    id: str = Field(..., description="Document identifier")
    filename: str = Field(..., description="Original filename")
    content_type: str = Field(..., description="MIME type")
    size: int = Field(..., description="File size in bytes")
    upload_date: datetime = Field(default_factory=datetime.now, description="Upload timestamp")
    processed: bool = Field(default=False, description="Processing status")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Document metadata")

class DocumentUploadResponse(BaseResponse):
    document_id: str = Field(..., description="Uploaded document identifier")
    filename: str = Field(..., description="Original filename")
    size: int = Field(..., description="File size in bytes")
    content_type: str = Field(..., description="MIME type")
    processing_status: str = Field(..., description="Processing status")

# User Models
class UserProfile(BaseModel):
    user_id: str = Field(..., description="User identifier")
    username: str = Field(..., description="Username")
    role: str = Field(..., description="User role")
    notification_preferences: Dict[str, bool] = Field(default_factory=dict, description="Notification preferences")
    default_workflow: Optional[str] = Field(None, description="Default workflow URL")
    persistence_parameters: Dict[str, Any] = Field(default_factory=dict, description="Persistence settings")
    llm_model_preferences: Dict[str, Any] = Field(default_factory=dict, description="LLM model preferences")

# Approval Models
class ApprovalRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    approved: bool = Field(..., description="Approval decision")
    reason: Optional[str] = Field(None, description="Approval reason")
    approver: Optional[str] = Field(None, description="Approver identifier")

class ApprovalResponse(BaseResponse):
    approval_id: str = Field(..., description="Approval identifier")
    session_id: str = Field(..., description="Session identifier")
    approved: bool = Field(..., description="Approval decision")
    processed_at: datetime = Field(default_factory=datetime.now, description="Processing timestamp")

# Guardrails Models
class GuardrailCheckRequest(BaseModel):
    message: str = Field(..., description="Message to check")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")

class GuardrailCheckResponse(BaseResponse):
    violations: List[GuardrailViolation] = Field(default_factory=list, description="Detected violations")
    passed: bool = Field(..., description="Whether message passed all guardrails")

class GuardrailStatusResponse(BaseResponse):
    total_violations: int = Field(0, description="Total violations count")
    violations_by_type: Dict[str, int] = Field(default_factory=dict, description="Violations by type")
    recent_violations: List[GuardrailViolation] = Field(default_factory=list, description="Recent violations")

# DataHub Models
class DataHubContextRequest(BaseModel):
    entity_urn: Optional[str] = Field(None, description="Entity URN")
    query: Optional[str] = Field(None, description="Search query")

class DataHubContextResponse(BaseResponse):
    entity_urn: Optional[str] = Field(None, description="Entity URN")
    context: Dict[str, Any] = Field(default_factory=dict, description="DataHub context")
    search_results: Optional[List[Dict[str, Any]]] = Field(None, description="Search results")

# Affine Models
class AffineDocumentRequest(BaseModel):
    content: str = Field(..., description="Document content")
    session_id: str = Field(..., description="Session identifier")
    workflow_id: str = Field(..., description="Workflow identifier")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="Creation timestamp")

class AffineDocumentResponse(BaseResponse):
    document_id: str = Field(..., description="Created document identifier")
    affine_url: str = Field(..., description="Affine document URL")
    session_id: str = Field(..., description="Session identifier")
    workflow_id: str = Field(..., description="Workflow identifier")

# Health Check Models
class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Check timestamp")
    version: str = Field(..., description="Service version")
    uptime: float = Field(..., description="Service uptime in seconds")
    dependencies: Dict[str, str] = Field(default_factory=dict, description="Dependency status")

# Metrics Models
class SystemMetrics(BaseModel):
    active_workflows: int = Field(0, description="Number of active workflows")
    documents_processed: int = Field(0, description="Total documents processed")
    chat_sessions: int = Field(0, description="Active chat sessions")
    success_rate: float = Field(0.0, description="Overall success rate")
    average_response_time: float = Field(0.0, description="Average response time in seconds")
    total_requests: int = Field(0, description="Total API requests")
    error_rate: float = Field(0.0, description="Error rate percentage")

class MetricsResponse(BaseResponse):
    metrics: SystemMetrics = Field(..., description="System metrics")
    last_updated: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
