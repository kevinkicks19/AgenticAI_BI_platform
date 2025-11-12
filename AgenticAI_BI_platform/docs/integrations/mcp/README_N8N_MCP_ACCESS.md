# N8N MCP Access for Agent Coordinator

## Understanding MCP Tools vs Direct API Access

### The Reality

**MCP tools (like `mcp_n8n-mcp_*`) are ONLY accessible to AI assistants**, not Python code. They work through the Model Context Protocol, which is a client-server architecture designed for AI assistants.

### What This Means for Your Agent Coordinator

Your Python backend **cannot directly call MCP tools**. Instead, you have three options:

1. **✅ Direct HTTP API calls to n8n** (RECOMMENDED - what you're already doing)
2. **❌ AI proxy** (slow, unreliable, expensive)
3. **⚠️ MCP Python SDK** (complex setup, requires separate MCP server process)

## Recommended Approach: Enhanced HTTP Client

We've enhanced your existing `N8nMCPClient` in `mcp_client.py` to provide **full MCP-equivalent functionality** using direct HTTP API calls.

### Available Methods

Your `N8nMCPClient` now provides these methods that mirror the MCP tools:

| MCP Tool | Client Method | Description |
|----------|---------------|-------------|
| `mcp_n8n-mcp_n8n_list_workflows` | `list_workflows()` | List all workflows |
| `mcp_n8n-mcp_n8n_get_workflow` | `get_workflow(id)` | Get workflow details |
| `mcp_n8n-mcp_n8n_trigger_webhook_workflow` | `trigger_webhook_workflow(url, data)` | Trigger webhook |
| `mcp_n8n-mcp_n8n_create_workflow` | `create_workflow(data)` | Create new workflow |
| `mcp_n8n-mcp_n8n_update_full_workflow` | `update_workflow(id, data)` | Update workflow |
| `mcp_n8n-mcp_n8n_validate_workflow` | `validate_workflow(data)` | Validate workflow |
| `mcp_n8n-mcp_n8n_delete_workflow` | `delete_workflow(id)` | Delete workflow |
| `mcp_n8n-mcp_n8n_get_execution` | `get_execution(id)` | Get execution details |
| `mcp_n8n-mcp_n8n_list_executions` | `list_executions()` | List executions |
| `mcp_n8n-mcp_n8n_health_check` | `health_check()` | Check n8n health |

### Usage in Agent Coordinator

#### Option 1: Use the Global Client Instance

```python
from mcp_client import mcp_client

# List workflows
workflows = mcp_client.list_workflows()
print(f"Found {workflows.get('total_count')} workflows")

# Get specific workflow
workflow = mcp_client.get_workflow("workflow-id-here")

# Trigger webhook
result = mcp_client.trigger_webhook_workflow(
    webhook_url="https://n8n.example.com/webhook/abc123",
    data={"message": "Hello from agent coordinator"}
)

# Check health
health = mcp_client.health_check()
print(f"n8n status: {health.get('status')}")

# List executions
executions = mcp_client.list_executions(
    workflow_id="some-workflow-id",
    status="success",
    limit=50
)
```

#### Option 2: Use Convenience Functions

```python
from mcp_client import (
    n8n_list_workflows,
    n8n_get_workflow,
    n8n_trigger_webhook,
    n8n_create_workflow,
    n8n_validate_workflow,
    n8n_health_check
)

# List workflows (mirrors MCP tool exactly)
workflows = n8n_list_workflows()

# Get workflow (mirrors MCP tool exactly)
workflow = n8n_get_workflow("workflow-id")

# Trigger webhook (mirrors MCP tool exactly)
result = n8n_trigger_webhook(
    webhook_url="https://n8n.example.com/webhook/abc123",
    data={"message": "Test"}
)

# Health check (mirrors MCP tool exactly)
health = n8n_health_check()
```

#### Option 3: Update Agent Coordinator Directly

```python
# In agent_coordinator.py or enhanced_agent_coordinator.py

from mcp_client import N8nMCPClient

class AgentCoordinator:
    def __init__(self):
        # Initialize n8n client with MCP-equivalent methods
        self.n8n_client = N8nMCPClient()
    
    def get_available_workflows(self):
        """Get available n8n workflows"""
        result = self.n8n_client.list_workflows()
        
        if result.get("status") == "success":
            return result.get("workflows", [])
        else:
            print(f"Error fetching workflows: {result.get('message')}")
            return []
    
    def execute_workflow(self, workflow_id: str, user_input: str):
        """Execute a workflow via webhook"""
        # First, get workflow details
        workflow = self.n8n_client.get_workflow(workflow_id)
        
        if workflow.get("status") != "success":
            return {"error": "Workflow not found"}
        
        # Determine webhook URL (you may need to extract this from workflow)
        webhook_url = self._get_webhook_url(workflow)
        
        # Trigger the workflow
        result = self.n8n_client.trigger_webhook_workflow(
            webhook_url=webhook_url,
            data={
                "message": user_input,
                "sessionId": "session-123"
            }
        )
        
        return result
    
    def monitor_workflow_execution(self, workflow_id: str):
        """Monitor recent workflow executions"""
        executions = self.n8n_client.list_executions(
            workflow_id=workflow_id,
            limit=10
        )
        
        if executions.get("status") == "success":
            for execution in executions.get("executions", []):
                print(f"Execution {execution.get('id')}: {execution.get('status')}")
        
        return executions
    
    def check_n8n_health(self):
        """Check if n8n is healthy"""
        health = self.n8n_client.health_check()
        return health.get("status") == "healthy"
```

## Configuration

Ensure your `.env` file has the n8n credentials:

```env
N8N_API_URL=https://n8n.casamccartney.link
N8N_API_KEY=your-n8n-api-key-here
```

## Response Format

All methods return a consistent response format:

```python
{
    "status": "success" | "error",
    "message": "...",  # Optional message
    # ... method-specific data
}
```

### Examples

**List Workflows:**
```python
{
    "status": "success",
    "workflows": [...],
    "total_count": 10,
    "source": "n8n_api"
}
```

**Get Workflow:**
```python
{
    "status": "success",
    "workflow": {
        "id": "abc123",
        "name": "My Workflow",
        "active": true,
        "nodes": [...],
        "connections": {...}
    }
}
```

**Trigger Webhook:**
```python
{
    "status": "success",
    "result": {
        "message": "Workflow executed successfully",
        "output": {...}
    }
}
```

**Health Check:**
```python
{
    "status": "healthy",
    "message": "n8n instance is accessible and responding",
    "api_url": "https://n8n.example.com",
    "workflows_count": 15
}
```

## Error Handling

```python
result = mcp_client.list_workflows()

if result.get("status") == "error":
    print(f"Error: {result.get('message')}")
    # Handle error
else:
    workflows = result.get("workflows", [])
    # Process workflows
```

## Comparison: MCP Tools vs HTTP Client

| Aspect | MCP Tools | HTTP Client (This Approach) |
|--------|-----------|----------------------------|
| **Accessibility** | AI assistants only | Python code ✅ |
| **Performance** | Fast | Fast ✅ |
| **Reliability** | High | High ✅ |
| **Setup Complexity** | Requires MCP server | Simple ✅ |
| **Direct Control** | Limited | Full ✅ |
| **Same Functionality** | ✅ | ✅ |

## Why This Approach is Better

1. **✅ Works in Python** - No need for complex MCP protocol implementation
2. **✅ Same functionality** - Provides all MCP tool capabilities
3. **✅ Better performance** - Direct HTTP calls are faster than going through MCP
4. **✅ More reliable** - No dependency on AI assistant availability
5. **✅ Full control** - Direct access to n8n API features
6. **✅ Easier debugging** - Standard HTTP requests are easier to troubleshoot

## Alternative: AI Proxy (NOT Recommended)

We also created `ai_mcp_proxy.py` which uses an AI assistant as a proxy to MCP tools. **This is NOT recommended** because:

- ❌ Slower (requires AI API call for each action)
- ❌ Less reliable (depends on AI response parsing)
- ❌ More expensive (uses AI tokens for infrastructure calls)
- ❌ Harder to debug (AI responses can be unpredictable)

**Use the direct HTTP client (`mcp_client.py`) instead.**

## Summary

Your agent coordinator now has **full "MCP-style" access to n8n** through the enhanced `N8nMCPClient`. This provides the same functionality as the MCP tools but works directly in Python code, which is exactly what you need! 🎉

