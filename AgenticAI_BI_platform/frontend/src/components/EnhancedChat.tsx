import React, { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agent_info?: {
    name: string;
    description: string;
    capabilities?: string[];
  };
  guardrail_violation?: {
    guardrail: string;
    name: string;
    description: string;
  };
  status?: 'handoff' | 'guardrail_violation' | 'success';
  messageType?: 'text' | 'code' | 'markdown' | 'json' | 'table';
}

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: 'analysis' | 'workflow' | 'document' | 'general';
}

const API_BASE_URL = 'http://localhost:5000';

const EnhancedChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<'idle' | 'waiting' | 'error'>('idle');
  const [isTyping, setIsTyping] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messageTemplates: MessageTemplate[] = [
    {
      id: '1',
      title: 'Analyze Sales Data',
      content: 'Can you analyze the sales data from the uploaded documents and provide insights on trends and performance?',
      category: 'analysis'
    },
    {
      id: '2',
      title: 'Create Workflow',
      content: 'I need a workflow to process financial reports automatically. Can you help me set this up?',
      category: 'workflow'
    },
    {
      id: '3',
      title: 'Document Summary',
      content: 'Please provide a summary of the key points from the uploaded documents.',
      category: 'document'
    },
    {
      id: '4',
      title: 'Data Visualization',
      content: 'Create charts and visualizations for the data analysis results.',
      category: 'analysis'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectMessageType = (content: string): Message['messageType'] => {
    if (content.includes('```')) return 'code';
    if (content.includes('|') && content.split('\n').length > 2) return 'table';
    if (content.includes('{') && content.includes('}')) return 'json';
    if (content.includes('**') || content.includes('*') || content.includes('#')) return 'markdown';
    return 'text';
  };

  const formatMessageContent = (content: string, messageType: Message['messageType']) => {
    switch (messageType) {
      case 'code':
        return formatCodeBlocks(content);
      case 'json':
        return formatJson(content);
      case 'table':
        return formatTable(content);
      case 'markdown':
        return formatMarkdown(content);
      default:
        return content;
    }
  };

  const formatCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    return content.replace(codeBlockRegex, (match, language, code) => {
      return `<div class="code-block">
        <div class="code-header">
          <span class="code-language">${language || 'code'}</span>
          <button class="copy-button" onclick="navigator.clipboard.writeText(\`${code.trim()}\`)">Copy</button>
        </div>
        <pre><code class="language-${language || 'text'}">${code.trim()}</code></pre>
      </div>`;
    });
  };

  const formatJson = (content: string) => {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const formatted = JSON.stringify(JSON.parse(jsonStr), null, 2);
        return content.replace(jsonStr, `<pre class="json-content">${formatted}</pre>`);
      }
    } catch (e) {
      // If JSON parsing fails, return original content
    }
    return content;
  };

  const formatTable = (content: string) => {
    const lines = content.split('\n');
    const tableLines = lines.filter(line => line.includes('|'));
    
    if (tableLines.length > 1) {
      const tableHtml = tableLines.map((line, index) => {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (index === 1) {
          // Skip separator line
          return '';
        }
        const cellTag = index === 0 ? 'th' : 'td';
        return `<tr>${cells.map(cell => `<${cellTag}>${cell}</${cellTag}>`).join('')}</tr>`;
      }).filter(row => row).join('');
      
      return content.replace(tableLines.join('\n'), `<table class="data-table">${tableHtml}</table>`);
    }
    return content;
  };

  const formatMarkdown = (content: string) => {
    let formatted = content;
    
    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Headers
    formatted = formatted.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    formatted = formatted.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Lists
    formatted = formatted.replace(/^\* (.*$)/gim, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Links
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return formatted;
  };

  const handleNewSession = async () => {
    try {
      setChatStatus('waiting');
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "Initialize new session",
          projectContext: {
            name: "New Project",
            description: "Created via web interface"
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create session');
      }
      
      const data = await response.json();
      setSessionId(data.session_id);
      setMessages([{
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        messageType: 'text'
      }]);
      setChatStatus('idle');
    } catch (error) {
      console.error('Error creating new session:', error);
      setChatStatus('error');
      setMessages([{
        role: 'assistant',
        content: 'Failed to initialize session. Please try again.',
        timestamp: new Date().toISOString(),
        messageType: 'text'
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    const message = inputMessage;
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      messageType: detectMessageType(message)
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setChatStatus('waiting');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      setIsTyping(false);
    }, 1000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: message
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send message');
      }
      
      const data = await response.json();
      
      if (data.status === 'success' || data.status === 'handoff' || data.status === 'guardrail_violation') {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          status: data.status,
          messageType: detectMessageType(data.response)
        };
        
        // Add agent info if available
        if (data.agent_info) {
          assistantMessage.agent_info = data.agent_info;
        }
        
        // Add guardrail violation info if available
        if (data.violations && data.violations.length > 0) {
          assistantMessage.guardrail_violation = data.violations[0];
        }
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.detail || 'Unexpected response format');
      }

      setChatStatus('idle');
    } catch (error) {
      console.error('Error sending message:', error);
      setChatStatus('error');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date().toISOString(),
        messageType: 'text'
      }]);
    }
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setInputMessage(template.content);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Coordinator Chat</h2>
            <p className="text-sm text-gray-600">Enhanced chat with formatting and templates</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              chatStatus === 'idle' ? 'bg-green-100 text-green-800' :
              chatStatus === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {chatStatus === 'idle' ? '🟢 Ready' : 
               chatStatus === 'waiting' ? '🟡 Processing' : '🔴 Error'}
            </div>
            <button
              onClick={handleNewSession}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              New Session
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to AI Coordinator</h3>
            <p className="text-gray-600 mb-6">Start a new session to begin chatting with your AI business intelligence coordinator.</p>
            <button
              onClick={handleNewSession}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start New Session
            </button>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {message.role === 'user' ? 'You' : 'AI Coordinator'}
                    </span>
                    {message.agent_info && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        🤖 {message.agent_info.name}
                      </span>
                    )}
                    {message.guardrail_violation && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        ⚠️ {message.guardrail_violation.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Message Content */}
                <div
                  className={`prose prose-sm max-w-none ${
                    message.role === 'user' ? 'prose-invert' : ''
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: formatMessageContent(message.content, message.messageType)
                  }}
                />

                {/* Message Status */}
                {message.status && (
                  <div className="mt-2 text-xs">
                    {message.status === 'handoff' && (
                      <span className="text-blue-600">🔄 Handed off to specialist agent</span>
                    )}
                    {message.status === 'guardrail_violation' && (
                      <span className="text-red-600">⚠️ Guardrail violation detected</span>
                    )}
                    {message.status === 'success' && (
                      <span className="text-green-600">✅ Processed successfully</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">AI is typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Templates */}
      {showTemplates && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {messageTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900">{template.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{template.content}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={sessionId ? "Type your message here... (Shift+Enter for new line)" : "Click 'New Session' to start chatting..."}
              disabled={!sessionId || chatStatus === 'waiting'}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Message Templates"
            >
              📝
            </button>
            <button
              onClick={handleSendMessage}
              disabled={!sessionId || chatStatus === 'waiting' || !inputMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {chatStatus === 'waiting' ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>

      {/* Custom CSS for enhanced formatting */}
      <style jsx>{`
        .code-block {
          background: #1e1e1e;
          border-radius: 8px;
          margin: 8px 0;
          overflow: hidden;
        }
        .code-header {
          background: #2d2d2d;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #404040;
        }
        .code-language {
          color: #9cdcfe;
          font-size: 12px;
          font-weight: 500;
        }
        .copy-button {
          background: #007acc;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        }
        .copy-button:hover {
          background: #005a9e;
        }
        .code-block pre {
          margin: 0;
          padding: 12px;
          overflow-x: auto;
        }
        .code-block code {
          color: #d4d4d4;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          line-height: 1.4;
        }
        .json-content {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 12px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          background: white;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .data-table th,
        .data-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .data-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        .data-table tr:hover {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
};

export default EnhancedChat;
