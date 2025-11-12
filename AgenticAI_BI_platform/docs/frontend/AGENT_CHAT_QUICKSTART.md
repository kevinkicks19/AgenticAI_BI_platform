# Agent Chat Interface - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Start the Backend
```bash
cd AgenticAI_BI_platform
cd backend
python app.py
```

The backend should start on `http://localhost:5000`

### Step 2: Start the Frontend
```bash
cd AgenticAI_BI_platform
npm run dev
```

The frontend will open at `http://localhost:5173` (or similar)

### Step 3: Use the Agent Chat
1. Open your browser to the frontend URL
2. Click **"Agent Chat"** in the left navigation
3. Select an agent from the sidebar (look for the green status indicator)
4. Start chatting!

## 📝 Testing the Interface

### Test with DVadvisor (Data Vault)
**Example Questions:**
- "What is a data vault hub?"
- "Show me an ERD for a customer hub with satellites"
- "What are the best practices for link tables?"
- "Generate a data vault model for a sales order"

### Test with HAadvisor (Home Automation)
**Example Questions:**
- "How do I set up a smart light automation?"
- "What's the best way to integrate Home Assistant?"
- "Show me an automation for motion detection"
- "What devices work well with Node-RED?"

### Test with Business Inception Agent
**Example Questions:**
- "I want to build a customer portal"
- "Help me gather requirements for a reporting system"
- "What should I include in a business case?"
- "Create an inception document for a mobile app"

## 🎯 What to Expect

### First Time Loading
- The interface will try to fetch agents from `/api/agents/list`
- If the endpoint isn't available, it falls back to hardcoded agents
- You should see 3 active agents (DVadvisor, HAadvisor, Business Inception Agent)

### Starting a Conversation
1. Click an agent card
2. You'll see a system message: "Started conversation with [Agent Name]"
3. The chat interface opens with the agent's details at the top

### Sending Messages
1. Type in the message box at the bottom
2. Press Enter or click "Send"
3. Your message appears immediately (blue bubble, right side)
4. The agent's response appears after processing (white bubble, left side)

### Session Management
- Each conversation is a separate session
- You can have multiple sessions open simultaneously
- Switch between sessions using the "Active Sessions" list
- Close sessions with the × button

## ⚙️ Configuration

### Environment Variables (Optional)
Create a `.env` file in the `backend` directory:

```env
# n8n Configuration
N8N_API_URL=https://bmccartn.app.n8n.cloud
N8N_API_KEY=your_api_key_if_needed

# Other configuration
PORT=5000
DEBUG=True
```

### Agent Webhook URLs
The default configuration uses these webhooks:
- **DVadvisor**: `https://bmccartn.app.n8n.cloud/webhook/18cd40ef-c9a1-41db-a401-9aef136b9768`
- **HAadvisor**: `https://bmccartn.app.n8n.cloud/webhook/ca361862-55b2-49a0-a765-ff06b90e416a`
- **Business Inception**: `https://bmccartn.app.n8n.cloud/webhook/1269a389-347f-44ae-918e-840c26918584`

## 🐛 Troubleshooting

### "Failed to send message"
**Possible causes:**
1. n8n workflow is not activated
2. Webhook URL is incorrect
3. Network/CORS issues

**Solution:**
- Check n8n workflow status (should be active/green)
- Verify webhook URL in `backend/app.py`
- Check browser console for errors

### Agent list is empty
**Possible causes:**
1. Backend is not running
2. API endpoint `/api/agents/list` is not responding

**Solution:**
- Ensure backend is running on port 5000
- Check terminal for backend errors
- The interface should fall back to hardcoded agents

### Messages not appearing
**Possible causes:**
1. Response format from n8n is incorrect
2. Network timeout
3. n8n workflow error

**Solution:**
- Check n8n execution logs
- Verify the workflow returns `{ "output": "..." }` or `{ "response": "..." }`
- Check browser console for response parsing errors

### Session not persisting on refresh
**This is expected behavior!**
- Sessions are currently stored in component state
- Refreshing the page will clear all sessions
- This is intentional for the initial version
- Backend persistence coming in future update

## 📊 Backend API Endpoints

The Agent Chat Interface uses these endpoints:

### `GET /api/agents/list`
Fetches available agents with metadata.

**Test with curl:**
```bash
curl http://localhost:5000/api/agents/list
```

**Expected response:**
```json
{
  "status": "success",
  "agents": [
    {
      "id": "2WcHPWj1Go1hH7Af",
      "name": "DVadvisor",
      "type": "advisor",
      "active": true,
      ...
    }
  ],
  "total": 5,
  "active": 3
}
```

## 🎨 UI Components

### Agent Cards
- **Icon**: Visual identifier (emoji)
- **Name**: Agent display name
- **Type Icon**: 🎯 (Advisor), ✨ (Creator), 🔍 (Analyzer)
- **Description**: What the agent does
- **Tags**: Relevant categories
- **Status**: Green border = active, gray = inactive

### Chat Messages
- **User messages**: Blue bubbles on the right
- **Agent messages**: White bubbles on the left with agent icon
- **System messages**: Gray, italic, centered
- **Timestamps**: Small text at bottom of each message

### Session List
- **Active sessions** appear in the sidebar
- **Session name**: Agent name
- **Message count**: Number of messages in session
- **Close button**: × to close session

## 🔄 Development Workflow

### Making Changes

1. **Frontend changes**:
   - Edit `AgenticAI_BI_platform/frontend/src/components/AgentChatInterface.tsx`
   - Changes hot-reload automatically
   - Check browser console for errors

2. **Backend changes**:
   - Edit `AgenticAI_BI_platform/backend/app.py`
   - Restart the backend: `Ctrl+C` then `python app.py`
   - Check terminal for errors

3. **Adding new agents**:
   - Add entry to the `agents` list in `/api/agents/list` endpoint
   - Include all required fields (id, name, description, type, webhookUrl, etc.)
   - Set `active: True` to make it visible

### Testing Changes

**Frontend:**
```bash
# Check for TypeScript errors
npm run build

# Run in dev mode with hot reload
npm run dev
```

**Backend:**
```bash
# Run with debug mode
DEBUG=True python app.py

# Test API endpoint
curl http://localhost:5000/api/agents/list
```

## 📱 Mobile/Responsive Support

The interface is **not yet optimized for mobile**. Current limitations:
- Fixed sidebar width (280px)
- No mobile-specific layouts
- May not work well on tablets

**Future enhancement**: Responsive design with collapsible sidebar.

## 🔐 Security Considerations

### Current Implementation
- **No authentication**: Anyone can access the chat
- **No rate limiting**: Unlimited messages
- **No message sanitization**: Raw text displayed

### Production Recommendations
1. Add user authentication
2. Implement rate limiting (e.g., 10 messages/minute)
3. Sanitize user input before sending to agents
4. Add CORS restrictions in production
5. Use HTTPS for all communications
6. Implement session timeouts
7. Add message encryption for sensitive data

## 🎯 Next Steps

After getting the basic interface working:

1. **Customize Agents**: Update agent descriptions and capabilities
2. **Add New Agents**: Create new n8n workflows and add them
3. **Improve UI**: Customize colors, fonts, layouts
4. **Add Features**: Implement typing indicators, rich messages, etc.
5. **Backend Persistence**: Store sessions in a database
6. **User Management**: Add authentication and user profiles

## 💡 Tips & Best Practices

### For Best Results
1. **Keep agents focused**: Each agent should have a clear specialty
2. **Test workflows**: Ensure n8n workflows are working before adding to UI
3. **Monitor performance**: Watch for slow response times
4. **Log conversations**: Helpful for debugging and improving agents
5. **User feedback**: Add thumbs up/down for agent responses

### Common Patterns
- **Advisor agents**: Knowledge-based Q&A with RAG
- **Creator agents**: Generate documents, reports, content
- **Analyzer agents**: Process data, extract insights

### Performance Tips
- Keep agent responses concise (< 1000 characters)
- Use streaming for long responses (future enhancement)
- Cache common queries in n8n workflows
- Monitor n8n execution times

## 📚 Additional Resources

- [Full Documentation](./AGENT_CHAT_INTERFACE.md)
- [n8n Documentation](https://docs.n8n.io/)
- [n8n MCP Integration](./backend/mcp/README_n8n_integration.md)
- [API Documentation](./backend/API_DOCUMENTATION.md)

## ❓ FAQ

**Q: Can I use this with self-hosted n8n?**  
A: Yes! Just update the webhook URLs to point to your n8n instance.

**Q: Do I need API keys?**  
A: Only if your n8n workflows require authentication. The current setup uses webhook URLs which don't require auth.

**Q: Can agents talk to each other?**  
A: Not yet, but this is a planned feature. You could implement it by having one agent call another agent's webhook.

**Q: How do I save conversation history?**  
A: Currently conversations are in-memory only. For persistence, you'll need to add backend storage (database or file system).

**Q: Can I customize the UI colors?**  
A: Yes! Edit the Tailwind CSS classes in `AgentChatInterface.tsx`. Colors are defined using Tailwind's color system.

**Q: Is there a limit to message length?**  
A: The UI doesn't impose a limit, but n8n workflows might have limits. Test with your specific workflows.

---

**Need Help?** Check the [full documentation](./AGENT_CHAT_INTERFACE.md) or open an issue on GitHub.

