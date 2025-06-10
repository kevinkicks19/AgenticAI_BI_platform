import React, { useEffect, useRef, useState } from 'react';

const API_BASE_URL = 'http://localhost:8000';
const defaultProjectContext = {
  name: 'Demo Project',
  description: 'A new project to demo the coordinator agent.'
};

// Add Document and ProjectContext interfaces
const initialDocuments = [];

const ProjectContextUpload = ({ onContextUpdate, documents, sessionId }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    console.log('Uploading files...', files, sessionId);
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/upload?session_id=${sessionId}`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload documents');
      const data = await response.json();
      const updatedContext = {
        name: projectName,
        description: projectDescription,
        documents: [...documents, ...(data.documents || [])]
      };
      onContextUpdate(updatedContext);
      updateProjectContext(updatedContext);
      setUploadStatus('Files uploaded and processed successfully.');
    } catch (error) {
      setUploadStatus('Error uploading files.');
      console.error('Error uploading files:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setUploadStatus(''), 4000);
    }
  };

  const updateProjectContext = async (newContext) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/project/update_context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, context: newContext })
      });
      if (!res.ok) throw new Error("Failed to update project context");
      const data = await res.json();
      console.log("Project context updated:", data);
    } catch (error) {
      console.error("Error updating project context:", error);
    }
  };

  return (
    <div className="project-context-upload" style={{
      padding: '20px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <div style={{ color: 'red', fontWeight: 'bold' }}>DEBUG: sessionId = {sessionId ? sessionId : 'NOT SET'}</div>
      {uploadStatus && (
        <div style={{ marginBottom: '10px', color: uploadStatus.startsWith('Error') ? 'red' : 'green', fontWeight: 'bold' }}>
          {uploadStatus}
        </div>
      )}
      <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>Project Context</h3>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Project Name"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
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
          onChange={e => setProjectDescription(e.target.value)}
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

const SessionChatbox = () => {
  // Generate a random sessionId immediately
  const [sessionId, setSessionId] = useState(() => 'session_' + Math.random().toString(36).substring(2, 10));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [approval, setApproval] = useState(null);
  const [projectContext, setProjectContext] = useState({
    name: '',
    description: '',
    documents: initialDocuments
  });
  const chatEndRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    async function initSession() {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: 'init',
          projectContext: defaultProjectContext,
          userId: 'demo_user',
        })
      });
      const data = await res.json();
      // Assume backend returns sessionId in response (if not, adjust accordingly)
      if (data.session_id || data.sessionId) {
        setSessionId(data.session_id || data.sessionId);
      } else {
        // fallback: generate a random sessionId
        setSessionId('session_' + Math.random().toString(36).substring(2, 10));
      }
      setMessages([{ sender: 'agent', text: 'Welcome! How can I help with your project?' }]);
    }
    initSession();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    setLoading(true);
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    setInput('');
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatInput: input,
        sessionId: sessionId
      })
    });
    const data = await res.json();
    // Show agent response
    setMessages(prev => [...prev, { sender: 'agent', text: data.response || '...' }]);
    // Handle approval if needed (stub: look for approval in response)
    if (data.response && data.response.toLowerCase().includes('approve')) {
      setApproval({ pending: true });
    } else {
      setApproval(null);
    }
    setLoading(false);
  };

  const handleApproval = async (approved) => {
    setApproval({ pending: false });
    setMessages(prev => [...prev, { sender: 'user', text: approved ? 'Approved' : 'More info needed' }]);
    const res = await fetch(`${API_BASE_URL}/api/approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        approved: approved
      })
    });
    const data = await res.json();
    setMessages(prev => [...prev, { sender: 'agent', text: data.status || 'Approval recorded.' }]);
  };

  const updateProjectContext = async (newContext) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/project/update_context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, context: newContext })
      });
      if (!res.ok) throw new Error("Failed to update project context");
      const data = await res.json();
      console.log("Project context updated:", data);
    } catch (error) {
      console.error("Error updating project context:", error);
    }
  };

  return (
    <div className="session-chatbox" style={{ maxWidth: 500, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 24 }}>
      {/* Project Context Upload always visible at the top */}
      <ProjectContextUpload
        onContextUpdate={setProjectContext}
        documents={projectContext.documents}
        sessionId={sessionId}
      />
      <h2 style={{ color: '#2563eb', marginBottom: 16 }}>Coordinator Agent Chat</h2>
      <div style={{ minHeight: 300, marginBottom: 16, overflowY: 'auto', maxHeight: 400 }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.sender === 'user' ? 'user-message' : 'agent-message'} style={{ marginBottom: 8 }}>
            {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      {approval?.pending && (
        <div style={{ marginBottom: 16 }}>
          <button className="approval-btn" onClick={() => handleApproval(true)}>Approve</button>
          <button className="approval-btn deny" onClick={() => handleApproval(false)}>More Info Needed</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          placeholder="Type your message..."
          style={{ flex: 1 }}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>Send</button>
      </div>
    </div>
  );
};

export default SessionChatbox; 