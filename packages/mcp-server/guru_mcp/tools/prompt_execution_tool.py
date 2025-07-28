"""
Prompt Execution Tool - Execute and manage prompt templates
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime
import re

class PromptExecutionTool:
    """
    Provides prompt template execution and management capabilities
    """
    
    def __init__(self):
        self.name = "guru_prompt_execution"
        # Mock prompt templates for testing - in production would connect to actual storage
        self.mock_templates = [
            {
                "id": "prompt-analysis-1",
                "name": "Code Analysis",
                "category": "analysis",
                "content": "Analyze the following {{language}} code:\n\n```{{language}}\n{{code}}\n```\n\nFocus on:\n{{#if checkPatterns}}- Design patterns{{/if}}\n{{#if checkPerformance}}- Performance{{/if}}\n{{#if checkSecurity}}- Security{{/if}}",
                "variables": [
                    {"id": "language", "type": "select", "options": ["python", "javascript", "typescript"]},
                    {"id": "code", "type": "text"},
                    {"id": "checkPatterns", "type": "boolean", "defaultValue": True},
                    {"id": "checkPerformance", "type": "boolean", "defaultValue": True},
                    {"id": "checkSecurity", "type": "boolean", "defaultValue": False}
                ]
            },
            {
                "id": "prompt-synthesis-1",
                "name": "Document Synthesis",
                "category": "synthesis",
                "content": "Synthesize insights from:\n\n{{documents}}\n\nUsing framework: {{framework}}\n{{#if specificFocus}}Focus: {{focusArea}}{{/if}}",
                "variables": [
                    {"id": "documents", "type": "text"},
                    {"id": "framework", "type": "select", "options": ["SCAMPER", "Gap Analysis", "SWOT"]},
                    {"id": "specificFocus", "type": "boolean", "defaultValue": False},
                    {"id": "focusArea", "type": "text"}
                ]
            }
        ]
    
    async def execute(self, args: Dict[str, Any]) -> str:
        """Execute prompt template operations"""
        action = args.get("action", "list")
        
        if action == "list":
            return await self._list_templates(args)
        elif action == "get":
            return await self._get_template(args)
        elif action == "resolve":
            return await self._resolve_template(args)
        elif action == "execute":
            return await self._execute_prompt(args)
        elif action == "validate":
            return await self._validate_variables(args)
        else:
            return f"Unknown action: {action}"
    
    async def _list_templates(self, args: Dict[str, Any]) -> str:
        """List available prompt templates"""
        category = args.get("category")
        
        templates = self.mock_templates
        if category:
            templates = [t for t in templates if t["category"] == category]
        
        result = "## Available Prompt Templates\n\n"
        
        # Group by category
        categories = {}
        for template in templates:
            cat = template["category"]
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(template)
        
        for category, temps in categories.items():
            result += f"### {category.upper()}\n"
            for template in temps:
                result += f"- **{template['name']}** (ID: {template['id']})\n"
                result += f"  Variables: {', '.join([v['id'] for v in template['variables']])}\n"
            result += "\n"
        
        return result
    
    async def _get_template(self, args: Dict[str, Any]) -> str:
        """Get specific template details"""
        template_id = args.get("template_id")
        template_name = args.get("template_name")
        
        if not template_id and not template_name:
            return "Error: Must provide either template_id or template_name"
        
        # Find template
        target_template = None
        for template in self.mock_templates:
            if (template_id and template["id"] == template_id) or \
               (template_name and template["name"] == template_name):
                target_template = template
                break
        
        if not target_template:
            return f"Template not found: {template_id or template_name}"
        
        # Format template details
        result = f"## {target_template['name']}\n"
        result += f"**Category:** {target_template['category']}\n"
        result += f"**ID:** {target_template['id']}\n\n"
        result += f"### Template Content\n```\n{target_template['content']}\n```\n\n"
        result += f"### Variables\n"
        
        for var in target_template['variables']:
            result += f"- **{var['id']}** ({var['type']})"
            if 'options' in var:
                result += f" - Options: {', '.join(var['options'])}"
            if 'defaultValue' in var:
                result += f" - Default: {var['defaultValue']}"
            result += "\n"
        
        return result
    
    async def _resolve_template(self, args: Dict[str, Any]) -> str:
        """Resolve template with provided variables"""
        template_id = args.get("template_id")
        variables = args.get("variables", {})
        
        if not template_id:
            return "Error: template_id required"
        
        # Find template
        template = None
        for t in self.mock_templates:
            if t["id"] == template_id:
                template = t
                break
        
        if not template:
            return f"Template not found: {template_id}"
        
        # Resolve template
        resolved = self._resolve_template_content(template["content"], variables)
        
        result = f"## Resolved Prompt\n\n"
        result += f"Template: {template['name']}\n"
        result += f"Variables: {json.dumps(variables, indent=2)}\n\n"
        result += f"### Resolved Content\n```\n{resolved}\n```\n"
        
        # Estimate tokens (rough approximation)
        token_count = len(resolved.split()) * 1.3
        result += f"\n*Estimated tokens: {int(token_count)}*"
        
        return result
    
    def _resolve_template_content(self, content: str, variables: Dict[str, Any]) -> str:
        """Resolve template placeholders with variables"""
        resolved = content
        
        # Simple variable replacement
        for key, value in variables.items():
            resolved = resolved.replace(f"{{{{{key}}}}}", str(value))
        
        # Handle conditionals (basic implementation)
        # {{#if variable}}content{{/if}}
        if_pattern = r'\{\{#if\s+(\w+)\}\}(.*?)\{\{/if\}\}'
        def replace_if(match):
            var_name = match.group(1)
            content = match.group(2)
            if variables.get(var_name):
                return content
            return ""
        
        resolved = re.sub(if_pattern, replace_if, resolved, flags=re.DOTALL)
        
        # Clean up any remaining placeholders
        resolved = re.sub(r'\{\{[^}]+\}\}', '', resolved)
        
        return resolved.strip()
    
    async def _execute_prompt(self, args: Dict[str, Any]) -> str:
        """Execute a prompt (simulate execution)"""
        template_id = args.get("template_id")
        variables = args.get("variables", {})
        
        if not template_id:
            return "Error: template_id required"
        
        # Find and resolve template
        template = None
        for t in self.mock_templates:
            if t["id"] == template_id:
                template = t
                break
        
        if not template:
            return f"Template not found: {template_id}"
        
        resolved = self._resolve_template_content(template["content"], variables)
        
        # In production, this would actually execute the prompt
        result = f"## Prompt Execution\n\n"
        result += f"**Template:** {template['name']}\n"
        result += f"**Status:** Ready to execute\n\n"
        result += f"### Resolved Prompt\n```\n{resolved}\n```\n\n"
        result += f"### Execution Instructions\n"
        result += f"1. Copy the resolved prompt above\n"
        result += f"2. Send to AI model with appropriate context\n"
        result += f"3. Process response according to template category ({template['category']})\n"
        
        return result
    
    async def _validate_variables(self, args: Dict[str, Any]) -> str:
        """Validate variables against template requirements"""
        template_id = args.get("template_id")
        variables = args.get("variables", {})
        
        if not template_id:
            return "Error: template_id required"
        
        # Find template
        template = None
        for t in self.mock_templates:
            if t["id"] == template_id:
                template = t
                break
        
        if not template:
            return f"Template not found: {template_id}"
        
        # Validate variables
        errors = []
        warnings = []
        
        for var_def in template['variables']:
            var_id = var_def['id']
            var_type = var_def['type']
            
            if var_id not in variables:
                if var_def.get('required', True) and 'defaultValue' not in var_def:
                    errors.append(f"Missing required variable: {var_id}")
                elif 'defaultValue' in var_def:
                    warnings.append(f"Using default for {var_id}: {var_def['defaultValue']}")
                continue
            
            # Type validation
            value = variables[var_id]
            if var_type == 'select' and 'options' in var_def:
                if value not in var_def['options']:
                    errors.append(f"{var_id}: Invalid option '{value}'. Must be one of: {', '.join(var_def['options'])}")
            elif var_type == 'boolean':
                if not isinstance(value, bool):
                    errors.append(f"{var_id}: Must be boolean, got {type(value).__name__}")
        
        # Check for unknown variables
        template_vars = {v['id'] for v in template['variables']}
        provided_vars = set(variables.keys())
        unknown = provided_vars - template_vars
        if unknown:
            warnings.append(f"Unknown variables will be ignored: {', '.join(unknown)}")
        
        # Format result
        result = f"## Variable Validation\n\n"
        result += f"Template: {template['name']}\n\n"
        
        if errors:
            result += "### ❌ Errors\n"
            for error in errors:
                result += f"- {error}\n"
            result += "\n"
        
        if warnings:
            result += "### ⚠️ Warnings\n"
            for warning in warnings:
                result += f"- {warning}\n"
            result += "\n"
        
        if not errors:
            result += "### ✅ Validation Passed\n"
            result += "All required variables are present and valid.\n"
        
        return result