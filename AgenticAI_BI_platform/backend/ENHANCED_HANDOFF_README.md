# 🚀 Enhanced Handoff System

The Enhanced Handoff System provides intelligent routing between the AI Coordinator and specialized n8n workflow agents, with seamless workflow integration and context preservation.

## ✨ Key Features

### 🔍 **Intelligent Agent Discovery**
- **Dynamic Workflow Mapping**: Automatically detects available n8n workflows and maps them to appropriate agents
- **Pattern Recognition**: Uses workflow names and descriptions to intelligently categorize workflows by agent type
- **Fallback Logic**: Provides fallback options when preferred agents have no available workflows

### 🎯 **Smart Intent Analysis**
- **Enhanced Intent Recognition**: Improved understanding of user intent with confidence scoring
- **Workflow-Aware Routing**: Considers workflow availability when deciding on handoffs
- **Context Preservation**: Maintains conversation context across agent transitions

### 🔄 **Seamless Workflow Integration**
- **Automatic Workflow Execution**: Can execute workflows as part of the handoff process
- **Webhook Support**: Integrates with n8n webhook triggers for real-time workflow execution
- **MCP Integration**: Leverages n8n MCP tools for workflow management

### 📊 **Enhanced Monitoring & Control**
- **Real-time Status Tracking**: Monitor handoff progress and workflow execution status
- **Workflow Cache Management**: Intelligent caching with automatic refresh capabilities
- **Comprehensive Logging**: Detailed tracking of handoff lifecycle and workflow interactions

## 🏗️ Architecture

### **Core Components**

1. **Enhanced Handoff Manager** (`handoff_manager.py`)
   - Manages handoff lifecycle and workflow integration
   - Maintains workflow cache and agent mapping
   - Handles workflow execution and fallback logic

2. **Enhanced Agent Coordinator** (`agent_coordinator.py`)
   - Improved intent analysis with handoff awareness
   - Seamless integration with handoff manager
   - Enhanced response handling for workflow operations

3. **Enhanced API Routes** (`handoff_routes.py`)
   - New endpoints for workflow execution
   - Agent discovery with workflow information
   - Workflow cache management

### **Data Flow**

```
User Request → Intent Analysis → Handoff Decision → Agent Selection → Workflow Execution → Response
     ↓              ↓              ↓              ↓              ↓              ↓
Coordinator → Confidence → Workflow Check → Agent Routing → n8n MCP → Enhanced Response
```

## 🚀 Getting Started

### **1. Start the Backend**
```bash
cd AgenticAI_BI_platform/backend
python app.py
```

### **2. Test the Enhanced System**
```bash
python test_enhanced_handoff.py
```

### **3. Use the New API Endpoints**

#### **Discover Agents with Workflows**
```bash
curl http://localhost:5000/api/handoff/agents-with-workflows
```

#### **Refresh Workflow Cache**
```bash
curl -X POST http://localhost:5000/api/handoff/refresh-workflows \
  -H "Content-Type: application/json" \
  -d '{"force_refresh": true}'
```

#### **Check Handoff Requirements**
```bash
curl -X POST http://localhost:5000/api/handoff/check \
  -H "Content-Type: application/json" \
  -d '{
    "intent_analysis": {
      "intent": "data_analysis",
      "confidence": 0.9,
      "user_message": "I need to analyze my sales data"
    }
  }'
```

## 🔧 Configuration

### **Agent Types & Capabilities**

The system supports these specialized agents:

| Agent Type | Description | Workflow Patterns | Fallback |
|------------|-------------|-------------------|----------|
| `data_analysis` | Data analysis and insights | `["data", "analysis", "insights", "metrics"]` | `faq` |
| `report_generation` | Report creation | `["report", "generate", "document"]` | `faq` |
| `document_processing` | Document handling | `["document", "process", "extract", "upload"]` | `faq` |
| `task_management` | Task and project management | `["task", "project", "manage", "organize"]` | `faq` |
| `approval_workflow` | Approval processes | `["approval", "review", "authorize"]` | `faq` |
| `faq` | General assistance | `[]` | `None` |

### **Workflow Mapping**

Workflows are automatically mapped to agents based on:
- **Name patterns**: Keywords in workflow names
- **Description content**: Workflow descriptions and metadata
- **Webhook paths**: Available webhook endpoints

## 📡 API Reference

### **Core Handoff Endpoints**

#### **POST** `/api/handoff/initiate`
Initiate a handoff to a specialized agent.

**Request Body:**
```json
{
  "session_id": "string",
  "user_message": "string",
  "intent_analysis": {
    "intent": "string",
    "confidence": 0.95,
    "target_agent": "string"
  },
  "context": {}
}
```

**Response:**
```json
{
  "success": true,
  "handoff_id": "uuid",
  "agent_name": "string",
  "handoff_type": "n8n_workflow|specialized_agent",
  "available_workflows": ["string"],
  "workflow_count": 0
}
```

#### **POST** `/api/handoff/execute-workflow`
Execute a workflow as part of a handoff.

**Request Body:**
```json
{
  "handoff_id": "string",
  "workflow_id": "string",
  "user_data": {}
}
```

#### **GET** `/api/handoff/agents-with-workflows**
Get all available agents with their associated workflows.

#### **POST** `/api/handoff/refresh-workflows`
Refresh the workflow cache.

### **Status & Monitoring Endpoints**

- **GET** `/api/handoff/status/{handoff_id}` - Get handoff status
- **GET** `/api/handoff/active` - List active handoffs
- **GET** `/api/handoff/workflows` - Get workflows organized by agent

## 🧪 Testing

### **Test Scenarios**

1. **Basic Handoff**: Test agent routing without workflow execution
2. **Workflow Handoff**: Test handoff with automatic workflow execution
3. **Fallback Logic**: Test scenarios where preferred agents have no workflows
4. **Context Preservation**: Test conversation context across handoffs
5. **Error Handling**: Test various error conditions and recovery

### **Running Tests**

```bash
# Run the complete test suite
python test_enhanced_handoff.py

# Test specific components
python -c "
from handoff_manager import handoff_manager
workflows = handoff_manager.refresh_n8n_workflows()
print(f'Found workflows: {workflows}')
"
```

## 🔍 Troubleshooting

### **Common Issues**

1. **Workflows Not Detected**
   - Check n8n MCP connectivity
   - Verify Cloudflare Access bypass is working
   - Check workflow naming patterns

2. **Handoff Failures**
   - Verify agent type exists in configuration
   - Check confidence thresholds
   - Review intent analysis output

3. **Workflow Execution Errors**
   - Check webhook endpoints
   - Verify workflow is active
   - Review MCP client configuration

### **Debug Mode**

Enable debug logging by setting environment variables:
```bash
export TASKMASTER_LOG_LEVEL=DEBUG
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

## 🚀 Future Enhancements

### **Planned Features**

1. **Multi-Agent Collaboration**: Allow multiple agents to work together
2. **Advanced Workflow Orchestration**: Complex workflow chains and dependencies
3. **Machine Learning Integration**: Learn from handoff patterns and improve routing
4. **Real-time Notifications**: WebSocket support for live handoff updates
5. **Advanced Context Management**: Semantic context preservation across agents

### **Integration Opportunities**

- **Slack/Discord**: Chat platform integration
- **Email Workflows**: Automated email processing
- **Document Management**: Integration with document storage systems
- **Analytics Dashboard**: Handoff performance metrics

## 📚 Examples

### **Example 1: Data Analysis Handoff**

```python
# User: "I need to analyze my sales data"
# System automatically:
# 1. Detects data_analysis intent (confidence: 0.95)
# 2. Checks for available workflows
# 3. Routes to Data Analysis Agent
# 4. Executes relevant workflow
# 5. Returns results with context
```

### **Example 2: Report Generation Handoff**

```python
# User: "Create a customer satisfaction report"
# System automatically:
# 1. Detects report_generation intent (confidence: 0.9)
# 2. Routes to Report Generation Agent
# 3. Checks workflow availability
# 4. Executes report generation workflow
# 5. Handles any approval processes
```

## 🤝 Contributing

To contribute to the Enhanced Handoff System:

1. **Fork the repository**
2. **Create a feature branch**
3. **Add tests for new functionality**
4. **Update documentation**
5. **Submit a pull request**

## 📄 License

This project is part of the AgenticAI BI Platform and follows the same licensing terms.

---

**🎯 Ready to test the enhanced handoff system? Run `python test_enhanced_handoff.py` to see it in action!**
