import { createChat } from '@n8n/chat';
import '@n8n/chat/style.css';
import React, { useEffect, useState, useRef } from 'react';

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

// Add Document and ProjectContext interfaces
interface Document {
  filename: string;
  upload_time: string;
  content_type: string;
  file_size: number;
}

interface ProjectContext {
  name: string;
  description: string;
  documents: Document[];
}

const API_BASE_URL = 'http://localhost:8000';

// Add ProjectContextUpload component
const ProjectContextUpload: React.FC<{
  onContextUpdate: (context: ProjectContext) => void;
  documents: Document[];
}> = ({ onContextUpdate, documents }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload documents');
      const data = await response.json();
      onContextUpdate({
        name: projectName,
        description: projectDescription,
        documents: [...documents, ...(data.documents || [])]
      });
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="project-context-upload" style={{
      padding: '20px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>Project Context</h3>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0'
          }}
        />
        <textarea
          placeholder="Project Description"
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            minHeight: '100px',
            resize: 'vertical'
          }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept=".txt,.pdf,.docx,.xlsx,.csv"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            backgroundColor: '#3B82F6',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Upload Project Files
        </button>
        <span style={{ fontSize: '14px', color: '#64748b' }}>
          Supported formats: TXT, PDF, DOCX, XLSX, CSV
        </span>
      </div>
      {documents.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ marginBottom: '10px', color: '#1e293b' }}>Uploaded Documents:</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {documents.map((doc, index) => (
              <li key={index} style={{
                padding: '8px',
                backgroundColor: 'white',
                borderRadius: '4px',
                marginBottom: '5px',
                border: '1px solid #e2e8f0'
              }}>
                {doc.filename} ({Math.round(doc.file_size / 1024)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const Chat: React.FC = () => {
  const [key, setKey] = useState(0);
  const [showResponse, setShowResponse] = useState(false);
  const [responseOptions, setResponseOptions] = useState<string[]>([]);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [projectContext, setProjectContext] = useState<ProjectContext>({
    name: '',
    description: '',
    documents: []
  });

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
      {/* Project Context Upload always visible at the top */}
      <ProjectContextUpload
        onContextUpdate={setProjectContext}
        documents={projectContext.documents}
      />
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