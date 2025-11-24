import React, { useState } from 'react';
import './App.css';
import AgentChatInterface from './components/AgentChatInterface';
import DocumentUpload from './components/DocumentUpload';
import Navigation from './components/Navigation';

function App() {
  const [activeTab, setActiveTab] = useState('agent-chat');

  const renderContent = () => {
    switch (activeTab) {
      case 'agent-chat':
        return <AgentChatInterface />;
      case 'documents':
        return <DocumentUpload />;
      default:
        return <AgentChatInterface />;
    }
  };


  return (
    <div className="App">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}

export default App; 