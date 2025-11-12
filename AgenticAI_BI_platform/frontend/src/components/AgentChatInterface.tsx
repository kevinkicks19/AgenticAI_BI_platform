import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'advisor' | 'creator' | 'analyzer';
  webhookUrl: string;
  icon: string;
  active: boolean;
  tags: string[];
  capabilities: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  agentName?: string;
}

interface ConversationSession {
  sessionId: string;
  agentId: string;
  agentName: string;
  messages: Message[];
  startTime: Date;
  lastActivity: Date;
}

const AgentChatInterface: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load agents from n8n workflows
  useEffect(() => {
    loadAgents();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/agents/list');
      setAgents(response.data.agents || []);
    } catch (error) {
      console.error('Error loading agents:', error);
      // Fallback to static agents if API fails
      setAgents([
        {
          id: '2WcHPWj1Go1hH7Af',
          name: 'DVadvisor',
          description: 'Data Vault Business Intelligence advisor with embedded knowledge to assist data vault users.',
          type: 'advisor',
          webhookUrl: 'https://bmccartn.app.n8n.cloud/webhook/18cd40ef-c9a1-41db-a401-9aef136b9768',
          icon: '📊',
          active: true,
          tags: ['data-vault', 'bi', 'analytics'],
          capabilities: ['Data vault modeling', 'ERD generation', 'Best practices guidance']
        },
        {
          id: 'V59ZdxTNusKy1Swt',
          name: 'HAadvisor',
          description: 'Home Automation advisor combining home automation and data vault knowledge.',
          type: 'advisor',
          webhookUrl: 'https://bmccartn.app.n8n.cloud/webhook/ca361862-55b2-49a0-a765-ff06b90e416a',
          icon: '🏠',
          active: true,
          tags: ['home-automation', 'iot', 'smart-home'],
          capabilities: ['Home automation setup', 'Device integration', 'Automation workflows']
        },
        {
          id: '3Qm6jbbc8jhlZayR',
          name: 'Business Inception Agent',
          description: 'Interactive assistant for gathering business requirements and creating inception documents.',
          type: 'creator',
          webhookUrl: 'https://bmccartn.app.n8n.cloud/webhook/1269a389-347f-44ae-918e-840c26918584',
          icon: '💼',
          active: true,
          tags: ['business-analysis', 'requirements', 'documentation'],
          capabilities: ['Requirements gathering', 'Document creation', 'Stakeholder analysis']
        },
        {
          id: 'ge9ANfdpN8yOu2hv',
          name: 'Metadata Object Creator',
          description: 'Creates and manages business metadata objects like CBEs, stories, and glossaries.',
          type: 'creator',
          webhookUrl: 'https://bmccartn.app.n8n.cloud/webhook-test/create-metadata-object',
          icon: '📝',
          active: false,
          tags: ['metadata', 'documentation', 'business-concepts'],
          capabilities: ['CBE creation', 'Story management', 'Glossary terms']
        },
        {
          id: 'yRvfRLH3i8L5ZSgf',
          name: 'YouTube Content Analyzer',
          description: 'Analyzes YouTube videos for summaries, transcripts, timestamps, and shareable clips.',
          type: 'analyzer',
          webhookUrl: 'https://bmccartn.app.n8n.cloud/form/92148b0b-bbf7-4ce9-80a2-768207adee7b',
          icon: '🎥',
          active: false,
          tags: ['content-analysis', 'video', 'youtube'],
          capabilities: ['Video transcription', 'Content summarization', 'Clip extraction']
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startConversation = (agent: Agent) => {
    const sessionId = `session-${Date.now()}`;
    const newSession: ConversationSession = {
      sessionId,
      agentId: agent.id,
      agentName: agent.name,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'system',
          content: `Started conversation with ${agent.name}. ${agent.description}`,
          timestamp: new Date()
        }
      ],
      startTime: new Date(),
      lastActivity: new Date()
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSession(newSession);
    setSelectedAgent(agent);
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentSession || !selectedAgent || isSending) return;

    setIsSending(true);

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      agentId: selectedAgent.id,
      agentName: selectedAgent.name
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      lastActivity: new Date()
    };

    setCurrentSession(updatedSession);
    setSessions(prev => prev.map(s => s.sessionId === currentSession.sessionId ? updatedSession : s));
    setMessage('');

    try {
      // Send to n8n webhook
      const response = await axios.post(selectedAgent.webhookUrl, {
        chatInput: message,
        sessionId: currentSession.sessionId,
        action: 'chat'
      });

      // Extract response
      const botResponseText = response.data?.output || response.data?.response || 'I received your message.';

      // Add assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: botResponseText,
        timestamp: new Date(),
        agentId: selectedAgent.id,
        agentName: selectedAgent.name
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        lastActivity: new Date()
      };

      setCurrentSession(finalSession);
      setSessions(prev => prev.map(s => s.sessionId === currentSession.sessionId ? finalSession : s));

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: 'Failed to send message. Please check your connection and try again.',
        timestamp: new Date()
      };

      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
        lastActivity: new Date()
      };

      setCurrentSession(errorSession);
      setSessions(prev => prev.map(s => s.sessionId === currentSession.sessionId ? errorSession : s));
    } finally {
      setIsSending(false);
    }
  };

  const switchSession = (session: ConversationSession) => {
    setCurrentSession(session);
    const agent = agents.find(a => a.id === session.agentId);
    if (agent) {
      setSelectedAgent(agent);
    }
  };

  const closeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    if (currentSession?.sessionId === sessionId) {
      setCurrentSession(null);
      setSelectedAgent(null);
    }
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'advisor': return 'blue';
      case 'creator': return 'purple';
      case 'analyzer': return 'green';
      default: return 'gray';
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'advisor': return '🎯';
      case 'creator': return '✨';
      case 'analyzer': return '🔍';
      default: return '🤖';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Agent List & Sessions */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-1">AI Agents</h2>
          <p className="text-sm text-gray-600">Select an agent to start chatting</p>
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Available Agents</h3>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading agents...</div>
          ) : (
            <div className="space-y-2">
              {agents.filter(a => a.active).map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => startConversation(agent)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedAgent?.id === agent.id
                      ? `border-${getAgentTypeColor(agent.type)}-500 bg-${getAgentTypeColor(agent.type)}-50`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{agent.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{agent.name}</h4>
                        <span className="text-xs">{getAgentTypeIcon(agent.type)}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{agent.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {agent.tags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className={`text-xs px-2 py-0.5 rounded-full bg-${getAgentTypeColor(agent.type)}-100 text-${getAgentTypeColor(agent.type)}-700`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Sessions */}
          {sessions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Active Sessions</h3>
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    onClick={() => switchSession(session)}
                    className={`p-2 rounded-lg border cursor-pointer transition-all ${
                      currentSession?.sessionId === session.sessionId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{session.agentName}</p>
                        <p className="text-xs text-gray-500">{session.messages.length} messages</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeSession(session.sessionId);
                        }}
                        className="text-gray-400 hover:text-red-500 text-lg p-1"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession && selectedAgent ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedAgent.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedAgent.name}</h3>
                  <p className="text-sm text-gray-600">{selectedAgent.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Session: {currentSession.sessionId.split('-')[1]}</span>
                </div>
              </div>
              
              {/* Agent Capabilities */}
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedAgent.capabilities.map((cap, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : msg.role === 'system'
                        ? 'bg-gray-100 text-gray-700 text-sm italic'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                        <span>{selectedAgent.icon}</span>
                        <span className="font-medium">{selectedAgent.name}</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={`Message ${selectedAgent.name}...`}
                  disabled={isSending}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || isSending}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Select an Agent</h3>
              <p className="text-gray-600">
                Choose an AI agent from the sidebar to start a conversation.
                Each agent specializes in different areas to help you with your tasks.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentChatInterface;

