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
}

const API_BASE_URL = 'http://localhost:5000';

const Chat: React.FC = () => {
  console.log('Chat component is rendering...');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<'idle' | 'waiting' | 'error'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        timestamp: new Date().toISOString()
      }]);
      setChatStatus('idle');
    } catch (error) {
      console.error('Error creating new session:', error);
      setChatStatus('error');
      setMessages([{
        role: 'assistant',
        content: 'Failed to initialize session. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    const message = inputMessage;
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setChatStatus('waiting');

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
          status: data.status
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
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <button style={{ 
        backgroundColor: '#10B981', 
        color: 'white', 
        padding: '10px 20px', 
        borderRadius: '8px', 
        fontWeight: 'bold', 
        fontSize: '18px', 
        marginBottom: '20px' 
      }}>
        ✅ Chat Component is Working!
      </button>

      {/* Status and New Session Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Chat Status: {chatStatus.toUpperCase()}
        </div>
        <button
          onClick={handleNewSession}
          style={{
            backgroundColor: '#FF0000',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          New Session
        </button>
      </div>
      
      {/* Chat Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginBottom: '20px',
        minHeight: '400px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '16px',
            marginTop: '50px'
          }}>
            Click "New Session" to start chatting with the AI coordinator!
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} style={{
              marginBottom: '15px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: message.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              borderLeft: message.role === 'user' ? '4px solid #2196f3' : '4px solid #4caf50'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {message.role === 'user' ? 'You' : 'Assistant'}
                {message.agent_info && (
                  <span style={{ 
                    marginLeft: '10px', 
                    fontSize: '12px', 
                    color: '#666',
                    backgroundColor: '#fff3cd',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    🤖 {message.agent_info.name}
                  </span>
                )}
                {message.guardrail_violation && (
                  <span style={{ 
                    marginLeft: '10px', 
                    fontSize: '12px', 
                    color: '#721c24',
                    backgroundColor: '#f8d7da',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    ⚠️ {message.guardrail_violation.name}
                  </span>
                )}
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={sessionId ? "Type your message here..." : "Click 'New Session' to start chatting..."}
          disabled={!sessionId || chatStatus === 'waiting'}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '16px',
            opacity: sessionId ? 1 : 0.6
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!sessionId || chatStatus === 'waiting'}
          style={{
            backgroundColor: sessionId ? '#3B82F6' : '#ccc',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            cursor: sessionId ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          {chatStatus === 'waiting' ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default Chat; 