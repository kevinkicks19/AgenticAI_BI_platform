"""
File Upload Routes for Agentic AI BI Platform

This module provides REST API endpoints for file uploads:
- Document file uploads (PDF, DOCX, TXT, etc.)
- Image uploads for reports
- File processing and storage
- Integration with Affine document management
"""

from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from typing import Dict, List, Any, Optional
import os
import uuid
import aiofiles
import magic
from datetime import datetime
import json
from pathlib import Path
import PyPDF2
import docx
from PIL import Image
import io

# Import processing modules
from document_processor import document_processor
from workflow_trigger import workflow_trigger

router = APIRouter(prefix="/api/upload", tags=["file-upload"])

# Configure upload settings
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Allowed file types and their MIME types
ALLOWED_TYPES = {
    'pdf': ['application/pdf'],
    'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'doc': ['application/msword'],
    'txt': ['text/plain'],
    'csv': ['text/csv', 'application/csv'],
    'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'xls': ['application/vnd.ms-excel'],
    'png': ['image/png'],
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg'],
    'gif': ['image/gif'],
    'webp': ['image/webp']
}

# Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

def validate_file_type(file: UploadFile) -> bool:
    """Validate if the uploaded file type is allowed"""
    if not file.content_type:
        return False
    
    # Check if content type is in allowed types
    for allowed_mimes in ALLOWED_TYPES.values():
        if file.content_type in allowed_mimes:
            return True
    
    return False

def get_file_extension(content_type: str) -> str:
    """Get file extension from content type"""
    for ext, mimes in ALLOWED_TYPES.items():
        if content_type in mimes:
            return ext
    return 'bin'

async def save_uploaded_file(file: UploadFile, upload_dir: Path) -> Dict[str, Any]:
    """Save uploaded file and return metadata"""
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_ext = get_file_extension(file.content_type)
    filename = f"{file_id}.{file_ext}"
    file_path = upload_dir / filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Get file metadata
    file_size = len(content)
    
    return {
        "file_id": file_id,
        "original_filename": file.filename,
        "saved_filename": filename,
        "file_path": str(file_path),
        "file_size": file_size,
        "content_type": file.content_type,
        "upload_time": datetime.now().isoformat()
    }

async def extract_text_from_file(file_path: str, content_type: str) -> str:
    """Extract text content from uploaded file"""
    try:
        if content_type == 'application/pdf':
            with open(file_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text.strip()
        
        elif content_type in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        
        elif content_type == 'text/plain':
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                return await f.read()
        
        elif content_type in ['text/csv', 'application/csv']:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                return await f.read()
        
        else:
            return f"[Binary file: {content_type}]"
    
    except Exception as e:
        return f"[Error extracting text: {str(e)}]"

@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    category: str = Form(default=""),
    tags: str = Form(default=""),
    user_id: str = Form(default="anonymous")
):
    """Upload a document file"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        if not validate_file_type(file):
            raise HTTPException(status_code=400, detail="File type not allowed")
        
        # Read file content to check size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")
        
        # Reset file pointer
        await file.seek(0)
        
        # Save file
        file_metadata = await save_uploaded_file(file, UPLOAD_DIR)
        
        # Extract text content
        extracted_text = await extract_text_from_file(
            file_metadata["file_path"], 
            file_metadata["content_type"]
        )
        
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        # Create document metadata
        document_metadata = {
            "file_id": file_metadata["file_id"],
            "original_filename": file_metadata["original_filename"],
            "document_type": document_type,
            "category": category,
            "tags": tag_list,
            "user_id": user_id,
            "file_size": file_metadata["file_size"],
            "content_type": file_metadata["content_type"],
            "upload_time": file_metadata["upload_time"],
            "extracted_text": extracted_text[:1000],  # First 1000 chars for preview
            "full_text_available": len(extracted_text) > 1000
        }
        
        # Save metadata to JSON file
        metadata_file = UPLOAD_DIR / f"{file_metadata['file_id']}_metadata.json"
        async with aiofiles.open(metadata_file, 'w') as f:
            await f.write(json.dumps(document_metadata, indent=2))
        
        # Trigger automatic processing workflows
        processing_results = await trigger_document_processing(document_metadata)
        
        # Add processing results to response
        enhanced_response = {
            "status": "success",
            "message": "File uploaded successfully",
            "document": document_metadata,
            "processing": processing_results
        }
        
        return JSONResponse(content=enhanced_response)
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.get("/documents")
async def list_uploaded_documents(
    document_type: Optional[str] = None,
    category: Optional[str] = None,
    user_id: Optional[str] = None
):
    """List all uploaded documents with optional filtering"""
    try:
        documents = []
        
        # Scan upload directory for metadata files
        for metadata_file in UPLOAD_DIR.glob("*_metadata.json"):
            try:
                async with aiofiles.open(metadata_file, 'r') as f:
                    content = await f.read()
                    doc_metadata = json.loads(content)
                    
                    # Apply filters
                    if document_type and doc_metadata.get("document_type") != document_type:
                        continue
                    if category and doc_metadata.get("category") != category:
                        continue
                    if user_id and doc_metadata.get("user_id") != user_id:
                        continue
                    
                    documents.append(doc_metadata)
            except Exception as e:
                print(f"Error reading metadata file {metadata_file}: {e}")
                continue
        
        # Sort by upload time (newest first)
        documents.sort(key=lambda x: x.get("upload_time", ""), reverse=True)
        
        return JSONResponse(content={
            "status": "success",
            "documents": documents,
            "total": len(documents)
        })
        
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.get("/documents/{file_id}")
async def get_document(file_id: str):
    """Get document metadata and full text content"""
    try:
        metadata_file = UPLOAD_DIR / f"{file_id}_metadata.json"
        
        if not metadata_file.exists():
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Read metadata
        async with aiofiles.open(metadata_file, 'r') as f:
            content = await f.read()
            doc_metadata = json.loads(content)
        
        # Get full text content
        file_path = doc_metadata["file_path"]
        if os.path.exists(file_path):
            full_text = await extract_text_from_file(
                file_path, 
                doc_metadata["content_type"]
            )
            doc_metadata["full_text"] = full_text
        
        return JSONResponse(content={
            "status": "success",
            "document": doc_metadata
        })
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.get("/documents/{file_id}/download")
async def download_document(file_id: str):
    """Download the original uploaded file"""
    try:
        metadata_file = UPLOAD_DIR / f"{file_id}_metadata.json"
        
        if not metadata_file.exists():
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Read metadata
        async with aiofiles.open(metadata_file, 'r') as f:
            content = await f.read()
            doc_metadata = json.loads(content)
        
        file_path = doc_metadata["file_path"]
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            path=file_path,
            filename=doc_metadata["original_filename"],
            media_type=doc_metadata["content_type"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.delete("/documents/{file_id}")
async def delete_document(file_id: str):
    """Delete an uploaded document"""
    try:
        metadata_file = UPLOAD_DIR / f"{file_id}_metadata.json"
        
        if not metadata_file.exists():
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Read metadata
        async with aiofiles.open(metadata_file, 'r') as f:
            content = await f.read()
            doc_metadata = json.loads(content)
        
        # Delete files
        file_path = doc_metadata["file_path"]
        if os.path.exists(file_path):
            os.remove(file_path)
        
        if metadata_file.exists():
            os.remove(metadata_file)
        
        return JSONResponse(content={
            "status": "success",
            "message": "Document deleted successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.post("/documents/{file_id}/affine")
async def create_affine_document(file_id: str, request: Request):
    """Create an Affine document from uploaded file"""
    try:
        data = await request.json()
        
        # Get document metadata
        metadata_file = UPLOAD_DIR / f"{file_id}_metadata.json"
        if not metadata_file.exists():
            raise HTTPException(status_code=404, detail="Document not found")
        
        async with aiofiles.open(metadata_file, 'r') as f:
            content = await f.read()
            doc_metadata = json.loads(content)
        
        # Get full text content
        file_path = doc_metadata["file_path"]
        full_text = await extract_text_from_file(
            file_path, 
            doc_metadata["content_type"]
        )
        
        # Import Affine service
        from affine_service import affine_service
        
        # Create document in Affine
        result = await affine_service.create_document({
            "title": data.get("title", doc_metadata["original_filename"]),
            "content": f"""
# {data.get("title", doc_metadata["original_filename"])}

**Original File:** {doc_metadata["original_filename"]}
**File Type:** {doc_metadata["content_type"]}
**Upload Date:** {doc_metadata["upload_time"]}
**File Size:** {doc_metadata["file_size"]} bytes

---

{full_text}
            """.strip(),
            "document_type": data.get("document_type", "uploaded_document"),
            "properties": {
                "file_id": file_id,
                "original_filename": doc_metadata["original_filename"],
                "file_size": doc_metadata["file_size"],
                "content_type": doc_metadata["content_type"],
                "upload_time": doc_metadata["upload_time"],
                "category": doc_metadata.get("category", ""),
                "tags": doc_metadata.get("tags", []),
                "user_id": doc_metadata.get("user_id", "anonymous"),
                "created_at": datetime.now().isoformat()
            }
        })
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return JSONResponse(content={
            "status": "success",
            "message": "Document created in Affine successfully",
            "affine_document": result
        })
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.post("/search")
async def search_documents(request: Request):
    """Search documents in vector store"""
    try:
        data = await request.json()
        query = data.get("query", "")
        k = data.get("k", 5)
        filter_dict = data.get("filter", None)
        
        if not query:
            raise HTTPException(status_code=400, detail="Query parameter is required")
        
        # Search in vector store
        results = await document_processor.search_documents(query, k, filter_dict)
        
        # Format results for frontend
        formatted_results = []
        for doc in results:
            formatted_results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": getattr(doc, 'score', None)
            })
        
        return JSONResponse(content={
            "status": "success",
            "query": query,
            "results": formatted_results,
            "total_results": len(formatted_results)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "error"},
            status_code=500
        )

@router.get("/health")
async def upload_health_check():
    """Health check for upload service"""
    try:
        # Check if upload directory exists and is writable
        if not UPLOAD_DIR.exists():
            UPLOAD_DIR.mkdir(exist_ok=True)
        
        # Test write permissions
        test_file = UPLOAD_DIR / "test_write.tmp"
        test_file.write_text("test")
        test_file.unlink()
        
        return JSONResponse(content={
            "status": "healthy",
            "upload_directory": str(UPLOAD_DIR),
            "max_file_size": MAX_FILE_SIZE,
            "allowed_types": list(ALLOWED_TYPES.keys()),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return JSONResponse(
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            },
            status_code=500
        )

async def trigger_document_processing(document_metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Trigger automatic document processing workflows
    
    Args:
        document_metadata: Document metadata from upload
        
    Returns:
        Processing results including vector store indexing and workflow triggers
    """
    try:
        processing_results = {
            "vector_store_indexing": {"status": "pending"},
            "workflow_triggers": {"status": "pending"},
            "document_analysis": {"status": "pending"}
        }
        
        # 1. Process document and add to vector store
        try:
            file_path = document_metadata["file_path"]
            vector_result = await document_processor.process_document(file_path, document_metadata)
            processing_results["vector_store_indexing"] = vector_result
            
            # If vector store processing succeeded, trigger indexing completion workflow
            if vector_result.get("status") == "success":
                indexing_workflow_result = await workflow_trigger.trigger_vector_store_indexing_workflow(
                    document_metadata, vector_result
                )
                processing_results["indexing_workflow"] = indexing_workflow_result
                
        except Exception as e:
            processing_results["vector_store_indexing"] = {
                "status": "error",
                "message": f"Vector store processing failed: {str(e)}"
            }
        
        # 2. Trigger document processing workflow
        try:
            processing_workflow_result = await workflow_trigger.trigger_document_processing_workflow(document_metadata)
            processing_results["workflow_triggers"] = processing_workflow_result
        except Exception as e:
            processing_results["workflow_triggers"] = {
                "status": "error",
                "message": f"Workflow trigger failed: {str(e)}"
            }
        
        # 3. Trigger document analysis workflow (if text extraction was successful)
        try:
            if document_metadata.get("extracted_text") and not document_metadata["extracted_text"].startswith("[Error"):
                # Get full text for analysis
                full_text = await extract_text_from_file(
                    document_metadata["file_path"], 
                    document_metadata["content_type"]
                )
                
                analysis_workflow_result = await workflow_trigger.trigger_document_analysis_workflow(
                    document_metadata, full_text
                )
                processing_results["document_analysis"] = analysis_workflow_result
            else:
                processing_results["document_analysis"] = {
                    "status": "skipped",
                    "message": "No text content available for analysis"
                }
        except Exception as e:
            processing_results["document_analysis"] = {
                "status": "error",
                "message": f"Document analysis failed: {str(e)}"
            }
        
        return processing_results
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Document processing pipeline failed: {str(e)}",
            "vector_store_indexing": {"status": "error"},
            "workflow_triggers": {"status": "error"},
            "document_analysis": {"status": "error"}
        }
