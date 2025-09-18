"""
Document Processing Pipeline for Vector Store Integration

This module handles automatic processing of uploaded documents:
- Text extraction and chunking
- Vector embedding generation
- Pinecone vector store indexing
- Workflow triggering for document processing
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Pinecone
from langchain.docstore.document import Document
import pinecone
from pinecone import Pinecone as PineconeClient

from config import PINECONE_API_KEY, OPENAI_API_KEY

class DocumentProcessor:
    """Handles document processing and vector store integration"""
    
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        # Initialize Pinecone
        self.pc = PineconeClient(api_key=PINECONE_API_KEY)
        self.index_name = "agentic-bi-documents"
        
        # Create index if it doesn't exist
        self._ensure_index_exists()
    
    def _ensure_index_exists(self):
        """Ensure Pinecone index exists"""
        if self.index_name not in self.pc.list_indexes().names():
            self.pc.create_index(
                name=self.index_name,
                dimension=1536,  # OpenAI embedding dimension
                metric="cosine",
                spec={
                    "serverless": {
                        "cloud": "aws",
                        "region": "us-east-1"
                    }
                }
            )
    
    async def process_document(self, file_path: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process uploaded document and add to vector store
        
        Args:
            file_path: Path to the uploaded file
            metadata: Document metadata from upload
            
        Returns:
            Processing result with vector store IDs
        """
        try:
            # Extract full text content
            from file_upload_routes import extract_text_from_file
            full_text = await extract_text_from_file(file_path, metadata["content_type"])
            
            if not full_text or full_text.startswith("[Error"):
                return {
                    "status": "error",
                    "message": f"Failed to extract text: {full_text}",
                    "file_id": metadata["file_id"]
                }
            
            # Create document chunks
            document = Document(
                page_content=full_text,
                metadata={
                    "file_id": metadata["file_id"],
                    "original_filename": metadata["original_filename"],
                    "document_type": metadata["document_type"],
                    "category": metadata["category"],
                    "tags": metadata["tags"],
                    "user_id": metadata["user_id"],
                    "file_size": metadata["file_size"],
                    "content_type": metadata["content_type"],
                    "upload_time": metadata["upload_time"],
                    "processed_time": datetime.now().isoformat(),
                    "source": "document_upload"
                }
            )
            
            # Split into chunks
            chunks = self.text_splitter.split_documents([document])
            
            # Generate embeddings and add to Pinecone
            vector_store = Pinecone.from_documents(
                chunks,
                self.embeddings,
                index_name=self.index_name
            )
            
            # Get the vector IDs
            vector_ids = [chunk.metadata.get("file_id", str(uuid.uuid4())) for chunk in chunks]
            
            return {
                "status": "success",
                "message": f"Document processed and indexed successfully",
                "file_id": metadata["file_id"],
                "chunks_created": len(chunks),
                "vector_ids": vector_ids,
                "index_name": self.index_name
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error processing document: {str(e)}",
                "file_id": metadata["file_id"]
            }
    
    async def search_documents(self, query: str, k: int = 5, filter_dict: Optional[Dict] = None) -> List[Document]:
        """
        Search documents in vector store
        
        Args:
            query: Search query
            k: Number of results to return
            filter_dict: Optional metadata filters
            
        Returns:
            List of relevant documents
        """
        try:
            vector_store = Pinecone.from_existing_index(
                index_name=self.index_name,
                embedding=self.embeddings
            )
            
            results = vector_store.similarity_search(
                query,
                k=k,
                filter=filter_dict
            )
            
            return results
            
        except Exception as e:
            print(f"Error searching documents: {e}")
            return []
    
    async def delete_document_from_vector_store(self, file_id: str) -> bool:
        """
        Delete document chunks from vector store
        
        Args:
            file_id: File ID to delete
            
        Returns:
            Success status
        """
        try:
            vector_store = Pinecone.from_existing_index(
                index_name=self.index_name,
                embedding=self.embeddings
            )
            
            # Delete all chunks for this file
            # Note: This is a simplified approach - in production you'd want to track chunk IDs
            index = self.pc.Index(self.index_name)
            
            # Query for documents with this file_id
            query_response = index.query(
                vector=[0] * 1536,  # Dummy vector
                filter={"file_id": file_id},
                top_k=1000,
                include_metadata=True
            )
            
            if query_response.matches:
                ids_to_delete = [match.id for match in query_response.matches]
                index.delete(ids=ids_to_delete)
            
            return True
            
        except Exception as e:
            print(f"Error deleting document from vector store: {e}")
            return False

# Global processor instance
document_processor = DocumentProcessor()
