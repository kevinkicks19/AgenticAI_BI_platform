# Agentic AI BI Platform - API Documentation

## Overview

The Agentic AI BI Platform provides a comprehensive REST API for business intelligence, document processing, and AI-powered workflow automation. This document outlines the enhanced API with OpenAPI/Swagger documentation.

## Quick Start

### Accessing the API Documentation

Once the enhanced backend is running, you can access the API documentation at:

- **Swagger UI**: `http://localhost:5000/docs`
- **ReDoc**: `http://localhost:5000/redoc`
- **OpenAPI JSON**: `http://localhost:5000/openapi.json`

### Health Check

Check if the API is running:
```bash
curl http://localhost:5000/health
```

## API Endpoints

### Chat Endpoints

#### POST `/api/chat`
Send a message to the AI coordinator.

**Request Body:**
```json
{
  "message": "Analyze the sales data from Q4",
  "session_id": "default",
  "turn": 0,
  "context": {
    "user_id": "user_123",
    "project": "Q4 Analysis"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Message processed successfully",
  "response": "I'll analyze the Q4 sales data for you...",
  "session_id": "default",
  "turn": 1,
  "current_agent": "data_analyst",
  "workflow_trigger": true,
  "workflow_id": "sales_analysis_workflow"
}
```

#### GET `/api/chat`
Initialize a new chat session.

### Workflow Endpoints

#### GET `/api/chat/workflows`
Get all available workflows.

#### POST `/api/bi/register-workflow`
Register a new workflow for an agent type.

**Request Body:**
```json
{
  "agent_type": "data_analyst",
  "workflow_id": "sales_analysis_workflow"
}
```

### Document Endpoints

#### POST `/api/documents/upload`
Upload a document for processing.

#### GET `/api/documents`
List uploaded documents.

### Guardrails Endpoints

#### GET `/api/guardrails/status`
Get current guardrails status and violations.

#### POST `/api/guardrails/check`
Check if a message violates guardrails.

**Request Body:**
```json
{
  "message": "Delete all customer data",
  "context": {
    "user_role": "admin"
  }
}
```

### DataHub Endpoints

#### GET `/api/datahub/context/{entity_urn}`
Get DataHub context for an entity.

#### GET `/api/datahub/search`
Search DataHub for entities.

### Affine Endpoints

#### POST `/api/inception/create-document`
Create an inception document in Affine.

**Request Body:**
```json
{
  "content": "Business problem analysis...",
  "session_id": "default",
  "workflow_id": "problem_analysis"
}
```

### System Endpoints

#### GET `/health`
Health check endpoint.

#### GET `/api/health`
API-specific health check.

#### GET `/api/metrics`
Get system performance metrics.

## Data Models

### Chat Models

#### ChatRequest
```json
{
  "message": "string (required, 1-4000 chars)",
  "session_id": "string (optional, default: 'default')",
  "turn": "integer (optional, default: 0)",
  "context": "object (optional)"
}
```

#### ChatResponse
```json
{
  "status": "string",
  "message": "string",
  "response": "string",
  "session_id": "string",
  "turn": "integer",
  "current_agent": "string",
  "agent_info": "AgentInfo object",
  "violations": "GuardrailViolation[]",
  "workflow_trigger": "boolean",
  "workflow_id": "string",
  "workflow_name": "string",
  "parameters": "object"
}
```

### Workflow Models

#### WorkflowInfo
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "agent_type": "enum (triage|data_analyst|document_processor|workflow_orchestrator)",
  "webhook_url": "string",
  "status": "enum (active|inactive|running|error)",
  "last_run": "datetime",
  "success_rate": "float",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Guardrails Models

#### GuardrailViolation
```json
{
  "guardrail": "string",
  "name": "string",
  "description": "string",
  "severity": "string (default: 'medium')",
  "type": "enum (security|compliance|data_privacy|business_rule)"
}
```

## Error Handling

### Error Response Format
```json
{
  "status": "error",
  "message": "Error description",
  "error_code": "ERROR_CODE",
  "details": {
    "field": "additional error details"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed
- `INTERNAL_ERROR`: Internal server error
- `GUARDRAIL_VIOLATION`: Message violates guardrails
- `WORKFLOW_ERROR`: Workflow execution failed

## Authentication

Currently, the API operates without authentication for development purposes. In production, implement:

1. **API Key Authentication**: Add API keys to request headers
2. **JWT Tokens**: Implement JWT-based authentication
3. **OAuth 2.0**: Integrate with OAuth providers
4. **Role-Based Access Control**: Implement user roles and permissions

## Rate Limiting

API requests are subject to rate limiting:

- **Chat endpoints**: 100 requests per minute per session
- **Workflow endpoints**: 50 requests per minute per user
- **Document endpoints**: 20 requests per minute per user
- **System endpoints**: 10 requests per minute per IP

## Best Practices

### Request Headers
```http
Content-Type: application/json
Accept: application/json
User-Agent: YourApp/1.0
```

### Error Handling
Always check the response status and handle errors gracefully:

```javascript
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const data = await response.json();
  // Process successful response
} catch (error) {
  // Handle error
  console.error('API Error:', error.message);
}
```

### Session Management
- Use consistent session IDs for related requests
- Implement session timeout handling
- Store session state appropriately

### Workflow Integration
- Check `workflow_trigger` in responses
- Handle workflow parameters appropriately
- Monitor workflow execution status

## Development

### Running the Enhanced API

1. **Upgrade to Enhanced Version:**
   ```bash
   cd backend
   python upgrade_to_enhanced.py
   ```

2. **Start the Server:**
   ```bash
   python app.py
   ```

3. **Access Documentation:**
   - Swagger UI: http://localhost:5000/docs
   - ReDoc: http://localhost:5000/redoc

### Testing the API

Use the built-in Swagger UI to test endpoints interactively, or use curl:

```bash
# Health check
curl http://localhost:5000/health

# Initialize chat
curl http://localhost:5000/api/chat

# Send message
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, AI coordinator!"}'
```

## Migration from Basic API

The enhanced API is backward compatible with the basic version. Key improvements:

1. **Structured Request/Response Models**: All endpoints now use Pydantic models
2. **Comprehensive Documentation**: OpenAPI/Swagger documentation
3. **Better Error Handling**: Structured error responses
4. **Health Monitoring**: Health check and metrics endpoints
5. **Improved Logging**: Enhanced logging and monitoring
6. **API Organization**: Endpoints organized by tags

## Support

For API support and questions:

- **Documentation**: Visit `/docs` for interactive API documentation
- **Health Status**: Check `/health` for system status
- **Metrics**: Monitor `/api/metrics` for performance data
- **Logs**: Check application logs for detailed error information

---

**Last Updated**: December 2024  
**API Version**: 1.0.0  
**Enhanced Version**: Available with OpenAPI documentation
