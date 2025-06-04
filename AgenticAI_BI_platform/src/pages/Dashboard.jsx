import React, { useState, useEffect } from 'react';
import { fetchAgents, triggerN8n } from '../utils/api';

function Dashboard() {
  const [agents, setAgents] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const n8nUrl = "https://bmccartn.app.n8n.cloud/webhook-test/1ca71fb5-6b71-4a82-9376-a5105df7a345";

  useEffect(() => {
    fetchAgents()
      .then(data => {
        setAgents(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching agents:", error);
      })
  }, []);

  const handleTriggerN8n = async () => {
    const response = await triggerN8n(n8nUrl);
    console.log("N8n Trigger Response:", response);
  };

  return (
    <div>
      <h1>Welcome to your Dashboard!</h1>
      {isLoading ? (
        <p>Loading agents...</p>
      ) : (
        <ul>
          {agents && agents.map((agent, index) => (
            <li key={index}>
              Name: {agent.name}, Priority: {agent.priority}
            </li>
          ))}
        </ul>
      )}
      <div>
        <button onClick={handleTriggerN8n}>Trigger N8N</button>
      </div>
    </div>
  );
}

export default Dashboard;