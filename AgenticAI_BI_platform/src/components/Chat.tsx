import { createChat } from '@n8n/chat';
import '@n8n/chat/style.css';
import React, { useEffect, useState } from 'react';

interface ResponseButtonProps {
  onClick: () => void;
  label: string;
}

const ResponseButton: React.FC<ResponseButtonProps> = ({ onClick, label }) => (
  <button
    onClick={onClick}
    style={{
      backgroundColor: '#3B82F6',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '6px',
      border: 'none',
      margin: '5px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '14px',
    }}
    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
  >
    {label}
  </button>
);

const Chat: React.FC = () => {
  const [key, setKey] = useState(0);
  const [showResponse, setShowResponse] = useState(false);
  const [responseOptions, setResponseOptions] = useState<string[]>([]);
  const [chatInitialized, setChatInitialized] = useState(false);

  const handleNewSession = () => {
    console.log('New session clicked');
    setKey(prev => prev + 1);
    setShowResponse(false);
    setResponseOptions([]);
  };

  const handleResponse = (response: string) => {
    console.log('User responded with:', response);
    setShowResponse(false);
  };

  const requestUserResponse = (options: string[]) => {
    console.log('Requesting user response with options:', options);
    setResponseOptions(options);
    setShowResponse(true);
  };

  useEffect(() => {
    console.log('Initializing chat...');
    try {
      const chat = createChat({
        webhookUrl: 'https://bmccartn.app.n8n.cloud/webhook/b3ddae7d-fffe-4e50-b242-744e822f7b58/chat',
      });
      console.log('Chat initialized successfully');
      setChatInitialized(true);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }

    window.addEventListener('chatResponseNeeded', ((event: CustomEvent) => {
      console.log('Chat response needed event received:', event.detail);
      requestUserResponse(event.detail.options);
    }) as EventListener);

    return () => {
      window.removeEventListener('chatResponseNeeded', (() => {}) as EventListener);
    };
  }, [key]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Debug info */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        zIndex: 10000,
        fontSize: '12px'
      }}>
        Chat Status: {chatInitialized ? 'Initialized' : 'Not Initialized'}
      </div>

      {/* New Session Button */}
      <div 
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <button
          onClick={handleNewSession}
          style={{
            backgroundColor: '#FF0000', // Changed to red to make it more visible
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#CC0000'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF0000'}
        >
          New Session
        </button>
      </div>
      
      {showResponse && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
          }}
        >
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Please select a response:</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {responseOptions.map((option, index) => (
              <ResponseButton
                key={index}
                label={option}
                onClick={() => handleResponse(option)}
              />
            ))}
          </div>
        </div>
      )}
      
      <div id="n8n-chat-widget" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Chat; 