import { createChat } from '@n8n/chat';
import '@n8n/chat/style.css';
import React, { useEffect, useState } from 'react';

const Chat: React.FC = () => {
  const [key, setKey] = useState(0);

  const handleNewSession = () => {
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    createChat({
      webhookUrl: 'https://bmccartn.app.n8n.cloud/webhook/b3ddae7d-fffe-4e50-b242-744e822f7b58/chat',
    });
  }, [key]);

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
        }}
      >
        <button
          onClick={handleNewSession}
          style={{
            backgroundColor: '#3B82F6',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
        >
          New Session
        </button>
      </div>
      <div id="n8n-chat-widget" />
    </>
  );
};

export default Chat; 