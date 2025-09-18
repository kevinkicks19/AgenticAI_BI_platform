import React, { useState, useEffect } from 'react';
import NotificationDemo from './NotificationDemo';

interface MetricCard {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
  description: string;
}

interface WorkflowStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'running' | 'error';
  lastRun: string;
  successRate: number;
}

interface RecentActivity {
  id: string;
  type: 'workflow' | 'document' | 'chat' | 'system';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricCard[]>([
    {
      title: 'Active Workflows',
      value: 12,
      change: '+2 this week',
      changeType: 'positive',
      icon: '⚡',
      description: 'Currently running workflows'
    },
    {
      title: 'Documents Processed',
      value: 1,247,
      change: '+15% from last month',
      changeType: 'positive',
      icon: '📄',
      description: 'Total documents analyzed'
    },
    {
      title: 'Chat Sessions',
      value: 89,
      change: '+23 this week',
      changeType: 'positive',
      icon: '💬',
      description: 'Active chat sessions'
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: '+1.2% from last week',
      changeType: 'positive',
      icon: '✅',
      description: 'Workflow execution success rate'
    }
  ]);

  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatus[]>([
    {
      id: '1',
      name: 'Data Analysis Pipeline',
      status: 'running',
      lastRun: '2 minutes ago',
      successRate: 96.5
    },
    {
      id: '2',
      name: 'Document Processing',
      status: 'active',
      lastRun: '15 minutes ago',
      successRate: 98.2
    },
    {
      id: '3',
      name: 'Report Generation',
      status: 'active',
      lastRun: '1 hour ago',
      successRate: 92.1
    },
    {
      id: '4',
      name: 'Data Validation',
      status: 'error',
      lastRun: '3 hours ago',
      successRate: 87.3
    }
  ]);

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'workflow',
      message: 'Data Analysis Pipeline completed successfully',
      timestamp: '2 minutes ago',
      status: 'success'
    },
    {
      id: '2',
      type: 'document',
      message: 'New document uploaded: Q4_Financial_Report.pdf',
      timestamp: '15 minutes ago',
      status: 'info'
    },
    {
      id: '3',
      type: 'chat',
      message: 'User requested data visualization for sales metrics',
      timestamp: '1 hour ago',
      status: 'success'
    },
    {
      id: '4',
      type: 'system',
      message: 'Data Validation workflow encountered an error',
      timestamp: '3 hours ago',
      status: 'error'
    },
    {
      id: '5',
      type: 'workflow',
      message: 'Report Generation workflow started',
      timestamp: '4 hours ago',
      status: 'info'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'inactive':
      case 'info':
        return 'text-blue-600 bg-blue-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
        return '🟢';
      case 'inactive':
        return '⚪';
      case 'error':
        return '🔴';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '⚪';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'workflow':
        return '⚡';
      case 'document':
        return '📄';
      case 'chat':
        return '💬';
      case 'system':
        return '🔧';
      default:
        return '📋';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Agentic AI BI Platform Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor your AI workflows, analyze performance, and track system activity
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">{metric.icon}</div>
              <div className={`text-sm font-medium ${
                metric.changeType === 'positive' ? 'text-green-600' :
                metric.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metric.change}
              </div>
            </div>
            <div className="mb-2">
              <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
              <p className="text-sm text-gray-600">{metric.title}</p>
            </div>
            <p className="text-xs text-gray-500">{metric.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workflow Status */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Workflow Status</h2>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {workflowStatuses.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(workflow.status)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                    <p className="text-sm text-gray-600">Last run: {workflow.lastRun}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                    {workflow.status}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {workflow.successRate}% success
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg mt-0.5">{getTypeIcon(activity.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
            <span className="text-2xl">⚡</span>
            <span className="font-medium text-blue-900">Start New Workflow</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200">
            <span className="text-2xl">📄</span>
            <span className="font-medium text-green-900">Upload Document</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200">
            <span className="text-2xl">💬</span>
            <span className="font-medium text-purple-900">New Chat Session</span>
          </button>
        </div>
      </div>

      {/* Notification System Demo */}
      <div className="mt-8">
        <NotificationDemo />
      </div>
    </div>
  );
};

export default Dashboard;
