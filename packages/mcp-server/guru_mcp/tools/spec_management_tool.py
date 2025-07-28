"""
Spec Management Tool - Access and query system specifications
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime

class SpecManagementTool:
    """
    Provides access to system specifications defined by users
    """
    
    def __init__(self):
        self.name = "guru_spec_management"
        # Mock specs for testing - in production would connect to actual storage
        self.mock_specs = [
            {
                "id": "spec-api-users",
                "category": "api",
                "name": "User Management API",
                "description": "REST API for user CRUD operations",
                "status": "active",
                "immutable": True,
                "values": {
                    "endpoint": "/api/v1/users",
                    "method": "GET, POST, PUT, DELETE",
                    "request-schema": {
                        "POST": {"name": "string", "email": "string", "role": "string"},
                        "PUT": {"name": "string?", "email": "string?", "role": "string?"}
                    },
                    "response-schema": {
                        "GET": {"users": [{"id": "string", "name": "string", "email": "string"}]},
                        "POST": {"id": "string", "created": "datetime"}
                    },
                    "auth-required": True
                }
            },
            {
                "id": "spec-business-validation",
                "category": "business",
                "name": "User Registration Rules",
                "description": "Business rules for user registration",
                "status": "active",
                "immutable": True,
                "values": {
                    "rule-name": "Age Verification",
                    "condition": "user.age >= 18",
                    "action": "Allow registration",
                    "priority": 1
                }
            },
            {
                "id": "spec-arch-frontend",
                "category": "architecture",
                "name": "Frontend Framework Decision",
                "description": "ADR for choosing React as frontend framework",
                "status": "active",
                "immutable": True,
                "values": {
                    "title": "Use React for Frontend",
                    "status": "accepted",
                    "context": "Need a modern, component-based frontend framework with strong ecosystem",
                    "decision": "We will use React with TypeScript for type safety",
                    "consequences": "Requires team training on React patterns, but provides excellent developer experience"
                }
            }
        ]
    
    async def execute(self, args: Dict[str, Any]) -> str:
        """Execute spec management queries"""
        action = args.get("action", "list")
        
        if action == "list":
            return await self._list_specs(args)
        elif action == "get":
            return await self._get_spec(args)
        elif action == "query":
            return await self._query_specs(args)
        elif action == "get_by_category":
            return await self._get_specs_by_category(args)
        else:
            return f"Unknown action: {action}"
    
    async def _list_specs(self, args: Dict[str, Any]) -> str:
        """List all available specs"""
        result = "## System Specifications\n\n"
        
        # Group by category
        categories = {}
        for spec in self.mock_specs:
            cat = spec["category"]
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(spec)
        
        for category, specs in categories.items():
            result += f"### {category.upper()}\n"
            for spec in specs:
                status_icon = "🔒" if spec.get("immutable") else "📝"
                result += f"- **{spec['name']}** {status_icon} ({spec['status']})\n"
                result += f"  {spec['description']}\n"
            result += "\n"
        
        result += f"\n*Total specs: {len(self.mock_specs)}*"
        return result
    
    async def _get_spec(self, args: Dict[str, Any]) -> str:
        """Get specific spec by ID or name"""
        spec_id = args.get("spec_id")
        spec_name = args.get("spec_name")
        
        if not spec_id and not spec_name:
            return "Error: Must provide either spec_id or spec_name"
        
        # Find spec
        target_spec = None
        for spec in self.mock_specs:
            if (spec_id and spec["id"] == spec_id) or (spec_name and spec["name"] == spec_name):
                target_spec = spec
                break
        
        if not target_spec:
            return f"Spec not found: {spec_id or spec_name}"
        
        # Format spec details
        result = f"## {target_spec['name']}\n"
        result += f"**Category:** {target_spec['category']}\n"
        result += f"**Status:** {target_spec['status']}\n"
        result += f"**Immutable:** {'Yes' if target_spec.get('immutable') else 'No'}\n\n"
        result += f"### Description\n{target_spec['description']}\n\n"
        result += f"### Values\n"
        
        for key, value in target_spec.get("values", {}).items():
            if isinstance(value, dict) or isinstance(value, list):
                result += f"**{key}:**\n```json\n{json.dumps(value, indent=2)}\n```\n"
            else:
                result += f"**{key}:** {value}\n"
        
        return result
    
    async def _query_specs(self, args: Dict[str, Any]) -> str:
        """Query specs with filters"""
        query = args.get("query", "").lower()
        category = args.get("category")
        status = args.get("status")
        immutable = args.get("immutable")
        
        # Filter specs
        filtered = self.mock_specs
        
        if category:
            filtered = [s for s in filtered if s["category"] == category]
        
        if status:
            filtered = [s for s in filtered if s["status"] == status]
        
        if immutable is not None:
            filtered = [s for s in filtered if s.get("immutable", False) == immutable]
        
        if query:
            filtered = [s for s in filtered if 
                       query in s["name"].lower() or 
                       query in s["description"].lower() or
                       any(query in str(v).lower() for v in s.get("values", {}).values())]
        
        # Format results
        if not filtered:
            return "No specs found matching the criteria"
        
        result = f"## Query Results ({len(filtered)} specs)\n\n"
        for spec in filtered:
            result += f"### {spec['name']}\n"
            result += f"- **ID:** {spec['id']}\n"
            result += f"- **Category:** {spec['category']}\n"
            result += f"- **Description:** {spec['description']}\n"
            
            # Show matching values if query was provided
            if query:
                matching_values = []
                for k, v in spec.get("values", {}).items():
                    if query in str(v).lower():
                        matching_values.append(f"{k}: {v}")
                if matching_values:
                    result += f"- **Matching values:** {', '.join(matching_values[:3])}\n"
            
            result += "\n"
        
        return result
    
    async def _get_specs_by_category(self, args: Dict[str, Any]) -> str:
        """Get all specs in a specific category"""
        category = args.get("category")
        if not category:
            return "Error: category parameter required"
        
        specs = [s for s in self.mock_specs if s["category"] == category]
        
        if not specs:
            return f"No specs found in category: {category}"
        
        result = f"## {category.upper()} Specifications\n\n"
        for spec in specs:
            result += f"### {spec['name']}\n"
            result += f"{spec['description']}\n"
            
            # Summary of key values
            if spec.get("values"):
                result += "**Key values:**\n"
                for k, v in list(spec["values"].items())[:3]:
                    if isinstance(v, (dict, list)):
                        result += f"- {k}: [complex value]\n"
                    else:
                        result += f"- {k}: {v}\n"
            result += "\n"
        
        return result