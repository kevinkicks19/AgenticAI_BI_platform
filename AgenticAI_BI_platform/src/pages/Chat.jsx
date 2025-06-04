import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const [responseOptions, setResponseOptions] = useState([]);
  const [showApproval, setShowApproval] = useState(false);
  const [lastSummaryMessage, setLastSummaryMessage] = useState(null);

  const handleNewSession = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setMessages([]);
    setInputMessage("");
    setShowResponse(false);
    setResponseOptions([]);
    setShowApproval(false);
    setLastSummaryMessage(null);
    console.log('New session started:', newSessionId);
  };

  const handleApproval = async (approved) => {
    try {
      const response = await fetch('http://localhost:5173/api/approval-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          approved: approved,
          messageId: lastSummaryMessage?.id
        }),
      });

      if (response.ok) {
        setShowApproval(false);
        if (!approved) {
          setMessages(prev => [...prev, {
            text: "Please provide more information about your requirements.",
            sender: 'system',
            type: 'info-request'
          }]);
        } else {
          setMessages(prev => [...prev, {
            text: "Summary approved. Proceeding with the workflow.",
            sender: 'system',
            type: 'approval-confirmed'
          }]);
        }
      }
    } catch (error) {
      console.error("Error sending approval response:", error);
    }
  };

  const handleSend = async () => {
    if (inputMessage.trim()) {
      const newMessage = { 
        text: inputMessage, 
        sender: 'user',
        id: uuidv4()
      };
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
      
      try {
        const response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: inputMessage, 
            sessionId: sessionId 
          }),
        });

        const data = await response.json();
        
        if (data.options && Array.isArray(data.options)) {
          setResponseOptions(data.options);
          setShowResponse(true);
        } else {
          setMessages(prev => [...prev, { 
            text: data.output, 
            sender: 'agent',
            id: uuidv4(),
            isSummary: data.isSummary
          }]);

          // If this is a summary message, show approval buttons
          if (data.isSummary) {
            setLastSummaryMessage({
              text: data.output,
              sender: 'agent',
              id: uuidv4(),
              isSummary: true
            });
            setShowApproval(true);
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages(prev => [...prev, { 
          text: "Error sending message. Please try again.", 
          sender: 'agent',
          id: uuidv4()
        }]);
      }
    }
  };

  const handleResponse = async (selectedOption) => {
    console.log('User selected response:', selectedOption);
    setShowResponse(false);
    setResponseOptions([]);
    
    setMessages(prev => [...prev, { 
      text: selectedOption, 
      sender: 'user',
      id: uuidv4()
    }]);
    
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: selectedOption, 
          sessionId: sessionId,
          isResponse: true 
        }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { 
        text: data.output, 
        sender: 'agent',
        id: uuidv4(),
        isSummary: data.isSummary
      }]);

      // If this is a summary message, show approval buttons
      if (data.isSummary) {
        setLastSummaryMessage({
          text: data.output,
          sender: 'agent',
          id: uuidv4(),
          isSummary: true
        });
        setShowApproval(true);
      }
    } catch (error) {
      console.error("Error sending response:", error);
      setMessages(prev => [...prev, { 
        text: "Error processing response. Please try again.", 
        sender: 'agent',
        id: uuidv4()
      }]);
    }
  };

  // Add this new function to handle GET requests for approval status
  const handleApprovalRequest = async (req) => {
    if (req.url.startsWith('/api/approval-request/')) {
      const sessionId = req.url.split('/').pop();
      if (sessionId === sessionId && showApproval && lastSummaryMessage) {
        return {
          needsApproval: true,
          summary: lastSummaryMessage.text,
          messageId: lastSummaryMessage.id
        };
      }
      return { needsApproval: false };
    }
  };

  // Add this to your component to set up the endpoint
  useEffect(() => {
    // Set up the GET endpoint for approval requests
    const server = {
      fetch: async (req) => {
        if (req.url.startsWith('/api/approval-request/')) {
          return handleApprovalRequest(req);
        }
        return new Response('Not found', { status: 404 });
      }
    };

    // Register the endpoint
    if (typeof window !== 'undefined') {
      window.approvalServer = server;
    }
  }, [sessionId, showApproval, lastSummaryMessage]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      padding: '20px',
      position: 'relative',
      gap: '20px'
    }}>
      {/* New Session Button */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
      }}>
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

      {/* Chat Messages */}
      <div 
        className="message-container" 
        style={{ 
          flex: 1,
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
          overflowY: "auto",
          backgroundColor: "#f9fafb",
          minHeight: 0,
          position: 'relative',
          zIndex: 1
        }}
      >
        {messages.map((message, index) => (
          <div key={message.id || index}>
            <div
              style={{
                marginBottom: "12px",
                padding: "12px 16px",
                borderRadius: "8px",
                maxWidth: "80%",
                backgroundColor: message.sender === "user" ? "#3B82F6" : 
                               message.sender === "system" ? "#F3F4F6" : "#ffffff",
                color: message.sender === "user" ? "#ffffff" : "#1f2937",
                alignSelf: message.sender === "user" ? "flex-end" : "flex-start",
                marginLeft: message.sender === "user" ? "auto" : "0",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            >
              {message.text}
            </div>
            
            {/* Show approval buttons after the last summary message */}
            {showApproval && 
             message.id === lastSummaryMessage?.id && (
              <div style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
                marginTop: '10px',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => handleApproval(true)}
                  style={{
                    backgroundColor: '#10B981',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10B981'}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleApproval(false)}
                  style={{
                    backgroundColor: '#EF4444',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                >
                  More Info Needed
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Response Options */}
      {showResponse && (
        <div style={{
          position: 'fixed',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minWidth: '300px',
        }}>
          <div style={{ 
            marginBottom: '10px', 
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#1f2937'
          }}>
            Please select a response:
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '8px'
          }}>
            {responseOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleResponse(option)}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: '10px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 3,
        marginTop: 'auto'
      }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '16px',
            backgroundColor: 'white',
            position: 'relative',
            zIndex: 3,
            color: '#1f2937',
            outline: 'none',
            '&::placeholder': {
              color: '#9ca3af'
            }
          }}
        />
        <button
          onClick={handleSend}
          style={{
            backgroundColor: '#3B82F6',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500',
            position: 'relative',
            zIndex: 3
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;