import React, { useState } from 'react';
import './App.css';
import ChatContainerManager from './components/ChatContainerManager';
import DocumentManager from './components/DocumentManager';
import Navigation from './components/Navigation';
import WorkflowManager from './components/WorkflowManager';

function App() {
  const [activeTab, setActiveTab] = useState('ai-coordinator');

  const renderContent = () => {
    switch (activeTab) {
      case 'ai-coordinator':
        return <ChatContainerManager />;
      case 'workflows':
        return <WorkflowManager />;
      case 'documents':
        return <DocumentManager />;
      default:
        return <ChatContainerManager />;
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