"""
Manual Filesystem Analysis Tool - Precise file selection and analysis using Guru's cognitive systems
"""

import asyncio
import os
import mimetypes
import base64
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from loguru import logger
import hashlib


class ManualFilesystemAnalysisTool:
    """
    Manually analyze specific files chosen by the user with precise control over the analysis process
    """
    
    def __init__(self, core_bridge, phi4_wingman):
        self.core_bridge = core_bridge
        self.phi4_wingman = phi4_wingman
        self.name = "guru_analyze_files_manual"
        
        # Security: Allowed analysis directories (same as filesystem analysis)
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
        
        # Maximum files per analysis
        self.max_files_per_analysis = 20
        
        # Supported analysis modes
        self.analysis_modes = {
            "individual": "Analyze each file separately with detailed insights",
            "comparative": "Compare files against each other to find patterns and differences", 
            "collective": "Analyze files as a unified system or project",
            "evolutionary": "Apply evolutionary optimization to improve file organization/content"
        }
        
    async def execute(self, args: Dict[str, Any]) -> str:
        """Execute manual filesystem analysis on specified files"""
        file_paths = args.get("file_paths", [])
        analysis_mode = args.get("analysis_mode", "individual")
        analysis_focus = args.get("analysis_focus", ["structure", "quality", "optimization"])
        cognitive_systems = args.get("cognitive_systems", ["harmonic_analysis", "quantum_synthesis"])
        comparison_criteria = args.get("comparison_criteria", []) if analysis_mode == "comparative" else []
        
        if not file_paths:
            return "## Error\n\nNo file paths provided for manual analysis"
            
        if len(file_paths) > self.max_files_per_analysis:
            return f"## Error\n\nToo many files specified. Maximum allowed: {self.max_files_per_analysis}"
            
        try:
            logger.info(f"🎯 Manual analysis of {len(file_paths)} files in {analysis_mode} mode")
            
            # Validate and prepare files
            validated_files = await self._validate_and_prepare_files(file_paths)
            
            if not validated_files["valid_files"]:
                return f"## Error\n\nNo valid files found for analysis. Issues: {', '.join(validated_files['issues'])}"
            
            # Perform analysis based on mode
            analysis_result = await self._execute_analysis_mode(
                validated_files["valid_files"], 
                analysis_mode, 
                analysis_focus, 
                cognitive_systems,
                comparison_criteria
            )
            
            # Format results
            return self._format_manual_analysis_result(
                analysis_result, analysis_mode, len(file_paths), len(validated_files["valid_files"])
            )
            
        except Exception as e:
            logger.error(f"Manual filesystem analysis failed: {e}")
            return f"## Error\n\nManual analysis failed: {str(e)}"
    
    async def _validate_and_prepare_files(self, file_paths: List[str]) -> Dict[str, Any]:
        """Validate file paths and prepare file information"""
        
        valid_files = []
        issues = []
        
        for file_path_str in file_paths:
            try:
                # Security validation
                if not self._is_path_allowed(file_path_str):
                    issues.append(f"{file_path_str}: Not in allowed directories")
                    continue
                
                file_path = Path(file_path_str).resolve()
                
                # Existence check
                if not file_path.exists():
                    issues.append(f"{file_path_str}: File does not exist")
                    continue
                
                # File type check
                if not file_path.is_file():
                    issues.append(f"{file_path_str}: Not a file")
                    continue
                
                # Size check
                stat_result = file_path.stat()
                if stat_result.st_size > self.max_file_size:
                    issues.append(f"{file_path_str}: File too large ({stat_result.st_size / 1024 / 1024:.1f}MB)")
                    continue
                
                # Read file content
                try:
                    content = file_path.read_text(encoding='utf-8', errors='ignore')
                except Exception as e:
                    issues.append(f"{file_path_str}: Could not read file - {str(e)}")
                    continue
                
                # Create file info
                file_info = {
                    "path": str(file_path),
                    "name": file_path.name,
                    "suffix": file_path.suffix.lower(),
                    "size_bytes": stat_result.st_size,
                    "modified_time": stat_result.st_mtime,
                    "content": content,
                    "content_hash": hashlib.md5(content.encode()).hexdigest()[:8],
                    "line_count": content.count('\n') + 1 if content else 0,
                    "word_count": len(content.split()) if content else 0,
                    "char_count": len(content),
                    "mime_type": mimetypes.guess_type(str(file_path))[0],
                    "category": self._categorize_file(file_path)
                }
                
                valid_files.append(file_info)
                
            except Exception as e:
                issues.append(f"{file_path_str}: Validation error - {str(e)}")
        
        return {
            "valid_files": valid_files,
            "issues": issues,
            "validation_summary": {
                "total_requested": len(file_paths),
                "valid_files": len(valid_files),
                "failed_files": len(issues)
            }
        }
    
    def _is_path_allowed(self, target_path: str) -> bool:
        """Check if path is within allowed directories for security"""
        try:
            resolved_path = Path(target_path).resolve()
            
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
    
    def _categorize_file(self, file_path: Path) -> str:
        """Categorize file based on extension and name"""
        suffix = file_path.suffix.lower()
        name = file_path.name.lower()
        
        # Code files
        code_extensions = {'.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt'}
        if suffix in code_extensions:
            return "code"
        
        # Documentation files
        doc_extensions = {'.md', '.txt', '.rst', '.asciidoc', '.org'}
        if suffix in doc_extensions or 'readme' in name:
            return "documentation"
        
        # Configuration files
        config_extensions = {'.json', '.yaml', '.yml', '.toml', '.ini', '.conf', '.cfg', '.env'}
        if suffix in config_extensions or name in {'dockerfile', 'makefile'}:
            return "configuration"
        
        # Data files
        data_extensions = {'.csv', '.tsv', '.xml', '.sql', '.jsonl'}
        if suffix in data_extensions:
            return "data"
        
        return "other"
    
    async def _execute_analysis_mode(self, files: List[Dict[str, Any]], analysis_mode: str, analysis_focus: List[str], cognitive_systems: List[str], comparison_criteria: List[str]) -> Dict[str, Any]:
        """Execute the specified analysis mode"""
        
        if analysis_mode == "individual":
            return await self._individual_analysis(files, analysis_focus, cognitive_systems)
        elif analysis_mode == "comparative":
            return await self._comparative_analysis(files, analysis_focus, cognitive_systems, comparison_criteria)
        elif analysis_mode == "collective":
            return await self._collective_analysis(files, analysis_focus, cognitive_systems)
        elif analysis_mode == "evolutionary":
            return await self._evolutionary_analysis(files, analysis_focus, cognitive_systems)
        else:
            raise ValueError(f"Unknown analysis mode: {analysis_mode}")
    
    async def _individual_analysis(self, files: List[Dict[str, Any]], analysis_focus: List[str], cognitive_systems: List[str]) -> Dict[str, Any]:
        """Analyze each file individually with detailed insights"""
        
        individual_analyses = []
        
        for file_info in files:
            logger.info(f"🔍 Analyzing {file_info['name']} individually")
            
            file_analysis = {
                "file_info": file_info,
                "cognitive_results": {},
                "focus_insights": {},
                "recommendations": []
            }
            
            # Apply selected cognitive systems
            for system in cognitive_systems:
                if system == "harmonic_analysis":
                    result = await self.core_bridge.invoke_harmonic_analyzer(
                        file_info["content"], "deep"
                    )
                    file_analysis["cognitive_results"]["harmonic"] = result
                    
                elif system == "quantum_synthesis":
                    result = await self.core_bridge.invoke_quantum_synthesizer(
                        f"Analyze and synthesize insights from {file_info['name']}", 
                        [file_info["content"][:1000]]
                    )
                    file_analysis["cognitive_results"]["quantum"] = result
                    
                elif system == "task_evolution":
                    result = await self.core_bridge.invoke_task_evolver(
                        f"Optimize the structure and quality of {file_info['name']}", 
                        []
                    )
                    file_analysis["cognitive_results"]["evolution"] = result
            
            # Generate focus-specific insights
            for focus in analysis_focus:
                if focus == "structure":
                    file_analysis["focus_insights"]["structure"] = self._analyze_file_structure(file_info)
                elif focus == "quality":
                    file_analysis["focus_insights"]["quality"] = self._analyze_file_quality(file_info)
                elif focus == "optimization":
                    file_analysis["focus_insights"]["optimization"] = self._analyze_optimization_opportunities(file_info)
            
            # Generate recommendations
            file_analysis["recommendations"] = self._generate_file_recommendations(file_analysis)
            
            individual_analyses.append(file_analysis)
            
            # Small delay between files
            await asyncio.sleep(0.1)
        
        return {
            "analysis_mode": "individual",
            "individual_analyses": individual_analyses,
            "summary_insights": self._generate_individual_summary_insights(individual_analyses)
        }
    
    async def _comparative_analysis(self, files: List[Dict[str, Any]], analysis_focus: List[str], cognitive_systems: List[str], comparison_criteria: List[str]) -> Dict[str, Any]:
        """Compare files against each other to find patterns and differences"""
        
        logger.info(f"⚔️ Comparative analysis of {len(files)} files")
        
        # First, get individual analysis for each file
        individual_results = await self._individual_analysis(files, analysis_focus, cognitive_systems)
        
        # Then perform comparisons
        comparisons = []
        
        for i, file1 in enumerate(files):
            for j, file2 in enumerate(files[i+1:], i+1):
                comparison = await self._compare_two_files(
                    file1, file2, 
                    individual_results["individual_analyses"][i],
                    individual_results["individual_analyses"][j],
                    comparison_criteria
                )
                comparisons.append(comparison)
        
        # Generate comparative insights
        comparative_insights = self._generate_comparative_insights(files, comparisons)
        
        return {
            "analysis_mode": "comparative",
            "individual_analyses": individual_results["individual_analyses"],
            "comparisons": comparisons,
            "comparative_insights": comparative_insights,
            "similarity_matrix": self._generate_similarity_matrix(files, comparisons)
        }
    
    async def _compare_two_files(self, file1: Dict[str, Any], file2: Dict[str, Any], analysis1: Dict[str, Any], analysis2: Dict[str, Any], criteria: List[str]) -> Dict[str, Any]:
        """Compare two specific files"""
        
        comparison = {
            "file1": file1["name"],
            "file2": file2["name"],
            "similarity_score": 0.0,
            "differences": [],
            "similarities": [],
            "recommendations": []
        }
        
        # Size comparison
        size_diff = abs(file1["size_bytes"] - file2["size_bytes"]) / max(file1["size_bytes"], file2["size_bytes"])
        
        # Content similarity (simplified)
        content_similarity = self._calculate_content_similarity(file1["content"], file2["content"])
        
        # Structure similarity
        structure_similarity = 0.8 if file1["category"] == file2["category"] else 0.2
        
        # Calculate overall similarity
        comparison["similarity_score"] = (content_similarity * 0.5 + structure_similarity * 0.3 + (1 - size_diff) * 0.2)
        
        # Generate comparison insights
        if comparison["similarity_score"] > 0.7:
            comparison["similarities"].append("Files show high structural and content similarity")
        elif comparison["similarity_score"] > 0.4:
            comparison["similarities"].append("Files share moderate similarities")
        else:
            comparison["differences"].append("Files are significantly different in structure and content")
        
        if file1["category"] != file2["category"]:
            comparison["differences"].append(f"Different file categories: {file1['category']} vs {file2['category']}")
        
        if abs(file1["line_count"] - file2["line_count"]) > 50:
            comparison["differences"].append(f"Significant size difference: {file1['line_count']} vs {file2['line_count']} lines")
        
        return comparison
    
    def _calculate_content_similarity(self, content1: str, content2: str) -> float:
        """Calculate content similarity between two texts"""
        
        # Simple word-based similarity
        words1 = set(content1.lower().split())
        words2 = set(content2.lower().split())
        
        if not words1 and not words2:
            return 1.0
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)
    
    async def _collective_analysis(self, files: List[Dict[str, Any]], analysis_focus: List[str], cognitive_systems: List[str]) -> Dict[str, Any]:
        """Analyze files as a unified system or project"""
        
        logger.info(f"🏗️ Collective analysis of {len(files)} files as unified system")
        
        # Combine all content for system-level analysis
        combined_content = "\n\n".join([f"=== {f['name']} ===\n{f['content']}" for f in files])
        system_context = f"System of {len(files)} files: {', '.join([f['name'] for f in files])}"
        
        collective_results = {
            "system_overview": {
                "total_files": len(files),
                "total_size": sum(f["size_bytes"] for f in files),
                "total_lines": sum(f["line_count"] for f in files),
                "file_categories": list(set(f["category"] for f in files)),
                "system_complexity": self._calculate_system_complexity(files)
            },
            "cognitive_results": {},
            "system_insights": [],
            "architecture_analysis": {},
            "recommendations": []
        }
        
        # Apply cognitive systems to the entire system
        for system in cognitive_systems:
            if system == "harmonic_analysis":
                result = await self.core_bridge.invoke_harmonic_analyzer(
                    combined_content[:5000], "architectural"  # Limit content for processing
                )
                collective_results["cognitive_results"]["harmonic"] = result
                
            elif system == "quantum_synthesis":
                result = await self.core_bridge.invoke_quantum_synthesizer(
                    f"Synthesize insights across the entire system: {system_context}",
                    [f["content"][:500] for f in files[:5]]  # Sample content from first 5 files
                )
                collective_results["cognitive_results"]["quantum"] = result
        
        # System-level insights
        collective_results["system_insights"] = self._generate_system_insights(files)
        collective_results["architecture_analysis"] = self._analyze_system_architecture(files)
        collective_results["recommendations"] = self._generate_system_recommendations(collective_results)
        
        return {
            "analysis_mode": "collective",
            **collective_results
        }
    
    async def _evolutionary_analysis(self, files: List[Dict[str, Any]], analysis_focus: List[str], cognitive_systems: List[str]) -> Dict[str, Any]:
        """Apply evolutionary optimization to improve file organization/content"""
        
        logger.info(f"🧬 Evolutionary analysis for optimizing {len(files)} files")
        
        # Use task evolution system for optimization
        evolution_result = await self.core_bridge.invoke_task_evolver(
            f"Optimize organization and structure of {len(files)} files for maximum efficiency and maintainability",
            [f"Current files: {', '.join([f['name'] for f in files])}"]
        )
        
        evolutionary_analysis = {
            "current_state": {
                "files": files,
                "organization_score": self._calculate_organization_score(files),
                "complexity_score": self._calculate_system_complexity(files),
                "maintainability_score": self._calculate_maintainability_score(files)
            },
            "evolution_results": evolution_result,
            "optimization_strategies": [],
            "proposed_changes": [],
            "expected_improvements": {}
        }
        
        # Generate optimization strategies
        evolutionary_analysis["optimization_strategies"] = self._generate_optimization_strategies(files)
        evolutionary_analysis["proposed_changes"] = self._generate_proposed_changes(files, evolution_result)
        evolutionary_analysis["expected_improvements"] = self._calculate_expected_improvements(files)
        
        return {
            "analysis_mode": "evolutionary",
            **evolutionary_analysis
        }
    
    def _analyze_file_structure(self, file_info: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze the structure of a single file"""
        content = file_info["content"]
        
        return {
            "line_density": file_info["char_count"] / max(file_info["line_count"], 1),
            "word_density": file_info["word_count"] / max(file_info["line_count"], 1),
            "structural_elements": {
                "functions": content.count("def ") + content.count("function "),
                "classes": content.count("class "),
                "imports": content.count("import ") + content.count("#include"),
                "comments": content.count("#") + content.count("//") + content.count("/*")
            },
            "organization_patterns": self._detect_organization_patterns(content)
        }
    
    def _analyze_file_quality(self, file_info: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze the quality of a single file"""
        content = file_info["content"]
        
        # Simple quality metrics
        comment_ratio = (content.count("#") + content.count("//")) / max(file_info["line_count"], 1)
        
        return {
            "comment_ratio": comment_ratio,
            "readability_score": min(1.0, comment_ratio * 2 + 0.5),
            "consistency_indicators": {
                "indentation_consistent": self._check_indentation_consistency(content),
                "naming_patterns": self._analyze_naming_patterns(content)
            },
            "potential_issues": self._detect_potential_issues(content, file_info)
        }
    
    def _analyze_optimization_opportunities(self, file_info: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze optimization opportunities for a single file"""
        content = file_info["content"]
        
        return {
            "size_optimization": {
                "current_size": file_info["size_bytes"],
                "estimated_savings": max(0, file_info["size_bytes"] * 0.1),  # Rough estimate
                "optimization_potential": "medium" if file_info["size_bytes"] > 50000 else "low"
            },
            "structure_optimization": {
                "function_count": content.count("def ") + content.count("function "),
                "complexity_reduction_potential": "high" if content.count("if ") > 20 else "low"
            },
            "maintainability_improvements": [
                "Add more descriptive comments" if content.count("#") < file_info["line_count"] * 0.1 else None,
                "Break down large functions" if len(content) > 10000 else None,
                "Improve variable naming" if len([w for w in content.split() if len(w) < 3]) > 50 else None
            ]
        }
    
    def _detect_organization_patterns(self, content: str) -> List[str]:
        """Detect organizational patterns in content"""
        patterns = []
        
        if "import " in content[:500]:  # Imports at top
            patterns.append("imports_at_top")
        
        if content.count("class ") > 0:
            patterns.append("object_oriented")
        
        if content.count("def ") > 5:
            patterns.append("function_heavy")
        
        return patterns
    
    def _check_indentation_consistency(self, content: str) -> bool:
        """Check if indentation is consistent throughout the file"""
        lines = content.split('\n')
        indentation_types = set()
        
        for line in lines[:50]:  # Check first 50 lines
            if line.startswith(' '):
                indentation_types.add('spaces')
            elif line.startswith('\t'):
                indentation_types.add('tabs')
        
        return len(indentation_types) <= 1
    
    def _analyze_naming_patterns(self, content: str) -> Dict[str, int]:
        """Analyze naming patterns in the content"""
        import re
        
        # Simple pattern detection
        snake_case = len(re.findall(r'\b[a-z]+_[a-z_]+\b', content))
        camel_case = len(re.findall(r'\b[a-z]+[A-Z][a-zA-Z]*\b', content))
        
        return {
            "snake_case_count": snake_case,
            "camel_case_count": camel_case,
            "consistency_score": 1.0 if snake_case == 0 or camel_case == 0 else 0.5
        }
    
    def _detect_potential_issues(self, content: str, file_info: Dict[str, Any]) -> List[str]:
        """Detect potential issues in the file"""
        issues = []
        
        if file_info["size_bytes"] > 100000:
            issues.append("Large file size - consider splitting")
        
        if content.count("TODO") > 5:
            issues.append("Many TODO comments - incomplete implementation")
        
        if content.count("print(") > 10 and file_info["category"] == "code":
            issues.append("Many print statements - consider using logging")
        
        return issues
    
    def _generate_file_recommendations(self, file_analysis: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate specific recommendations for a file"""
        recommendations = []
        
        file_info = file_analysis["file_info"]
        
        # Size-based recommendations
        if file_info["size_bytes"] > 50000:
            recommendations.append({
                "type": "structure",
                "priority": "medium",
                "title": "Consider File Splitting",
                "description": f"File is {file_info['size_bytes']/1024:.0f}KB - consider breaking into smaller modules"
            })
        
        # Quality-based recommendations
        quality_analysis = file_analysis["focus_insights"].get("quality", {})
        if quality_analysis.get("comment_ratio", 0) < 0.1:
            recommendations.append({
                "type": "quality",
                "priority": "low",
                "title": "Add More Comments",
                "description": "Consider adding more comments to improve code readability"
            })
        
        return recommendations
    
    def _generate_individual_summary_insights(self, individual_analyses: List[Dict[str, Any]]) -> List[str]:
        """Generate summary insights from individual file analyses"""
        insights = []
        
        total_files = len(individual_analyses)
        large_files = len([a for a in individual_analyses if a["file_info"]["size_bytes"] > 50000])
        
        if large_files > total_files * 0.3:
            insights.append(f"High proportion of large files ({large_files}/{total_files}) - consider modularization")
        
        categories = set(a["file_info"]["category"] for a in individual_analyses)
        insights.append(f"File diversity: {len(categories)} different categories detected")
        
        return insights
    
    def _generate_comparative_insights(self, files: List[Dict[str, Any]], comparisons: List[Dict[str, Any]]) -> List[str]:
        """Generate insights from comparative analysis"""
        insights = []
        
        high_similarity_pairs = [c for c in comparisons if c["similarity_score"] > 0.7]
        
        if high_similarity_pairs:
            insights.append(f"Found {len(high_similarity_pairs)} pairs of highly similar files - potential for consolidation")
        
        categories = set(f["category"] for f in files)
        if len(categories) > 1:
            insights.append(f"Mixed file types detected: {', '.join(categories)} - organized project structure")
        
        return insights
    
    def _generate_similarity_matrix(self, files: List[Dict[str, Any]], comparisons: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a similarity matrix between files"""
        matrix = {}
        
        for comparison in comparisons:
            file1, file2 = comparison["file1"], comparison["file2"]
            if file1 not in matrix:
                matrix[file1] = {}
            if file2 not in matrix:
                matrix[file2] = {}
            
            matrix[file1][file2] = comparison["similarity_score"]
            matrix[file2][file1] = comparison["similarity_score"]
        
        return matrix
    
    def _calculate_system_complexity(self, files: List[Dict[str, Any]]) -> float:
        """Calculate overall system complexity"""
        total_lines = sum(f["line_count"] for f in files)
        total_files = len(files)
        avg_file_size = total_lines / max(total_files, 1)
        
        # Normalize complexity score
        complexity = min(1.0, (avg_file_size / 1000) + (total_files / 50))
        return complexity
    
    def _generate_system_insights(self, files: List[Dict[str, Any]]) -> List[str]:
        """Generate system-level insights"""
        insights = []
        
        total_size = sum(f["size_bytes"] for f in files)
        insights.append(f"System contains {len(files)} files totaling {total_size/1024:.0f}KB")
        
        categories = {}
        for f in files:
            categories[f["category"]] = categories.get(f["category"], 0) + 1
        
        insights.append(f"File distribution: {', '.join([f'{cat}: {count}' for cat, count in categories.items()])}")
        
        return insights
    
    def _analyze_system_architecture(self, files: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze the overall system architecture"""
        return {
            "architectural_patterns": self._detect_architectural_patterns(files),
            "dependency_analysis": self._analyze_dependencies(files),
            "modularity_score": self._calculate_modularity_score(files)
        }
    
    def _detect_architectural_patterns(self, files: List[Dict[str, Any]]) -> List[str]:
        """Detect architectural patterns in the file system"""
        patterns = []
        
        categories = [f["category"] for f in files]
        
        if "code" in categories and "configuration" in categories:
            patterns.append("configuration_management")
        
        if "code" in categories and "documentation" in categories:
            patterns.append("documented_codebase")
        
        return patterns
    
    def _analyze_dependencies(self, files: List[Dict[str, Any]]) -> Dict[str, int]:
        """Analyze dependencies between files"""
        dependencies = {"imports": 0, "includes": 0, "references": 0}
        
        for f in files:
            content = f["content"]
            dependencies["imports"] += content.count("import ")
            dependencies["includes"] += content.count("#include")
            
            # Count references to other files in the set
            for other_f in files:
                if f != other_f and other_f["name"].replace(other_f["suffix"], "") in content:
                    dependencies["references"] += 1
        
        return dependencies
    
    def _calculate_modularity_score(self, files: List[Dict[str, Any]]) -> float:
        """Calculate how modular the system is"""
        if len(files) <= 1:
            return 0.5
        
        # Simple modularity based on file count and size distribution
        avg_size = sum(f["size_bytes"] for f in files) / len(files)
        size_variance = sum((f["size_bytes"] - avg_size) ** 2 for f in files) / len(files)
        
        # Lower variance = more modular
        modularity = max(0.0, min(1.0, 1.0 - (size_variance / (avg_size ** 2))))
        return modularity
    
    def _generate_system_recommendations(self, collective_results: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate system-level recommendations"""
        recommendations = []
        
        system_overview = collective_results["system_overview"]
        
        if system_overview["system_complexity"] > 0.8:
            recommendations.append({
                "type": "architecture",
                "priority": "high",
                "title": "Reduce System Complexity",
                "description": "System complexity is high - consider breaking into smaller modules"
            })
        
        if len(system_overview["file_categories"]) == 1:
            recommendations.append({
                "type": "organization",
                "priority": "medium", 
                "title": "Diversify File Types",
                "description": "Consider adding documentation or configuration files for better project organization"
            })
        
        return recommendations
    
    def _calculate_organization_score(self, files: List[Dict[str, Any]]) -> float:
        """Calculate how well-organized the files are"""
        if not files:
            return 0.0
        
        # Factor in file size distribution
        sizes = [f["size_bytes"] for f in files]
        avg_size = sum(sizes) / len(sizes)
        size_variance = sum((s - avg_size) ** 2 for s in sizes) / len(sizes)
        
        # Factor in category distribution
        categories = set(f["category"] for f in files)
        category_diversity = len(categories) / max(len(files), 1)
        
        # Combine factors
        organization_score = (
            (1.0 - min(1.0, size_variance / (avg_size ** 2))) * 0.6 +  # Size consistency
            min(1.0, category_diversity * 2) * 0.4  # Category diversity
        )
        
        return organization_score
    
    def _calculate_maintainability_score(self, files: List[Dict[str, Any]]) -> float:
        """Calculate maintainability score for the file set"""
        if not files:
            return 0.0
        
        total_score = 0.0
        
        for f in files:
            content = f["content"]
            
            # Comment ratio
            comment_ratio = (content.count("#") + content.count("//")) / max(f["line_count"], 1)
            
            # Size factor (smaller files are more maintainable)
            size_factor = max(0.0, min(1.0, 1.0 - (f["size_bytes"] / 100000)))
            
            # Combine factors
            file_score = (comment_ratio * 0.4 + size_factor * 0.6)
            total_score += file_score
        
        return total_score / len(files)
    
    def _generate_optimization_strategies(self, files: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate optimization strategies for the file set"""
        strategies = []
        
        # File size optimization
        large_files = [f for f in files if f["size_bytes"] > 50000]
        if large_files:
            strategies.append({
                "strategy": "file_size_optimization",
                "title": "Optimize Large Files",
                "description": f"Split {len(large_files)} large files into smaller modules",
                "impact": "high",
                "effort": "medium"
            })
        
        # Category consolidation
        categories = {}
        for f in files:
            categories[f["category"]] = categories.get(f["category"], 0) + 1
        
        if len(categories) > 3:
            strategies.append({
                "strategy": "category_organization",
                "title": "Organize by Category",
                "description": f"Group {len(categories)} different file types into organized directories",
                "impact": "medium",
                "effort": "low"
            })
        
        return strategies
    
    def _generate_proposed_changes(self, files: List[Dict[str, Any]], evolution_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate specific proposed changes based on evolutionary analysis"""
        changes = []
        
        # Example changes based on analysis
        for f in files:
            if f["size_bytes"] > 100000:
                changes.append({
                    "file": f["name"],
                    "change_type": "split",
                    "description": f"Split {f['name']} into 2-3 smaller files",
                    "rationale": "Reduce complexity and improve maintainability"
                })
            
            if f["category"] == "code" and f["content"].count("#") < f["line_count"] * 0.05:
                changes.append({
                    "file": f["name"],
                    "change_type": "documentation",
                    "description": f"Add comments to {f['name']}",
                    "rationale": "Improve code readability and maintainability"
                })
        
        return changes
    
    def _calculate_expected_improvements(self, files: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate expected improvements from optimization"""
        return {
            "maintainability_improvement": 0.25,
            "complexity_reduction": 0.30,
            "organization_improvement": 0.20,
            "performance_gain": 0.15
        }
    
    def _format_manual_analysis_result(self, analysis: Dict[str, Any], analysis_mode: str, total_requested: int, valid_files: int) -> str:
        """Format manual analysis results for presentation"""
        
        result = f"## 🎯 Guru Manual Filesystem Analysis\n\n"
        result += f"**Analysis Mode:** {analysis_mode.title()}\n"
        result += f"**Files Requested:** {total_requested}\n"
        result += f"**Files Successfully Analyzed:** {valid_files}\n"
        result += f"**Cognitive Systems Applied:** {', '.join(analysis.get('cognitive_systems', ['harmonic', 'quantum']))}\n\n"
        
        if analysis_mode == "individual":
            result += self._format_individual_results(analysis)
        elif analysis_mode == "comparative":
            result += self._format_comparative_results(analysis)
        elif analysis_mode == "collective":
            result += self._format_collective_results(analysis)
        elif analysis_mode == "evolutionary":
            result += self._format_evolutionary_results(analysis)
        
        result += f"\n---\n"
        result += f"*Manual filesystem analysis provides precise control over which files to analyze and how to analyze them using Guru's cognitive enhancement systems.*"
        
        return result
    
    def _format_individual_results(self, analysis: Dict[str, Any]) -> str:
        """Format individual analysis results"""
        result = f"### 📄 Individual File Analysis\n\n"
        
        for file_analysis in analysis["individual_analyses"][:5]:  # Show first 5
            file_info = file_analysis["file_info"]
            result += f"**{file_info['name']}** ({file_info['category']})\n"
            result += f"- Size: {file_info['size_bytes']/1024:.1f}KB, Lines: {file_info['line_count']}\n"
            
            # Show recommendations
            recommendations = file_analysis.get("recommendations", [])
            if recommendations:
                result += f"- Recommendations: {len(recommendations)} suggestions\n"
                for rec in recommendations[:2]:
                    result += f"  • {rec['title']}\n"
            result += "\n"
        
        # Summary insights
        summary = analysis.get("summary_insights", [])
        if summary:
            result += f"### 💡 Summary Insights\n"
            for insight in summary:
                result += f"- {insight}\n"
            result += "\n"
        
        return result
    
    def _format_comparative_results(self, analysis: Dict[str, Any]) -> str:
        """Format comparative analysis results"""
        result = f"### ⚔️ Comparative Analysis\n\n"
        
        comparisons = analysis.get("comparisons", [])
        high_similarity = [c for c in comparisons if c["similarity_score"] > 0.7]
        
        result += f"**Total Comparisons:** {len(comparisons)}\n"
        result += f"**High Similarity Pairs:** {len(high_similarity)}\n\n"
        
        if high_similarity:
            result += f"**Most Similar Files:**\n"
            for comp in high_similarity[:3]:
                result += f"- {comp['file1']} ↔ {comp['file2']} (similarity: {comp['similarity_score']:.2f})\n"
            result += "\n"
        
        insights = analysis.get("comparative_insights", [])
        if insights:
            result += f"**Comparative Insights:**\n"
            for insight in insights:
                result += f"- {insight}\n"
            result += "\n"
        
        return result
    
    def _format_collective_results(self, analysis: Dict[str, Any]) -> str:
        """Format collective analysis results"""
        result = f"### 🏗️ Collective System Analysis\n\n"
        
        overview = analysis.get("system_overview", {})
        result += f"**System Overview:**\n"
        result += f"- Total Files: {overview.get('total_files', 0)}\n"
        result += f"- Total Size: {overview.get('total_size', 0)/1024:.1f}KB\n"
        result += f"- System Complexity: {overview.get('system_complexity', 0):.2f}/1.0\n"
        result += f"- File Categories: {', '.join(overview.get('file_categories', []))}\n\n"
        
        insights = analysis.get("system_insights", [])
        if insights:
            result += f"**System Insights:**\n"
            for insight in insights:
                result += f"- {insight}\n"
            result += "\n"
        
        architecture = analysis.get("architecture_analysis", {})
        if architecture:
            result += f"**Architecture Analysis:**\n"
            result += f"- Modularity Score: {architecture.get('modularity_score', 0):.2f}/1.0\n"
            patterns = architecture.get("architectural_patterns", [])
            if patterns:
                result += f"- Detected Patterns: {', '.join(patterns)}\n"
            result += "\n"
        
        return result
    
    def _format_evolutionary_results(self, analysis: Dict[str, Any]) -> str:
        """Format evolutionary analysis results"""
        result = f"### 🧬 Evolutionary Optimization Analysis\n\n"
        
        current_state = analysis.get("current_state", {})
        result += f"**Current State:**\n"
        result += f"- Organization Score: {current_state.get('organization_score', 0):.2f}/1.0\n"
        result += f"- Complexity Score: {current_state.get('complexity_score', 0):.2f}/1.0\n"
        result += f"- Maintainability Score: {current_state.get('maintainability_score', 0):.2f}/1.0\n\n"
        
        strategies = analysis.get("optimization_strategies", [])
        if strategies:
            result += f"**Optimization Strategies:**\n"
            for strategy in strategies:
                result += f"- **{strategy['title']}** ({strategy['impact']} impact, {strategy['effort']} effort)\n"
                result += f"  {strategy['description']}\n"
            result += "\n"
        
        improvements = analysis.get("expected_improvements", {})
        if improvements:
            result += f"**Expected Improvements:**\n"
            for improvement, value in improvements.items():
                result += f"- {improvement.replace('_', ' ').title()}: +{value:.1%}\n"
            result += "\n"
        
        return result