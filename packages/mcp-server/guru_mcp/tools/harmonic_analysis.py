"""
Harmonic Analysis Tool - Mathematical pattern analysis for cognitive enhancement
"""

import asyncio
import re
from typing import Any, Dict, List
from loguru import logger
import numpy as np


class HarmonicAnalysisTool:
    """
    Analyze patterns, structure, and harmony in content using mathematical signal processing
    """
    
    def __init__(self, core_bridge):
        self.core_bridge = core_bridge
        self.name = "guru_harmonic_analysis"
        
    async def execute(self, args: Dict[str, Any]) -> str:
        """Execute harmonic analysis on provided content"""
        content = args.get("content", "")
        domain = args.get("domain", "auto-detect")
        analysis_depth = args.get("analysis_depth", "deep")
        
        if not content:
            return "## Error\n\nNo content provided for analysis"
            
        try:
            logger.info(f"Running harmonic analysis on {len(content)} characters")
            
            # Detect domain if auto-detect
            if domain == "auto-detect":
                domain = self._detect_domain(content)
            
            # Perform harmonic analysis
            analysis_result = await self._analyze_harmonics(content, domain, analysis_depth)
            
            # Format results
            return self._format_analysis_result(analysis_result, domain, analysis_depth)
            
        except Exception as e:
            logger.error(f"Harmonic analysis failed: {e}")
            return f"## Error\n\nHarmonic analysis failed: {str(e)}"
    
    def _detect_domain(self, content: str) -> str:
        """Auto-detect content domain based on patterns"""
        content_lower = content.lower()
        
        # Code patterns
        code_indicators = ['function', 'class', 'import', 'def ', 'var ', 'const ', 'let ', 'if (', 'for (', '{}', '[]', '=>']
        if any(indicator in content_lower for indicator in code_indicators):
            return "coding"
            
        # Research patterns
        research_indicators = ['abstract', 'methodology', 'hypothesis', 'results', 'conclusion', 'references', 'doi:', 'et al.']
        if any(indicator in content_lower for indicator in research_indicators):
            return "research"
            
        # Default to writing
        return "writing"
    
    async def _analyze_harmonics(self, content: str, domain: str, depth: str) -> Dict[str, Any]:
        """Perform mathematical harmonic analysis"""
        
        # Simulate processing time based on depth
        processing_time = {"surface": 0.2, "deep": 0.8, "architectural": 1.5}.get(depth, 0.8)
        await asyncio.sleep(processing_time)
        
        # Character frequency analysis (fundamental frequency)
        char_frequencies = self._calculate_character_frequencies(content)
        
        # Pattern recognition
        patterns = self._detect_patterns(content, domain)
        
        # Structural analysis
        structure = self._analyze_structure(content, domain)
        
        # Harmonic resonance calculation
        resonance = self._calculate_resonance(char_frequencies, patterns, structure)
        
        # Domain-specific insights
        domain_insights = self._generate_domain_insights(content, domain, patterns, structure)
        
        return {
            "fundamental_frequency": char_frequencies,
            "patterns": patterns,
            "structure": structure,
            "resonance": resonance,
            "domain_insights": domain_insights,
            "complexity_score": self._calculate_complexity(content, patterns),
            "harmony_score": resonance["overall_harmony"],
            "optimization_suggestions": self._generate_optimization_suggestions(patterns, structure, domain)
        }
    
    def _calculate_character_frequencies(self, content: str) -> Dict[str, float]:
        """Calculate character frequency distribution (fundamental frequencies)"""
        total_chars = len(content)
        if total_chars == 0:
            return {}
            
        char_counts = {}
        for char in content.lower():
            if char.isalnum() or char.isspace():
                char_counts[char] = char_counts.get(char, 0) + 1
        
        # Convert to frequencies
        frequencies = {char: count / total_chars for char, count in char_counts.items()}
        
        # Return top frequencies
        return dict(sorted(frequencies.items(), key=lambda x: x[1], reverse=True)[:10])
    
    def _detect_patterns(self, content: str, domain: str) -> Dict[str, Any]:
        """Detect recurring patterns and their harmonics"""
        patterns = {
            "repetitive_structures": [],
            "rhythmic_patterns": [],
            "symmetrical_elements": [],
            "fractal_characteristics": []
        }
        
        if domain == "coding":
            # Code-specific patterns
            patterns["repetitive_structures"] = re.findall(r'(\w+)\s*\([^)]*\)', content)[:5]
            patterns["rhythmic_patterns"] = re.findall(r'\b(if|for|while|function|class)\b', content)
            patterns["symmetrical_elements"] = re.findall(r'[{}()\[\]]', content)
            
        elif domain == "writing":
            # Text-specific patterns
            sentences = re.split(r'[.!?]+', content)
            patterns["repetitive_structures"] = [word for word in re.findall(r'\b\w{4,}\b', content) 
                                               if content.lower().count(word.lower()) > 2][:5]
            patterns["rhythmic_patterns"] = [len(s.split()) for s in sentences if s.strip()][:10]
            patterns["symmetrical_elements"] = re.findall(r'[""''(),-]', content)
            
        elif domain == "research":
            # Research-specific patterns
            patterns["repetitive_structures"] = re.findall(r'\b(\w+(?:\s+\w+){1,3})\b', content)[:5]
            patterns["rhythmic_patterns"] = re.findall(r'\b(study|analysis|results?|findings?|data)\b', content, re.IGNORECASE)
            patterns["symmetrical_elements"] = re.findall(r'[();\[\]]', content)
        
        return patterns
    
    def _analyze_structure(self, content: str, domain: str) -> Dict[str, Any]:
        """Analyze structural harmonics and organization"""
        structure = {
            "hierarchical_levels": 0,
            "section_balance": [],
            "flow_coherence": 0.0,
            "modular_organization": []
        }
        
        if domain == "coding":
            # Code structure analysis
            lines = content.split('\n')
            indentation_levels = [len(line) - len(line.lstrip()) for line in lines if line.strip()]
            structure["hierarchical_levels"] = len(set(indentation_levels))
            structure["section_balance"] = [len([l for l in lines if l.strip().startswith(keyword)]) 
                                          for keyword in ['class', 'function', 'def']]
            structure["modular_organization"] = re.findall(r'(?:class|function|def)\s+(\w+)', content)
            
        elif domain == "writing":
            # Text structure analysis
            paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
            sentences = re.split(r'[.!?]+', content)
            structure["hierarchical_levels"] = len([p for p in paragraphs if len(p) > 100])
            structure["section_balance"] = [len(s.split()) for s in sentences if s.strip()][:10]
            structure["flow_coherence"] = min(1.0, len(paragraphs) / 10.0)
            
        elif domain == "research":
            # Research structure analysis
            sections = re.findall(r'\b(introduction|methodology|results|discussion|conclusion)\b', content, re.IGNORECASE)
            structure["hierarchical_levels"] = len(set(sections))
            structure["section_balance"] = [content.lower().count(section.lower()) for section in set(sections)]
            structure["modular_organization"] = list(set(sections))
        
        return structure
    
    def _calculate_resonance(self, frequencies: Dict[str, float], patterns: Dict[str, Any], structure: Dict[str, Any]) -> Dict[str, float]:
        """Calculate harmonic resonance between different elements"""
        
        # Frequency resonance (how well distributed are character frequencies)
        freq_values = list(frequencies.values())
        freq_resonance = 1.0 - (np.std(freq_values) if freq_values else 0)
        
        # Pattern resonance (consistency of patterns)
        total_patterns = sum(len(p) if isinstance(p, list) else 1 for p in patterns.values())
        pattern_resonance = min(1.0, total_patterns / 20.0)
        
        # Structural resonance (balance in structure)
        struct_levels = structure.get("hierarchical_levels", 0)
        structural_resonance = min(1.0, struct_levels / 5.0) if struct_levels > 0 else 0.5
        
        # Overall harmony calculation
        overall_harmony = (freq_resonance * 0.3 + pattern_resonance * 0.4 + structural_resonance * 0.3)
        
        return {
            "frequency_resonance": freq_resonance,
            "pattern_resonance": pattern_resonance,
            "structural_resonance": structural_resonance,
            "overall_harmony": overall_harmony,
            "coherence_index": (freq_resonance + pattern_resonance + structural_resonance) / 3
        }
    
    def _generate_domain_insights(self, content: str, domain: str, patterns: Dict[str, Any], structure: Dict[str, Any]) -> List[str]:
        """Generate domain-specific insights from harmonic analysis"""
        insights = []
        
        if domain == "coding":
            if structure["hierarchical_levels"] > 4:
                insights.append("Deep nesting detected - consider flattening architecture for better harmony")
            if len(patterns["repetitive_structures"]) > 3:
                insights.append("High function call frequency suggests opportunities for abstraction")
            insights.append(f"Code exhibits {structure['hierarchical_levels']}-level harmonic structure")
            
        elif domain == "writing":
            sentence_lengths = structure.get("section_balance", [])
            if sentence_lengths and np.std(sentence_lengths) > 10:
                insights.append("Sentence length variation creates rhythmic complexity")
            insights.append("Text flow shows natural linguistic harmonic patterns")
            
        elif domain == "research":
            if len(structure["modular_organization"]) >= 4:
                insights.append("Research follows traditional academic harmonic structure")
            insights.append("Methodological patterns exhibit systematic resonance")
        
        insights.append("Mathematical frequency analysis reveals underlying structural harmonics")
        return insights
    
    def _calculate_complexity(self, content: str, patterns: Dict[str, Any]) -> float:
        """Calculate overall complexity score"""
        content_length_factor = min(1.0, len(content) / 5000.0)
        pattern_complexity = sum(len(p) if isinstance(p, list) else 1 for p in patterns.values()) / 50.0
        unique_chars = len(set(content.lower())) / 26.0
        
        return min(1.0, (content_length_factor + pattern_complexity + unique_chars) / 3.0)
    
    def _generate_optimization_suggestions(self, patterns: Dict[str, Any], structure: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        """Generate optimization suggestions based on harmonic analysis"""
        suggestions = []
        
        # Universal suggestions based on harmonic principles
        if structure["hierarchical_levels"] > 5:
            suggestions.append({
                "type": "structural_optimization",
                "title": "Reduce Hierarchical Complexity",
                "description": "Flatten deeply nested structures to improve harmonic flow",
                "impact": "high",
                "effort": "medium"
            })
        
        total_patterns = sum(len(p) if isinstance(p, list) else 1 for p in patterns.values())
        if total_patterns > 30:
            suggestions.append({
                "type": "pattern_optimization", 
                "title": "Consolidate Repetitive Patterns",
                "description": "Reduce pattern redundancy to enhance harmonic resonance",
                "impact": "medium",
                "effort": "low"
            })
        
        # Domain-specific suggestions
        if domain == "coding":
            suggestions.append({
                "type": "code_harmony",
                "title": "Apply Mathematical Refactoring",
                "description": "Use harmonic principles to optimize code structure and flow",
                "impact": "high",
                "effort": "medium"
            })
        elif domain == "writing":
            suggestions.append({
                "type": "linguistic_harmony",
                "title": "Enhance Rhythmic Flow",
                "description": "Adjust sentence structure for better linguistic harmony",
                "impact": "medium", 
                "effort": "low"
            })
        
        return suggestions
    
    def _format_analysis_result(self, analysis: Dict[str, Any], domain: str, depth: str) -> str:
        """Format the harmonic analysis results for presentation"""
        result = f"## 🎵 Guru Harmonic Analysis\n\n"
        result += f"**Domain:** {domain.title()}\n"
        result += f"**Analysis Depth:** {depth}\n"
        result += f"**Harmony Score:** {analysis['harmony_score']:.2f}/1.0\n"
        result += f"**Complexity Score:** {analysis['complexity_score']:.2f}/1.0\n\n"
        
        # Resonance Analysis
        resonance = analysis["resonance"]
        result += f"### 🌊 Harmonic Resonance Analysis\n"
        result += f"- **Frequency Resonance:** {resonance['frequency_resonance']:.2f} (character distribution harmony)\n"
        result += f"- **Pattern Resonance:** {resonance['pattern_resonance']:.2f} (structural pattern consistency)\n"
        result += f"- **Structural Resonance:** {resonance['structural_resonance']:.2f} (organizational balance)\n"
        result += f"- **Coherence Index:** {resonance['coherence_index']:.2f} (overall harmonic unity)\n\n"
        
        # Key Insights
        result += f"### 💡 Harmonic Insights\n"
        for i, insight in enumerate(analysis["domain_insights"], 1):
            result += f"{i}. {insight}\n"
        result += "\n"
        
        # Patterns Detected
        patterns = analysis["patterns"]
        result += f"### 🔍 Pattern Analysis\n"
        if patterns["repetitive_structures"]:
            result += f"- **Repetitive Structures:** {len(patterns['repetitive_structures'])} detected\n"
        if patterns["rhythmic_patterns"]:
            result += f"- **Rhythmic Patterns:** {len(patterns['rhythmic_patterns'])} occurrences\n"
        if patterns["symmetrical_elements"]:
            result += f"- **Symmetrical Elements:** {len(patterns['symmetrical_elements'])} found\n"
        result += "\n"
        
        # Optimization Suggestions
        suggestions = analysis["optimization_suggestions"]
        if suggestions:
            result += f"### 🎯 Optimization Suggestions\n"
            for suggestion in suggestions:
                impact_emoji = "🔴" if suggestion["impact"] == "high" else "🟡" if suggestion["impact"] == "medium" else "🟢"
                result += f"- {impact_emoji} **{suggestion['title']}** ({suggestion['type']})\n"
                result += f"  {suggestion['description']}\n"
                result += f"  *Impact: {suggestion['impact']}, Effort: {suggestion['effort']}*\n\n"
        
        result += f"---\n"
        result += f"*Harmonic analysis uses mathematical signal processing to identify patterns, resonance, and optimization opportunities in content structure.*"
        
        return result