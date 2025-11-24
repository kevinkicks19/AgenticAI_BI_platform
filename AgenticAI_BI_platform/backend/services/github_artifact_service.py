"""
GitHub Artifact Service
Handles pushing markdown artifacts to GitHub repositories
"""
import os
import json
from datetime import datetime
from typing import Dict, Optional, List
from pathlib import Path
import requests
from dotenv import load_dotenv

load_dotenv()


class GitHubArtifactService:
    """Service for managing artifact pushes to GitHub repositories"""
    
    # Repository mappings for different artifact types
    REPOSITORY_MAP = {
        "inception": os.getenv("GITHUB_REPO_INCEPTION", "business-inception-artifacts"),
        "glossary": os.getenv("GITHUB_REPO_GLOSSARY", "business-glossary-artifacts"),
        "metadata": os.getenv("GITHUB_REPO_METADATA", "metadata-objects-artifacts"),
        "data-vault": os.getenv("GITHUB_REPO_DATA_VAULT", "data-vault-artifacts"),
        "bi-report": os.getenv("GITHUB_REPO_BI_REPORTS", "bi-reports-artifacts"),
    }
    
    def __init__(self):
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.github_owner = os.getenv("GITHUB_OWNER", "your-username")  # Your GitHub username/org
        self.base_url = "https://api.github.com"
        
        if not self.github_token:
            raise ValueError("GITHUB_TOKEN environment variable is required")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get GitHub API headers"""
        return {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        }
    
    def _get_repo_path(self, artifact_type: str, filename: str, date: Optional[str] = None) -> str:
        """Generate the file path in the repository based on artifact type"""
        now = datetime.now()
        year = date[:4] if date and len(date) >= 4 else str(now.year)
        month = date[5:7] if date and len(date) >= 7 else f"{now.month:02d}"
        month_name = now.strftime("%B").lower() if not date else datetime.strptime(month, "%m").strftime("%B").lower()
        
        if artifact_type == "inception":
            return f"artifacts/{year}/{month}-{month_name}/{filename}"
        elif artifact_type == "glossary":
            # Extract first letter for alphabetical organization
            first_letter = filename[0].upper() if filename else "A"
            return f"glossary/terms/{first_letter}/{filename}"
        elif artifact_type == "metadata":
            # Determine if CBE or business concept
            if filename.startswith("cbe-") or filename.startswith("hub-") or filename.startswith("link-") or filename.startswith("sat-"):
                category = "cbes" if filename.startswith("cbe-") else filename.split("-")[0] + "s"
            else:
                category = "business-concepts"
            return f"{category}/{filename}"
        elif artifact_type == "data-vault":
            # Organize by type (hub, link, satellite)
            if filename.startswith("hub-"):
                return f"hubs/{filename}"
            elif filename.startswith("link-"):
                return f"links/{filename}"
            elif filename.startswith("sat-"):
                return f"satellites/{filename}"
            else:
                return f"models/{filename}"
        elif artifact_type == "bi-report":
            quarter = f"Q{(now.month - 1) // 3 + 1}" if not date else self._get_quarter(month)
            return f"reports/{year}/{quarter}/{filename}"
        else:
            return f"artifacts/{filename}"
    
    def _get_quarter(self, month: str) -> str:
        """Get quarter from month number"""
        month_num = int(month)
        return f"Q{(month_num - 1) // 3 + 1}"
    
    def _get_file_content(self, repo: str, path: str) -> Optional[Dict]:
        """Get existing file content and SHA for update"""
        url = f"{self.base_url}/repos/{self.github_owner}/{repo}/contents/{path}"
        response = requests.get(url, headers=self._get_headers())
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            return None  # File doesn't exist yet
        else:
            raise Exception(f"Error checking file: {response.status_code} - {response.text}")
    
    def push_artifact(
        self,
        artifact_type: str,
        filename: str,
        content: str,
        metadata: Optional[Dict] = None,
        commit_message: Optional[str] = None,
        date: Optional[str] = None
    ) -> Dict:
        """
        Push an artifact to GitHub
        
        Args:
            artifact_type: Type of artifact (inception, glossary, metadata, data-vault, bi-report)
            filename: Name of the file (e.g., "inception-report-session-abc123-2025-01-15.md")
            content: Markdown content of the artifact
            metadata: Optional metadata to include in frontmatter
            commit_message: Custom commit message
            date: Optional date string (YYYY-MM-DD) for organizing files
        
        Returns:
            Dict with status, file_url, and commit info
        """
        try:
            # Get repository name
            repo = self.REPOSITORY_MAP.get(artifact_type)
            if not repo:
                raise ValueError(f"Unknown artifact type: {artifact_type}")
            
            # Generate file path
            file_path = self._get_repo_path(artifact_type, filename, date)
            
            # Add metadata frontmatter if provided
            if metadata:
                frontmatter = "---\n"
                for key, value in metadata.items():
                    if isinstance(value, list):
                        frontmatter += f"{key}: {json.dumps(value)}\n"
                    elif isinstance(value, dict):
                        frontmatter += f"{key}: {json.dumps(value)}\n"
                    else:
                        frontmatter += f"{key}: {value}\n"
                frontmatter += "---\n\n"
                content = frontmatter + content
            
            # Encode content to base64
            import base64
            encoded_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')
            
            # Check if file exists
            existing_file = self._get_file_content(repo, file_path)
            
            # Prepare commit data
            commit_data = {
                "message": commit_message or f"Add {artifact_type} artifact: {filename}",
                "content": encoded_content,
                "branch": "main"
            }
            
            # If file exists, include SHA for update
            if existing_file:
                commit_data["sha"] = existing_file["sha"]
                commit_data["message"] = commit_message or f"Update {artifact_type} artifact: {filename}"
            
            # Push to GitHub
            url = f"{self.base_url}/repos/{self.github_owner}/{repo}/contents/{file_path}"
            response = requests.put(url, headers=self._get_headers(), json=commit_data)
            
            if response.status_code in [200, 201]:
                result = response.json()
                return {
                    "status": "success",
                    "file_url": result.get("content", {}).get("html_url"),
                    "raw_url": result.get("content", {}).get("download_url"),
                    "sha": result.get("content", {}).get("sha"),
                    "commit": result.get("commit", {}).get("sha"),
                    "message": f"Artifact pushed successfully to {repo}"
                }
            else:
                return {
                    "status": "error",
                    "error": f"GitHub API error: {response.status_code} - {response.text}",
                    "message": f"Failed to push artifact to {repo}"
                }
        
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "message": f"Error pushing artifact: {str(e)}"
            }
    
    def create_inception_artifact(
        self,
        session_id: str,
        content: str,
        workflow_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Create and push an inception artifact"""
        date_str = datetime.now().strftime("%Y-%m-%d")
        filename = f"inception-report-session-{session_id}-{date_str}.md"
        
        artifact_metadata = {
            "title": f"Inception Report - Session {session_id}",
            "session_id": session_id,
            "workflow_id": workflow_id or "unknown",
            "created_at": datetime.now().isoformat(),
            "type": "inception",
            "status": "draft",
            "tags": ["inception", "business-problem", "dad-methodology"]
        }
        
        if metadata:
            artifact_metadata.update(metadata)
        
        return self.push_artifact(
            artifact_type="inception",
            filename=filename,
            content=content,
            metadata=artifact_metadata,
            date=date_str
        )
    
    def create_glossary_artifact(
        self,
        term: str,
        definition: str,
        category: Optional[str] = None,
        related_terms: Optional[List[str]] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Create and push a glossary artifact"""
        filename = f"{term.lower().replace(' ', '-')}.md"
        
        content = f"# {term}\n\n## Definition\n\n{definition}\n\n"
        
        if category:
            content += f"## Category\n\n{category}\n\n"
        
        if related_terms:
            content += "## Related Terms\n\n"
            for rt in related_terms:
                content += f"- [{rt}](../{rt[0].upper()}/{rt.lower().replace(' ', '-')}.md)\n"
            content += "\n"
        
        artifact_metadata = {
            "title": term,
            "term": term,
            "category": category or "general",
            "created_at": datetime.now().isoformat(),
            "type": "glossary",
            "related_terms": related_terms or []
        }
        
        if metadata:
            artifact_metadata.update(metadata)
        
        return self.push_artifact(
            artifact_type="glossary",
            filename=filename,
            content=content,
            metadata=artifact_metadata
        )
    
    def create_metadata_artifact(
        self,
        object_name: str,
        object_type: str,  # "cbe", "business-concept", etc.
        content: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Create and push a metadata object artifact"""
        prefix = "cbe-" if object_type == "cbe" else ""
        filename = f"{prefix}{object_name.lower().replace(' ', '-')}.md"
        
        artifact_metadata = {
            "title": object_name,
            "object_name": object_name,
            "object_type": object_type,
            "created_at": datetime.now().isoformat(),
            "type": "metadata"
        }
        
        if metadata:
            artifact_metadata.update(metadata)
        
        return self.push_artifact(
            artifact_type="metadata",
            filename=filename,
            content=content,
            metadata=artifact_metadata
        )
    
    def create_data_vault_artifact(
        self,
        name: str,
        artifact_type: str,  # "hub", "link", "satellite"
        content: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Create and push a data vault artifact"""
        filename = f"{artifact_type}-{name.lower().replace(' ', '-')}.md"
        
        artifact_metadata = {
            "title": f"{artifact_type.title()} {name}",
            "name": name,
            "type": artifact_type,
            "created_at": datetime.now().isoformat(),
            "data_vault_type": artifact_type
        }
        
        if metadata:
            artifact_metadata.update(metadata)
        
        return self.push_artifact(
            artifact_type="data-vault",
            filename=filename,
            content=content,
            metadata=artifact_metadata
        )


# Example usage
if __name__ == "__main__":
    service = GitHubArtifactService()
    
    # Example: Create an inception artifact
    result = service.create_inception_artifact(
        session_id="abc123",
        content="# Business Problem Inception Report\n\n## Executive Summary\n\n...",
        workflow_id="3Qm6jbbc8jhlZayR"
    )
    print(result)

