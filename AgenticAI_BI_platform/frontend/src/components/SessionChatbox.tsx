import React, { useRef, useState } from 'react';

interface SessionChatboxProps {
  sessionId: string | null;
  onFileUpload?: (document: any) => void;
  onSendMessage?: (message: string) => void;
}

const API_BASE_URL = 'http://localhost:5000';

const SessionChatbox: React.FC<SessionChatboxProps> = ({ sessionId, onFileUpload, onSendMessage }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !sessionId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('files', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/upload?session_id=${sessionId}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const data = await response.json();
      if (onFileUpload) {
        onFileUpload(data);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = () => {
    // This would send a message to the current session
    if (!message.trim() || !sessionId) return;
    
    if (onSendMessage) {
      onSendMessage(message);
    }
    
    setMessage('');
  };

  return (
    <div className="session-chatbox" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%' 
    }}>
      <div className="message-area" style={{ 
        flex: 1,
        padding: '10px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        marginBottom: '10px',
        overflowY: 'auto'
      }}>
        {/* Messages would be displayed here */}
      </div>
      
      <div className="input-area" style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept=".txt,.pdf,.docx,.xlsx,.csv"
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !sessionId}
          style={{
            padding: '8px',
            backgroundColor: '#4B5563',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: sessionId ? 'pointer' : 'not-allowed',
            opacity: sessionId ? 1 : 0.6
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={sessionId ? "Type a message..." : "Create a session first"}
          disabled={!sessionId}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
        />
        
        <button
          onClick={handleSendMessage}
          disabled={!message.trim() || !sessionId}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: message.trim() && sessionId ? 'pointer' : 'not-allowed',
            opacity: message.trim() && sessionId ? 1 : 0.6
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default SessionChatbox; 