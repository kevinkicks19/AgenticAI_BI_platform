# n8n Integration with Agent Coordinator

This document describes the integration between the Agent Coordinator and n8n MCP server, enabling dynamic workflow routing based on user interactions.

## Overview

The Agent Coordinator now includes n8n integration that allows it to:
- Analyze user intents and automatically route them to appropriate n8n workflows
- Create workflows dynamically based on intent types
- Execute workflows with context-aware parameters
- Manage workflow lifecycle (create, activate, deactivate, delete)
- Provide fallback responses when workflows are not available

## Architecture

### Components

1. **N8nMCPIntegration** (`n8n_integration.py`)
   - Python interface to n8n MCP server functionality
   - Handles workflow CRUD operations
   - Manages workflow execution and webhook triggers

2. **WorkflowRouter** (`n8n_integration.py`)
   - Routes user intents to appropriate workflows
   - Maps intent types to workflow configurations
   - Handles workflow creation for new intent types

3. **Enhanced AgentCoordinator** (`agent_coordinator.py`)
   - Integrates n8n functionality into the main coordinator
   - Uses workflow router for dynamic workflow selection
   - Provides fallback mechanisms when n8n is unavailable

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# n8n Configuration
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your-n8n-api-key
```

### Configuration File

The `config.py` file includes n8n configuration:

```python
# n8n Configuration for MCP Integration
N8N_API_URL = os.getenv("N8N_API_URL", "https://n8n.casamccartney.link")
N8N_API_KEY = os.getenv("N8N_API_KEY")
```

## Intent-to-Workflow Mapping

The system automatically maps user intents to appropriate workflows:

| Intent Type | Workflow Name | Description | Parameters |
|-------------|---------------|-------------|------------|
| `data_analysis` | Data Analysis Workflow | Analyzes data and generates insights | `data_source`, `analysis_type`, `output_format` |
| `document_processing` | Document Processing Workflow | Processes and extracts information from documents | `document_type`, `extraction_fields`, `output_format` |
| `task_management` | Task Management Workflow | Manages tasks and project workflows | `task_type`, `priority`, `assignee` |
| `approval_request` | Approval Workflow | Handles approval requests and notifications | `approval_type`, `approver`, `deadline` |
| `notification` | Notification Workflow | Sends notifications and alerts | `notification_type`, `recipients`, `message` |
| `report_generation` | Report Generation Workflow | Generates reports and summaries | `report_type`, `data_source`, `format` |

## API Endpoints

### Workflow Management

- `GET /api/n8n/workflows` - List all workflows
- `GET /api/n8n/workflows/{workflow_id}` - Get workflow details
- `POST /api/n8n/workflows` - Create new workflow
- `POST /api/n8n/workflows/{workflow_id}/execute` - Execute workflow
- `POST /api/n8n/workflows/{workflow_id}/activate` - Activate workflow
- `POST /api/n8n/workflows/{workflow_id}/deactivate` - Deactivate workflow
- `DELETE /api/n8n/workflows/{workflow_id}` - Delete workflow
- `GET /api/n8n/workflows/{workflow_id}/executions` - Get workflow executions
- `POST /api/n8n/webhook/trigger` - Trigger workflow via webhook

### Example Usage

```python
# List workflows
response = await coordinator.n8n_integration.list_workflows()

# Execute workflow
result = await coordinator.n8n_integration.execute_workflow(
    "workflow-id",
    {"parameter": "value"}
)

# Create workflow
new_workflow = await coordinator.n8n_integration.create_workflow(
    name="My Workflow",
    nodes=[...],
    connections={...}
)
```

## Workflow Execution Flow

1. **User Input**: User sends a message to the coordinator
2. **Intent Analysis**: Coordinator analyzes the user's intent using OpenAI
3. **Workflow Routing**: WorkflowRouter determines appropriate workflow
4. **Workflow Execution**: If workflow exists, execute it; otherwise create new one
5. **Response Generation**: Generate response based on workflow results
6. **Fallback**: If workflow execution fails, fall back to general chat

## Dynamic Workflow Creation

When a new intent type is detected, the system can automatically create appropriate workflows:

```python
# Example: Creating a data analysis workflow
workflow_config = {
    "workflow_name": "Data Analysis Workflow",
    "description": "Analyzes data and generates insights",
    "parameters": ["data_source", "analysis_type", "output_format"]
}

# The system creates nodes like:
nodes = [
    {"name": "Manual Trigger", "type": "n8n-nodes-base.manualTrigger"},
    {"name": "Set Parameters", "type": "n8n-nodes-base.set"},
    {"name": "Data Analysis", "type": "n8n-nodes-base.code"}
]
```

## Error Handling

The integration includes comprehensive error handling:

- **n8n Unavailable**: Falls back to general chat responses
- **Workflow Creation Failed**: Returns error message to user
- **Workflow Execution Failed**: Provides fallback response
- **API Errors**: Logs errors and continues with fallback

## Testing

Run the test script to verify the integration:

```bash
cd AgenticAI_BI_platform/backend
python test_n8n_integration.py
```

The test script demonstrates:
- Workflow listing and management
- Intent analysis and routing
- Dynamic workflow creation
- Error handling and fallbacks

## Best Practices

1. **Workflow Design**: Keep workflows simple and focused on specific tasks
2. **Error Handling**: Always include error handling in workflow nodes
3. **Parameter Validation**: Validate input parameters before workflow execution
4. **Logging**: Use proper logging for debugging workflow issues
5. **Testing**: Test workflows thoroughly before production use

## Troubleshooting

### Common Issues

1. **n8n Connection Failed**
   - Check N8N_API_URL and N8N_API_KEY configuration
   - Verify n8n instance is running and accessible

2. **Workflow Creation Failed**
   - Check workflow node configurations
   - Verify n8n API permissions

3. **Intent Analysis Issues**
   - Review OpenAI API configuration
   - Check intent analysis prompts

### Debug Mode

Enable debug logging by setting the log level:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Future Enhancements

- **Workflow Templates**: Pre-defined templates for common use cases
- **Advanced Routing**: More sophisticated intent-to-workflow mapping
- **Workflow Optimization**: Automatic workflow performance optimization
- **Integration Testing**: Comprehensive test suite for workflow scenarios
- **Monitoring**: Real-time workflow execution monitoring and alerting 