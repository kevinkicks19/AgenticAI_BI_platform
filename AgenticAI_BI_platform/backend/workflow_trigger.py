"""
Workflow Trigger System for Document Processing

This module handles automatic workflow triggering when documents are uploaded:
- n8n workflow execution
- Document processing workflows
- Integration with existing workflow orchestration
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
import httpx

from config import N8N_API_URL, N8N_API_KEY

class DocumentWorkflowTrigger:
    """Handles workflow triggering for document processing"""
    
    def __init__(self):
        self.n8n_api_url = N8N_API_URL
        self.n8n_api_key = N8N_API_KEY
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def trigger_document_processing_workflow(self, document_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trigger n8n workflow for document processing
        
        Args:
            document_metadata: Document metadata from upload
            
        Returns:
            Workflow execution result
        """
        try:
            # Prepare workflow payload
            workflow_payload = {
                "document_id": document_metadata["file_id"],
                "filename": document_metadata["original_filename"],
                "document_type": document_metadata["document_type"],
                "category": document_metadata["category"],
                "tags": document_metadata["tags"],
                "user_id": document_metadata["user_id"],
                "file_size": document_metadata["file_size"],
                "content_type": document_metadata["content_type"],
                "upload_time": document_metadata["upload_time"],
                "trigger_type": "document_upload",
                "timestamp": datetime.now().isoformat()
            }
            
            # Trigger the document processing workflow
            # This assumes you have a workflow with webhook trigger
            webhook_url = f"{self.n8n_api_url}/webhook/document-processing"
            
            headers = {}
            if self.n8n_api_key:
                headers["Authorization"] = f"Bearer {self.n8n_api_key}"
            
            response = await self.client.post(
                webhook_url,
                json=workflow_payload,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "status": "success",
                    "message": "Document processing workflow triggered successfully",
                    "workflow_execution_id": result.get("execution_id"),
                    "workflow_status": result.get("status", "running"),
                    "document_id": document_metadata["file_id"]
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to trigger workflow: {response.text}",
                    "document_id": document_metadata["file_id"]
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error triggering workflow: {str(e)}",
                "document_id": document_metadata["file_id"]
            }
    
    async def trigger_vector_store_indexing_workflow(self, document_metadata: Dict[str, Any], processing_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trigger workflow for vector store indexing completion
        
        Args:
            document_metadata: Original document metadata
            processing_result: Result from document processing
            
        Returns:
            Workflow execution result
        """
        try:
            # Prepare workflow payload for indexing completion
            workflow_payload = {
                "document_id": document_metadata["file_id"],
                "filename": document_metadata["original_filename"],
                "document_type": document_metadata["document_type"],
                "category": document_metadata["category"],
                "tags": document_metadata["tags"],
                "user_id": document_metadata["user_id"],
                "chunks_created": processing_result.get("chunks_created", 0),
                "vector_ids": processing_result.get("vector_ids", []),
                "index_name": processing_result.get("index_name"),
                "processing_status": processing_result.get("status"),
                "trigger_type": "vector_store_indexing_complete",
                "timestamp": datetime.now().isoformat()
            }
            
            # Trigger the indexing completion workflow
            webhook_url = f"{self.n8n_api_url}/webhook/indexing-complete"
            
            headers = {}
            if self.n8n_api_key:
                headers["Authorization"] = f"Bearer {self.n8n_api_key}"
            
            response = await self.client.post(
                webhook_url,
                json=workflow_payload,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "status": "success",
                    "message": "Indexing completion workflow triggered successfully",
                    "workflow_execution_id": result.get("execution_id"),
                    "workflow_status": result.get("status", "running"),
                    "document_id": document_metadata["file_id"]
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to trigger indexing workflow: {response.text}",
                    "document_id": document_metadata["file_id"]
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error triggering indexing workflow: {str(e)}",
                "document_id": document_metadata["file_id"]
            }
    
    async def trigger_document_analysis_workflow(self, document_metadata: Dict[str, Any], extracted_text: str) -> Dict[str, Any]:
        """
        Trigger workflow for document analysis (AI processing)
        
        Args:
            document_metadata: Document metadata
            extracted_text: Extracted text content
            
        Returns:
            Workflow execution result
        """
        try:
            # Prepare workflow payload for document analysis
            workflow_payload = {
                "document_id": document_metadata["file_id"],
                "filename": document_metadata["original_filename"],
                "document_type": document_metadata["document_type"],
                "category": document_metadata["category"],
                "tags": document_metadata["tags"],
                "user_id": document_metadata["user_id"],
                "text_content": extracted_text[:5000],  # First 5000 chars for analysis
                "text_length": len(extracted_text),
                "content_type": document_metadata["content_type"],
                "trigger_type": "document_analysis",
                "timestamp": datetime.now().isoformat()
            }
            
            # Trigger the document analysis workflow
            webhook_url = f"{self.n8n_api_url}/webhook/document-analysis"
            
            headers = {}
            if self.n8n_api_key:
                headers["Authorization"] = f"Bearer {self.n8n_api_key}"
            
            response = await self.client.post(
                webhook_url,
                json=workflow_payload,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "status": "success",
                    "message": "Document analysis workflow triggered successfully",
                    "workflow_execution_id": result.get("execution_id"),
                    "workflow_status": result.get("status", "running"),
                    "document_id": document_metadata["file_id"]
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to trigger analysis workflow: {response.text}",
                    "document_id": document_metadata["file_id"]
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error triggering analysis workflow: {str(e)}",
                "document_id": document_metadata["file_id"]
            }
    
    async def get_workflow_status(self, execution_id: str) -> Dict[str, Any]:
        """
        Get status of workflow execution
        
        Args:
            execution_id: Workflow execution ID
            
        Returns:
            Workflow status information
        """
        try:
            headers = {}
            if self.n8n_api_key:
                headers["Authorization"] = f"Bearer {self.n8n_api_key}"
            
            response = await self.client.get(
                f"{self.n8n_api_url}/api/v1/executions/{execution_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "status": "error",
                    "message": f"Failed to get workflow status: {response.text}"
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error getting workflow status: {str(e)}"
            }
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

# Global workflow trigger instance
workflow_trigger = DocumentWorkflowTrigger()
