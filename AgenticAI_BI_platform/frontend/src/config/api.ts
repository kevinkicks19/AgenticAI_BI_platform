/**
 * API Configuration
 * Centralized API endpoint configuration that works in both development and production
 */

// Get the API base URL from environment variables
// In production (Render), this will be the same origin as the frontend
// In development, it will be the local backend server
const getApiBaseUrl = (): string => {
  // Check if we have a Vite environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // In production, the backend serves the frontend from the same origin
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  
  // Default to localhost for development
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// API endpoint helpers
export const API_ENDPOINTS = {
  // Chat endpoints
  chat: `${API_BASE_URL}/api/chat`,
  
  // Workflow endpoints
  workflows: `${API_BASE_URL}/api/handoff/workflows`,
  executeWorkflow: `${API_BASE_URL}/api/handoff/execute-workflow`,
  
  // Handoff endpoints
  chatHomeAutomation: `${API_BASE_URL}/api/handoff/chat/home-automation`,
  
  // Affine document endpoints
  affineWorkflowMetadata: `${API_BASE_URL}/api/affine/documents/workflow-metadata`,
  affineWorkflowExecution: `${API_BASE_URL}/api/affine/documents/workflow-execution`,
  affineBusinessProblem: `${API_BASE_URL}/api/affine/documents/business-problem`,
  affineSearch: `${API_BASE_URL}/api/affine/documents/search`,
  
  // Agent endpoints
  agents: `${API_BASE_URL}/api/agents`,
  data: `${API_BASE_URL}/api/data`,
};

export default API_BASE_URL;

