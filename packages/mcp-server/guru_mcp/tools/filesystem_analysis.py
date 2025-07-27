"""
Filesystem Analysis Tool - Direct analysis of files and folders on disk using Guru's cognitive systems
"""

import asyncio
import os
import mimetypes
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from loguru import logger
import hashlib
import json


class FilesystemAnalysisTool:
    """
    Analyze files and folders directly from disk using Guru's cognitive enhancement capabilities
    """
    
    def __init__(self, core_bridge, phi4_wingman):
        self.core_bridge = core_bridge
        self.phi4_wingman = phi4_wingman
        self.name = "guru_analyze_filesystem"
        
        # Supported file types for analysis
        self.supported_extensions = {
            # Code files
            'code': {'.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss', '.java', '.cpp', '.c', '.h', 
                    '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.dart', '.vue', '.svelte', '.elm'},
            # Documentation
            'docs': {'.md', '.txt', '.rst', '.asciidoc', '.org', '.tex', '.rtf'},
            # Configuration
            'config': {'.json', '.yaml', '.yml', '.toml', '.ini', '.conf', '.cfg', '.env', '.properties'},
            # Data files
            'data': {'.csv', '.tsv', '.json', '.xml', '.sql', '.jsonl', '.parquet'},
            # Build/package files
            'build': {'Dockerfile', 'Makefile', 'CMakeLists.txt', '.dockerfile', '.make', '.cmake'}
        }
        
        # Security: Allowed analysis directories (can be configured)
        self.allowed_paths = {
            os.path.expanduser('~/Documents'),
            os.path.expanduser('~/Desktop'), 
            os.path.expanduser('~/Downloads'),
            '/Users/boss/Documents/projects',  # User's project directory
            '/tmp',
            '/var/tmp'
        }
        
        # Maximum file size for analysis (10MB)
        self.max_file_size = 10 * 1024 * 1024
        
        # Maximum files to analyze in single request
        self.max_files_per_request = 50
        
    async def execute(self, args: Dict[str, Any]) -> str:
        """Execute filesystem analysis on specified path"""
        target_path = args.get("target_path", "")
        analysis_depth = args.get("analysis_depth", "moderate")
        file_types = args.get("file_types", ["code", "docs", "config"])
        recursive = args.get("recursive", True)
        include_hidden = args.get("include_hidden", False)
        
        if not target_path:
            return "## Error\n\nNo target path provided for filesystem analysis"
            
        try:
            # Security validation
            if not self._is_path_allowed(target_path):
                return f"## Error\n\nPath '{target_path}' is not in allowed directories for security reasons"
            
            # Path validation
            path_obj = Path(target_path).resolve()
            if not path_obj.exists():
                return f"## Error\n\nPath '{target_path}' does not exist"
            
            logger.info(f"🔍 Analyzing filesystem path: {target_path}")
            
            # Perform filesystem analysis
            analysis_result = await self._analyze_filesystem(
                path_obj, analysis_depth, file_types, recursive, include_hidden
            )
            
            # Format results
            return self._format_filesystem_analysis(analysis_result, target_path, analysis_depth)
            
        except Exception as e:
            logger.error(f"Filesystem analysis failed: {e}")
            return f"## Error\n\nFilesystem analysis failed: {str(e)}"
    
    def _is_path_allowed(self, target_path: str) -> bool:
        """Check if path is within allowed directories for security"""
        try:
            resolved_path = Path(target_path).resolve()
            
            # Check against allowed paths
            for allowed_path in self.allowed_paths:
                allowed_resolved = Path(allowed_path).resolve()
                try:
                    resolved_path.relative_to(allowed_resolved)
                    return True
                except ValueError:
                    continue
            
            return False
            
        except Exception as e:
            logger.warning(f"Path validation error: {e}")
            return False
    
    async def _analyze_filesystem(self, path_obj: Path, analysis_depth: str, file_types: List[str], recursive: bool, include_hidden: bool) -> Dict[str, Any]:
        """Perform comprehensive filesystem analysis"""
        
        start_time = asyncio.get_event_loop().time()
        
        # Discover files and directories
        discovery_result = await self._discover_filesystem_structure(
            path_obj, file_types, recursive, include_hidden
        )
        
        # Analyze individual files
        file_analyses = await self._analyze_files(
            discovery_result["files"], analysis_depth
        )
        
        # Analyze directory structure
        structure_analysis = await self._analyze_directory_structure(
            discovery_result["directories"], discovery_result["files"]
        )
        
        # Perform cognitive synthesis using Guru systems
        cognitive_insights = await self._generate_cognitive_insights(
            file_analyses, structure_analysis, analysis_depth
        )
        
        # Generate recommendations
        recommendations = await self._generate_filesystem_recommendations(
            file_analyses, structure_analysis, cognitive_insights
        )
        
        processing_time = asyncio.get_event_loop().time() - start_time
        
        return {
            "discovery_result": discovery_result,
            "file_analyses": file_analyses,
            "structure_analysis": structure_analysis,
            "cognitive_insights": cognitive_insights,
            "recommendations": recommendations,
            "analysis_metadata": {
                "analysis_depth": analysis_depth,
                "processing_time_seconds": processing_time,
                "files_analyzed": len(file_analyses),
                "total_files_found": len(discovery_result["files"]),
                "directories_scanned": len(discovery_result["directories"])
            }
        }
    
    async def _discover_filesystem_structure(self, path_obj: Path, file_types: List[str], recursive: bool, include_hidden: bool) -> Dict[str, Any]:
        """Discover and catalog filesystem structure"""
        
        files = []
        directories = []
        
        # Get relevant file extensions
        relevant_extensions = set()
        for file_type in file_types:
            if file_type in self.supported_extensions:
                relevant_extensions.update(self.supported_extensions[file_type])
        
        def should_analyze_file(file_path: Path) -> bool:
            # Check hidden files
            if not include_hidden and file_path.name.startswith('.'):
                return False
            
            # Check file size
            try:
                if file_path.stat().st_size > self.max_file_size:
                    return False
            except OSError:
                return False
            
            # Check extension or special files
            return (file_path.suffix.lower() in relevant_extensions or 
                    file_path.name in self.supported_extensions['build'])
        
        def scan_directory(dir_path: Path, current_depth: int = 0):
            try:
                directories.append({
                    "path": str(dir_path),
                    "name": dir_path.name,
                    "depth": current_depth,
                    "is_hidden": dir_path.name.startswith('.')
                })
                
                for item in dir_path.iterdir():
                    # Skip hidden items if not requested
                    if not include_hidden and item.name.startswith('.'):
                        continue
                    
                    if item.is_file() and should_analyze_file(item):
                        file_info = self._get_file_info(item)
                        if file_info:
                            files.append(file_info)
                            
                        # Limit number of files
                        if len(files) >= self.max_files_per_request:
                            break
                    
                    elif item.is_dir() and recursive and current_depth < 10:  # Limit recursion depth
                        scan_directory(item, current_depth + 1)
                        
            except PermissionError:
                logger.warning(f"Permission denied accessing: {dir_path}")
            except Exception as e:
                logger.warning(f"Error scanning directory {dir_path}: {e}")
        
        if path_obj.is_file():
            # Single file analysis
            if should_analyze_file(path_obj):
                file_info = self._get_file_info(path_obj)
                if file_info:
                    files.append(file_info)
        else:
            # Directory analysis
            scan_directory(path_obj)
        
        return {
            "files": files,
            "directories": directories,
            "total_files_found": len(files),
            "total_size_bytes": sum(f["size_bytes"] for f in files),
            "file_type_distribution": self._calculate_file_type_distribution(files)
        }
    
    def _get_file_info(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Extract comprehensive file information"""
        try:
            stat_result = file_path.stat()
            
            # Determine file category
            file_category = "unknown"
            for category, extensions in self.supported_extensions.items():
                if file_path.suffix.lower() in extensions or file_path.name in extensions:
                    file_category = category
                    break
            
            # Get MIME type
            mime_type, _ = mimetypes.guess_type(str(file_path))
            
            return {
                "path": str(file_path),
                "name": file_path.name,
                "suffix": file_path.suffix.lower(),
                "category": file_category,
                "size_bytes": stat_result.st_size,
                "modified_time": stat_result.st_mtime,
                "mime_type": mime_type,
                "is_hidden": file_path.name.startswith('.'),
                "parent_directory": str(file_path.parent),
                "depth": len(file_path.parts) - len(Path(file_path.parts[0]).parts)
            }
            
        except Exception as e:
            logger.warning(f"Error getting file info for {file_path}: {e}")
            return None
    
    def _calculate_file_type_distribution(self, files: List[Dict[str, Any]]) -> Dict[str, int]:
        """Calculate distribution of file types"""
        distribution = {}
        for file_info in files:
            category = file_info["category"]
            distribution[category] = distribution.get(category, 0) + 1
        return distribution
    
    async def _analyze_files(self, files: List[Dict[str, Any]], analysis_depth: str) -> List[Dict[str, Any]]:
        """Analyze individual files using Guru's cognitive systems"""
        
        file_analyses = []
        
        # Analyze files in batches to avoid overwhelming the system
        batch_size = 5
        for i in range(0, len(files), batch_size):
            batch = files[i:i + batch_size]
            
            batch_analyses = await asyncio.gather(
                *[self._analyze_single_file(file_info, analysis_depth) for file_info in batch],
                return_exceptions=True
            )
            
            for analysis in batch_analyses:
                if isinstance(analysis, Exception):
                    logger.warning(f"File analysis failed: {analysis}")
                else:
                    file_analyses.append(analysis)
            
            # Small delay between batches
            await asyncio.sleep(0.1)
        
        return file_analyses
    
    async def _analyze_single_file(self, file_info: Dict[str, Any], analysis_depth: str) -> Dict[str, Any]:
        """Analyze a single file using appropriate Guru cognitive systems"""
        
        file_path = Path(file_info["path"])
        
        try:
            # Read file content (with size limit)
            content = ""
            if file_info["size_bytes"] <= self.max_file_size:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
            
            # Choose analysis approach based on file category
            if file_info["category"] == "code":
                analysis = await self._analyze_code_file(file_info, content, analysis_depth)
            elif file_info["category"] == "docs":
                analysis = await self._analyze_documentation_file(file_info, content, analysis_depth)
            elif file_info["category"] == "config":
                analysis = await self._analyze_configuration_file(file_info, content, analysis_depth)
            elif file_info["category"] == "data":
                analysis = await self._analyze_data_file(file_info, content, analysis_depth)
            else:
                analysis = await self._analyze_generic_file(file_info, content, analysis_depth)
            
            # Add file metadata to analysis
            analysis["file_info"] = file_info
            analysis["content_preview"] = content[:200] + "..." if len(content) > 200 else content
            
            return analysis
            
        except Exception as e:
            logger.warning(f"Error analyzing file {file_path}: {e}")
            return {
                "file_info": file_info,
                "analysis_status": "error",
                "error_message": str(e),
                "insights": [],
                "recommendations": []
            }
    
    async def _analyze_code_file(self, file_info: Dict[str, Any], content: str, analysis_depth: str) -> Dict[str, Any]:
        """Analyze code files using harmonic analysis and task evolution"""
        
        # Use harmonic analysis for code structure
        harmonic_result = await self.core_bridge.invoke_harmonic_analyzer(content, analysis_depth)
        
        # Specific code analysis
        code_metrics = self._calculate_code_metrics(content, file_info["suffix"])
        
        insights = [
            f"Code file exhibits {harmonic_result.get('harmonic_patterns', ['structural'])[0]} patterns",
            f"Complexity level: {code_metrics['complexity_level']}",
            f"Lines of code: {code_metrics['lines_of_code']}"
        ]
        
        if code_metrics['functions_count'] > 0:
            insights.append(f"Contains {code_metrics['functions_count']} functions/methods")
        
        recommendations = []
        if code_metrics['complexity_level'] == 'high':
            recommendations.append({
                "type": "code_optimization",
                "title": "Reduce Code Complexity",
                "description": "Consider breaking down complex functions into smaller, more manageable pieces",
                "priority": "medium"
            })
        
        return {
            "analysis_type": "code_analysis",
            "harmonic_analysis": harmonic_result,
            "code_metrics": code_metrics,
            "insights": insights,
            "recommendations": recommendations,
            "analysis_confidence": 0.85
        }
    
    async def _analyze_documentation_file(self, file_info: Dict[str, Any], content: str, analysis_depth: str) -> Dict[str, Any]:
        """Analyze documentation files using quantum synthesis"""
        
        # Use quantum synthesis for cross-referential analysis
        synthesis_result = await self.core_bridge.invoke_quantum_synthesizer(
            f"Analyze documentation structure and content coherence", [content[:1000]]
        )
        
        doc_metrics = self._calculate_documentation_metrics(content)
        
        insights = [
            f"Documentation exhibits {synthesis_result.get('interference_patterns', ['structural'])[0]} organizational patterns",
            f"Content length: {doc_metrics['word_count']} words",
            f"Structure level: {doc_metrics['structure_level']}"
        ]
        
        recommendations = []
        if doc_metrics['structure_level'] == 'minimal':
            recommendations.append({
                "type": "documentation_improvement",
                "title": "Enhance Document Structure",
                "description": "Add headings and sections to improve readability and navigation",
                "priority": "medium"
            })
        
        return {
            "analysis_type": "documentation_analysis",
            "synthesis_analysis": synthesis_result,
            "doc_metrics": doc_metrics,
            "insights": insights,
            "recommendations": recommendations,
            "analysis_confidence": 0.80
        }
    
    async def _analyze_configuration_file(self, file_info: Dict[str, Any], content: str, analysis_depth: str) -> Dict[str, Any]:
        """Analyze configuration files using adaptive learning"""
        
        config_metrics = self._analyze_configuration_structure(content, file_info["suffix"])
        
        insights = [
            f"Configuration contains {config_metrics['settings_count']} settings",
            f"Configuration type: {config_metrics['config_type']}",
            f"Complexity: {config_metrics['nesting_level']} levels deep"
        ]
        
        recommendations = []
        if config_metrics['has_sensitive_data']:
            recommendations.append({
                "type": "security",
                "title": "Review Sensitive Data",
                "description": "Configuration may contain sensitive information - ensure proper security measures",
                "priority": "high"
            })
        
        return {
            "analysis_type": "configuration_analysis",
            "config_metrics": config_metrics,
            "insights": insights,
            "recommendations": recommendations,
            "analysis_confidence": 0.75
        }
    
    async def _analyze_data_file(self, file_info: Dict[str, Any], content: str, analysis_depth: str) -> Dict[str, Any]:
        """Analyze data files using pattern recognition"""
        
        data_metrics = self._analyze_data_structure(content, file_info["suffix"])
        
        insights = [
            f"Data file contains {data_metrics['estimated_records']} estimated records",
            f"Data format: {data_metrics['format_type']}",
            f"Column count: {data_metrics.get('column_count', 'N/A')}"
        ]
        
        return {
            "analysis_type": "data_analysis",
            "data_metrics": data_metrics,
            "insights": insights,
            "recommendations": [],
            "analysis_confidence": 0.70
        }
    
    async def _analyze_generic_file(self, file_info: Dict[str, Any], content: str, analysis_depth: str) -> Dict[str, Any]:
        """Generic file analysis"""
        
        generic_metrics = {
            "character_count": len(content),
            "line_count": content.count('\n') + 1 if content else 0,
            "word_count": len(content.split()) if content else 0
        }
        
        insights = [
            f"File contains {generic_metrics['character_count']} characters",
            f"Text has {generic_metrics['line_count']} lines"
        ]
        
        return {
            "analysis_type": "generic_analysis",
            "generic_metrics": generic_metrics,
            "insights": insights,
            "recommendations": [],
            "analysis_confidence": 0.60
        }
    
    def _calculate_code_metrics(self, content: str, file_extension: str) -> Dict[str, Any]:
        """Calculate code-specific metrics"""
        
        lines = content.split('\n')
        code_lines = [line for line in lines if line.strip() and not line.strip().startswith('#')]
        
        # Count functions/methods (basic heuristic)
        functions_count = 0
        if file_extension in ['.py']:
            functions_count = content.count('def ')
        elif file_extension in ['.js', '.ts']:
            functions_count = content.count('function ') + content.count('=> ')
        elif file_extension in ['.java', '.cpp', '.c']:
            functions_count = len([line for line in lines if '(' in line and '{' in line])
        
        # Complexity estimation
        complexity_indicators = content.count('if ') + content.count('for ') + content.count('while ') + content.count('switch ')
        
        if complexity_indicators > 20:
            complexity_level = 'high'
        elif complexity_indicators > 5:
            complexity_level = 'medium'
        else:
            complexity_level = 'low'
        
        return {
            "lines_of_code": len(code_lines),
            "total_lines": len(lines),
            "functions_count": functions_count,
            "complexity_indicators": complexity_indicators,
            "complexity_level": complexity_level
        }
    
    def _calculate_documentation_metrics(self, content: str) -> Dict[str, Any]:
        """Calculate documentation-specific metrics"""
        
        word_count = len(content.split())
        lines = content.split('\n')
        
        # Count headers (markdown style)
        headers = [line for line in lines if line.strip().startswith('#')]
        
        # Structure level estimation
        if len(headers) > 5:
            structure_level = 'well_structured'
        elif len(headers) > 2:
            structure_level = 'moderately_structured'  
        else:
            structure_level = 'minimal'
        
        return {
            "word_count": word_count,
            "line_count": len(lines),
            "headers_count": len(headers),
            "structure_level": structure_level
        }
    
    def _analyze_configuration_structure(self, content: str, file_extension: str) -> Dict[str, Any]:
        """Analyze configuration file structure"""
        
        settings_count = 0
        nesting_level = 0
        has_sensitive_data = False
        config_type = "unknown"
        
        if file_extension in ['.json']:
            config_type = "json"
            try:
                data = json.loads(content)
                settings_count = self._count_json_keys(data)
                nesting_level = self._get_json_depth(data)
            except:
                pass
        elif file_extension in ['.yaml', '.yml']:
            config_type = "yaml"
            settings_count = content.count(':')
            nesting_level = max(len(line) - len(line.lstrip()) for line in content.split('\n') if line.strip()) // 2
        elif file_extension in ['.ini', '.cfg']:
            config_type = "ini"
            settings_count = content.count('=')
            nesting_level = 1
        
        # Check for sensitive data patterns
        sensitive_patterns = ['password', 'secret', 'key', 'token', 'api_key', 'private']
        has_sensitive_data = any(pattern in content.lower() for pattern in sensitive_patterns)
        
        return {
            "config_type": config_type,
            "settings_count": settings_count,
            "nesting_level": nesting_level,
            "has_sensitive_data": has_sensitive_data
        }
    
    def _count_json_keys(self, data: Any) -> int:
        """Recursively count JSON keys"""
        if isinstance(data, dict):
            return len(data) + sum(self._count_json_keys(v) for v in data.values())
        elif isinstance(data, list):
            return sum(self._count_json_keys(item) for item in data)
        else:
            return 0
    
    def _get_json_depth(self, data: Any, current_depth: int = 0) -> int:
        """Get maximum depth of JSON structure"""
        if isinstance(data, dict):
            if not data:
                return current_depth
            return max(self._get_json_depth(v, current_depth + 1) for v in data.values())
        elif isinstance(data, list):
            if not data:
                return current_depth
            return max(self._get_json_depth(item, current_depth + 1) for item in data)
        else:
            return current_depth
    
    def _analyze_data_structure(self, content: str, file_extension: str) -> Dict[str, Any]:
        """Analyze data file structure"""
        
        format_type = "unknown"
        estimated_records = 0
        column_count = None
        
        if file_extension == '.csv':
            format_type = "csv"
            lines = content.split('\n')
            estimated_records = len([line for line in lines if line.strip()]) - 1  # Exclude header
            if lines:
                column_count = len(lines[0].split(','))
        elif file_extension == '.json':
            format_type = "json"
            try:
                data = json.loads(content)
                if isinstance(data, list):
                    estimated_records = len(data)
                elif isinstance(data, dict):
                    estimated_records = 1
            except:
                pass
        elif file_extension == '.xml':
            format_type = "xml"
            estimated_records = content.count('<') // 2  # Rough estimate
        
        return {
            "format_type": format_type,
            "estimated_records": estimated_records,
            "column_count": column_count
        }
    
    async def _analyze_directory_structure(self, directories: List[Dict[str, Any]], files: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze overall directory structure using cognitive systems"""
        
        # Calculate structure metrics
        max_depth = max((d["depth"] for d in directories), default=0)
        file_distribution = {}
        
        for file_info in files:
            category = file_info["category"]
            file_distribution[category] = file_distribution.get(category, 0) + 1
        
        # Identify patterns in directory organization
        directory_patterns = self._identify_directory_patterns(directories, files)
        
        return {
            "max_depth": max_depth,
            "total_directories": len(directories),
            "file_distribution": file_distribution,
            "directory_patterns": directory_patterns,
            "organization_score": self._calculate_organization_score(directories, files)
        }
    
    def _identify_directory_patterns(self, directories: List[Dict[str, Any]], files: List[Dict[str, Any]]) -> List[str]:
        """Identify common directory organization patterns"""
        
        patterns = []
        dir_names = [d["name"].lower() for d in directories]
        
        # Common software project patterns
        if any(name in dir_names for name in ['src', 'source', 'lib']):
            patterns.append("source_code_organization")
        
        if any(name in dir_names for name in ['test', 'tests', 'spec']):
            patterns.append("testing_structure")
        
        if any(name in dir_names for name in ['docs', 'documentation', 'doc']):
            patterns.append("documentation_structure")
        
        if any(name in dir_names for name in ['config', 'conf', 'settings']):
            patterns.append("configuration_management")
        
        if any(name in dir_names for name in ['assets', 'static', 'public']):
            patterns.append("asset_organization")
        
        return patterns
    
    def _calculate_organization_score(self, directories: List[Dict[str, Any]], files: List[Dict[str, Any]]) -> float:
        """Calculate how well-organized the directory structure is"""
        
        score = 0.5  # Base score
        
        # Bonus for reasonable depth (not too shallow, not too deep)
        max_depth = max((d["depth"] for d in directories), default=0)
        if 2 <= max_depth <= 5:
            score += 0.2
        elif max_depth > 8:
            score -= 0.2
        
        # Bonus for balanced file distribution
        file_counts_per_dir = {}
        for file_info in files:
            parent = file_info["parent_directory"]
            file_counts_per_dir[parent] = file_counts_per_dir.get(parent, 0) + 1
        
        if file_counts_per_dir:
            max_files = max(file_counts_per_dir.values())
            if max_files < 20:  # No directory is overwhelmed with files
                score += 0.2
        
        # Bonus for having common organizational directories
        dir_names = [d["name"].lower() for d in directories]
        org_dirs = ['src', 'docs', 'test', 'config', 'lib']
        found_org_dirs = sum(1 for org_dir in org_dirs if org_dir in dir_names)
        score += (found_org_dirs / len(org_dirs)) * 0.3
        
        return min(1.0, max(0.0, score))
    
    async def _generate_cognitive_insights(self, file_analyses: List[Dict[str, Any]], structure_analysis: Dict[str, Any], analysis_depth: str) -> List[str]:
        """Generate high-level cognitive insights using Guru's synthesis capabilities"""
        
        insights = []
        
        # Analyze patterns across files
        code_files = [f for f in file_analyses if f.get("analysis_type") == "code_analysis"]
        doc_files = [f for f in file_analyses if f.get("analysis_type") == "documentation_analysis"]
        
        if code_files:
            avg_complexity = sum(f.get("code_metrics", {}).get("complexity_indicators", 0) for f in code_files) / len(code_files)
            if avg_complexity > 10:
                insights.append("Codebase exhibits high complexity patterns - consider refactoring for maintainability")
            else:
                insights.append("Codebase maintains reasonable complexity levels across files")
        
        if doc_files:
            well_structured_docs = sum(1 for f in doc_files if f.get("doc_metrics", {}).get("structure_level") == "well_structured")
            if well_structured_docs / len(doc_files) > 0.7:
                insights.append("Documentation demonstrates good structural organization")
            else:
                insights.append("Documentation could benefit from improved structural organization")
        
        # Directory organization insights
        org_score = structure_analysis["organization_score"]
        if org_score > 0.8:
            insights.append("Directory structure exhibits excellent organizational patterns")
        elif org_score > 0.6:
            insights.append("Directory structure shows good organizational principles")
        else:
            insights.append("Directory structure could benefit from reorganization")
        
        # Cross-domain insights
        file_categories = structure_analysis["file_distribution"]
        if len(file_categories) > 3:
            insights.append("Project demonstrates multi-domain complexity with diverse file types")
        
        return insights[:6]  # Limit to most relevant insights
    
    async def _generate_filesystem_recommendations(self, file_analyses: List[Dict[str, Any]], structure_analysis: Dict[str, Any], cognitive_insights: List[str]) -> List[Dict[str, Any]]:
        """Generate actionable recommendations for filesystem improvements"""
        
        recommendations = []
        
        # Collect recommendations from individual file analyses
        for analysis in file_analyses:
            recommendations.extend(analysis.get("recommendations", []))
        
        # Add structural recommendations
        if structure_analysis["max_depth"] > 6:
            recommendations.append({
                "type": "structure_optimization",
                "title": "Reduce Directory Nesting",
                "description": f"Directory structure is {structure_analysis['max_depth']} levels deep - consider flattening",
                "priority": "medium"
            })
        
        if structure_analysis["organization_score"] < 0.6:
            recommendations.append({
                "type": "organization_improvement", 
                "title": "Improve Directory Organization",
                "description": "Consider adopting standard project organization patterns (src/, docs/, tests/)",
                "priority": "medium"
            })
        
        # Add cognitive enhancement recommendations
        code_analyses = [f for f in file_analyses if f.get("analysis_type") == "code_analysis"]
        if len(code_analyses) > 10:
            high_complexity_files = [f for f in code_analyses 
                                   if f.get("code_metrics", {}).get("complexity_level") == "high"]
            if len(high_complexity_files) > len(code_analyses) * 0.3:
                recommendations.append({
                    "type": "cognitive_enhancement",
                    "title": "Apply Guru Task Evolution",
                    "description": "Use evolutionary optimization to refactor high-complexity code files",
                    "priority": "high"
                })
        
        # Prioritize and limit recommendations
        priority_order = {"high": 3, "medium": 2, "low": 1}
        recommendations.sort(key=lambda r: priority_order.get(r["priority"], 0), reverse=True)
        
        return recommendations[:8]  # Limit to most important recommendations
    
    def _format_filesystem_analysis(self, analysis: Dict[str, Any], target_path: str, analysis_depth: str) -> str:
        """Format filesystem analysis results for presentation"""
        
        result = f"## 📁 Guru Filesystem Analysis\n\n"
        result += f"**Target Path:** `{target_path}`\n"
        result += f"**Analysis Depth:** {analysis_depth}\n"
        result += f"**Files Analyzed:** {analysis['analysis_metadata']['files_analyzed']}\n"
        result += f"**Processing Time:** {analysis['analysis_metadata']['processing_time_seconds']:.1f}s\n\n"
        
        # Discovery Summary
        discovery = analysis["discovery_result"]
        result += f"### 📊 Discovery Summary\n"
        result += f"- **Total Files Found:** {discovery['total_files_found']}\n"
        result += f"- **Directories Scanned:** {len(discovery['directories'])}\n"
        result += f"- **Total Size:** {discovery['total_size_bytes'] / 1024:.1f} KB\n\n"
        
        # File Type Distribution
        if discovery["file_type_distribution"]:
            result += f"**File Type Distribution:**\n"
            for file_type, count in discovery["file_type_distribution"].items():
                result += f"- {file_type.title()}: {count} files\n"
            result += "\n"
        
        # Directory Structure Analysis
        structure = analysis["structure_analysis"]
        result += f"### 🏗️ Structure Analysis\n"
        result += f"- **Organization Score:** {structure['organization_score']:.2f}/1.0\n"
        result += f"- **Maximum Depth:** {structure['max_depth']} levels\n"
        result += f"- **Directory Patterns:** {', '.join(structure['directory_patterns']) if structure['directory_patterns'] else 'None detected'}\n\n"
        
        # Cognitive Insights
        insights = analysis["cognitive_insights"]
        if insights:
            result += f"### 🧠 Cognitive Insights\n"
            for i, insight in enumerate(insights, 1):
                result += f"{i}. {insight}\n"
            result += "\n"
        
        # Top File Analyses
        file_analyses = analysis["file_analyses"]
        if file_analyses:
            result += f"### 📄 File Analysis Highlights\n"
            
            # Show most interesting files
            interesting_files = sorted(file_analyses, 
                                     key=lambda f: f.get("analysis_confidence", 0) * len(f.get("insights", [])), 
                                     reverse=True)[:5]
            
            for file_analysis in interesting_files:
                file_info = file_analysis["file_info"]
                result += f"**{file_info['name']}** ({file_analysis['analysis_type']})\n"
                for insight in file_analysis.get("insights", [])[:2]:
                    result += f"  • {insight}\n"
                result += "\n"
        
        # Recommendations
        recommendations = analysis["recommendations"]
        if recommendations:
            result += f"### 💡 Recommendations\n"
            for rec in recommendations[:6]:
                priority_emoji = "🔴" if rec["priority"] == "high" else "🟡" if rec["priority"] == "medium" else "🟢"
                result += f"{priority_emoji} **{rec['title']}** ({rec['type']})\n"
                result += f"   {rec['description']}\n\n"
        
        result += f"---\n"
        result += f"*Filesystem analysis combines Guru's cognitive systems with direct file/folder analysis for comprehensive insights and optimization recommendations.*"
        
        return result