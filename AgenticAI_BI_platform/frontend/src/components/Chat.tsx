import React, { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ResponseButtonProps {
  onClick: () => void;
  label: string;
}

interface ApprovalRequest {
  requestId: string;
  message: string;
  options: string[];
}

interface Document {
  filename: string;
  upload_time: string;
  content_type: string;
  file_size: number;
}

const API_BASE_URL = 'http://localhost:8000';

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
  const [currentRequest, setCurrentRequest] = useState<ApprovalRequest | null>(null);
  const [chatStatus, setChatStatus] = useState<'idle' | 'waiting' | 'error'>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setDocuments([]);
      setKey(prev => prev + 1);
      setShowResponse(false);
      setCurrentRequest(null);
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

    const newMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
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
          message: inputMessage
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send message');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        }]);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !sessionId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/upload?sessionId=${sessionId}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload document');
      
      const data = await response.json();
      setDocuments(prev => [...prev, {
        filename: data.metadata.filename,
        upload_time: data.metadata.upload_time,
        content_type: data.metadata.content_type,
        file_size: data.metadata.file_size
      }]);

      // Add a system message about the upload
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Document "${file.name}" has been uploaded and processed.`,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error uploading file:', error);
      setChatStatus('error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResponse = async (response: string) => {
    if (!currentRequest) return;
    
    console.log('User responded with:', response);
    try {
      // Send the response back to the backend
      const responseUrl = `${API_BASE_URL}/api/approval/${currentRequest.requestId}?response=${encodeURIComponent(response)}`;
      const result = await fetch(responseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!result.ok) {
        throw new Error('Failed to send response');
      }

      setShowResponse(false);
      setCurrentRequest(null);
      setChatStatus('idle');
    } catch (error) {
      console.error('Error sending response:', error);
      setChatStatus('error');
    }
  };

  // Function to check for pending approval requests
  const checkForApprovalRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/approval/pending`);
      if (response.ok) {
        const request: ApprovalRequest = await response.json();
        if (request) {
          setCurrentRequest(request);
          setShowResponse(true);
          setChatStatus('waiting');
        }
      }
    } catch (error) {
      console.error('Error checking for approval requests:', error);
      setChatStatus('error');
    }
  };

  useEffect(() => {
    // Set up polling for approval requests
    const pollInterval = setInterval(checkForApprovalRequests, 5000); // Check every 5 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [key]); // Reset polling when session changes

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
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
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#CC0000'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF0000'}
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
        marginBottom: '20px'
      }}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '10px'
            }}
          >
            <div style={{
              maxWidth: '70%',
              padding: '10px 15px',
              borderRadius: '12px',
              backgroundColor: message.role === 'user' ? '#3B82F6' : 'white',
              color: message.role === 'user' ? 'white' : 'black',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              {message.content}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '4px'
            }}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Uploaded Documents</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {documents.map((doc, index) => (
              <div
                key={index}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                {doc.filename} ({new Date(doc.upload_time).toLocaleString()})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept=".txt,.pdf,.docx,.xls,.xlsx,.csv"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !sessionId}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4B5563',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            opacity: isUploading || !sessionId ? 0.5 : 1
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={sessionId ? "Type your message..." : "Start a new session to chat..."}
          disabled={!sessionId}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || !sessionId}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            opacity: !inputMessage.trim() || !sessionId ? 0.5 : 1
          }}
        >
          Send
        </button>
      </div>

      {/* Approval Request Modal */}
      {showResponse && currentRequest && (
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
            maxWidth: '80%',
            width: '600px',
          }}
        >
          <div style={{ 
            marginBottom: '10px', 
            fontWeight: 'bold',
            fontSize: '16px',
            textAlign: 'center'
          }}>
            {currentRequest.message}
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            flexWrap: 'wrap', 
            justifyContent: 'center' 
          }}>
            {currentRequest.options.map((option, index) => (
              <ResponseButton
                key={index}
                label={option}
                onClick={() => handleResponse(option)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat; 