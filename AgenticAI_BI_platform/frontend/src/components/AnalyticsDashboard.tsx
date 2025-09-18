import React, { useEffect, useState } from 'react';
import {
    AreaChart,
    BarChart,
    DoughnutChart,
    LineChart,
    ProgressChart,
    SparklineChart
} from './charts/ChartComponents';

interface AnalyticsData {
  workflowPerformance: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
  documentProcessing: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
    }[];
  };
  systemMetrics: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
  userActivity: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
  agentDistribution: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
    }[];
  };
  responseTime: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate sample data
  const generateSampleData = (): AnalyticsData => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const labels = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      workflowPerformance: {
        labels,
        datasets: [
          {
            label: 'Success Rate (%)',
            data: Array.from({ length: days }, () => Math.floor(Math.random() * 20) + 80),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
          },
          {
            label: 'Error Rate (%)',
            data: Array.from({ length: days }, () => Math.floor(Math.random() * 10) + 1),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
          },
        ],
      },
      documentProcessing: {
        labels: ['PDF', 'DOCX', 'XLSX', 'CSV', 'TXT'],
        datasets: [
          {
            label: 'Documents Processed',
            data: [245, 189, 156, 98, 67],
            backgroundColor: [
              '#3B82F6',
              '#10B981',
              '#F59E0B',
              '#EF4444',
              '#8B5CF6',
            ],
          },
        ],
      },
      systemMetrics: {
        labels,
        datasets: [
          {
            label: 'CPU Usage (%)',
            data: Array.from({ length: days }, () => Math.floor(Math.random() * 30) + 40),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          },
          {
            label: 'Memory Usage (%)',
            data: Array.from({ length: days }, () => Math.floor(Math.random() * 25) + 50),
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
          },
        ],
      },
      userActivity: {
        labels,
        datasets: [
          {
            label: 'Active Users',
            data: Array.from({ length: days }, () => Math.floor(Math.random() * 50) + 20),
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
          },
        ],
      },
      agentDistribution: {
        labels: ['Triage Agent', 'Data Analyst', 'Document Processor', 'Workflow Orchestrator'],
        datasets: [
          {
            data: [35, 28, 22, 15],
            backgroundColor: [
              '#3B82F6',
              '#10B981',
              '#F59E0B',
              '#EF4444',
            ],
          },
        ],
      },
      responseTime: {
        labels,
        datasets: [
          {
            label: 'Average Response Time (ms)',
            data: Array.from({ length: days }, () => Math.floor(Math.random() * 500) + 200),
            borderColor: '#06B6D4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
          },
        ],
      },
    };
  };

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAnalyticsData(generateSampleData());
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights into system performance and usage</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Workflows</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
              <div className="mt-2">
                <SparklineChart 
                  data={[12, 19, 15, 25, 22, 18, 24]} 
                  color="#10B981" 
                  height={30}
                />
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">⚡</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">94.2%</p>
              <div className="mt-2">
                <SparklineChart 
                  data={[92, 94, 96, 93, 95, 97, 94]} 
                  color="#3B82F6" 
                  height={30}
                />
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">89</p>
              <div className="mt-2">
                <SparklineChart 
                  data={[85, 88, 92, 87, 90, 89, 91]} 
                  color="#8B5CF6" 
                  height={30}
                />
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">1.2s</p>
              <div className="mt-2">
                <SparklineChart 
                  data={[1.5, 1.3, 1.1, 1.4, 1.2, 1.0, 1.2]} 
                  color="#F59E0B" 
                  height={30}
                />
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 text-xl">⚡</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Workflow Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Performance</h3>
          <LineChart
            data={analyticsData.workflowPerformance}
            height={300}
          />
        </div>

        {/* Document Processing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Processing by Type</h3>
          <DoughnutChart
            data={analyticsData.documentProcessing}
            height={300}
          />
        </div>

        {/* System Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Resource Usage</h3>
          <AreaChart
            data={analyticsData.systemMetrics}
            height={300}
          />
        </div>

        {/* User Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity</h3>
          <BarChart
            data={analyticsData.userActivity}
            height={300}
          />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Distribution</h3>
          <DoughnutChart
            data={analyticsData.agentDistribution}
            height={250}
          />
        </div>

        {/* Response Time */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Trends</h3>
          <LineChart
            data={analyticsData.responseTime}
            height={250}
          />
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                <span className="text-sm text-gray-600">65%</span>
              </div>
              <ProgressChart
                value={65}
                max={100}
                color="#3B82F6"
                height={80}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                <span className="text-sm text-gray-600">78%</span>
              </div>
              <ProgressChart
                value={78}
                max={100}
                color="#10B981"
                height={80}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Storage Usage</span>
                <span className="text-sm text-gray-600">45%</span>
              </div>
              <ProgressChart
                value={45}
                max={100}
                color="#F59E0B"
                height={80}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
