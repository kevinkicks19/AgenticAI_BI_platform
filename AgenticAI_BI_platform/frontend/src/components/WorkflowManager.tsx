import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, ExternalLink, MessageCircle } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  type: string;
  webhookUrl: string;
  icon: string;
  tags: string[];
  capabilities: string[];
}

const WorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/agents/list');
      setWorkflows(response.data.agents || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter(workflow => 
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workflow.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openInN8n = (workflowId: string) => {
    // Opens the workflow in n8n (you'd need to configure your n8n URL)
    window.open(`https://bmccartn.app.n8n.cloud/workflow/${workflowId}`, '_blank');
  };

  const openChat = (workflowId: string) => {
    // Navigate to agent chat with this workflow selected
    window.location.hash = '#agent-chat';
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflow Manager</h1>
          <p className="text-gray-600">
            Manage your n8n AI agent workflows
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search workflows by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-2xl font-bold text-gray-900">{workflows.length}</div>
            <div className="text-sm text-gray-600">Total Workflows</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-2xl mb-2">🟢</div>
            <div className="text-2xl font-bold text-green-600">
              {workflows.filter(w => w.active).length}
            </div>
            <div className="text-sm text-gray-600">Active Workflows</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-2xl mb-2">💬</div>
            <div className="text-2xl font-bold text-blue-600">
              {workflows.filter(w => w.active).length}
            </div>
            <div className="text-sm text-gray-600">Available for Chat</div>
          </div>
        </div>

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <div 
              key={workflow.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{workflow.icon}</div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  workflow.active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {workflow.active ? '🟢 Active' : '⚪ Inactive'}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {workflow.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {workflow.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {workflow.tags.slice(0, 3).map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {workflow.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{workflow.tags.length - 3}
                  </span>
                )}
              </div>

              {/* Capabilities */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 mb-2">Capabilities:</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {workflow.capabilities.slice(0, 2).map((cap, idx) => (
                    <li key={idx}>• {cap}</li>
                  ))}
                  {workflow.capabilities.length > 2 && (
                    <li className="text-gray-400">
                      +{workflow.capabilities.length - 2} more
                    </li>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openChat(workflow.id)}
                  disabled={!workflow.active}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
                <button
                  onClick={() => openInN8n(workflow.id)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  title="Open in n8n"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              {/* Webhook URL (for reference) */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">ID:</span>{' '}
                  <span className="font-mono">{workflow.id.substring(0, 12)}...</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredWorkflows.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No workflows found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search terms
            </p>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">About These Workflows</h3>
              <p className="text-sm text-blue-800 mb-3">
                These are your n8n AI agent workflows. Each workflow is configured with:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>AI Processing:</strong> OpenAI GPT models for natural language understanding</li>
                <li>• <strong>Vector Stores:</strong> Pinecone RAG for knowledge retrieval</li>
                <li>• <strong>Webhook Triggers:</strong> HTTP endpoints for real-time chat</li>
                <li>• <strong>Memory:</strong> Session-based conversation context</li>
              </ul>
              <div className="mt-4 text-sm text-blue-700">
                <strong>Quick Actions:</strong>
                <br />
                • Click "Chat" to start a conversation with an agent
                <br />
                • Click the external link icon to open the workflow in n8n
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowManager;
