import {
    Bot,
    Send
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const IntegratedChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('default');
  const [currentTurn, setCurrentTurn] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session
  useEffect(() => {
    initializeChat();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chat');
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id || 'default');
        
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          type: 'assistant',
          content: 'Hello! I\'m your AI Business Intelligence Coordinator. I can help you analyze data, execute workflows, and solve business problems. Use the "Add Workflow" button in the sidebar to start working with specialized AI agents.',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      // Add fallback welcome message
      const fallbackMessage: ChatMessage = {
        id: 'welcome-fallback',
        type: 'assistant',
        content: 'Hello! I\'m your AI Business Intelligence Coordinator. I can help you analyze data, execute workflows, and solve business problems. Use the "Add Workflow" button in the sidebar to start working with specialized AI agents.',
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
    }
  };

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
    setCurrentTurn(prev => prev + 1);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          session_id: sessionId,
          turn: currentTurn + 1
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('DEBUG: Coordinator response:', result);
        
        if (result.status === 'success') {
        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: result.output || result.message || 'I\'ve processed your request.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        setCurrentTurn(prev => prev + 1);
                  } else if (result.status === 'workflow_listing') {
            // Handle workflow listing response
            const assistantMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: result.response || result.message || 'Here are the available workflows.',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            
            setCurrentTurn(prev => prev + 1);
            
            // Log workflow information
            if (result.workflows) {
              console.log(`DEBUG: Found ${result.workflow_count} workflows:`, result.workflows);
            }
          } else if (result.status === 'bi_guidance') {
            // Handle BI workflow guidance response
            const assistantMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              type: 'assistant',
              content: result.response || result.message || 'Here is guidance on our BI workflow system.',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            
            setCurrentTurn(prev => prev + 1);
            
            // Log guidance information
            if (result.guidance) {
              console.log(`DEBUG: BI Guidance for phase: ${result.phase}`, result.guidance);
            }
          } else if (result.status === 'handoff') {
          // Handle handoff response
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: result.response || 'Transferring to specialized agent...',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
          
          setCurrentTurn(prev => prev + 1);
        } else {
          // Handle other status types
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            type: 'assistant',
            content: result.response || result.message || 'I\'ve processed your request.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
          
          setCurrentTurn(prev => prev + 1);
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center space-x-3">
          <Bot className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-semibold">AI Coordinator Chat</h1>
            <p className="text-sm text-blue-100">Session: {sessionId}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 border border-gray-300'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              
              <div className={`text-xs mt-2 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 text-gray-800 border border-gray-300 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about workflows, business problems, or general questions..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
        </div>
      </div>
    </div>
  );
};

export default IntegratedChat;
