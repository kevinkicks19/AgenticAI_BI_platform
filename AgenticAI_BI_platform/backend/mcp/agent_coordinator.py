from typing import Dict, List, Optional, Any, Set
from pydantic import BaseModel
from langchain.memory import RedisChatMessageHistory
from langchain.schema import HumanMessage, AIMessage
import openai
from datetime import datetime
import json
from fastapi import APIRouter, Request, UploadFile, File, HTTPException, Form
import pinecone
import aiofiles
import os
from pathlib import Path
import tempfile
import magic
import PyPDF2
import docx
import pandas as pd
import io
from config import OPENAI_API_KEY, REDIS_URL, PINECONE_API_KEY
import re
import traceback
import asyncio
from pinecone import Pinecone, ServerlessSpec
import joblib
import numpy as np

class WorkflowContext(BaseModel):
    workflow_id: str
    status: str
    parameters: Dict[str, Any]
    last_updated: datetime
    execution_history: List[Dict[str, Any]]

class AgentContext(BaseModel):
    session_id: str
    user_id: str
    current_workflow: Optional[WorkflowContext]
    conversation_history: List[Dict[str, str]]
    project_context: Dict[str, Any]
    last_interaction: datetime
    tasks: List[Dict[str, Any]] = []
    approvals: List[Dict[str, Any]] = []

class DocumentProcessor:
    ALLOWED_MIME_TYPES: Set[str] = {
        'text/plain',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
        'application/vnd.ms-excel',  # .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # .xlsx
        'text/csv'
    }
    
    @staticmethod
    def extract_text_from_file(file_content: bytes, mime_type: str) -> str:
        """Extract text content from various file formats."""
        if mime_type == 'text/plain':
            return file_content.decode('utf-8')
        
        elif mime_type == 'application/pdf':
            pdf_file = io.BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        
        elif mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            docx_file = io.BytesIO(file_content)
            doc = docx.Document(docx_file)
            return "\n".join([paragraph.text for paragraph in doc.paragraphs])
        
        elif mime_type in ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
            excel_file = io.BytesIO(file_content)
            df = pd.read_excel(excel_file)
            return df.to_string()
        
        elif mime_type == 'text/csv':
            csv_file = io.BytesIO(file_content)
            df = pd.read_csv(csv_file)
            return df.to_string()
        
        raise ValueError(f"Unsupported file type: {mime_type}")

class AgentCoordinator:
    def __init__(self, redis_url: str, openai_api_key: str):
        self.redis_url = redis_url
        openai.api_key = openai_api_key
        self.message_history = RedisChatMessageHistory(
            url=redis_url,
            ttl=3600,
            session_id="default"
        )
        self.sessions: Dict[str, AgentContext] = {}
        # Pinecone v3+ vector store for context
        self.pc = Pinecone(api_key=PINECONE_API_KEY)
        # Optionally create the index if it doesn't exist
        if "project-context" not in self.pc.list_indexes().names():
            self.pc.create_index(
                name="project-context",
                dimension=1024,  # text-embedding-3-small produces 1024-dimensional vectors
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
        self.index = self.pc.Index("project-context")
        self.document_processor = DocumentProcessor()
        # Instantiate the OpenAI client
        self.client = openai.OpenAI(api_key=openai_api_key)
        self.pca = self._load_pca_model()

    def _load_pca_model(self):
        try:
            return joblib.load("pca_1536_to_1024.joblib")
        except Exception as e:
            print("PCA model not found or failed to load. Using full embedding.", e)
            return None

    async def initialize_session(self, user_id: str, project_context: Dict[str, Any]) -> str:
        session_id = f"{user_id}_{datetime.now().timestamp()}"
        self.message_history.session_id = session_id
        context = AgentContext(
            session_id=session_id,
            user_id=user_id,
            current_workflow=None,
            conversation_history=[],
            project_context=project_context,
            last_interaction=datetime.now(),
            tasks=[],
            approvals=[]
        )
        self.sessions[session_id] = context
        await self._store_context(context)
        return session_id

    async def process_user_input(self, session_id: str, user_input: str) -> Dict[str, Any]:
        context = await self._get_context(session_id)
        self.message_history.add_user_message(user_input)
        intent_analysis = await self._analyze_intent(user_input, context)
        workflow_decision = await self._determine_workflow(intent_analysis, context)
        context.last_interaction = datetime.now()
        context.conversation_history.append({
            "role": "user",
            "content": user_input,
            "timestamp": datetime.now().isoformat()
        })
        await self._store_context(context)
        response = await self._generate_response(workflow_decision, context)
        return {
            "intent": intent_analysis,
            "workflow_decision": workflow_decision,
            "response": response
        }

    async def get_project_summary(self, session_id: str) -> Dict[str, Any]:
        context = await self._get_context(session_id)
        return {
            "project": context.project_context,
            "summary": f"Project for user {context.user_id} with {len(context.tasks)} tasks."
        }

    async def get_task_list(self, session_id: str) -> List[Dict[str, Any]]:
        context = await self._get_context(session_id)
        return context.tasks

    async def switch_project(self, session_id: str, new_project_context: Dict[str, Any]) -> Dict[str, Any]:
        context = await self._get_context(session_id)
        context.project_context = new_project_context
        context.tasks = []
        context.approvals = []
        await self._store_context(context)
        return {"status": "switched", "project": new_project_context}

    async def handle_approval(self, session_id: str, approval: bool) -> Dict[str, Any]:
        context = await self._get_context(session_id)
        context.approvals.append({
            "timestamp": datetime.now().isoformat(),
            "approved": approval
        })
        await self._store_context(context)
        return {"status": "approval recorded", "approved": approval}

    async def suggest_next_steps(self, session_id: str) -> List[str]:
        context = await self._get_context(session_id)
        # Stub: Suggest next steps based on project context/history
        return ["Review project goals", "Add new task", "Request summary"]

    async def _analyze_intent(self, user_input: str, context: AgentContext) -> dict:
        messages = [
            {"role": "system", "content": "You are an AI agent coordinator analyzing user intents. Always respond ONLY with a valid JSON object, with no extra text, no markdown, and no code block fencing."},
            {"role": "user", "content": f"Analyze this user input in the context of their project: {user_input}"}
        ]
        print("Calling OpenAI chat.completions.create with:", messages)
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.3
            )
            print("OpenAI response (analyze_intent):", response)
            if not isinstance(response, dict):
                print("Response type:", type(response))
                print("Response content:", response)
        except Exception as e:
            print("OpenAI error (analyze_intent):", e)
            raise
        content = response.choices[0].message.content.strip()
        # Remove markdown code block if present
        if content.startswith("```"):
            content = re.sub(r"^```[a-zA-Z]*\n?", "", content)
            if content.endswith("```"):
                content = content[:-3].rstrip()
        return json.loads(content)

    async def _determine_workflow(self, intent_analysis: Dict[str, Any], context: AgentContext) -> Dict[str, Any]:
        """Determine which workflow to execute based on the user's intent."""
        intent_type = intent_analysis.get("intent_type", "general_chat")
        intent_confidence = intent_analysis.get("confidence", 0.0)
        
        # Map intents to workflows
        workflow_mapping = {
            "data_analysis": {
                "workflow_id": "data_analysis",
                "parameters": intent_analysis.get("parameters", {}),
                "priority": "high" if intent_confidence > 0.8 else "normal"
            },
            "document_processing": {
                "workflow_id": "document_processing",
                "parameters": intent_analysis.get("parameters", {}),
                "priority": "high" if intent_confidence > 0.8 else "normal"
            },
            "task_management": {
                "workflow_id": "task_management",
                "parameters": intent_analysis.get("parameters", {}),
                "priority": "normal"
            },
            "approval_request": {
                "workflow_id": "approval_workflow",
                "parameters": intent_analysis.get("parameters", {}),
                "priority": "high"
            }
        }
        
        return workflow_mapping.get(intent_type, {
            "workflow_id": "general_chat",
            "parameters": intent_analysis.get("parameters", {}),
            "priority": "normal"
        })

    async def _generate_response(self, workflow_decision: Dict[str, Any], context: AgentContext) -> str:
        """Generate a response based on the workflow decision and context."""
        # Get relevant context from vector store
        recent_messages = context.conversation_history[-5:]  # Last 5 messages
        context_query = " ".join([msg["content"] for msg in recent_messages])
        relevant_context = await self.query_context(context_query, top_k=3)
        
        # Prepare the system message with context
        system_message = {
            "role": "system",
            "content": f"""You are an AI agent coordinator managing a project for user {context.user_id}.
            Current project context: {json.dumps(context.project_context)}
            Recent relevant context: {json.dumps(relevant_context['documents'])}
            Current workflow: {workflow_decision['workflow_id']}
            You should respond in a helpful, professional manner while maintaining context awareness."""
        }
        
        # Prepare the conversation history
        messages = [system_message]
        for msg in recent_messages:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add the current user input
        if recent_messages and recent_messages[-1]["role"] == "user":
            current_input = recent_messages[-1]["content"]
            messages.append({
                "role": "user",
                "content": f"Based on the current context and workflow ({workflow_decision['workflow_id']}), respond to: {current_input}"
            })
        
        # Generate the response
        print("Calling OpenAI chat.completions.create with:", messages)
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            print("OpenAI response (generate_response):", response)
            if not isinstance(response, dict):
                print("Response type:", type(response))
                print("Response content:", response)
        except Exception as e:
            print("OpenAI error (generate_response):", e)
            raise
        ai_response = response.choices[0].message.content
        context.conversation_history.append({
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.now().isoformat()
        })
        
        # Store the interaction in vector store for future context
        await self.store_context_vector(
            context.session_id,
            f"User: {current_input}\nAssistant: {ai_response}",
            metadata={
                "workflow": workflow_decision['workflow_id'],
                "timestamp": datetime.now().isoformat()
            }
        )
        
        return ai_response

    async def _store_context(self, context: AgentContext) -> None:
        # TODO: Implement context storage
        self.sessions[context.session_id] = context
        pass

    async def _get_context(self, session_id: str) -> AgentContext:
        context = self.sessions.get(session_id)
        if context is None:
            raise HTTPException(status_code=404, detail="Session not found")
        return context

    async def execute_workflow(self, workflow_id: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        # TODO: Implement workflow execution
        pass

    async def get_embedding(self, text: str) -> list:
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.embeddings.create(
                    model="text-embedding-3-small",  # This produces 1536-dimensional vectors
                    input=text
                )
            )
            embedding = response.data[0].embedding
            if self.pca:
                embedding_1024 = self.pca.transform(np.array(embedding).reshape(1, -1))[0]
                return embedding_1024.tolist()
            else:
                return embedding
        except Exception as e:
            print(f"Error getting embedding: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error getting embeddings: {str(e)}"
            )

    async def store_context_vector(self, session_id: str, text: str, metadata: dict = None):
        embedding = await self.get_embedding(text)
        doc_id = f"{session_id}_{datetime.now().timestamp()}"
        # Pinecone upsert
        self.index.upsert([
            (
                doc_id,
                embedding,
                metadata or {"session_id": session_id}
            )
        ])
        return doc_id

    async def query_context(self, query_text: str, top_k: int = 5):
        query_embedding = await self.get_embedding(query_text)
        result = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True
        )
        # Return the most relevant documents and their metadata
        matches = result.get("matches", [])
        documents = [m.get("id") for m in matches]
        metadatas = [m.get("metadata") for m in matches]
        ids = [m.get("id") for m in matches]
        scores = [m.get("score") for m in matches]
        return {
            "documents": documents,
            "metadatas": metadatas,
            "ids": ids,
            "scores": scores,
        }

    async def process_document(self, session_id: str, file: UploadFile, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process and store an uploaded document in the vector store."""
        import traceback
        start_time = datetime.now()
        print(f"\nStarting document processing at {start_time}")
        
        try:
            # Read file content
            content = await file.read()
            print(f"File read complete. Size: {len(content)} bytes")
            
            # Detect file type
            mime_type = magic.from_buffer(content, mime=True)
            print(f"File type detected: {mime_type}")
            
            # Validate file type
            if mime_type not in self.document_processor.ALLOWED_MIME_TYPES:
                print(f"Unsupported file type: {mime_type}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {mime_type}. Allowed types: {', '.join(self.document_processor.ALLOWED_MIME_TYPES)}"
                )
            
            # Extract text content based on file type
            try:
                print("Extracting text from file...")
                text_content = self.document_processor.extract_text_from_file(content, mime_type)
            except Exception as e:
                tb = traceback.format_exc()
                print(f"Error extracting text from file: {str(e)}\n{tb}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Error extracting text from file: {str(e)}\n{tb}"
                )
            
            print(f"Text extraction complete. Content length: {len(text_content)} characters")
            
            # Split text into chunks for better vector storage
            chunks = self._split_text_into_chunks(text_content)
            print(f"Text split into {len(chunks)} chunks")
            
            # Store each chunk in the vector store with metadata
            doc_metadata = {
                "session_id": session_id,
                "filename": file.filename,
                "content_type": mime_type,
                "upload_time": datetime.now().isoformat(),
                "file_size": len(content),
                "chunk_index": 0,  # Will be updated for each chunk
                **(metadata or {})
            }
            
            chunk_ids = []
            for i, chunk in enumerate(chunks):
                print(f"Processing chunk {i+1}/{len(chunks)}")
                chunk_metadata = {**doc_metadata, "chunk_index": i}
                try:
                    embedding = await self.get_embedding(chunk)
                    doc_id = f"{session_id}_{datetime.now().timestamp()}_{i}"
                    await asyncio.get_event_loop().run_in_executor(
                        None,
                        lambda: self.index.upsert([
                            (
                                doc_id,
                                embedding,
                                chunk_metadata
                            )
                        ])
                    )
                    chunk_ids.append(doc_id)
                except Exception as e:
                    tb = traceback.format_exc()
                    print(f"Error storing chunk {i}: {str(e)}\n{tb}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Error storing chunk {i}: {str(e)}\n{tb}"
                    )
            
            # Update session context
            context = await self._get_context(session_id)
            if "documents" not in context.project_context:
                context.project_context["documents"] = []
            context.project_context["documents"].append({
                "filename": file.filename,
                "upload_time": doc_metadata["upload_time"],
                "content_type": mime_type,
                "file_size": len(content),
                "chunk_count": len(chunks),
                "chunk_ids": chunk_ids
            })
            await self._store_context(context)
            
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            print(f"\nDocument processing completed in {processing_time:.2f} seconds")
            
            return {
                "status": "success",
                "message": f"Document {file.filename} processed successfully",
                "metadata": doc_metadata,
                "chunk_count": len(chunks),
                "processing_time_seconds": processing_time
            }
            
        except HTTPException as he:
            tb = traceback.format_exc()
            print(f"HTTP Exception during processing: {str(he)}\n{tb}")
            raise HTTPException(
                status_code=he.status_code,
                detail=f"{he.detail}\n{tb}"
            )
        except Exception as e:
            tb = traceback.format_exc()
            print(f"Unexpected error during processing: {str(e)}\n{tb}")
            raise HTTPException(
                status_code=500,
                detail=f"Error processing document: {str(e)}\n{tb}"
            )

    def _split_text_into_chunks(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks for better vector storage."""
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            if end > text_length:
                end = text_length
            
            # Try to find a natural break point (newline or period)
            if end < text_length:
                # Look for the last newline in the chunk
                last_newline = text.rfind('\n', start, end)
                if last_newline != -1 and last_newline > start + chunk_size // 2:
                    end = last_newline + 1
                else:
                    # Look for the last period followed by space
                    last_period = text.rfind('. ', start, end)
                    if last_period != -1 and last_period > start + chunk_size // 2:
                        end = last_period + 2
            
            chunks.append(text[start:end].strip())
            start = end - overlap
        
        return chunks

# --- FastAPI Router for Coordinator APIs ---
router = APIRouter()
coordinator = AgentCoordinator(redis_url=REDIS_URL, openai_api_key=OPENAI_API_KEY)

# New endpoint to update project context (for augmenting context as the project progresses)
@router.post("/api/project/update_context")
async def update_project_context(request: Request):
    try:
        data = await request.json()
        session_id = data.get("session_id")
        new_context = data.get("context")
        if not session_id or not new_context:
            raise HTTPException(status_code=400, detail="session_id and context are required")
        await coordinator.store_context_vector(session_id, str(new_context))
        return {"status": "context updated"}
    except Exception as e:
        print("Error updating project context:", e)
        raise HTTPException(status_code=500, detail=f"Error updating project context: {str(e)}")

@router.post("/api/chat")
async def chat(request: Request):
    try:
        data = await request.json()
        print("Received chat request data:", data)  # Debug log
        
        session_id = data.get("sessionId")
        user_input = data.get("message") or data.get("chatInput")
        project_context = data.get("projectContext")
        
        print(f"Processing chat - session_id: {session_id}, user_input: {user_input}")  # Debug log
        
        # If no sessionId, create a new session
        if not session_id:
            if not project_context:
                project_context = {"name": "Default Project", "description": "No description provided."}
            try:
                session_id = await coordinator.initialize_session(
                    user_id="web-user",
                    project_context=project_context
                )
                welcome_message = "Session initialized. How can I assist you?"
                return {"status": "success", "session_id": session_id, "response": welcome_message}
            except Exception as e:
                print(f"Error initializing session: {str(e)}")
                print("Traceback:", traceback.format_exc())
                raise HTTPException(
                    status_code=500,
                    detail=f"Error initializing session: {str(e)}"
                )
        
        # Validate user input
        if not user_input:
            raise HTTPException(
                status_code=400,
                detail="message or chatInput is required"
            )
            
        # Process the chat
        try:
            result = await coordinator.process_user_input(session_id, user_input)
            return {
                "status": "success",
                "response": result["response"],
                "intent": result["intent"],
                "workflow": result["workflow_decision"],
                "session_id": session_id
            }
        except HTTPException as he:
            # Re-raise HTTP exceptions as they already have proper status codes
            raise he
        except Exception as e:
            print(f"Error processing user input: {str(e)}")
            print("Traceback:", traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Error processing user input: {str(e)}"
            )
            
    except json.JSONDecodeError as e:
        print(f"Invalid JSON in request: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON in request: {str(e)}"
        )
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        print(f"Unexpected error in /api/chat endpoint: {str(e)}")
        print("Traceback:", traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@router.get("/api/project")
async def get_project(request: Request):
    session_id = request.query_params.get("sessionId")
    return await coordinator.get_project_summary(session_id)

@router.get("/api/tasks")
async def get_tasks(request: Request):
    session_id = request.query_params.get("sessionId")
    return await coordinator.get_task_list(session_id)

@router.post("/api/project/switch")
async def switch_project(request: Request):
    data = await request.json()
    session_id = data.get("sessionId")
    new_project_context = data.get("projectContext")
    return await coordinator.switch_project(session_id, new_project_context)

@router.post("/api/approval")
async def approval(request: Request):
    data = await request.json()
    session_id = data.get("sessionId")
    approval_value = data.get("approved")
    return await coordinator.handle_approval(session_id, approval_value)

@router.get("/api/suggestions")
async def suggestions(request: Request):
    session_id = request.query_params.get("sessionId")
    return await coordinator.suggest_next_steps(session_id)

@router.post("/api/documents/upload")
async def upload_documents(
    request: Request,
    file: UploadFile = File(None),  # Single file upload
    files: List[UploadFile] = File(None),  # Multiple files upload
    session_id: str = None,
    metadata: str = None
):
    """Upload and process documents for the current session."""
    import traceback
    import json
    print("\n=== Document Upload Request ===")
    print(f"Session ID from query params: {request.query_params.get('session_id')}")
    print(f"Session ID from parameter: {session_id}")
    
    # Parse metadata if it's a string (from multipart/form-data)
    if metadata:
        try:
            metadata = json.loads(metadata)
        except Exception:
            print("Warning: Could not parse metadata as JSON. Using empty dict.")
            metadata = {}
    else:
        metadata = {}
    
    # Get session ID from query params if not provided
    if not session_id:
        session_id = request.query_params.get("session_id")
    if not session_id:
        print("Error: No session ID provided")
        raise HTTPException(status_code=400, detail="Session ID is required")
    
    print(f"Using session ID: {session_id}")
    
    # Handle both single file and multiple files
    files_to_process = []
    if file:
        files_to_process = [file]
    elif files:
        files_to_process = files
    else:
        raise HTTPException(status_code=400, detail="No files provided")
    
    print(f"Number of files to process: {len(files_to_process)}")
    for f in files_to_process:
        print(f"File: {f.filename}, Content-Type: {f.content_type}")
    
    results = []
    for f in files_to_process:
        try:
            print(f"\nProcessing file: {f.filename}")
            result = await coordinator.process_document(session_id, f, metadata)
            print(f"Successfully processed {f.filename}")
            results.append(result)
        except HTTPException as he:
            tb = traceback.format_exc()
            print(f"HTTP Exception processing file {f.filename}: {str(he)}\n{tb}")
            results.append({
                "status": "error",
                "filename": f.filename,
                "error": f"{he.detail}\n{tb}"
            })
        except Exception as e:
            tb = traceback.format_exc()
            print(f"Unexpected error processing file {f.filename}: {str(e)}\n{tb}")
            results.append({
                "status": "error",
                "filename": f.filename,
                "error": f"Unexpected error: {str(e)}\n{tb}"
            })
    
    print("\n=== Upload Results ===")
    print(json.dumps(results, indent=2))
    print("=====================\n")
    
    # If it was a single file upload, return just that result
    if file and not files:
        return results[0]
    
    return {
        "status": "success",
        "documents": results
    } 