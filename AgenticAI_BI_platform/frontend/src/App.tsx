import React, { useState } from 'react';
import './App.css';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ChatContainerManager from './components/ChatContainerManager';
import Dashboard from './components/Dashboard';
import DocumentManager from './components/DocumentManager';
import Navigation from './components/Navigation';
import SettingsPanel from './components/SettingsPanel';
import WorkflowManager from './components/WorkflowManager';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'ai-coordinator':
        return <ChatContainerManager />;
      case 'workflows':
        return <WorkflowManager />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'documents':
        return <DocumentManager />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <Dashboard />;
    }
  };


  return (
    <NotificationProvider>
      <div className="App">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </NotificationProvider>
  );
}

export default App; 