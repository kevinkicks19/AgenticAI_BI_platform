import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  const handleSend = async () => {
    if (inputMessage.trim()) {
      const newMessage = { text: inputMessage, sender: 'user' };
      setMessages([...messages, newMessage]);
      setInputMessage('');
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: inputMessage, sessionId: sessionId }),
        });

        const data = await response.text();
        setMessages(prevMessages => [...prevMessages, { text: data, sender: 'agent' }]);
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages(prevMessages => [...prevMessages, { text: "Error sending message.", sender: 'agent' }]);
      }
    }
  };
  return (    
    <div>      
      <h2>Chat with Agent</h2>      
      <div className="message-container" style={{ border: "1px solid black", padding: "10px", height: "300px", overflowY: "scroll", }}>
        {messages.map((message, index) => {
          return (
            <div
              key={index} className={message.sender === "user" ? "user-message" : "agent-message"}
            >
               {message.text}
            </div>

          );


        })}
      </div>
      <div>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
export default Chat;