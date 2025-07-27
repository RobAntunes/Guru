"""
Active Knowledge Access Tool for MCP
Provides access to only the documents that users have toggled on in their knowledge bases
"""

from typing import Dict, List, Any, Optional
import json
import os
from pathlib import Path
import aiofiles

class ActiveKnowledgeTool:
    """Tool for accessing active documents from knowledge bases"""
    
    def __init__(self):
        # Get the correct storage path
        self.storage_base = Path.home() / ".guru" / "knowledge_bases"
        self.storage_base.mkdir(parents=True, exist_ok=True)
    
    async def execute(self, 
                     action: str,
                     knowledge_base_id: Optional[str] = None,
                     include_content: bool = False,
                     group_id: Optional[str] = None,
                     **kwargs) -> Dict[str, Any]:
        """
        Execute knowledge base queries
        
        Actions:
        - list_bases: List all available knowledge bases
        - get_active_documents: Get all active documents from a knowledge base
        - get_group_structure: Get the group hierarchy with active document counts
        - get_document: Get a specific active document by ID
        """
        
        if action == "list_bases":
            return await self._list_knowledge_bases()
        
        elif action == "get_active_documents":
            if not knowledge_base_id:
                return {"error": "knowledge_base_id required"}
            return await self._get_active_documents(knowledge_base_id, include_content, group_id)
        
        elif action == "get_group_structure":
            if not knowledge_base_id:
                return {"error": "knowledge_base_id required"}
            return await self._get_group_structure(knowledge_base_id)
        
        elif action == "get_document":
            if not knowledge_base_id or not kwargs.get("document_id"):
                return {"error": "knowledge_base_id and document_id required"}
            return await self._get_document(knowledge_base_id, kwargs["document_id"])
        
        else:
            return {"error": f"Unknown action: {action}"}
    
    async def _list_knowledge_bases(self) -> Dict[str, Any]:
        """List all available knowledge bases"""
        try:
            bases = []
            
            if self.storage_base.exists():
                for kb_dir in self.storage_base.iterdir():
                    if kb_dir.is_dir():
                        metadata_path = kb_dir / "metadata.json"
                        if metadata_path.exists():
                            async with aiofiles.open(metadata_path, 'r') as f:
                                metadata = json.loads(await f.read())
                                
                            # Count active documents
                            groups_path = kb_dir / "groups.json"
                            active_count = 0
                            total_count = 0
                            
                            if groups_path.exists():
                                async with aiofiles.open(groups_path, 'r') as f:
                                    groups = json.loads(await f.read())
                                    for group in groups:
                                        for doc in group.get("documents", []):
                                            total_count += 1
                                            if doc.get("membership", {}).get("isActive", False):
                                                active_count += 1
                            
                            bases.append({
                                "id": metadata["id"],
                                "name": metadata["name"],
                                "description": metadata.get("description", ""),
                                "created_at": metadata.get("createdAt"),
                                "updated_at": metadata.get("updatedAt"),
                                "active_documents": active_count,
                                "total_documents": total_count
                            })
            
            return {
                "knowledge_bases": bases,
                "count": len(bases)
            }
            
        except Exception as e:
            return {"error": f"Failed to list knowledge bases: {str(e)}"}
    
    async def _get_active_documents(self, kb_id: str, include_content: bool, group_id: Optional[str]) -> Dict[str, Any]:
        """Get all active documents from a knowledge base"""
        try:
            kb_path = self.storage_base / kb_id
            groups_path = kb_path / "groups.json"
            
            if not groups_path.exists():
                return {"error": "Knowledge base not found"}
            
            async with aiofiles.open(groups_path, 'r') as f:
                groups = json.loads(await f.read())
            
            active_documents = []
            
            for group in groups:
                # Skip if filtering by group and this isn't the right group
                if group_id and group["id"] != group_id:
                    continue
                
                for doc_ref in group.get("documents", []):
                    if doc_ref.get("membership", {}).get("isActive", False):
                        doc_info = {
                            "id": doc_ref["doc"]["id"],
                            "title": doc_ref["doc"]["title"],
                            "type": doc_ref["doc"]["type"],
                            "group_id": group["id"],
                            "group_name": group["name"],
                            "added_at": doc_ref["membership"]["addedAt"]
                        }
                        
                        # Include content if requested
                        if include_content:
                            doc_path = kb_path / "documents" / f"{doc_ref['doc']['id']}.json"
                            if doc_path.exists():
                                async with aiofiles.open(doc_path, 'r') as f:
                                    doc_data = json.loads(await f.read())
                                    doc_info["content"] = doc_data.get("content", "")
                                    doc_info["metadata"] = doc_data.get("metadata", {})
                        
                        active_documents.append(doc_info)
            
            return {
                "documents": active_documents,
                "count": len(active_documents),
                "knowledge_base_id": kb_id,
                "filtered_by_group": group_id is not None
            }
            
        except Exception as e:
            return {"error": f"Failed to get active documents: {str(e)}"}
    
    async def _get_group_structure(self, kb_id: str) -> Dict[str, Any]:
        """Get group hierarchy with active document information"""
        try:
            kb_path = self.storage_base / kb_id
            groups_path = kb_path / "groups.json"
            
            if not groups_path.exists():
                return {"error": "Knowledge base not found"}
            
            async with aiofiles.open(groups_path, 'r') as f:
                groups = json.loads(await f.read())
            
            group_structure = []
            
            for group in groups:
                active_count = sum(
                    1 for doc in group.get("documents", [])
                    if doc.get("membership", {}).get("isActive", False)
                )
                
                group_info = {
                    "id": group["id"],
                    "name": group["name"],
                    "parent_id": group.get("parentId"),
                    "total_documents": len(group.get("documents", [])),
                    "active_documents": active_count,
                    "created_at": group.get("createdAt"),
                    "is_expanded": group.get("isExpanded", True)
                }
                
                # Add nested groups recursively
                if "groups" in group:
                    group_info["subgroups"] = self._process_nested_groups(group["groups"])
                
                group_structure.append(group_info)
            
            return {
                "groups": group_structure,
                "knowledge_base_id": kb_id
            }
            
        except Exception as e:
            return {"error": f"Failed to get group structure: {str(e)}"}
    
    def _process_nested_groups(self, groups: List[Dict]) -> List[Dict]:
        """Process nested groups recursively"""
        result = []
        for group in groups:
            active_count = sum(
                1 for doc in group.get("documents", [])
                if doc.get("membership", {}).get("isActive", False)
            )
            
            group_info = {
                "id": group["id"],
                "name": group["name"],
                "total_documents": len(group.get("documents", [])),
                "active_documents": active_count,
                "is_expanded": group.get("isExpanded", True)
            }
            
            if "groups" in group:
                group_info["subgroups"] = self._process_nested_groups(group["groups"])
            
            result.append(group_info)
        
        return result
    
    async def _get_document(self, kb_id: str, document_id: str) -> Dict[str, Any]:
        """Get a specific document if it's active"""
        try:
            kb_path = self.storage_base / kb_id
            groups_path = kb_path / "groups.json"
            
            if not groups_path.exists():
                return {"error": "Knowledge base not found"}
            
            async with aiofiles.open(groups_path, 'r') as f:
                groups = json.loads(await f.read())
            
            # Find the document in groups
            for group in groups:
                for doc_ref in group.get("documents", []):
                    if doc_ref["doc"]["id"] == document_id:
                        if not doc_ref.get("membership", {}).get("isActive", False):
                            return {"error": "Document is not active"}
                        
                        # Load document content
                        doc_path = kb_path / "documents" / f"{document_id}.json"
                        if doc_path.exists():
                            async with aiofiles.open(doc_path, 'r') as f:
                                doc_data = json.loads(await f.read())
                            
                            return {
                                "document": {
                                    "id": document_id,
                                    "title": doc_ref["doc"]["title"],
                                    "type": doc_ref["doc"]["type"],
                                    "content": doc_data.get("content", ""),
                                    "metadata": doc_data.get("metadata", {}),
                                    "group_id": group["id"],
                                    "group_name": group["name"]
                                }
                            }
                        else:
                            return {"error": "Document file not found"}
            
            return {"error": "Document not found in any group"}
            
        except Exception as e:
            return {"error": f"Failed to get document: {str(e)}"}

# Initialize the tool
active_knowledge_tool = ActiveKnowledgeTool()