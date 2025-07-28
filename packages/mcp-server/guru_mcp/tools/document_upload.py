"""
Document Upload Tool - Upload and analyze documents using Guru's cognitive systems
"""

import asyncio
import base64
import os
import tempfile
import mimetypes
from pathlib import Path
from typing import Any, Dict, List, Optional
from loguru import logger
import hashlib


class DocumentUploadTool:
    """
    Upload and analyze documents directly through MCP with cognitive enhancement
    """
    
    def __init__(self, core_bridge, phi4_wingman):
        self.core_bridge = core_bridge
        self.phi4_wingman = phi4_wingman
        self.name = "guru_upload_documents"
        
        # Supported file types for upload
        self.supported_mime_types = {
            # Text files
            'text/plain': '.txt',
            'text/markdown': '.md',
            'text/csv': '.csv',
            'text/html': '.html',
            'text/css': '.css',
            'text/javascript': '.js',
            
            # Document formats
            'application/json': '.json',
            'application/xml': '.xml',
            'application/yaml': '.yaml',
            'text/yaml': '.yml',
            
            # Code files (based on content)
            'application/x-python': '.py',
            'application/typescript': '.ts',
            'application/x-java': '.java',
            'application/x-c': '.c',
            'application/x-cpp': '.cpp'
        }
        
        # Maximum file size (5MB for uploads)
        self.max_upload_size = 5 * 1024 * 1024
        
        # Maximum number of files per upload batch
        self.max_files_per_batch = 10
        
        # Temporary storage for uploaded files
        self.temp_dir = Path(tempfile.gettempdir()) / "guru_uploads"
        self.temp_dir.mkdir(exist_ok=True)
        
    async def execute(self, args: Dict[str, Any]) -> str:
        """Execute document upload and analysis"""
        documents = args.get("documents", [])
        analysis_mode = args.get("analysis_mode", "comprehensive")
        cognitive_systems = args.get("cognitive_systems", ["harmonic_analysis", "quantum_synthesis"])
        preserve_files = args.get("preserve_files", False)
        batch_name = args.get("batch_name", f"upload_{int(asyncio.get_event_loop().time())}")
        
        if not documents:
            return "## Error\n\nNo documents provided for upload"
            
        if len(documents) > self.max_files_per_batch:
            return f"## Error\n\nToo many documents. Maximum allowed: {self.max_files_per_batch}"
            
        try:
            logger.info(f"📤 Processing upload batch '{batch_name}' with {len(documents)} documents")
            
            # Process uploaded documents
            processed_documents = await self._process_uploaded_documents(documents, batch_name)
            
            if not processed_documents["valid_documents"]:
                return f"## Error\n\nNo valid documents found. Issues: {', '.join(processed_documents['issues'])}"
            
            # Perform cognitive analysis on uploaded documents
            analysis_result = await self._analyze_uploaded_documents(
                processed_documents["valid_documents"], 
                analysis_mode, 
                cognitive_systems
            )
            
            # Clean up temporary files unless preservation is requested
            if not preserve_files:
                await self._cleanup_temp_files(processed_documents["valid_documents"])
            
            # Format results
            return self._format_upload_analysis_result(
                analysis_result, batch_name, len(documents), len(processed_documents["valid_documents"])
            )
            
        except Exception as e:
            logger.error(f"Document upload analysis failed: {e}")
            return f"## Error\n\nDocument upload failed: {str(e)}"
    
    async def _process_uploaded_documents(self, documents: List[Dict[str, Any]], batch_name: str) -> Dict[str, Any]:
        """Process and validate uploaded documents"""
        
        valid_documents = []
        issues = []
        
        for i, doc in enumerate(documents):
            try:
                # Extract document information
                content = doc.get("content", "")
                filename = doc.get("filename", f"document_{i+1}")
                mime_type = doc.get("mime_type", "text/plain")
                encoding = doc.get("encoding", "utf-8")
                
                # Handle base64 encoded content
                if doc.get("is_base64", False):
                    try:
                        content = base64.b64decode(content).decode(encoding)
                    except Exception as e:
                        issues.append(f"{filename}: Failed to decode base64 content - {str(e)}")
                        continue
                
                # Validate content size
                content_size = len(content.encode('utf-8'))
                if content_size > self.max_upload_size:
                    issues.append(f"{filename}: File too large ({content_size/1024/1024:.1f}MB)")
                    continue
                
                if not content.strip():
                    issues.append(f"{filename}: Empty content")
                    continue
                
                # Determine file extension
                file_extension = self.supported_mime_types.get(mime_type, '.txt')
                if not filename.endswith(file_extension) and '.' not in filename:
                    filename += file_extension
                
                # Create temporary file
                temp_file_path = self.temp_dir / f"{batch_name}_{i+1}_{filename}"
                temp_file_path.write_text(content, encoding='utf-8')
                
                # Create document info
                doc_info = {
                    "original_filename": filename,
                    "temp_path": str(temp_file_path),
                    "content": content,
                    "mime_type": mime_type,
                    "size_bytes": content_size,
                    "line_count": content.count('\n') + 1,
                    "word_count": len(content.split()),
                    "char_count": len(content),
                    "content_hash": hashlib.md5(content.encode()).hexdigest()[:8],
                    "upload_index": i + 1,
                    "category": self._categorize_content(content, mime_type, filename)
                }
                
                valid_documents.append(doc_info)
                
            except Exception as e:
                issues.append(f"Document {i+1}: Processing error - {str(e)}")
        
        return {
            "valid_documents": valid_documents,
            "issues": issues,
            "processing_summary": {
                "total_uploaded": len(documents),
                "valid_documents": len(valid_documents),
                "failed_documents": len(issues),
                "batch_name": batch_name
            }
        }
    
    def _categorize_content(self, content: str, mime_type: str, filename: str) -> str:
        """Categorize uploaded content based on content analysis"""
        
        content_lower = content.lower()
        filename_lower = filename.lower()
        
        # Code detection
        code_indicators = ['def ', 'function ', 'class ', 'import ', '#include', 'public class', 'package ', 'namespace ']
        if any(indicator in content_lower for indicator in code_indicators):
            return "code"
        
        # Configuration detection
        config_indicators = ['config', 'settings', '.json' in filename_lower, '.yaml' in filename_lower, '.yml' in filename_lower]
        if any(indicator in filename_lower for indicator in ['.json', '.yaml', '.yml', '.ini', '.conf']) or 'config' in filename_lower:
            return "configuration"
        
        # Documentation detection
        doc_indicators = ['readme', '.md' in filename_lower, '# ' in content, '## ', 'documentation']
        if any(indicator in filename_lower for indicator in doc_indicators) or content.count('# ') > 2:
            return "documentation"
        
        # Data detection
        if mime_type in ['text/csv', 'application/json'] or filename_lower.endswith(('.csv', '.json', '.xml')):
            return "data"
        
        # Research/academic detection
        academic_indicators = ['abstract', 'introduction', 'methodology', 'results', 'conclusion', 'references', 'bibliography']
        if any(indicator in content_lower for indicator in academic_indicators):
            return "academic"
        
        # Business document detection
        business_indicators = ['executive summary', 'business plan', 'proposal', 'requirements', 'specification']
        if any(indicator in content_lower for indicator in business_indicators):
            return "business"
        
        return "document"
    
    async def _analyze_uploaded_documents(self, documents: List[Dict[str, Any]], analysis_mode: str, cognitive_systems: List[str]) -> Dict[str, Any]:
        """Perform cognitive analysis on uploaded documents"""
        
        analysis_result = {
            "batch_overview": {
                "total_documents": len(documents),
                "total_size": sum(doc["size_bytes"] for doc in documents),
                "categories": self._get_category_distribution(documents),
                "analysis_mode": analysis_mode
            },
            "individual_analyses": [],
            "cross_document_insights": [],
            "knowledge_extraction": {},
            "recommendations": []
        }
        
        # Analyze each document individually
        for doc in documents:
            logger.info(f"🔍 Analyzing uploaded document: {doc['original_filename']}")
            
            doc_analysis = await self._analyze_single_uploaded_document(doc, cognitive_systems)
            analysis_result["individual_analyses"].append(doc_analysis)
            
            # Small delay between analyses
            await asyncio.sleep(0.1)
        
        # Perform cross-document analysis if multiple documents
        if len(documents) > 1:
            analysis_result["cross_document_insights"] = await self._perform_cross_document_analysis(documents, cognitive_systems)
        
        # Extract knowledge for potential RAG usage
        analysis_result["knowledge_extraction"] = await self._extract_knowledge_for_rag(documents, analysis_result["individual_analyses"])
        
        # Generate batch-level recommendations
        analysis_result["recommendations"] = self._generate_batch_recommendations(analysis_result)
        
        return analysis_result
    
    async def _analyze_single_uploaded_document(self, doc: Dict[str, Any], cognitive_systems: List[str]) -> Dict[str, Any]:
        """Analyze a single uploaded document"""
        
        doc_analysis = {
            "document_info": doc,
            "cognitive_results": {},
            "content_insights": [],
            "quality_metrics": {},
            "recommendations": []
        }
        
        content = doc["content"]
        
        # Apply selected cognitive systems
        for system in cognitive_systems:
            if system == "harmonic_analysis":
                result = await self.core_bridge.invoke_harmonic_analyzer(content, "deep")
                doc_analysis["cognitive_results"]["harmonic"] = result
                
            elif system == "quantum_synthesis":
                result = await self.core_bridge.invoke_quantum_synthesizer(
                    f"Analyze and synthesize insights from uploaded document: {doc['original_filename']}", 
                    [content[:1000]]
                )
                doc_analysis["cognitive_results"]["quantum"] = result
                
            elif system == "task_evolution":
                result = await self.core_bridge.invoke_task_evolver(
                    f"Optimize the structure and content of uploaded document: {doc['original_filename']}", 
                    []
                )
                doc_analysis["cognitive_results"]["evolution"] = result
        
        # Generate content insights based on category
        doc_analysis["content_insights"] = self._generate_content_insights(doc)
        
        # Calculate quality metrics
        doc_analysis["quality_metrics"] = self._calculate_document_quality_metrics(doc)
        
        # Generate document-specific recommendations
        doc_analysis["recommendations"] = self._generate_document_recommendations(doc_analysis)
        
        return doc_analysis
    
    def _generate_content_insights(self, doc: Dict[str, Any]) -> List[str]:
        """Generate insights based on document content and category"""
        
        insights = []
        content = doc["content"]
        category = doc["category"]
        
        # Universal insights
        insights.append(f"Document contains {doc['word_count']} words across {doc['line_count']} lines")
        
        # Category-specific insights
        if category == "code":
            function_count = content.count("def ") + content.count("function ")
            class_count = content.count("class ")
            insights.append(f"Code structure: {function_count} functions, {class_count} classes detected")
            
        elif category == "documentation":
            header_count = content.count("# ") + content.count("## ")
            insights.append(f"Documentation structure: {header_count} headers detected")
            
        elif category == "academic":
            section_keywords = ["introduction", "methodology", "results", "conclusion"]
            sections_found = [kw for kw in section_keywords if kw in content.lower()]
            insights.append(f"Academic structure: {len(sections_found)} standard sections found")
            
        elif category == "data":
            if content.startswith("{") or content.startswith("["):
                insights.append("Structured data format detected (JSON-like)")
            elif "," in content and "\n" in content:
                insights.append("Tabular data format detected (CSV-like)")
        
        # Content complexity
        unique_words = len(set(content.lower().split()))
        vocabulary_richness = unique_words / max(doc["word_count"], 1)
        
        if vocabulary_richness > 0.6:
            insights.append("High vocabulary diversity indicates complex or technical content")
        elif vocabulary_richness < 0.3:
            insights.append("Low vocabulary diversity indicates repetitive or simple content")
        
        return insights
    
    def _calculate_document_quality_metrics(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate quality metrics for the document"""
        
        content = doc["content"]
        
        # Readability metrics (simplified)
        sentences = len([s for s in content.split('.') if s.strip()])
        avg_sentence_length = doc["word_count"] / max(sentences, 1)
        
        # Structure metrics
        paragraph_count = len([p for p in content.split('\n\n') if p.strip()])
        avg_paragraph_length = doc["word_count"] / max(paragraph_count, 1)
        
        # Content density
        punctuation_count = sum(content.count(p) for p in '.,!?;:"')
        punctuation_density = punctuation_count / max(doc["char_count"], 1)
        
        return {
            "readability": {
                "avg_sentence_length": avg_sentence_length,
                "sentence_count": sentences,
                "readability_score": max(0.0, min(1.0, 1.0 - (avg_sentence_length - 15) / 20))
            },
            "structure": {
                "paragraph_count": paragraph_count,
                "avg_paragraph_length": avg_paragraph_length,
                "structure_score": min(1.0, paragraph_count / 10.0)
            },
            "content_density": {
                "punctuation_density": punctuation_density,
                "density_score": min(1.0, punctuation_density * 20)
            },
            "overall_quality": 0.75  # Placeholder for more sophisticated calculation
        }
    
    def _generate_document_recommendations(self, doc_analysis: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate recommendations for improving the document"""
        
        recommendations = []
        doc = doc_analysis["document_info"]
        quality = doc_analysis["quality_metrics"]
        
        # Size-based recommendations
        if doc["size_bytes"] > 100000:  # 100KB
            recommendations.append({
                "type": "structure",
                "priority": "medium",
                "title": "Consider Breaking Down Large Document",
                "description": f"Document is {doc['size_bytes']/1024:.0f}KB - consider splitting into smaller sections"
            })
        
        # Quality-based recommendations
        if quality["readability"]["avg_sentence_length"] > 25:
            recommendations.append({
                "type": "readability",
                "priority": "low",
                "title": "Improve Sentence Length",
                "description": "Average sentence length is high - consider shorter, clearer sentences"
            })
        
        if quality["structure"]["paragraph_count"] < 3 and doc["word_count"] > 500:
            recommendations.append({
                "type": "structure",
                "priority": "medium",
                "title": "Add Paragraph Breaks",
                "description": "Document would benefit from better paragraph structure"
            })
        
        # Category-specific recommendations
        if doc["category"] == "documentation" and doc["content"].count("# ") < 2:
            recommendations.append({
                "type": "documentation",
                "priority": "medium",
                "title": "Add More Headers",
                "description": "Documentation would benefit from clearer section headers"
            })
        
        return recommendations
    
    async def _perform_cross_document_analysis(self, documents: List[Dict[str, Any]], cognitive_systems: List[str]) -> List[str]:
        """Perform analysis across multiple uploaded documents"""
        
        insights = []
        
        # Content similarity analysis
        categories = [doc["category"] for doc in documents]
        category_counts = {}
        for cat in categories:
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        if len(category_counts) == 1:
            insights.append(f"All documents are of the same type ({list(category_counts.keys())[0]}) - consistent document set")
        else:
            insights.append(f"Mixed document types: {', '.join(f'{cat}({count})' for cat, count in category_counts.items())}")
        
        # Size distribution analysis
        sizes = [doc["size_bytes"] for doc in documents]
        size_variance = max(sizes) / min(sizes) if min(sizes) > 0 else 1
        
        if size_variance > 10:
            insights.append("Significant size variation between documents suggests different content types or purposes")
        
        # Content overlap analysis (simplified)
        all_words = set()
        for doc in documents:
            all_words.update(doc["content"].lower().split())
        
        common_words = set()
        for doc in documents:
            doc_words = set(doc["content"].lower().split())
            if not common_words:
                common_words = doc_words
            else:
                common_words = common_words.intersection(doc_words)
        
        overlap_ratio = len(common_words) / len(all_words) if all_words else 0
        
        if overlap_ratio > 0.3:
            insights.append(f"High content overlap ({overlap_ratio:.1%}) suggests related or complementary documents")
        elif overlap_ratio < 0.1:
            insights.append("Low content overlap suggests documents cover different topics or domains")
        
        return insights
    
    async def _extract_knowledge_for_rag(self, documents: List[Dict[str, Any]], individual_analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract knowledge from documents for potential RAG system usage"""
        
        knowledge_extraction = {
            "key_concepts": [],
            "important_entities": [],
            "document_summaries": [],
            "cross_references": [],
            "knowledge_graph_nodes": []
        }
        
        for doc, analysis in zip(documents, individual_analyses):
            # Extract key concepts (simplified approach)
            content = doc["content"]
            words = content.lower().split()
            
            # Find frequently mentioned terms (potential key concepts)
            word_freq = {}
            for word in words:
                if len(word) > 4 and word.isalpha():  # Filter out short/non-alpha words
                    word_freq[word] = word_freq.get(word, 0) + 1
            
            # Top concepts for this document
            top_concepts = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
            
            knowledge_extraction["key_concepts"].extend([
                {
                    "concept": concept,
                    "frequency": freq,
                    "source_document": doc["original_filename"],
                    "category": doc["category"]
                }
                for concept, freq in top_concepts if freq > 2
            ])
            
            # Generate document summary (first paragraph or first 200 words)
            first_paragraph = content.split('\n\n')[0] if '\n\n' in content else content
            summary = ' '.join(first_paragraph.split()[:200])
            
            knowledge_extraction["document_summaries"].append({
                "document": doc["original_filename"],
                "summary": summary,
                "category": doc["category"],
                "word_count": doc["word_count"]
            })
            
            # Create knowledge graph nodes
            knowledge_extraction["knowledge_graph_nodes"].append({
                "id": doc["content_hash"],
                "title": doc["original_filename"],
                "type": doc["category"],
                "content_preview": content[:300] + "..." if len(content) > 300 else content,
                "metadata": {
                    "size": doc["size_bytes"],
                    "word_count": doc["word_count"],
                    "upload_index": doc["upload_index"]
                }
            })
        
        return knowledge_extraction
    
    def _get_category_distribution(self, documents: List[Dict[str, Any]]) -> Dict[str, int]:
        """Get distribution of document categories"""
        categories = {}
        for doc in documents:
            cat = doc["category"]
            categories[cat] = categories.get(cat, 0) + 1
        return categories
    
    def _generate_batch_recommendations(self, analysis_result: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate recommendations for the entire document batch"""
        
        recommendations = []
        overview = analysis_result["batch_overview"]
        
        # Batch size recommendations
        if overview["total_documents"] > 5:
            recommendations.append({
                "type": "organization",
                "priority": "medium",
                "title": "Consider Document Grouping",
                "description": f"Large batch ({overview['total_documents']} documents) - consider grouping by topic or purpose"
            })
        
        # Category diversity recommendations
        categories = overview["categories"]
        if len(categories) > 3:
            recommendations.append({
                "type": "organization",
                "priority": "low",
                "title": "High Category Diversity",
                "description": f"Documents span {len(categories)} categories - ensure logical organization"
            })
        
        # Size recommendations
        total_size_mb = overview["total_size"] / 1024 / 1024
        if total_size_mb > 10:
            recommendations.append({
                "type": "performance",
                "priority": "medium",
                "title": "Large Document Set",
                "description": f"Total size ({total_size_mb:.1f}MB) may impact processing - consider batch processing"
            })
        
        return recommendations
    
    async def _cleanup_temp_files(self, documents: List[Dict[str, Any]]):
        """Clean up temporary files created during upload processing"""
        
        for doc in documents:
            try:
                temp_path = Path(doc["temp_path"])
                if temp_path.exists():
                    temp_path.unlink()
                    logger.debug(f"Cleaned up temp file: {temp_path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file {doc['temp_path']}: {e}")
    
    def _format_upload_analysis_result(self, analysis: Dict[str, Any], batch_name: str, total_uploaded: int, valid_documents: int) -> str:
        """Format document upload analysis results"""
        
        result = f"## 📤 Guru Document Upload Analysis\n\n"
        result += f"**Batch Name:** {batch_name}\n"
        result += f"**Documents Uploaded:** {total_uploaded}\n"
        result += f"**Successfully Processed:** {valid_documents}\n"
        result += f"**Total Size:** {analysis['batch_overview']['total_size']/1024:.1f}KB\n\n"
        
        # Category distribution
        categories = analysis["batch_overview"]["categories"]
        if categories:
            result += f"### 📊 Document Categories\n"
            for category, count in categories.items():
                result += f"- **{category.title()}:** {count} documents\n"
            result += "\n"
        
        # Individual document highlights
        result += f"### 📄 Document Analysis Highlights\n"
        for doc_analysis in analysis["individual_analyses"][:3]:  # Show first 3
            doc_info = doc_analysis["document_info"]
            result += f"**{doc_info['original_filename']}** ({doc_info['category']})\n"
            result += f"- Size: {doc_info['size_bytes']/1024:.1f}KB, Words: {doc_info['word_count']}\n"
            
            insights = doc_analysis.get("content_insights", [])
            if insights:
                result += f"- Key Insight: {insights[0]}\n"
            
            recommendations = doc_analysis.get("recommendations", [])
            if recommendations:
                result += f"- Recommendation: {recommendations[0]['title']}\n"
            result += "\n"
        
        # Cross-document insights
        cross_insights = analysis.get("cross_document_insights", [])
        if cross_insights:
            result += f"### 🔗 Cross-Document Insights\n"
            for insight in cross_insights[:3]:
                result += f"- {insight}\n"
            result += "\n"
        
        # Knowledge extraction summary
        knowledge = analysis.get("knowledge_extraction", {})
        if knowledge:
            result += f"### 🧠 Knowledge Extraction\n"
            key_concepts = knowledge.get("key_concepts", [])
            if key_concepts:
                top_concepts = sorted(key_concepts, key=lambda x: x["frequency"], reverse=True)[:5]
                result += f"**Top Concepts:** {', '.join([c['concept'] for c in top_concepts])}\n"
            
            summaries = knowledge.get("document_summaries", [])
            result += f"**Document Summaries:** {len(summaries)} generated\n"
            result += f"**Knowledge Graph Nodes:** {len(knowledge.get('knowledge_graph_nodes', []))} created\n\n"
        
        # Batch recommendations
        recommendations = analysis.get("recommendations", [])
        if recommendations:
            result += f"### 💡 Batch Recommendations\n"
            for rec in recommendations[:3]:
                priority_emoji = "🔴" if rec["priority"] == "high" else "🟡" if rec["priority"] == "medium" else "🟢"
                result += f"{priority_emoji} **{rec['title']}** ({rec['type']})\n"
                result += f"   {rec['description']}\n\n"
        
        result += f"---\n"
        result += f"*Document upload enables direct analysis of user files with cognitive enhancement and knowledge extraction for potential RAG usage.*"
        
        return result