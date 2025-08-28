import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  FileText, 
  Filter, 
  SortAsc, 
  SortDesc,
  Eye,
  Edit,
  Trash2,
  Download,
  Share2,
  Tag,
  Calendar,
  User,
  FolderOpen,
  BookOpen,
  BarChart3,
  Users,
  TrendingUp,
  Target
} from 'lucide-react';

interface AffineDocument {
  id: string;
  title: string;
  content: string;
  document_type: string;
  properties: {
    workflow_id?: string;
    user_id?: string;
    category?: string;
    tags?: string[];
    created_at: string;
    updated_at?: string;
    status?: string;
    priority?: string;
  };
}

interface DocumentType {
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<AffineDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<AffineDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AffineDocument | null>(null);
  const [documentForm, setDocumentForm] = useState({
    title: '',
    content: '',
    document_type: '',
    category: '',
    tags: [] as string[],
    priority: 'medium'
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockDocuments: AffineDocument[] = [
      {
        id: 'doc-1',
        title: 'Customer Churn Analysis Report Q4 2024',
        content: 'Comprehensive analysis of customer retention patterns and churn risk factors...',
        document_type: 'bi_report',
        properties: {
          workflow_id: 'workflow-1',
          user_id: 'analyst-123',
          category: 'customer_analytics',
          tags: ['customer_retention', 'churn_analysis', 'q4_2024'],
          created_at: '2024-12-19T10:00:00Z',
          updated_at: '2024-12-19T15:30:00Z',
          status: 'completed',
          priority: 'high'
        }
      },
      {
        id: 'doc-2',
        title: 'Sales Performance Dashboard Configuration',
        content: 'Workflow configuration and parameters for the sales performance dashboard...',
        document_type: 'workflow_metadata',
        properties: {
          workflow_id: 'workflow-2',
          user_id: 'admin-456',
          category: 'sales_analytics',
          tags: ['sales', 'dashboard', 'configuration'],
          created_at: '2024-12-19T09:00:00Z',
          status: 'active'
        }
      },
      {
        id: 'doc-3',
        title: 'Inventory Optimization Problem Statement',
        content: 'Business problem definition for inventory optimization workflow...',
        document_type: 'business_problem',
        properties: {
          user_id: 'manager-789',
          category: 'inventory_management',
          tags: ['inventory', 'optimization', 'cost_reduction'],
          created_at: '2024-12-18T14:00:00Z',
          status: 'resolved',
          priority: 'critical'
        }
      },
      {
        id: 'doc-4',
        title: 'Financial Analysis Workflow Template',
        content: 'Template for financial analysis workflows including parameters and outputs...',
        document_type: 'workflow_template',
        properties: {
          user_id: 'analyst-123',
          category: 'financial_analysis',
          tags: ['financial', 'template', 'workflow'],
          created_at: '2024-12-18T11:00:00Z',
          status: 'active'
        }
      }
    ];

    setDocuments(mockDocuments);
    setFilteredDocuments(mockDocuments);
  }, []);

  const documentTypes: DocumentType[] = [
    { name: 'bi_report', count: 0, icon: <BarChart3 className="w-5 h-5" />, color: 'bg-blue-100 text-blue-800' },
    { name: 'workflow_metadata', count: 0, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-green-100 text-green-800' },
    { name: 'business_problem', count: 0, icon: <Target className="w-5 h-5" />, color: 'bg-orange-100 text-orange-800' },
    { name: 'workflow_template', count: 0, icon: <BookOpen className="w-5 h-5" />, color: 'bg-purple-100 text-purple-800' },
    { name: 'collaboration_space', count: 0, icon: <Users className="w-5 h-5" />, color: 'bg-pink-100 text-pink-800' }
  ];

  const categories = [
    'customer_analytics', 'sales_analytics', 'inventory_management', 
    'financial_analysis', 'marketing_analytics', 'operational_efficiency'
  ];

  // Update document type counts
  useEffect(() => {
    const updatedTypes = documentTypes.map(type => ({
      ...type,
      count: documents.filter(doc => doc.document_type === type.name).length
    }));
    // Note: In a real app, you'd update the state here
  }, [documents]);

  // Filter and sort documents
  useEffect(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doc.properties.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = selectedType === 'all' || doc.document_type === selectedType;
      const matchesCategory = selectedCategory === 'all' || doc.properties.category === selectedCategory;
      
      return matchesSearch && matchesType && matchesCategory;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (sortBy === 'title') {
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
      } else {
        aValue = new Date(a.properties[sortBy] || a.properties.created_at);
        bValue = new Date(b.properties[sortBy] || b.properties.created_at);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, selectedType, selectedCategory, sortBy, sortOrder]);

  const createDocument = async () => {
    try {
      let endpoint = '';
      let payload: any = {};

      switch (documentForm.document_type) {
        case 'bi_report':
          endpoint = '/api/affine/documents/bi-report';
          payload = {
            title: documentForm.title,
            content: documentForm.content,
            workflow_id: 'temp-workflow',
            user_id: 'current-user',
            tags: documentForm.tags
          };
          break;
        case 'workflow_metadata':
          endpoint = '/api/affine/documents/workflow-metadata';
          payload = {
            workflow_id: 'temp-workflow',
            name: documentForm.title,
            description: documentForm.content,
            category: documentForm.category,
            tags: documentForm.tags
          };
          break;
        case 'business_problem':
          endpoint = '/api/affine/documents/business-problem';
          payload = {
            problem_description: documentForm.content,
            user_id: 'current-user',
            category: documentForm.category,
            priority: documentForm.priority,
            tags: documentForm.tags
          };
          break;
        default:
          console.error('Unknown document type');
          return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Document created:', result);
        
        // Add to local state
        const newDocument: AffineDocument = {
          id: result.document_id,
          title: documentForm.title,
          content: documentForm.content,
          document_type: documentForm.document_type,
          properties: {
            user_id: 'current-user',
            category: documentForm.category,
            tags: documentForm.tags,
            created_at: new Date().toISOString(),
            status: 'active'
          }
        };
        
        setDocuments(prev => [...prev, newDocument]);
        setShowCreateModal(false);
        setDocumentForm({
          title: '',
          content: '',
          document_type: '',
          category: '',
          tags: [],
          priority: 'medium'
        });
      }
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    const docType = documentTypes.find(t => t.name === type);
    return docType ? docType.icon : <FileText className="w-5 h-5" />;
  };

  const getDocumentTypeColor = (type: string) => {
    const docType = documentTypes.find(t => t.name === type);
    return docType ? docType.color : 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Manager</h1>
          <p className="text-gray-600">
            Organize, search, and manage all your Affine documents and knowledge base
          </p>
        </div>

        {/* Document Type Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {documentTypes.map((type) => (
            <div key={type.name} className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className={`p-2 rounded-full ${type.color}`}>
                  {type.icon}
                </div>
              </div>
              <h3 className="font-medium text-gray-900 text-sm mb-1">
                {type.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <p className="text-2xl font-bold text-blue-600">{type.count}</p>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search documents by title, content, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {documentTypes.map(type => (
                  <option key={type.name} value={type.name}>
                    {type.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
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
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="updated_at-desc">Recently Updated</option>
              </select>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Document
              </button>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${getDocumentTypeColor(document.document_type)}`}>
                      {getDocumentTypeIcon(document.document_type)}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getDocumentTypeColor(document.document_type)}`}>
                      {document.document_type.replace('_', ' ')}
                    </span>
                  </div>
                  {document.properties.priority && (
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(document.properties.priority)}`}>
                      {document.properties.priority}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {document.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {document.content}
                </p>

                {document.properties.tags && document.properties.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {document.properties.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {document.properties.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{document.properties.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(document.properties.created_at).toLocaleDateString()}</span>
                  </div>
                  {document.properties.category && (
                    <span className="text-blue-600">
                      {document.properties.category.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedType !== 'all' || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first document'}
            </p>
            {!searchQuery && selectedType === 'all' && selectedCategory === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Document
              </button>
            )}
          </div>
        )}

        {/* Create Document Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Document</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Type
                    </label>
                    <select
                      value={documentForm.document_type}
                      onChange={(e) => setDocumentForm(prev => ({ ...prev, document_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select document type</option>
                      {documentTypes.map(type => (
                        <option key={type.name} value={type.name}>
                          {type.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={documentForm.title}
                      onChange={(e) => setDocumentForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <textarea
                      value={documentForm.content}
                      onChange={(e) => setDocumentForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={documentForm.category}
                      onChange={(e) => setDocumentForm(prev => ({ ...prev, category: e.target.value }))}
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
                      Tags
                    </label>
                    <input
                      type="text"
                      value={documentForm.tags.join(', ')}
                      onChange={(e) => setDocumentForm(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()) }))}
                      placeholder="Enter tags separated by commas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {documentForm.document_type === 'business_problem' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={documentForm.priority}
                        onChange={(e) => setDocumentForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createDocument}
                    disabled={!documentForm.document_type || !documentForm.title || !documentForm.content}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create Document
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

export default DocumentManager;
