import requests
import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
from config import DATAHUB_API_URL, DATAHUB_API_TOKEN

class DataHubMCPClient:
    """
    MCP Client for DataHub integration to enhance physical workflows with rich metadata
    """
    
    def __init__(self):
        self.datahub_api_url = DATAHUB_API_URL or "http://localhost:8080"
        self.datahub_api_token = DATAHUB_API_TOKEN
        
        if not self.datahub_api_token:
            print("Warning: DATAHUB_API_TOKEN not found in environment variables")
        
        # Set up headers for DataHub API calls
        self.headers = {
            'Authorization': f'Bearer {self.datahub_api_token}',
            'Content-Type': 'application/json'
        } if self.datahub_api_token else {'Content-Type': 'application/json'}
    
    def get_dataset_metadata(self, dataset_urn: str) -> Dict[str, Any]:
        """Get comprehensive dataset metadata from DataHub"""
        try:
            url = f"{self.datahub_api_url}/api/v2/datasets/{dataset_urn}"
            response = requests.get(url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                dataset_data = response.json()
                
                return {
                    "status": "success",
                    "dataset": {
                        "urn": dataset_data.get("urn"),
                        "name": dataset_data.get("name"),
                        "description": dataset_data.get("description"),
                        "platform": dataset_data.get("platform"),
                        "schema": dataset_data.get("schema"),
                        "properties": dataset_data.get("properties", {}),
                        "tags": dataset_data.get("tags", []),
                        "ownership": dataset_data.get("ownership", {}),
                        "lineage": dataset_data.get("lineage", {}),
                        "usage": dataset_data.get("usage", {})
                    },
                    "source": "datahub_api"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to fetch dataset {dataset_urn}: {response.status_code}",
                    "response_text": response.text
                }
        except requests.exceptions.ConnectionError:
            return {
                "status": "error",
                "message": "Failed to connect to DataHub API. Please check if DataHub is running and the API URL is correct."
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def search_datasets(self, query: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Search for datasets in DataHub"""
        try:
            url = f"{self.datahub_api_url}/api/v2/search"
            
            search_request = {
                "input": query,
                "type": "DATASET",
                "start": 0,
                "count": 20
            }
            
            if filters:
                search_request["filters"] = filters
            
            response = requests.post(url, json=search_request, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                search_results = response.json()
                
                return {
                    "status": "success",
                    "results": search_results.get("elements", []),
                    "total": search_results.get("numEntities", 0),
                    "source": "datahub_api"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to search datasets: {response.status_code}",
                    "response_text": response.text
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_business_context(self, entity_urn: str) -> Dict[str, Any]:
        """Get business context for an entity (dataset, table, column)"""
        try:
            # Get entity details
            url = f"{self.datahub_api_url}/api/v2/entities/{entity_urn}"
            response = requests.get(url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                entity_data = response.json()
                
                # Extract business context
                business_context = {
                    "name": entity_data.get("name"),
                    "description": entity_data.get("description"),
                    "tags": entity_data.get("tags", []),
                    "glossary_terms": entity_data.get("glossaryTerms", []),
                    "ownership": entity_data.get("ownership", {}),
                    "properties": entity_data.get("properties", {}),
                    "custom_properties": entity_data.get("customProperties", {})
                }
                
                return {
                    "status": "success",
                    "business_context": business_context,
                    "source": "datahub_api"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to fetch business context for {entity_urn}: {response.status_code}",
                    "response_text": response.text
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_column_metadata(self, dataset_urn: str, column_name: str = None) -> Dict[str, Any]:
        """Get detailed column metadata for a dataset"""
        try:
            # Get dataset schema
            dataset_result = self.get_dataset_metadata(dataset_urn)
            
            if dataset_result["status"] != "success":
                return dataset_result
            
            schema = dataset_result["dataset"].get("schema", {})
            columns = schema.get("fields", [])
            
            if column_name:
                # Get specific column
                column = next((col for col in columns if col.get("fieldPath") == column_name), None)
                if column:
                    return {
                        "status": "success",
                        "column": column,
                        "source": "datahub_api"
                    }
                else:
                    return {
                        "status": "error",
                        "message": f"Column {column_name} not found in dataset {dataset_urn}"
                    }
            else:
                # Get all columns
                return {
                    "status": "success",
                    "columns": columns,
                    "total_columns": len(columns),
                    "source": "datahub_api"
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_data_lineage(self, entity_urn: str) -> Dict[str, Any]:
        """Get data lineage information for an entity"""
        try:
            url = f"{self.datahub_api_url}/api/v2/lineage/{entity_urn}"
            response = requests.get(url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                lineage_data = response.json()
                
                return {
                    "status": "success",
                    "lineage": {
                        "upstream": lineage_data.get("upstream", []),
                        "downstream": lineage_data.get("downstream", []),
                        "relationships": lineage_data.get("relationships", [])
                    },
                    "source": "datahub_api"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to fetch lineage for {entity_urn}: {response.status_code}",
                    "response_text": response.text
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def update_metadata(self, entity_urn: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Update metadata for an entity in DataHub"""
        try:
            url = f"{self.datahub_api_url}/api/v2/entities/{entity_urn}"
            response = requests.post(url, json=metadata, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                return {
                    "status": "success",
                    "message": f"Metadata updated successfully for {entity_urn}",
                    "source": "datahub_api"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to update metadata for {entity_urn}: {response.status_code}",
                    "response_text": response.text
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_glossary_terms(self, query: str = None) -> Dict[str, Any]:
        """Get glossary terms from DataHub"""
        try:
            url = f"{self.datahub_api_url}/api/v2/glossaryTerms"
            
            if query:
                url += f"?search={query}"
            
            response = requests.get(url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                glossary_data = response.json()
                
                return {
                    "status": "success",
                    "terms": glossary_data.get("elements", []),
                    "total": glossary_data.get("numEntities", 0),
                    "source": "datahub_api"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to fetch glossary terms: {response.status_code}",
                    "response_text": response.text
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def get_business_entities(self, entity_type: str = "DATASET") -> Dict[str, Any]:
        """Get business entities of a specific type"""
        try:
            url = f"{self.datahub_api_url}/api/v2/search"
            
            search_request = {
                "input": "*",
                "type": entity_type,
                "start": 0,
                "count": 100
            }
            
            response = requests.post(url, json=search_request, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                search_results = response.json()
                
                return {
                    "status": "success",
                    "entities": search_results.get("elements", []),
                    "total": search_results.get("numEntities", 0),
                    "entity_type": entity_type,
                    "source": "datahub_api"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to fetch {entity_type} entities: {response.status_code}",
                    "response_text": response.text
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}

# Create a global DataHub MCP client instance
datahub_mcp_client = DataHubMCPClient()
