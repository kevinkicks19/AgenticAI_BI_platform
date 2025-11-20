"""
GitHub Artifact Routes
API endpoints for pushing artifacts to GitHub
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Dict
from services.github_artifact_service import GitHubArtifactService

router = APIRouter(prefix="/api/github", tags=["github-artifacts"])

# Initialize service
try:
    github_service = GitHubArtifactService()
except Exception as e:
    print(f"Warning: GitHub service not initialized: {e}")
    github_service = None


class InceptionArtifactRequest(BaseModel):
    session_id: str
    content: str
    workflow_id: Optional[str] = None
    metadata: Optional[Dict] = None


class GlossaryArtifactRequest(BaseModel):
    term: str
    definition: str
    category: Optional[str] = None
    related_terms: Optional[List[str]] = None
    metadata: Optional[Dict] = None


class MetadataArtifactRequest(BaseModel):
    object_name: str
    object_type: str  # "cbe", "business-concept", etc.
    content: str
    metadata: Optional[Dict] = None


class DataVaultArtifactRequest(BaseModel):
    name: str
    artifact_type: str  # "hub", "link", "satellite"
    content: str
    metadata: Optional[Dict] = None


class BIReportArtifactRequest(BaseModel):
    report_name: str
    content: str
    date: Optional[str] = None
    metadata: Optional[Dict] = None


@router.post("/push-inception")
async def push_inception_artifact(request: InceptionArtifactRequest):
    """Push an inception artifact to GitHub"""
    if not github_service:
        raise HTTPException(status_code=503, detail="GitHub service not configured")
    
    try:
        result = github_service.create_inception_artifact(
            session_id=request.session_id,
            content=request.content,
            workflow_id=request.workflow_id,
            metadata=request.metadata
        )
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/push-glossary")
async def push_glossary_artifact(request: GlossaryArtifactRequest):
    """Push a glossary artifact to GitHub"""
    if not github_service:
        raise HTTPException(status_code=503, detail="GitHub service not configured")
    
    try:
        result = github_service.create_glossary_artifact(
            term=request.term,
            definition=request.definition,
            category=request.category,
            related_terms=request.related_terms,
            metadata=request.metadata
        )
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/push-metadata")
async def push_metadata_artifact(request: MetadataArtifactRequest):
    """Push a metadata object artifact to GitHub"""
    if not github_service:
        raise HTTPException(status_code=503, detail="GitHub service not configured")
    
    try:
        result = github_service.create_metadata_artifact(
            object_name=request.object_name,
            object_type=request.object_type,
            content=request.content,
            metadata=request.metadata
        )
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/push-data-vault")
async def push_data_vault_artifact(request: DataVaultArtifactRequest):
    """Push a data vault artifact to GitHub"""
    if not github_service:
        raise HTTPException(status_code=503, detail="GitHub service not configured")
    
    try:
        result = github_service.create_data_vault_artifact(
            name=request.name,
            artifact_type=request.artifact_type,
            content=request.content,
            metadata=request.metadata
        )
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/push-bi-report")
async def push_bi_report_artifact(request: BIReportArtifactRequest):
    """Push a BI report artifact to GitHub"""
    if not github_service:
        raise HTTPException(status_code=503, detail="GitHub service not configured")
    
    try:
        result = github_service.push_artifact(
            artifact_type="bi-report",
            filename=f"{request.report_name.lower().replace(' ', '-')}.md",
            content=request.content,
            metadata=request.metadata,
            date=request.date
        )
        
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

