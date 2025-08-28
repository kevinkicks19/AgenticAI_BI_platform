import React from 'react';
import Chat from '../components/Chat';

const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">
          Agentic AI BI Platform Dashboard
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <Chat />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 