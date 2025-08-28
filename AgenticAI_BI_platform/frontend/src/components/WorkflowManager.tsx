import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Search, 
  FileText, 
  Database, 
  TrendingUp, 
  Users, 
  Filter,
  Plus,
  BookOpen,
  Save,
  Eye,
  Download
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  parameters: Record<string, any>;
  status: 'active' | 'inactive' | 'draft';
  lastExecuted?: string;
  executionCount: number;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  parameters: Record<string, any>;
  results?: any;
  error?: string;
}

interface AffineDocument {
  id: string;
  title: string;
  content: string;
  document_type: string;
  properties: {
    workflow_id?: string;
    category?: string;
    tags?: string[];
    created_at: string;
  };
}

const WorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [affineDocuments, setAffineDocuments] = useState<AffineDocument[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentData, setDocumentData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    category: ''
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockWorkflows: Workflow[] = [
      {
        id: 'workflow-1',
        name: 'Customer Churn Analysis',
        description: 'Analyzes customer behavior patterns to identify churn risk factors',
        category: 'customer_analytics',
        tags: ['customer_retention', 'analytics', 'churn'],
        parameters: {
          date_range: 'required',
          customer_segment: 'optional',
          output_format: 'optional'
        },
        status: 'active',
        lastExecuted: '2024-12-19T10:30:00Z',
        executionCount: 15
      },
      {
        id: 'workflow-2',
        name: 'Sales Performance Dashboard',
        description: 'Generates comprehensive sales analytics and performance metrics',
        category: 'sales_analytics',
        tags: ['sales', 'dashboard', 'performance'],
        parameters: {
          sales_team: 'required',
          date_period: 'required',
          metrics: 'optional'
        },
        status: 'active',
        lastExecuted: '2024-12-19T09:15:00Z',
        executionCount: 23
      },
      {
        id: 'workflow-3',
        name: 'Inventory Optimization',
        description: 'Optimizes inventory levels based on demand forecasting',
        category: 'inventory_management',
        tags: ['inventory', 'optimization', 'forecasting'],
        parameters: {
          product_category: 'required',
          forecast_period: 'required',
          safety_stock: 'optional'
        },
        status: 'active',
        lastExecuted: '2024-12-18T16:45:00Z',
        executionCount: 8
      }
    ];

    setWorkflows(mockWorkflows);
  }, []);

  const categories = ['all', 'customer_analytics', 'sales_analytics', 'inventory_management', 'financial_analysis'];

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || workflow.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const executeWorkflow = async (workflow: Workflow) => {
    setIsExecuting(true);
    setSelectedWorkflow(workflow);

    try {
      // Simulate workflow execution
      const execution: WorkflowExecution = {
        id: `exec-${Date.now()}`,
        workflowId: workflow.id,
        status: 'running',
        startTime: new Date().toISOString(),
        parameters: {}
      };

      setExecutions(prev => [...prev, execution]);

      // Simulate execution time
      setTimeout(async () => {
        const completedExecution = { ...execution, status: 'completed', endTime: new Date().toISOString(), results: { success: true } };
        
        setExecutions(prev => prev.map(exec => 
          exec.id === execution.id ? completedExecution : exec
        ));
        
        // Automatically save to Affine
        try {
          await saveWorkflowExecutionToAffine(completedExecution, workflow);
        } catch (error) {
          console.error('Error saving workflow execution to Affine:', error);
        }
        
        setIsExecuting(false);
      }, 3000);

    } catch (error) {
      console.error('Error executing workflow:', error);
      setIsExecuting(false);
    }
  };

  const saveToAffine = async () => {
    if (!selectedWorkflow) return;

    try {
      const response = await fetch('http://localhost:5000/api/affine/documents/workflow-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: selectedWorkflow.id,
          name: selectedWorkflow.name,
          description: selectedWorkflow.description,
          category: selectedWorkflow.category,
          tags: selectedWorkflow.tags,
          parameters: selectedWorkflow.parameters
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Saved to Affine:', result);
        setShowDocumentModal(false);
        // Refresh documents
        fetchAffineDocuments();
      }
    } catch (error) {
      console.error('Error saving to Affine:', error);
    }
  };

  const fetchAffineDocuments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/affine/documents/search?document_type=workflow_metadata&limit=50');
      if (response.ok) {
        const data = await response.json();
        setAffineDocuments(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching Affine documents:', error);
    }
  };

  useEffect(() => {
    fetchAffineDocuments();
  }, []);

  const saveWorkflowExecutionToAffine = async (execution: WorkflowExecution, workflow: Workflow) => {
    try {
      const response = await fetch('http://localhost:5000/api/affine/documents/workflow-execution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          execution_id: execution.id,
          status: execution.status,
          start_time: execution.startTime,
          end_time: execution.endTime,
          parameters: execution.parameters,
          results: execution.results,
          error: execution.error
        })
      });

      if (response.ok) {
        console.log('Workflow execution saved to Affine:', await response.json());
      }
    } catch (error) {
      console.error('Error saving workflow execution to Affine:', error);
    }
  };

  const createBIReport = async (execution: WorkflowExecution) => {
    const workflow = workflows.find(w => w.id === execution.workflowId);
    if (!workflow) return;

    setDocumentData({
      title: `BI Report: ${workflow.name} - ${new Date(execution.startTime).toLocaleDateString()}`,
      content: `Execution completed successfully at ${new Date(execution.endTime!).toLocaleString()}. Results: ${JSON.stringify(execution.results, null, 2)}`,
      tags: [...workflow.tags, 'bi_report', 'execution_result'],
      category: workflow.category
    });
    setShowDocumentModal(true);
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflow Manager</h1>
          <p className="text-gray-600">
            Discover, execute, and manage your n8n workflows with integrated Affine document storage
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
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
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{workflow.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{workflow.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    workflow.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {workflow.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {workflow.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Executions: {workflow.executionCount}</span>
                  {workflow.lastExecuted && (
                    <span>Last: {new Date(workflow.lastExecuted).toLocaleDateString()}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => executeWorkflow(workflow)}
                    disabled={isExecuting}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Execute
                  </button>
                  <button
                    onClick={() => {
                      setSelectedWorkflow(workflow);
                      setDocumentData({
                        title: `Workflow: ${workflow.name}`,
                        content: workflow.description,
                        tags: workflow.tags,
                        category: workflow.category
                      });
                      setShowDocumentModal(true);
                    }}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Executions History */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Executions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workflow
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {executions.slice(-5).reverse().map((execution) => {
                  const workflow = workflows.find(w => w.id === execution.workflowId);
                  const duration = execution.endTime 
                    ? Math.round((new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) / 1000)
                    : null;

                  return (
                    <tr key={execution.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {workflow?.name || 'Unknown Workflow'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                          execution.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {execution.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(execution.startTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {duration ? `${duration}s` : 'Running...'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {execution.status === 'completed' && (
                            <button
                              onClick={() => createBIReport(execution)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              Report
                            </button>
                          )}
                          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Affine Documents */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Affine Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {affineDocuments.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-medium text-gray-900 mb-2">{doc.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{doc.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{doc.properties.document_type}</span>
                  <span>{new Date(doc.properties.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Modal */}
        {showDocumentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedWorkflow ? 'Save Workflow to Affine' : 'Create BI Report'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={documentData.title}
                      onChange={(e) => setDocumentData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <textarea
                      value={documentData.content}
                      onChange={(e) => setDocumentData(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={documentData.tags.join(', ')}
                      onChange={(e) => setDocumentData(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()) }))}
                      placeholder="Enter tags separated by commas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={documentData.category}
                      onChange={(e) => setDocumentData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      {categories.filter(c => c !== 'all').map(category => (
                        <option key={category} value={category}>
                          {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowDocumentModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveToAffine}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save to Affine
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowManager;
