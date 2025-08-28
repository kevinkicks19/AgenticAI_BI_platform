import { Maximize2, Minimize2, Send, Workflow, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EmbeddedN8nChatProps {
  workflowId: string;
  title: string;
  description?: string;
  webhookUrl: string;
  agentType: string;
  onClose: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const EmbeddedN8nChat: React.FC<EmbeddedN8nChatProps> = ({
  workflowId,
  title,
  description,
  webhookUrl,
  agentType,
  onClose,
  onMinimize,
  isMinimized = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionId] = useState(`workflow-${workflowId}-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Add welcome message when component mounts
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'assistant',
      content: `Hello! I'm your ${title} assistant. How can I help you today?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [title]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Use the coordinator's MCP-based workflow execution instead of direct webhook
      const coordinatorExecutionData = {
        workflow_id: workflowId,
        message: inputMessage,
        session_context: {
          session_id: sessionId,
          turn: messages.length + 1,
          timestamp: new Date().toISOString(),
          workflow_id: workflowId,
          agent_type: agentType,
          execution_source: "embedded_chat"
        }
      };

      console.log(`DEBUG: Executing workflow ${workflowId} via coordinator MCP:`, coordinatorExecutionData);

      const response = await fetch('http://localhost:5000/api/handoff/execute-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coordinatorExecutionData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('DEBUG: Coordinator workflow execution result:', result);
        
        if (result.status === 'success') {
          const executionResult = result.execution_result;
          
          // Create assistant message from the workflow execution result
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: executionResult.result?.response || 
                     executionResult.result?.message || 
                     executionResult.message || 
                     'Workflow executed successfully via MCP',
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMessage]);
          
          // Log execution details
          console.log(`DEBUG: Workflow executed via ${executionResult.execution_method}:`, executionResult);
          
        } else {
          throw new Error(`Workflow execution failed: ${result.message}`);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('DEBUG: Error executing workflow via coordinator:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: `Sorry, I encountered an error executing the ${title} workflow. Please try again or contact support.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onMinimize}
          className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
          title={`Restore ${title} chat`}
        >
          <Workflow className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl ${
      isFullscreen 
        ? 'inset-4' 
        : 'bottom-4 right-4 w-96 h-[500px]'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Workflow className="w-5 h-5" />
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            {description && (
              <p className="text-xs text-purple-100">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleFullscreen}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Minimize chat"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{maxHeight: 'calc(100vh - 300px)'}}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  message.type === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-purple-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ${title}...`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer with workflow info */}
      <div className="bg-gray-50 p-2 text-xs text-gray-600 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span>Workflow: {workflowId}</span>
          <span>Agent: {agentType}</span>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedN8nChat;
