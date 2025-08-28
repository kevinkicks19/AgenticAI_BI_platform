import {
    BarChart3,
    CheckCircle,
    Lightbulb,
    Plus,
    Search,
    Target,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface BusinessProblem {
  id: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  user_id: string;
  workflow_solution?: string;
  created_at: string;
  tags: string[];
}

interface WorkflowRecommendation {
  id: string;
  name: string;
  description: string;
  category: string;
  confidence_score: number;
  tags: string[];
  parameters: Record<string, any>;
}

interface AffineDocument {
  id: string;
  title: string;
  content: string;
  document_type: string;
  properties: {
    category?: string;
    priority?: string;
    status?: string;
    tags?: string[];
    created_at: string;
  };
}

const BusinessProblemSolver: React.FC = () => {
  const [problems, setProblems] = useState<BusinessProblem[]>([]);
  const [recommendations, setRecommendations] = useState<WorkflowRecommendation[]>([]);
  const [affineDocuments, setAffineDocuments] = useState<AffineDocument[]>([]);
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<BusinessProblem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [problemForm, setProblemForm] = useState({
    description: '',
    category: '',
    priority: 'medium' as const,
    tags: [] as string[]
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockProblems: BusinessProblem[] = [
      {
        id: 'problem-1',
        description: 'Need to identify factors causing customer churn to improve retention strategies',
        category: 'customer_retention',
        priority: 'high',
        status: 'open',
        user_id: 'user-123',
        created_at: '2024-12-19T10:00:00Z',
        tags: ['customer_churn', 'retention', 'analytics']
      },
      {
        id: 'problem-2',
        description: 'Sales team needs better insights into performance metrics and conversion rates',
        category: 'sales_analytics',
        priority: 'medium',
        status: 'in_progress',
        user_id: 'user-456',
        workflow_solution: 'Sales Performance Dashboard',
        created_at: '2024-12-19T09:30:00Z',
        tags: ['sales_performance', 'conversion', 'metrics']
      },
      {
        id: 'problem-3',
        description: 'Inventory levels are too high, causing storage costs and cash flow issues',
        category: 'inventory_management',
        priority: 'critical',
        status: 'resolved',
        user_id: 'user-789',
        workflow_solution: 'Inventory Optimization',
        created_at: '2024-12-18T14:00:00Z',
        tags: ['inventory', 'cost_optimization', 'cash_flow']
      }
    ];

    const mockRecommendations: WorkflowRecommendation[] = [
      {
        id: 'rec-1',
        name: 'Customer Churn Analysis',
        description: 'Analyzes customer behavior patterns to identify churn risk factors',
        category: 'customer_analytics',
        confidence_score: 0.95,
        tags: ['customer_retention', 'analytics', 'churn'],
        parameters: {
          date_range: 'required',
          customer_segment: 'optional'
        }
      },
      {
        id: 'rec-2',
        name: 'Sales Performance Dashboard',
        description: 'Generates comprehensive sales analytics and performance metrics',
        category: 'sales_analytics',
        confidence_score: 0.88,
        tags: ['sales', 'dashboard', 'performance'],
        parameters: {
          sales_team: 'required',
          date_period: 'required'
        }
      },
      {
        id: 'rec-3',
        name: 'Inventory Optimization',
        description: 'Optimizes inventory levels based on demand forecasting',
        category: 'inventory_management',
        confidence_score: 0.92,
        tags: ['inventory', 'optimization', 'forecasting'],
        parameters: {
          product_category: 'required',
          forecast_period: 'required'
        }
      }
    ];

    setProblems(mockProblems);
    setRecommendations(mockRecommendations);
  }, []);

  const categories = [
    'customer_retention', 'sales_analytics', 'inventory_management', 
    'financial_analysis', 'marketing_analytics', 'operational_efficiency'
  ];

  const priorities = ['low', 'medium', 'high', 'critical'];

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         problem.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || problem.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || problem.priority === selectedPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const createProblem = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/affine/documents/business-problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem_description: problemForm.description,
          user_id: 'current-user', // Replace with actual user ID
          category: problemForm.category,
          priority: problemForm.priority,
          tags: problemForm.tags
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Problem created:', result);
        
        // Add to local state
        const newProblem: BusinessProblem = {
          id: result.document_id,
          description: problemForm.description,
          category: problemForm.category,
          priority: problemForm.priority,
          status: 'open',
          user_id: 'current-user',
          created_at: new Date().toISOString(),
          tags: problemForm.tags
        };
        
        setProblems(prev => [...prev, newProblem]);
        setShowProblemForm(false);
        setProblemForm({
          description: '',
          category: '',
          priority: 'medium',
          tags: []
        });
        
        // Refresh Affine documents
        fetchAffineDocuments();
      }
    } catch (error) {
      console.error('Error creating problem:', error);
    }
  };

  const fetchAffineDocuments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/affine/documents/search?document_type=business_problem&limit=50');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'customer_retention': return <Users className="w-5 h-5" />;
      case 'sales_analytics': return <TrendingUp className="w-5 h-5" />;
      case 'inventory_management': return <BarChart3 className="w-5 h-5" />;
      case 'financial_analysis': return <Target className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Problem Solver</h1>
          <p className="text-gray-600">
            Define business problems, get AI-powered workflow recommendations, and track solutions in Affine
          </p>
        </div>

        {/* Quick Problem Creation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Quick Problem Definition</h2>
            <button
              onClick={() => setShowProblemForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Problem
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Customer Issues</h3>
              <p className="text-sm text-gray-600">Retention, satisfaction, churn</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Performance</h3>
              <p className="text-sm text-gray-600">Sales, efficiency, metrics</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Operations</h3>
              <p className="text-sm text-gray-600">Inventory, processes, costs</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search problems by description or tags..."
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
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Problems List */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Problems</h2>
          <div className="space-y-4">
            {filteredProblems.map((problem) => (
              <div key={problem.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {getCategoryIcon(problem.category)}
                    <div className="flex-1">
                      <p className="text-gray-900 mb-2">{problem.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {problem.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(problem.priority)}`}>
                      {problem.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(problem.status)}`}>
                      {problem.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Created: {new Date(problem.created_at).toLocaleDateString()}</span>
                  {problem.workflow_solution && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Solution: {problem.workflow_solution}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow Recommendations */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Workflow Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{rec.name}</h3>
                  <span className="text-sm text-blue-600 font-medium">
                    {Math.round(rec.confidence_score * 100)}% match
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {rec.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
                  Use This Workflow
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Affine Documents */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Affine Knowledge Base</h2>
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

        {/* Problem Creation Modal */}
        {showProblemForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Define New Business Problem</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Problem Description
                    </label>
                    <textarea
                      value={problemForm.description}
                      onChange={(e) => setProblemForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      placeholder="Describe your business problem in detail..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={problemForm.category}
                      onChange={(e) => setProblemForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={problemForm.priority}
                      onChange={(e) => setProblemForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={problemForm.tags.join(', ')}
                      onChange={(e) => setProblemForm(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()) }))}
                      placeholder="Enter tags separated by commas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowProblemForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createProblem}
                    disabled={!problemForm.description || !problemForm.category}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create Problem
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

export default BusinessProblemSolver;
