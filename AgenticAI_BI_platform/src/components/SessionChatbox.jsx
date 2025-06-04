import React, { useEffect, useRef, useState } from 'react';

const API_BASE_URL = 'http://localhost:8000';
const defaultProjectContext = {
  name: 'Demo Project',
  description: 'A new project to demo the coordinator agent.'
};

const SessionChatbox = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [approval, setApproval] = useState(null);
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

  return (
    <div className="session-chatbox" style={{ maxWidth: 500, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 24 }}>
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