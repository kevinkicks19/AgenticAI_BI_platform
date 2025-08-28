# Frontend Components for Agentic AI BI Platform

## Overview

This document describes the React components we've created to integrate with both Affine and n8n workflows, providing a comprehensive interface for business intelligence and workflow management.

## Components Overview

### 🧭 Navigation Component
**File**: `src/components/Navigation.tsx`

**Purpose**: Provides navigation between different sections of the application with a responsive sidebar design.

**Features**:
- Responsive sidebar navigation
- Mobile-friendly hamburger menu
- Visual indicators for current page
- Clean, modern design with Tailwind CSS

**Navigation Items**:
- **Workflow Manager**: Manage n8n workflows and executions
- **Problem Solver**: Define and track business problems
- **Document Manager**: Organize Affine documents and knowledge
- **Analytics Dashboard**: View insights and performance metrics

### ⚙️ Workflow Manager Component
**File**: `src/components/WorkflowManager.tsx`

**Purpose**: Comprehensive workflow management interface that integrates n8n workflows with Affine document storage.

**Features**:
- **Workflow Discovery**: Browse available n8n workflows by category
- **Workflow Execution**: Execute workflows with real-time status tracking
- **Execution History**: Track workflow runs and results
- **Affine Integration**: Store workflow metadata and results in Affine
- **BI Report Generation**: Automatically create reports from workflow outputs
- **Search & Filtering**: Find workflows by name, description, or tags

**Key Functions**:
- `executeWorkflow()`: Trigger n8n workflow execution
- `saveToAffine()`: Store workflow metadata in Affine
- `createBIReport()`: Generate BI reports from execution results
- `fetchAffineDocuments()`: Retrieve stored documents

### 💡 Business Problem Solver Component
**File**: `src/components/BusinessProblemSolver.tsx`

**Purpose**: AI-powered interface for defining business problems and getting workflow recommendations.

**Features**:
- **Problem Definition**: Interactive forms for describing business issues
- **Category Classification**: Organize problems by business domain
- **Priority Management**: Set problem urgency levels
- **AI Recommendations**: Get workflow suggestions based on problem type
- **Affine Integration**: Track problems and solutions in knowledge base
- **Quick Templates**: Pre-defined problem categories for rapid input

**Key Functions**:
- `createProblem()`: Store business problems in Affine
- `getWorkflowRecommendations()`: AI-powered workflow suggestions
- `trackBusinessProblem()`: Monitor problem-solving progress

### 📚 Document Manager Component
**File**: `src/components/DocumentManager.tsx`

**Purpose**: Comprehensive document management system for organizing Affine knowledge base.

**Features**:
- **Document Types**: Support for BI reports, workflow metadata, business problems, templates
- **Advanced Search**: Full-text search with filtering by type, category, and tags
- **Sorting Options**: Multiple sorting criteria (date, title, updates)
- **Document Creation**: Interactive forms for new documents
- **Visual Organization**: Grid layout with document type indicators
- **Tag Management**: Flexible tagging system for organization

**Key Functions**:
- `createDocument()`: Create new documents in Affine
- `searchDocuments()`: Advanced search and filtering
- `updateDocument()`: Modify existing documents
- `getDocumentTypes()`: Discover available document types

## Integration Points

### 🔗 Affine API Integration
All components integrate with the Affine REST API through these endpoints:

- **BI Reports**: `POST /api/affine/documents/bi-report`
- **Workflow Metadata**: `POST /api/affine/documents/workflow-metadata`
- **Business Problems**: `POST /api/affine/documents/business-problem`
- **Document Search**: `GET /api/affine/documents/search`
- **Document Updates**: `PATCH /api/affine/documents/{id}`

### 🔄 n8n Workflow Integration
Workflow management through:

- **Workflow Discovery**: Browse available workflows
- **Execution Tracking**: Monitor workflow runs
- **Result Storage**: Save outputs to Affine
- **Parameter Management**: Configure workflow inputs

## Technical Implementation

### 🎨 UI Framework
- **React 19** with TypeScript for type safety
- **Tailwind CSS** for responsive design
- **Lucide React** for consistent iconography
- **Responsive Design** for mobile and desktop

### 📱 Responsive Design
- **Desktop**: Full sidebar navigation with content area
- **Mobile**: Collapsible hamburger menu with overlay
- **Tablet**: Adaptive layout between mobile and desktop

### 🔧 State Management
- **React Hooks**: useState, useEffect for local state
- **Component Props**: Clean data flow between components
- **Async Operations**: Proper error handling and loading states

## Usage Examples

### Creating a Business Problem
```typescript
// In BusinessProblemSolver component
const createProblem = async () => {
  const response = await fetch('/api/affine/documents/business-problem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      problem_description: 'Customer churn analysis needed',
      user_id: 'current-user',
      category: 'customer_retention',
      priority: 'high',
      tags: ['churn', 'analytics', 'retention']
    })
  });
  // Handle response...
};
```

### Storing Workflow Metadata
```typescript
// In WorkflowManager component
const saveToAffine = async () => {
  const response = await fetch('/api/affine/documents/workflow-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflow_id: 'n8n-workflow-123',
      name: 'Customer Segmentation',
      description: 'Analyzes customer data for segmentation',
      category: 'customer_analytics',
      tags: ['segmentation', 'analytics'],
      parameters: { date_range: 'required' }
    })
  });
  // Handle response...
};
```

### Searching Documents
```typescript
// In DocumentManager component
const searchDocuments = async (query: string) => {
  const response = await fetch(
    `/api/affine/documents/search?query=${query}&document_type=bi_report&limit=20`
  );
  const data = await response.json();
  setDocuments(data.results);
};
```

## Future Enhancements

### 🚀 Planned Features
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Analytics**: Charts and visualization components
- **Workflow Templates**: Pre-built workflow configurations
- **Collaboration Tools**: Team-based problem solving
- **AI Insights**: Automated recommendations and insights

### 🔮 Integration Opportunities
- **n8n Webhooks**: Automatic document creation on workflow completion
- **Real-time Sync**: Live updates between Affine and n8n
- **Advanced Search**: Semantic search and AI-powered discovery
- **Workflow Automation**: Auto-trigger workflows based on problems

## Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Configure Backend
Ensure your FastAPI backend is running with Affine integration enabled.

### 4. Set Environment Variables
```bash
# Add to your .env file
AFFINE_API_KEY=your_api_key
AFFINE_WORKSPACE_ID=your_workspace_id
```

## Component Architecture

```
App.tsx
├── Navigation.tsx
├── WorkflowManager.tsx
├── BusinessProblemSolver.tsx
├── DocumentManager.tsx
└── (Future: AnalyticsDashboard.tsx)
```

## Best Practices

### 🎯 Component Design
- **Single Responsibility**: Each component has a clear, focused purpose
- **Reusable Components**: Common UI elements are modular
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Graceful fallbacks and user feedback

### 🔒 Security Considerations
- **Input Validation**: Client-side validation for all forms
- **API Security**: Secure communication with backend
- **User Authentication**: Ready for future auth implementation
- **Data Sanitization**: Proper handling of user input

### 📊 Performance
- **Lazy Loading**: Components load only when needed
- **Efficient Rendering**: Optimized React patterns
- **Async Operations**: Non-blocking API calls
- **Responsive Images**: Optimized for different screen sizes

---

**Last Updated**: December 2024
**Status**: Ready for Development ✅
