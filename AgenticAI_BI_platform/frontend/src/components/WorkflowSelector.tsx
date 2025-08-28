import { BarChart3, FileText, Home, Workflow } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface WorkflowInfo {
  id: string;
  name: string;
  description: string;
  agentType: string;
  webhookUrl: string;
  status: 'active' | 'inactive';
}

interface WorkflowSelectorProps {
  onWorkflowSelect: (workflow: WorkflowInfo) => void;
}

const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({ onWorkflowSelect }) => {
  const [workflows, setWorkflows] = useState<WorkflowInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pre-defined workflows based on your n8n setup
  const defaultWorkflows: WorkflowInfo[] = [
    {
      id: 'homeautomation-advisor',
      name: 'Home Automation Advisor',
      description: 'Get help with smart home devices, automation setup, and IoT solutions',
      agentType: 'home_automation',
      webhookUrl: 'https://n8n.casamccartney.link/webhook/1a4a4850-d74b-446d-8336-3e7c64161424/chat',
      status: 'active'
    },
    {
      id: '3Qm6jbbc8jhlZayR',
      name: 'Business Problem Inception Agent - Advanced',
      description: 'Fixed DAD methodology inception agent with proper response format and Affine integration',
      agentType: 'inception',
      webhookUrl: 'https://n8n.casamccartney.link/webhook/1269a389-347f-44ae-918e-840c26918584/chat',
      status: 'active'
    },
    {
      id: 'gerald-data-analysis',
      name: 'Gerald - Data Analysis',
      description: 'AI-powered data analysis and processing specialist',
      agentType: 'data_analysis',
              webhookUrl: 'https://n8n.casamccartney.link/webhook/ca361862-55b2-49a0-a765-ff06b90e416a/chat',
      status: 'active'
    },
    {
      id: 'business-intelligence',
      name: 'Business Intelligence',
      description: 'Generate reports, analyze trends, and create business insights',
      agentType: 'report_generation',
      webhookUrl: 'https://n8n.casamccartney.link/webhook/bi',
      status: 'active'
    },
    {
      id: 'document-processor',
      name: 'Document Processor',
      description: 'Upload, process, and extract information from documents',
      agentType: 'document_processing',
      webhookUrl: 'https://n8n.casamccartney.link/webhook/documents',
      status: 'active'
    }
  ];

  useEffect(() => {
    // Load workflows from backend if available, otherwise use defaults
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/handoff/workflows');
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.workflows.length > 0) {
          console.log('DEBUG: Backend workflows data:', data.workflows);
          
          // Transform backend workflows to our format
          const backendWorkflows = data.workflows.map((wf: any) => {
            const workflow = {
              id: wf.id || wf.name, // Use actual n8n workflow ID or name as fallback
              name: wf.name || 'Unknown Workflow',
              description: wf.description || 'Workflow from n8n',
              agentType: wf.agent_type || 'general',
              webhookUrl: wf.webhook_url || 'https://n8n.casamccartney.link/webhook/chat',
              status: wf.active ? 'active' : 'inactive'
            };
            console.log(`DEBUG: Transformed workflow: ${workflow.name} -> ID: ${workflow.id}`);
            return workflow;
          });
          setWorkflows(backendWorkflows);
        } else {
          setWorkflows(defaultWorkflows);
        }
      } else {
        setWorkflows(defaultWorkflows);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
      setWorkflows(defaultWorkflows);
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'home_automation':
        return <Home className="w-5 h-5 text-green-600" />;
      case 'data_analysis':
        return <BarChart3 className="w-5 h-5 text-blue-600" />;
      case 'report_generation':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'document_processing':
        return <FileText className="w-5 h-5 text-orange-600" />;
      default:
        return <Workflow className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAgentColor = (agentType: string) => {
    switch (agentType) {
      case 'home_automation':
        return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'data_analysis':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'report_generation':
        return 'border-purple-200 bg-purple-50 hover:bg-purple-100';
      case 'document_processing':
        return 'border-orange-200 bg-orange-50 hover:bg-orange-100';
      default:
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading available workflows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-2">⚠️</div>
        <p className="text-red-800 mb-2">{error}</p>
        <button
          onClick={loadWorkflows}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Workflows</h2>
        <p className="text-gray-600">
          Select a workflow to start working with a specialized AI agent. Each workflow is designed for specific tasks and can help you get things done faster.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${getAgentColor(workflow.agentType)} ${
              workflow.status === 'inactive' ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
            }`}
            onClick={() => workflow.status === 'active' && onWorkflowSelect(workflow)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getAgentIcon(workflow.agentType)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {workflow.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {workflow.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    workflow.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {workflow.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                  
                  {workflow.status === 'active' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWorkflowSelect(workflow);
                      }}
                      className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                      Start Chat
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">🏠</div>
          <p className="text-gray-600">No workflows available at the moment.</p>
          <p className="text-sm text-gray-500">Check back later or contact your administrator.</p>
        </div>
      )}
    </div>
  );
};

export default WorkflowSelector;
