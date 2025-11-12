import React from 'react';

const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">Workflow analytics and performance insights</p>
      </div>

      {/* Coming Soon Message */}
      <div className="bg-white rounded-lg shadow-md p-12 border border-gray-200 text-center">
        <div className="text-6xl mb-6">📊</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics Dashboard Coming Soon</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          We're working on connecting real analytics data from your n8n workflows. This will include:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8 text-left">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Workflow Performance</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Execution success rates</li>
              <li>• Average response times</li>
              <li>• Error tracking and trends</li>
              <li>• Resource usage metrics</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-900 mb-2">Agent Analytics</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Chat session statistics</li>
              <li>• Message volume by agent</li>
              <li>• User satisfaction metrics</li>
              <li>• Popular query patterns</li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="text-3xl mb-3">📈</div>
            <h3 className="font-semibold text-gray-900 mb-2">Usage Trends</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Daily/weekly/monthly trends</li>
              <li>• Peak usage times</li>
              <li>• Feature adoption rates</li>
              <li>• Growth metrics</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900 mb-2">Data Insights</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Vector store query analytics</li>
              <li>• Knowledge base effectiveness</li>
              <li>• Document processing stats</li>
              <li>• Metadata object creation</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-gray-900 mb-3">🛠️ Technical Implementation Plan</h3>
          <p className="text-sm text-gray-700 mb-3">
            The analytics dashboard will pull real-time data from:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li><strong>n8n API:</strong> Workflow executions, node statistics, and performance metrics</li>
            <li><strong>n8n MCP Server:</strong> Direct integration with your n8n workflows</li>
            <li><strong>Backend Logging:</strong> Agent conversations and session tracking</li>
            <li><strong>Vector Stores:</strong> Pinecone query analytics and usage patterns</li>
          </ul>
        </div>
      </div>

      {/* Current Capabilities */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Now</h2>
        <p className="text-gray-600 mb-6">
          While we build out the analytics dashboard, you can access these features:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.hash = '#agent-chat'}
            className="flex flex-col items-center p-6 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 text-center"
          >
            <span className="text-4xl mb-3">💬</span>
            <span className="font-semibold text-blue-900 mb-2">Agent Chat</span>
            <span className="text-sm text-blue-700">
              Interact with your AI agents and see real-time responses
            </span>
          </button>

          <button
            onClick={() => window.location.hash = '#workflows'}
            className="flex flex-col items-center p-6 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 text-center"
          >
            <span className="text-4xl mb-3">⚙️</span>
            <span className="font-semibold text-purple-900 mb-2">Workflow Manager</span>
            <span className="text-sm text-purple-700">
              View and manage your n8n workflow configurations
            </span>
          </button>

          <button
            onClick={() => window.location.hash = '#dashboard'}
            className="flex flex-col items-center p-6 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200 text-center"
          >
            <span className="text-4xl mb-3">📊</span>
            <span className="font-semibold text-green-900 mb-2">Dashboard</span>
            <span className="text-sm text-green-700">
              See overview of your workflows and agent status
            </span>
          </button>
        </div>
      </div>

      {/* Development Note */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">Want to Help Build This?</h3>
            <p className="text-sm text-yellow-800 mb-3">
              The analytics dashboard is a perfect opportunity to integrate real n8n workflow data. 
              Here's what needs to be implemented:
            </p>
            <div className="text-sm text-yellow-800 space-y-1">
              <p><strong>Backend:</strong> Create endpoints that query n8n API for execution history</p>
              <p><strong>Frontend:</strong> Build chart components using real data</p>
              <p><strong>MCP Integration:</strong> Use the n8n MCP server to get workflow statistics</p>
              <p><strong>Storage:</strong> Optionally store historical data for trend analysis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
