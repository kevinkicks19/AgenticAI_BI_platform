import { FileText, MessageCircle } from 'lucide-react';
import React from 'react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    {
      id: 'agent-chat',
      label: 'Agent Chat',
      icon: MessageCircle,
      description: 'Chat with AI agents via n8n'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      description: 'Upload and manage documents'
    }
  ];

  return (
    <nav className="w-64 bg-white border-r border-gray-200 p-4 h-screen">
        <div className="mb-6">
          <div className="mb-2">
            <h1 className="text-xl font-bold text-gray-900">Agentic AI BI</h1>
          </div>
          <p className="text-sm text-gray-600">Business Intelligence Platform</p>
        </div>

      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
                  <button
                    key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full p-3 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-blue-100 border border-blue-300 text-blue-800'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
