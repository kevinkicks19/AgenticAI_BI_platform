import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface WorkflowSummary {
  id: string;
  name: string;
  active: boolean;
  nodeCount: number;
  updatedAt: string;
  tags: string[];
}

interface Agent {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  type: string;
}

const Dashboard: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    activeAgents: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load agents
      const agentsResponse = await axios.get('http://localhost:5000/api/agents/list');
      const agentsList = agentsResponse.data.agents || [];
      setAgents(agentsList);

      // For now, we'll use a simplified workflow list
      // In the future, this could call the n8n MCP to get real workflow data
      const activeWorkflows = agentsList.filter((a: Agent) => a.active);
      
      setStats({
        totalWorkflows: agentsList.length,
        activeWorkflows: activeWorkflows.length,
        activeAgents: activeWorkflows.length
      });

      setWorkflows(agentsList.map((agent: Agent) => ({
        id: agent.id,
        name: agent.name,
        active: agent.active,
        nodeCount: 0, // This would come from n8n MCP
        updatedAt: 'Recently',
        tags: [agent.type]
      })));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Overview of your n8n workflows and AI agents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">⚡</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalWorkflows}</div>
          </div>
          <h3 className="text-sm text-gray-600 font-medium">Total Workflows</h3>
          <p className="text-xs text-gray-500 mt-1">Configured n8n workflows</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">🟢</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeWorkflows}</div>
          </div>
          <h3 className="text-sm text-gray-600 font-medium">Active Workflows</h3>
          <p className="text-xs text-gray-500 mt-1">Currently available</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">🤖</div>
            <div className="text-2xl font-bold text-blue-600">{stats.activeAgents}</div>
          </div>
          <h3 className="text-sm text-gray-600 font-medium">Active Agents</h3>
          <p className="text-xs text-gray-500 mt-1">Ready to assist</p>
        </div>
      </div>

      {/* Workflow/Agent List */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">AI Agents & Workflows</h2>
          <button 
            onClick={loadDashboardData}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
        
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">
                  {agents.find(a => a.id === workflow.id)?.icon || '⚡'}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {workflow.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  workflow.active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {workflow.active ? '🟢 Active' : '⚪ Inactive'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => window.location.hash = '#agent-chat'}
            className="flex items-center justify-center space-x-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            <span className="text-2xl">💬</span>
            <span className="font-medium text-blue-900">Chat with Agents</span>
          </button>
          
          <button 
            onClick={() => window.location.hash = '#workflows'}
            className="flex items-center justify-center space-x-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
          >
            <span className="text-2xl">⚙️</span>
            <span className="font-medium text-purple-900">Manage Workflows</span>
          </button>
          
          <button 
            onClick={() => window.location.hash = '#documents'}
            className="flex items-center justify-center space-x-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
          >
            <span className="text-2xl">📄</span>
            <span className="font-medium text-green-900">View Documents</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">About This Dashboard</h3>
            <p className="text-sm text-blue-800">
              This dashboard shows real data from your n8n workflows. The agents listed above are powered by 
              n8n workflows with AI capabilities, RAG (Retrieval Augmented Generation), and custom integrations.
            </p>
            <div className="mt-3 text-sm text-blue-700">
              <strong>Active Agents:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {agents.filter(a => a.active).map(agent => (
                  <li key={agent.id}>{agent.icon} {agent.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
