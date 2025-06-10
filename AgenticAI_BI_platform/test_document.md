# Test Document for AgenticAI BI Platform

## Overview
This is a test document to verify the document upload and vectorization functionality of the AgenticAI BI platform.

## Key Features Being Tested
1. **Document Processing**: Text extraction from various file formats
2. **Vectorization**: Converting text content into embeddings
3. **Chunking**: Splitting large documents into manageable chunks
4. **Metadata Storage**: Storing document metadata in the vector store
5. **Session Integration**: Linking documents to user sessions

## Technical Details
- **Supported Formats**: PDF, DOCX, TXT, CSV, Excel files
- **Chunk Size**: 1000 characters with 200 character overlap
- **Vector Store**: Pinecone for persistent storage
- **Embedding Model**: OpenAI text-embedding-ada-002

## Business Context
This document represents a typical business requirement document that might be uploaded by a Solution Architect or Product Owner. It contains:
- Project specifications
- Technical requirements
- Business rules
- User stories and acceptance criteria

## Expected Behavior
When this document is uploaded:
1. The system should extract all text content
2. Split the content into chunks of ~1000 characters
3. Generate embeddings for each chunk
4. Store chunks in the Pinecone vector store
5. Associate metadata with each chunk
6. Update the session context with document information

## Testing Scenarios
- Single file upload
- Multiple file upload
- Different file formats
- Large document processing
- Error handling for unsupported formats
- Session persistence and retrieval

## Integration Points
- Chat interface can query uploaded documents
- LLM can use document context for responses
- Workflow management can reference document content
- User management can track document ownership 