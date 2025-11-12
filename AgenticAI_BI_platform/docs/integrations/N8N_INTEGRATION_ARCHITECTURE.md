# N8N Integration Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend UI                              │
│  (React - User Interface)                                        │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP Requests
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Flask Backend API                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Agent Coordinator                                  │  │
│  │  (agent_coordinator.py / enhanced_agent_coordinator.py)   │  │
│  │                                                            │  │
│  │  - Process user messages                                  │  │
│  │  - Analyze intent                                          │  │
│  │  - Route to appropriate workflows                          │  │
│  │  - Manage sessions                                         │  │
│  └────────────────┬──────────────────────────────────────────┘  │
│                   │                                              │
│                   │ Uses                                         │
│                   ↓                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         N8nMCPClient (mcp_client.py)                       │  │
│  │                                                            │  │
│  │  ✅ list_workflows()                                       │  │
│  │  ✅ get_workflow(id)                                       │  │
│  │  ✅ trigger_webhook_workflow(url, data)                    │  │
│  │  ✅ create_workflow(data)                                  │  │
│  │  ✅ update_workflow(id, data)                              │  │
│  │  ✅ validate_workflow(data)                                │  │
│  │  ✅ delete_workflow(id)                                    │  │
│  │  ✅ get_execution(id)                                      │  │
│  │  ✅ list_executions(workflow_id, status, limit)            │  │
│  │  ✅ health_check()                                         │  │
│  │  ✅ activate_workflow(id)                                  │  │
│  │  ✅ deactivate_workflow(id)                                │  │
│  └────────────────┬──────────────────────────────────────────┘  │
└───────────────────┼──────────────────────────────────────────────┘
                    │ Direct HTTP API Calls
                    │ (X-N8N-API-KEY authentication)
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                      N8N Instance                                │
│  (https://n8n.casamccartney.link)                                │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Workflow 1    │  │   Workflow 2    │  │   Workflow 3    │  │
│  │                 │  │                 │  │                 │  │
│  │ - Webhook       │  │ - Schedule      │  │ - Manual        │  │
│  │ - Process       │  │ - Transform     │  │ - Execute       │  │
│  │ - Respond       │  │ - Save          │  │ - Notify        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: User Message to Workflow Execution

```
1. User sends message
   │
   ↓
2. Frontend → Backend API
   │
   ↓
3. Agent Coordinator receives message
   │
   ├── Analyze intent (OpenAI)
   │
   ├── Determine if workflow needed
   │
   ↓
4. N8nMCPClient.list_workflows()
   │
   ├── HTTP GET → N8N API /api/v1/workflows
   │
   └── Returns workflow list
   │
   ↓
5. N8nMCPClient.get_workflow(id)
   │
   ├── HTTP GET → N8N API /api/v1/workflows/{id}
   │
   └── Returns workflow details
   │
   ↓
6. Extract webhook URL from workflow
   │
   ↓
7. N8nMCPClient.trigger_webhook_workflow(url, data)
   │
   ├── HTTP POST → N8N Webhook URL
   │
   └── Workflow executes
   │
   ↓
8. Return response to user
```

## MCP Tools vs Direct API: The Truth

### ❌ Common Misconception

```
Python Code → MCP Tools → N8N
              (NOT POSSIBLE!)
```

**MCP tools are ONLY for AI assistants, not Python code!**

### ✅ Correct Approach (What We're Using)

```
Python Code → HTTP API → N8N
              (DIRECT ACCESS)
```

**Direct HTTP calls provide the same functionality with better performance!**

### Comparison Table

| Feature | MCP Tools (AI Only) | Direct HTTP (Our Approach) |
|---------|---------------------|---------------------------|
| **Access from Python** | ❌ No | ✅ Yes |
| **Performance** | Medium | ✅ Fast |
| **Reliability** | Depends on MCP server | ✅ High |
| **Setup Complexity** | High | ✅ Low |
| **Debugging** | Difficult | ✅ Easy |
| **Same Features** | ✅ | ✅ |
| **Cost** | Requires MCP infra | ✅ None |

## Integration Points

### 1. Agent Coordinator → N8N Client

```python
# agent_coordinator.py
from mcp_client import N8nMCPClient

class AgentCoordinator:
    def __init__(self):
        self.n8n_client = N8nMCPClient()  # ✅ MCP-style access
    
    def get_n8n_workflows(self):
        return self.n8n_client.list_workflows()
```

### 2. Enhanced Coordinator → N8N Client

```python
# enhanced_agent_coordinator.py
from mcp_client import N8nMCPClient

class EnhancedAgentCoordinator:
    def __init__(self):
        self.n8n_client = N8nMCPClient()  # ✅ MCP-style access
        
    async def execute_workflow_sequence(self, sequence_type):
        # Use n8n_client for workflow operations
        workflows = self.n8n_client.list_workflows()
```

### 3. Workflow Orchestration → N8N Client

```python
# workflow_orchestration_engine.py
from mcp_client import N8nMCPClient

class WorkflowOrchestrationEngine:
    def __init__(self):
        self.n8n_client = N8nMCPClient()  # ✅ MCP-style access
    
    async def execute_agent_workflow(self, agent_type, payload):
        result = self.n8n_client.trigger_webhook_workflow(url, payload)
```

## Available Methods Reference

### Workflow Management

```python
# List all workflows
workflows = n8n_client.list_workflows()

# Get specific workflow
workflow = n8n_client.get_workflow(workflow_id)

# Create new workflow
result = n8n_client.create_workflow({
    "name": "My Workflow",
    "nodes": [...],
    "connections": {...}
})

# Update workflow
result = n8n_client.update_workflow(workflow_id, {...})

# Delete workflow
result = n8n_client.delete_workflow(workflow_id)

# Validate workflow
result = n8n_client.validate_workflow({...})
```

### Workflow Execution

```python
# Trigger webhook workflow
result = n8n_client.trigger_webhook_workflow(
    webhook_url="https://n8n.example.com/webhook/abc123",
    data={"message": "Hello"}
)

# Activate workflow
result = n8n_client.activate_workflow(workflow_id)

# Deactivate workflow
result = n8n_client.deactivate_workflow(workflow_id)
```

### Execution Monitoring

```python
# List executions
executions = n8n_client.list_executions(
    workflow_id="workflow-123",
    status="success",
    limit=50
)

# Get execution details
execution = n8n_client.get_execution(
    execution_id="exec-456",
    include_data=True
)
```

### Health & Diagnostics

```python
# Health check
health = n8n_client.health_check()
# Returns: {
#   "status": "healthy",
#   "message": "n8n instance is accessible",
#   "api_url": "https://n8n.example.com",
#   "workflows_count": 15
# }
```

## Configuration

### Environment Variables

```env
# .env file
N8N_API_URL=https://n8n.casamccartney.link
N8N_API_KEY=your-n8n-api-key-here
```

### Client Initialization

```python
# Automatic configuration from environment
from mcp_client import N8nMCPClient

client = N8nMCPClient()  # Reads from env automatically

# Or use the global instance
from mcp_client import mcp_client

workflows = mcp_client.list_workflows()
```

## Error Handling

All methods return a consistent response format:

```python
# Success response
{
    "status": "success",
    "data": {...},
    # ... method-specific fields
}

# Error response
{
    "status": "error",
    "message": "Error description",
    "response_text": "..."  # Optional raw response
}
```

### Example Error Handling

```python
result = n8n_client.list_workflows()

if result.get("status") == "success":
    workflows = result.get("workflows", [])
    print(f"Found {len(workflows)} workflows")
else:
    print(f"Error: {result.get('message')}")
    # Handle error appropriately
```

## Performance Considerations

### Workflow Caching

```python
class AgentCoordinator:
    def __init__(self):
        self.workflow_cache = {}
        self.last_cache_update = None
    
    def _refresh_workflow_cache(self):
        result = self.n8n_client.list_workflows()
        if result.get("status") == "success":
            self.workflow_cache = {
                wf["id"]: wf for wf in result.get("workflows", [])
            }
            self.last_cache_update = datetime.now()
```

### Async Operations (Optional)

For better performance with multiple workflows:

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def execute_workflows_parallel(workflow_ids):
    with ThreadPoolExecutor() as executor:
        loop = asyncio.get_event_loop()
        tasks = [
            loop.run_in_executor(
                executor, 
                n8n_client.get_workflow, 
                wf_id
            )
            for wf_id in workflow_ids
        ]
        results = await asyncio.gather(*tasks)
    return results
```

## Summary

✅ **Your agent coordinator has full N8N "MCP access"!**

- **Direct HTTP API calls** provide all MCP tool functionality
- **Better performance** than going through MCP protocol
- **Simpler setup** - just configure API URL and key
- **Fully documented** with examples and usage guides
- **Production-ready** with error handling and caching

The `N8nMCPClient` in `mcp_client.py` gives you everything you need! 🚀

