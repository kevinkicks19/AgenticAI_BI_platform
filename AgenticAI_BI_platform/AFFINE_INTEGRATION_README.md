# Affine Integration for Agentic AI BI Platform

## Overview

This integration connects your Agentic AI BI Platform with Affine's REST API to provide:
- **Document Management**: Store BI reports, insights, and workflow outputs
- **Workflow Metadata**: Organize and discover n8n workflows
- **Business Problem Tracking**: Track user problems and solutions
- **Collaboration**: Team-based workflow management and knowledge sharing

## Features

### 🗂️ Document Management
- **BI Reports**: Store analysis results and insights
- **Workflow Metadata**: Document workflow descriptions and parameters
- **Business Problems**: Track user issues and solutions
- **Collaboration Spaces**: Create team workspaces

### 🔍 Discovery & Search
- **Full-text Search**: Find documents by content
- **Tag-based Filtering**: Organize by categories and tags
- **Type Filtering**: Filter by document type
- **Category Browsing**: Browse by business category

### 🔄 Integration Points
- **n8n Workflows**: Store metadata and execution results
- **AI Agent Coordination**: Document agent decisions and handoffs
- **User Sessions**: Track problem-solving journeys
- **Business Intelligence**: Store insights and recommendations

## Setup

### 1. Environment Configuration

Add these variables to your `.env` file:

```bash
# Affine API Configuration
AFFINE_API_URL=https://app.affine.pro
AFFINE_API_KEY=your_affine_api_key_here
AFFINE_WORKSPACE_ID=your_affine_workspace_id_here
```

### 2. Get Affine Credentials

1. **Go to your Affine workspace**
2. **Navigate to Settings > API Keys**
3. **Generate a new API key**
4. **Copy the workspace ID** from the URL or settings

### 3. Install Dependencies

The integration requires `httpx` for async HTTP requests:

```bash
pip install httpx
```

## API Endpoints

### Health & Status
- `GET /api/affine/health` - Overall health check
- `GET /api/affine/status` - Affine connection status

### Document Management
- `POST /api/affine/documents/bi-report` - Create BI report
- `POST /api/affine/documents/workflow-metadata` - Store workflow info
- `POST /api/affine/documents/business-problem` - Track business problem
- `PATCH /api/affine/documents/{id}` - Update document

### Discovery & Search
- `GET /api/affine/documents/search` - Search documents
- `GET /api/affine/workflows/templates` - Get workflow templates
- `GET /api/affine/documents/types` - List document types
- `GET /api/affine/documents/categories` - List categories

### Collaboration
- `POST /api/affine/collaboration/spaces` - Create collaboration space

## Usage Examples

### Creating a BI Report

```python
import requests

report_data = {
    "title": "Customer Churn Analysis Q4 2024",
    "content": "Analysis of customer retention patterns...",
    "workflow_id": "n8n-churn-analysis-123",
    "user_id": "analyst-456",
    "tags": ["customer_retention", "q4_2024", "churn_analysis"]
}

response = requests.post(
    "http://localhost:5000/api/affine/documents/bi-report",
    json=report_data
)
```

### Storing Workflow Metadata

```python
workflow_data = {
    "workflow_id": "n8n-workflow-789",
    "name": "Sales Performance Dashboard",
    "description": "Generates comprehensive sales analytics...",
    "category": "sales_analytics",
    "tags": ["sales", "dashboard", "analytics"],
    "parameters": {
        "date_range": "required",
        "sales_team": "optional",
        "product_category": "optional"
    }
}

response = requests.post(
    "http://localhost:5000/api/affine/documents/workflow-metadata",
    json=workflow_data
)
```

### Tracking Business Problems

```python
problem_data = {
    "problem_description": "Need to identify factors causing customer churn",
    "user_id": "manager-123",
    "category": "customer_retention",
    "priority": "high",
    "workflow_solution": "Customer Churn Analysis Workflow"
}

response = requests.post(
    "http://localhost:5000/api/affine/documents/business-problem",
    json=problem_data
)
```

### Searching Documents

```python
# Search for customer-related documents
response = requests.get(
    "http://localhost:5000/api/affine/documents/search",
    params={
        "query": "customer",
        "document_type": "bi_report",
        "tags": "customer_retention",
        "limit": 20
    }
)
```

## Integration with Your Platform

### 1. Workflow Execution Results

When a workflow completes, automatically store the results:

```python
# After workflow execution
affine_result = await affine_service.create_bi_report(
    title=f"Workflow Result: {workflow_name}",
    content=workflow_output,
    workflow_id=workflow_id,
    user_id=user_id,
    tags=["workflow_result", category]
)
```

### 2. AI Agent Coordination

Store agent decisions and handoffs:

```python
# When agent makes a decision
await affine_service.track_business_problem(
    problem_description=user_problem,
    user_id=user_id,
    category=problem_category,
    workflow_solution=recommended_workflow
)
```

### 3. Business Problem Solving

Track the entire problem-solving journey:

```python
# Create collaboration space for complex problems
space = await affine_service.create_collaboration_space(
    name=f"Problem: {problem_title}",
    description=problem_description,
    members=[user_id, "ai_coordinator"],
    tags=[problem_category, "collaboration"]
)
```

## Testing

Run the test script to verify integration:

```bash
cd backend
python test_affine_integration.py
```

This will test all endpoints and show you the results.

## Docker Deployment

The integration is already configured for Docker. Just add your Affine credentials to the environment variables in `docker-compose.yml`.

## Error Handling

The service gracefully handles:
- **Missing API keys**: Integration disabled with warnings
- **API failures**: Detailed error logging and user feedback
- **Network issues**: Timeout handling and retry logic
- **Invalid data**: Input validation and error responses

## Future Enhancements

### Planned Features
- **Real-time Sync**: Webhook-based document updates
- **Advanced Search**: Semantic search and AI-powered discovery
- **Workflow Templates**: Pre-built workflow configurations
- **Analytics**: Usage metrics and collaboration insights

### Integration Opportunities
- **n8n Webhooks**: Automatic document creation on workflow completion
- **AI Agent Memory**: Persistent storage of agent decisions
- **User Analytics**: Track problem-solving patterns
- **Team Collaboration**: Multi-user workflow management

## Troubleshooting

### Common Issues

1. **"Affine integration not enabled"**
   - Check your `.env` file has `AFFINE_API_KEY` set
   - Verify the API key is valid

2. **"API returned status 401"**
   - Invalid or expired API key
   - Check workspace ID is correct

3. **"Connection timeout"**
   - Network connectivity issues
   - Check `AFFINE_API_URL` is accessible

### Debug Mode

Enable detailed logging by setting `DEBUG=True` in your environment.

## Support

For issues with the integration:
1. Check the logs for detailed error messages
2. Verify your Affine credentials
3. Test the connection with the health check endpoint
4. Review the API documentation for Affine

---

**Last Updated**: December 2024
**Status**: Ready for Testing ✅
