import React, { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface WorkflowChatProps {
  workflowId: string;
  workflowName: string;
  webhookUrl: string;
  onClose: () => void;
}

const WorkflowChat: React.FC<WorkflowChatProps> = ({
  workflowId,
  workflowName,
  webhookUrl,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

          try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputMessage,
            session_id: `workflow-${workflowId}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: 'workflow_chat',
            workflow_id: workflowId
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Handle different response formats from n8n
          let responseContent = 'Workflow processed your request successfully.';
          
          if (data.response) {
            responseContent = data.response;
          } else if (data.message) {
            responseContent = data.message;
          } else if (data.error) {
            responseContent = `Workflow error: ${data.error}`;
          } else if (data.result) {
            responseContent = data.result;
          }
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: responseContent,
            role: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Error: Workflow returned status ${response.status}. This might indicate an issue with the workflow configuration.`,
            role: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Error: Failed to communicate with workflow. Please check your connection or try again later.`,
          role: 'assistant',
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

  return (
    <div className="workflow-chat-container">
      <div className="workflow-chat-header">
        <h3>Chat with {workflowName}</h3>
        <button onClick={onClose} className="close-button">
          ×
        </button>
      </div>
      
      <div className="workflow-chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>Welcome to the {workflowName} workflow chat!</p>
            <p>Ask me anything about this workflow or start a conversation.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="workflow-chat-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          disabled={isLoading}
          rows={2}
        />
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default WorkflowChat;
