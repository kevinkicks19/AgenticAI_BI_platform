# Agent Chat Interface

## Overview

The **Agent Chat Interface** provides a unified, modern chat experience for interacting with your specialized AI agents powered by n8n workflows. This interface allows users to have multiple concurrent conversations with different agents, each optimized for specific tasks.

## Features

### 🤖 **Multi-Agent Support**
- **DVadvisor**: Data Vault Business Intelligence advisor with RAG capabilities
- **HAadvisor**: Home Automation advisor combining IoT and data vault knowledge
- **Business Inception Agent**: Interactive requirements gathering and document creation
- **Metadata Object Creator**: Creates CBEs, stories, and glossaries
- **YouTube Content Analyzer**: Video analysis, transcription, and summarization

### 💬 **Session Management**
- **Multiple Sessions**: Run concurrent conversations with different agents
- **Session Persistence**: Messages are stored per session in memory
- **Session Switching**: Easily switch between active conversations
- **Session Close**: Clean up completed conversations

### 🎨 **Modern UI/UX**
- **Agent Discovery**: Browse available agents with descriptions and capabilities
- **Agent Types**: Visual categorization (Advisor 🎯, Creator ✨, Analyzer 🔍)
- **Real-time Chat**: Smooth message flow with timestamps
- **Message History**: Full conversation history per session
- **Loading States**: Visual feedback during message sending

### 📊 **Agent Metadata**
Each agent displays:
- **Icon**: Visual identifier
- **Description**: What the agent does
- **Type**: Category (advisor, creator, analyzer)
- **Tags**: Relevant topics
- **Capabilities**: Specific features

## Architecture

### Frontend (`AgentChatInterface.tsx`)

```typescript
interface Agent {
  id: string;              // n8n workflow ID
  name: string;            // Display name
  description: string;     // What the agent does
  type: 'advisor' | 'creator' | 'analyzer';
  webhookUrl: string;      // n8n webhook endpoint
  icon: string;            // Emoji icon
  active: boolean;         // Is it available?
  tags: string[];          // Categories
  capabilities: string[];  // What it can do
}

interface ConversationSession {
  sessionId: string;       // Unique session ID
  agentId: string;         // Which agent
  agentName: string;       // Agent display name
  messages: Message[];     // Chat history
  startTime: Date;         // When started
  lastActivity: Date;      // Last message time
}
```

### Backend (`app.py`)

New endpoint: `GET /api/agents/list`

Returns:
```json
{
  "status": "success",
  "agents": [
    {
      "id": "2WcHPWj1Go1hH7Af",
      "name": "DVadvisor",
      "description": "Data Vault BI advisor...",
      "type": "advisor",
      "webhookUrl": "https://...",
      "icon": "📊",
      "active": true,
      "tags": ["data-vault", "bi"],
      "capabilities": ["Data vault modeling", "ERD generation"]
    }
  ],
  "total": 5,
  "active": 3
}
```

## How It Works

### 1. Agent Discovery
When the component loads, it fetches available agents from `/api/agents/list`. If the API is unavailable, it falls back to a hardcoded list of known agents.

### 2. Starting a Conversation
When a user clicks on an agent:
1. A new `ConversationSession` is created with a unique `sessionId`
2. A system message is added to introduce the agent
3. The session is added to the active sessions list
4. The chat interface opens with the agent

### 3. Sending Messages
When a user sends a message:
1. User message is added to the session immediately (optimistic update)
2. Message is sent to the agent's n8n webhook with:
   - `chatInput`: The user's message
   - `sessionId`: The current session ID
   - `action`: "chat"
3. Response from n8n is parsed and added as assistant message
4. UI updates with the new message

### 4. n8n Workflow Integration
Each agent workflow should:
- Accept a webhook trigger with parameters: `chatInput`, `sessionId`, `action`
- Process the message through the AI agent
- Return a response with structure: `{ output: "...", response: "..." }`

Example n8n workflow structure:
```
Webhook Trigger → AI Agent → Response Formatting → Webhook Response
```

## Usage

### For Users

1. **Navigate to Agent Chat**
   - Click "Agent Chat" in the left navigation
   - Browse available agents in the sidebar

2. **Start a Conversation**
   - Click on any active agent (green indicator)
   - The chat interface opens automatically

3. **Send Messages**
   - Type your message in the input box
   - Press Enter or click "Send"
   - Wait for the agent's response

4. **Manage Sessions**
   - View active sessions in the "Active Sessions" section
   - Click a session to switch to it
   - Click the × button to close a session

### For Developers

#### Adding a New Agent

1. **Create the n8n Workflow**
   - Set up a webhook trigger
   - Add your AI processing logic
   - Configure the response format

2. **Add to Backend** (`app.py`)
   ```python
   {
       "id": "your-workflow-id",
       "name": "Your Agent Name",
       "description": "What your agent does",
       "type": "advisor|creator|analyzer",
       "webhookUrl": "https://your-n8n-instance/webhook/...",
       "icon": "🤖",
       "active": True,
       "tags": ["tag1", "tag2"],
       "capabilities": ["capability1", "capability2"]
   }
   ```

3. **Test**
   - Reload the frontend
   - Your agent should appear in the list
   - Start a conversation to test

#### Webhook Response Format

Your n8n workflow should return:
```json
{
  "output": "The agent's response message",
  "response": "Alternative response field (fallback)"
}
```

## Configuration

### Backend Configuration

Set these environment variables (or use defaults):

```bash
# n8n Configuration
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key
```

### Agent Configuration

Agents are currently configured statically in `app.py`. To add dynamic agent discovery from n8n:

1. Implement n8n API integration in `backend/mcp/n8n_integration.py`
2. Update the `/api/agents/list` endpoint to fetch from n8n
3. Map n8n workflow metadata to agent structure

## Troubleshooting

### Agent Not Appearing
- Check if the agent is marked `active: True` in the backend
- Verify the webhook URL is correct
- Check n8n workflow is activated

### Messages Not Sending
- Check browser console for errors
- Verify n8n webhook is accessible
- Check CORS settings on n8n
- Ensure webhook accepts POST requests with JSON body

### Session Issues
- Sessions are stored in component state (lost on refresh)
- For persistent sessions, integrate with backend storage
- Session IDs are generated client-side

## Future Enhancements

### Planned Features
- [ ] **Session Persistence**: Store sessions in backend
- [ ] **Message Export**: Export conversation history
- [ ] **Agent Status**: Real-time agent availability
- [ ] **Typing Indicators**: Show when agent is processing
- [ ] **Rich Messages**: Support markdown, images, files
- [ ] **Agent Suggestions**: Recommend best agent for query
- [ ] **Multi-user Sessions**: Collaborative conversations
- [ ] **Message Reactions**: Thumbs up/down for responses
- [ ] **Agent Analytics**: Track usage and performance

### Integration Opportunities
- **DataHub**: Show relevant data assets during conversations
- **Affine**: Save conversations as documents
- **Workflow Triggers**: Agents can trigger other workflows
- **Notification System**: Alert users when agent responds

## API Reference

### GET `/api/agents/list`
Fetch available AI agents.

**Response:**
```json
{
  "status": "success",
  "agents": Agent[],
  "total": number,
  "active": number
}
```

### Agent Webhook (POST)
Send message to agent.

**Request:**
```json
{
  "chatInput": "User message",
  "sessionId": "session-1234567890",
  "action": "chat"
}
```

**Response:**
```json
{
  "output": "Agent response",
  "response": "Alternative response field"
}
```

## Contributing

To add new features:

1. **Update the Interface**: Modify `AgentChatInterface.tsx`
2. **Update the Backend**: Add endpoints in `app.py`
3. **Update Documentation**: Update this file
4. **Test Thoroughly**: Test with multiple agents
5. **Submit PR**: Include screenshots and test results

## License

Part of the AgenticAI BI Platform.

