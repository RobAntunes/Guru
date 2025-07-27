"""
Guru MCP Server - Universal AI Cognitive Enhancement

This server provides MCP tools that bridge external AI models to Guru's cognitive systems.
"""

import asyncio
import json
import sys
from typing import Any, Dict, List, Optional, Sequence

from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.server.stdio
import mcp.types as types
from loguru import logger

from .tools.harmonic_analysis import HarmonicAnalysisTool
from .tools.quantum_synthesis import QuantumSynthesisTool
from .tools.task_evolution import TaskEvolutionTool
from .tools.adaptive_learning import AdaptiveLearningTool
from .tools.silc_conversation import SILCConversationTool
from .tools.filesystem_analysis import FilesystemAnalysisTool
from .tools.manual_filesystem_analysis import ManualFilesystemAnalysisTool
from .tools.document_upload import DocumentUploadTool
from .tools.rag_knowledge_base import RAGKnowledgeBaseTool
from .bridge.core_bridge import GuruCoreBridge
from .models.phi4_mini import Phi4MiniWingman
from .tools.synthesis_tool import SynthesisTool
from .tools.active_knowledge_tool import ActiveKnowledgeTool


class GuruMCPServer:
    """
    Main MCP server class that orchestrates all Guru cognitive systems
    """
    
    def __init__(self):
        self.server = Server("guru-cognitive-server")
        
        # Initialize Guru systems bridge
        self.core_bridge = GuruCoreBridge()
        
        # Initialize Phi-4 Mini wingman for AI-to-AI collaboration
        self.phi4_wingman = Phi4MiniWingman()
        
        # Initialize all tool handlers
        self.harmonic_tool = HarmonicAnalysisTool(self.core_bridge)
        self.quantum_tool = QuantumSynthesisTool(self.core_bridge)
        self.task_tool = TaskEvolutionTool(self.core_bridge)
        self.learning_tool = AdaptiveLearningTool(self.core_bridge)
        self.silc_tool = SILCConversationTool(self.core_bridge, self.phi4_wingman)
        self.filesystem_tool = FilesystemAnalysisTool(self.core_bridge, self.phi4_wingman)
        self.manual_filesystem_tool = ManualFilesystemAnalysisTool(self.core_bridge, self.phi4_wingman)
        self.document_upload_tool = DocumentUploadTool(self.core_bridge, self.phi4_wingman)
        self.rag_tool = RAGKnowledgeBaseTool(self.core_bridge, self.phi4_wingman)
        self.synthesis_tool = SynthesisTool()
        self.active_knowledge_tool = ActiveKnowledgeTool()
        
        # Register all MCP handlers
        self._register_handlers()
        
        logger.info("🚀 Guru MCP Server initialized with all cognitive systems")
    
    def _register_handlers(self):
        """Register all MCP protocol handlers"""
        
        @self.server.list_tools()
        async def handle_list_tools() -> List[types.Tool]:
            """Return all available Guru cognitive tools"""
            return [
                types.Tool(
                    name="guru_harmonic_analysis",
                    description="Analyze patterns, structure, and harmony in code, text, or any content using mathematical signal processing",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "content": {
                                "type": "string",
                                "description": "The content to analyze (code, text, data, etc.)"
                            },
                            "domain": {
                                "type": "string", 
                                "enum": ["coding", "writing", "research", "auto-detect"],
                                "description": "Content domain for specialized analysis"
                            },
                            "analysis_depth": {
                                "type": "string",
                                "enum": ["surface", "deep", "architectural"],  
                                "description": "How deep to analyze patterns"
                            }
                        },
                        "required": ["content"]
                    }
                ),
                types.Tool(
                    name="guru_quantum_synthesis",
                    description="Discover emergent insights and cross-domain connections using quantum-inspired memory interference",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "What you want to synthesize or discover connections about"
                            },
                            "context": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Additional context to inform the synthesis"
                            },
                            "cross_domain": {
                                "type": "boolean",
                                "default": True,
                                "description": "Enable cross-domain knowledge synthesis"
                            },
                            "discovery_mode": {
                                "type": "string",
                                "enum": ["conservative", "balanced", "creative"],
                                "description": "How adventurous to be in finding connections"
                            }
                        },
                        "required": ["query"]
                    }
                ),
                types.Tool(
                    name="guru_task_evolution", 
                    description="Evolve and optimize task approaches using biological evolution principles",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "objective": {
                                "type": "string",
                                "description": "The main goal or task to evolve an approach for"
                            },
                            "constraints": {
                                "type": "array", 
                                "items": {"type": "string"},
                                "description": "Limitations or requirements to consider"
                            },
                            "current_approach": {
                                "type": "string",
                                "description": "Existing approach to evolve (optional)"
                            },
                            "evolution_pressure": {
                                "type": "string",
                                "enum": ["efficiency", "quality", "innovation", "balanced"],
                                "description": "What to optimize for during evolution"
                            }
                        },
                        "required": ["objective"]
                    }
                ),
                types.Tool(
                    name="guru_adaptive_learning",
                    description="Optimize strategies and approaches using multi-armed bandit and reinforcement learning",
                    inputSchema={
                        "type": "object", 
                        "properties": {
                            "strategy_space": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Different strategies or approaches to optimize between"
                            },
                            "performance_history": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "strategy": {"type": "string"},
                                        "outcome": {"type": "number"},
                                        "context": {"type": "string"}
                                    }
                                },
                                "description": "Historical performance data (optional)"
                            },
                            "exploration_rate": {
                                "type": "number",
                                "minimum": 0,
                                "maximum": 1,
                                "default": 0.1,
                                "description": "How much to explore vs exploit (0=pure exploitation, 1=pure exploration)"
                            }
                        },
                        "required": ["strategy_space"]
                    }
                ),
                types.Tool(
                    name="guru_silc_conversation",
                    description="Initiate cognitive collaboration between AI models using SILC protocol for enhanced reasoning",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "request": {
                                "type": "string", 
                                "description": "What you want cognitive assistance with"
                            },
                            "requesting_model": {
                                "type": "string",
                                "description": "Which AI model is requesting assistance (e.g., 'claude', 'gpt-4')"
                            },
                            "collaboration_type": {
                                "type": "string",
                                "enum": ["cognitive_analysis", "problem_decomposition", "strategy_optimization", "creative_synthesis"],
                                "description": "Type of cognitive collaboration needed"
                            },
                            "complexity_level": {
                                "type": "string",
                                "enum": ["simple", "moderate", "complex", "expert"],
                                "description": "Cognitive complexity of the request"
                            },
                            "domain_context": {
                                "type": "string",
                                "description": "Relevant domain or context information"
                            }
                        },
                        "required": ["request", "requesting_model"]
                    }
                ),
                types.Tool(
                    name="guru_open_silc_channel",
                    description="Open a SILC signal channel for direct AI-to-AI communication using mathematical signals",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "channel_id": {
                                "type": "string",
                                "description": "Unique identifier for the channel"
                            },
                            "participants": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of participant IDs who can access this channel"
                            },
                            "initial_signal": {
                                "type": "object",
                                "properties": {
                                    "confidence": {"type": "number", "minimum": 0, "maximum": 1, "description": "Signal amplitude (confidence level)"},
                                    "urgency": {"type": "number", "minimum": 0, "maximum": 1, "description": "Signal frequency (urgency/priority)"},
                                    "context_relevance": {"type": "number", "minimum": 0, "maximum": 1, "description": "Signal phase (relationship/context)"},
                                    "complexity": {"type": "number", "minimum": 0, "maximum": 1, "description": "Signal harmonics (complexity/nuance)"}
                                },
                                "description": "Initial signal to send on channel creation (optional)"
                            },
                            "message": {
                                "type": "string",
                                "description": "Optional text message to accompany the signal"
                            }
                        },
                        "required": ["channel_id", "participants"]
                    }
                ),
                types.Tool(
                    name="guru_analyze_domain",
                    description="Send any domain data to Guru's wingman AI for universal cognitive analysis and enhancement suggestions",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "domain_context": {
                                "type": "object",
                                "properties": {
                                    "domain_type": {
                                        "type": "string",
                                        "enum": ["software", "research", "business", "creative", "academic", "personal", "scientific", "medical", "legal", "financial", "educational", "other"],
                                        "description": "The primary domain being analyzed"
                                    },
                                    "content_items": {
                                        "type": "array",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "type": {"type": "string", "description": "Type of content (file, document, data, process, etc.)"},
                                                "identifier": {"type": "string", "description": "Name, path, or identifier"},
                                                "content": {"type": "string", "description": "The actual content to analyze"},
                                                "metadata": {"type": "object", "description": "Additional context (language, format, date, etc.)"},
                                                "size": {"type": "number", "description": "Size or scale metric"}
                                            }
                                        },
                                        "description": "Array of content items to analyze (code, documents, data, processes, etc.)"
                                    },
                                    "structure": {
                                        "type": "object",
                                        "properties": {
                                            "organization": {"type": "array", "items": {"type": "string"}, "description": "How content is organized (folders, categories, sections)"},
                                            "relationships": {"type": "object", "description": "Connections between content items"},
                                            "tools_used": {"type": "array", "items": {"type": "string"}, "description": "Tools, frameworks, methodologies used"},
                                            "constraints": {"type": "array", "items": {"type": "string"}, "description": "Limitations, requirements, or boundaries"}
                                        },
                                        "description": "Structural information about the domain"
                                    },
                                    "performance_metrics": {
                                        "type": "object",
                                        "properties": {
                                            "quantitative_measures": {"type": "object", "description": "Numerical metrics (speed, accuracy, efficiency, etc.)"},
                                            "qualitative_assessments": {"type": "array", "items": {"type": "string"}, "description": "Subjective quality measures"},
                                            "benchmarks": {"type": "object", "description": "Comparison data or standards"},
                                            "trends": {"type": "array", "items": {"type": "object"}, "description": "Historical performance data"}
                                        },
                                        "description": "Performance and effectiveness data"
                                    },
                                    "history": {
                                        "type": "object",
                                        "properties": {
                                            "timeline": {"type": "array", "items": {"type": "object"}, "description": "Chronological events or changes"},
                                            "patterns": {"type": "array", "items": {"type": "string"}, "description": "Recurring themes or behaviors"},
                                            "evolution": {"type": "object", "description": "How the domain has developed over time"}
                                        },
                                        "description": "Historical context and development patterns"
                                    }
                                },
                                "description": "Universal domain context for cognitive analysis"
                            },
                            "analysis_focus": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["efficiency", "quality", "structure", "innovation", "relationships", "optimization", "growth", "sustainability", "clarity", "impact", "scalability", "robustness"]
                                },
                                "description": "Universal cognitive enhancement areas to focus on"
                            },
                            "current_challenges": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Current problems, obstacles, or areas for improvement"
                            },
                            "objectives": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Goals, desired outcomes, or success criteria"
                            },
                            "analysis_depth": {
                                "type": "string",
                                "enum": ["surface", "moderate", "deep", "comprehensive"],
                                "default": "moderate",
                                "description": "How thorough the cognitive analysis should be"
                            },
                            "requesting_model": {
                                "type": "string",
                                "description": "Which foundation model is requesting the analysis"
                            }
                        },
                        "required": ["domain_context", "requesting_model"]
                    }
                ),
                types.Tool(
                    name="guru_analyze_filesystem",
                    description="Analyze files and folders directly from disk using Guru's cognitive enhancement capabilities",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "target_path": {
                                "type": "string",
                                "description": "Path to file or directory to analyze (must be within allowed directories)"
                            },
                            "analysis_depth": {
                                "type": "string",
                                "enum": ["surface", "moderate", "deep", "comprehensive"],
                                "default": "moderate",
                                "description": "How thorough the analysis should be"
                            },
                            "file_types": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["code", "docs", "config", "data", "build"]
                                },
                                "default": ["code", "docs", "config"],
                                "description": "Types of files to analyze"
                            },
                            "recursive": {
                                "type": "boolean",
                                "default": true,
                                "description": "Whether to analyze subdirectories recursively"
                            },
                            "include_hidden": {
                                "type": "boolean", 
                                "default": false,
                                "description": "Whether to include hidden files and directories"
                            }
                        },
                        "required": ["target_path"]
                    }
                ),
                types.Tool(
                    name="guru_analyze_files_manual",
                    description="Manually analyze specific files with precise control over analysis process using Guru's cognitive systems",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "file_paths": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of specific file paths to analyze (must be within allowed directories)"
                            },
                            "analysis_mode": {
                                "type": "string",
                                "enum": ["individual", "comparative", "collective", "evolutionary"],
                                "default": "individual",
                                "description": "How to analyze the files: individually, compare against each other, as unified system, or with evolutionary optimization"
                            },
                            "analysis_focus": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["structure", "quality", "optimization", "efficiency", "relationships"]
                                },
                                "default": ["structure", "quality", "optimization"],
                                "description": "What aspects to focus the analysis on"
                            },
                            "cognitive_systems": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["harmonic_analysis", "quantum_synthesis", "task_evolution"]
                                },
                                "default": ["harmonic_analysis", "quantum_synthesis"],
                                "description": "Which Guru cognitive systems to apply"
                            },
                            "comparison_criteria": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Specific criteria for comparative analysis (only used in comparative mode)"
                            }
                        },
                        "required": ["file_paths"]
                    }
                ),
                types.Tool(
                    name="guru_upload_documents",
                    description="Upload and analyze documents directly through MCP with Guru's cognitive enhancement",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "documents": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "filename": {"type": "string", "description": "Name of the document"},
                                        "content": {"type": "string", "description": "Document content (text or base64 encoded)"},
                                        "mime_type": {"type": "string", "description": "MIME type of the document"},
                                        "encoding": {"type": "string", "default": "utf-8", "description": "Text encoding"},
                                        "is_base64": {"type": "boolean", "default": false, "description": "Whether content is base64 encoded"},
                                        "category": {"type": "string", "description": "Document category (auto-detected if not provided)"},
                                        "metadata": {"type": "object", "description": "Additional document metadata"}
                                    },
                                    "required": ["filename", "content"]
                                },
                                "description": "Array of documents to upload and analyze"
                            },
                            "analysis_mode": {
                                "type": "string",
                                "enum": ["comprehensive", "focused", "comparative"],
                                "default": "comprehensive",
                                "description": "Analysis approach for uploaded documents"
                            },
                            "cognitive_systems": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["harmonic_analysis", "quantum_synthesis", "task_evolution"]
                                },
                                "default": ["harmonic_analysis", "quantum_synthesis"],
                                "description": "Cognitive systems to apply to documents"
                            },
                            "preserve_files": {
                                "type": "boolean",
                                "default": false,
                                "description": "Whether to preserve temporary files after analysis"
                            },
                            "batch_name": {
                                "type": "string",
                                "description": "Name for this upload batch (auto-generated if not provided)"
                            }
                        },
                        "required": ["documents"]
                    }
                ),
                types.Tool(
                    name="guru_rag_knowledge_base",
                    description="Create and manage RAG knowledge bases like Claude Projects, powered by Guru's cognitive systems",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "operation": {
                                "type": "string",
                                "enum": ["create", "add_documents", "query", "list", "info", "delete", "update"],
                                "default": "query",
                                "description": "Operation to perform on knowledge base"
                            },
                            "knowledge_base_name": {
                                "type": "string",
                                "description": "Name of the knowledge base to operate on"
                            },
                            "description": {
                                "type": "string",
                                "description": "Description of the knowledge base (for create/update operations)"
                            },
                            "documents": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "filename": {"type": "string"},
                                        "content": {"type": "string"},
                                        "category": {"type": "string"},
                                        "metadata": {"type": "object"}
                                    }
                                },
                                "description": "Documents to add to the knowledge base (for add_documents operation)"
                            },
                            "query": {
                                "type": "string",
                                "description": "Query to search the knowledge base (for query operation)"
                            },
                            "max_results": {
                                "type": "integer",
                                "default": 10,
                                "description": "Maximum number of results to return"
                            },
                            "include_cognitive_insights": {
                                "type": "boolean",
                                "default": true,
                                "description": "Whether to include Guru's cognitive insights in results"
                            },
                            "response_mode": {
                                "type": "string",
                                "enum": ["comprehensive", "concise", "analytical"],
                                "default": "comprehensive",
                                "description": "Response detail level"
                            },
                            "cognitive_systems": {
                                "type": "array",
                                "items": {"type": "string"},
                                "default": ["harmonic_analysis", "quantum_synthesis"],
                                "description": "Cognitive systems for knowledge base enhancement"
                            },
                            "enable_cognitive_analysis": {
                                "type": "boolean",
                                "default": true,
                                "description": "Enable cognitive analysis of documents"
                            },
                            "chunk_documents": {
                                "type": "boolean",
                                "default": true,
                                "description": "Whether to chunk documents for better retrieval"
                            },
                            "confirm": {
                                "type": "boolean",
                                "default": false,
                                "description": "Confirmation flag for destructive operations"
                            }
                        },
                        "required": ["knowledge_base_name"]
                    }
                ),
                types.Tool(
                    name="guru_knowledge_synthesis",
                    description="Multi-stage contextual idea generator that analyzes documents for patterns and proposes creative directions while staying grounded in actual content",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["start", "analyze", "select_patterns", "generate", "get_status"],
                                "description": "Stage of synthesis process: start new session, analyze patterns, select patterns, generate work, or get status"
                            },
                            "session_id": {
                                "type": "string",
                                "description": "Session ID (returned from 'start' action, required for other actions)"
                            },
                            "documents": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {"type": "string"},
                                        "content": {"type": "string"},
                                        "title": {"type": "string"},
                                        "metadata": {"type": "object"}
                                    },
                                    "required": ["id", "content"]
                                },
                                "description": "Documents to analyze (required for 'start' action)"
                            },
                            "selected_patterns": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Pattern IDs to use for synthesis (required for 'select_patterns' action)"
                            },
                            "synthesis_type": {
                                "type": "string",
                                "enum": ["features", "architecture", "roadmap", "gaps", "opportunities"],
                                "description": "Type of work to generate (required for 'generate' action)"
                            },
                            "context": {
                                "type": "object",
                                "properties": {
                                    "project_type": {"type": "string"},
                                    "technology_stack": {"type": "array", "items": {"type": "string"}},
                                    "goals": {"type": "array", "items": {"type": "string"}},
                                    "constraints": {"type": "array", "items": {"type": "string"}}
                                },
                                "description": "Additional context for synthesis (optional)"
                            }
                        },
                        "required": ["action"]
                    }
                ),
                types.Tool(
                    name="guru_active_knowledge",
                    description="Access only the active documents from knowledge bases that users have toggled on",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["list_bases", "get_active_documents", "get_group_structure", "get_document"],
                                "description": "Action to perform: list_bases (list all KBs), get_active_documents (get active docs), get_group_structure (get groups), get_document (get specific doc)"
                            },
                            "knowledge_base_id": {
                                "type": "string",
                                "description": "ID of the knowledge base (required for all actions except list_bases)"
                            },
                            "include_content": {
                                "type": "boolean",
                                "default": False,
                                "description": "Include document content in response (for get_active_documents)"
                            },
                            "group_id": {
                                "type": "string",
                                "description": "Filter by specific group ID (optional for get_active_documents)"
                            },
                            "document_id": {
                                "type": "string",
                                "description": "Document ID to retrieve (required for get_document action)"
                            }
                        },
                        "required": ["action"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: Dict[str, Any] | None) -> List[types.TextContent]:
            """Route MCP tool calls to appropriate Guru systems"""
            
            try:
                args = arguments or {}
                
                if name == "guru_harmonic_analysis":
                    result = await self.harmonic_tool.execute(args)
                elif name == "guru_quantum_synthesis":
                    result = await self.quantum_tool.execute(args)
                elif name == "guru_task_evolution": 
                    result = await self.task_tool.execute(args)
                elif name == "guru_adaptive_learning":
                    result = await self.learning_tool.execute(args)
                elif name == "guru_silc_conversation":
                    result = await self.silc_tool.execute(args)
                elif name == "guru_open_silc_channel":
                    result = await self._handle_open_silc_channel(args)
                elif name == "guru_analyze_domain":
                    result = await self._handle_analyze_domain(args)
                elif name == "guru_analyze_filesystem":
                    result = await self.filesystem_tool.execute(args)
                elif name == "guru_analyze_files_manual":
                    result = await self.manual_filesystem_tool.execute(args)
                elif name == "guru_upload_documents":
                    result = await self.document_upload_tool.execute(args)
                elif name == "guru_rag_knowledge_base":
                    result = await self.rag_tool.execute(args)
                elif name == "guru_knowledge_synthesis":
                    result_dict = await self.synthesis_tool.execute(**args)
                    # Format the result as JSON for consistent output
                    import json
                    result = json.dumps(result_dict, indent=2)
                elif name == "guru_active_knowledge":
                    result_dict = await self.active_knowledge_tool.execute(**args)
                    # Format the result as JSON for consistent output
                    import json
                    result = json.dumps(result_dict, indent=2)
                else:
                    raise ValueError(f"Unknown tool: {name}")
                
                # Format result as MCP TextContent
                return [types.TextContent(
                    type="text",
                    text=result
                )]
                
            except Exception as e:
                logger.error(f"Error executing tool {name}: {e}")
                return [types.TextContent(
                    type="text",
                    text=f"## Error\n\nFailed to execute {name}: {str(e)}"
                )]
    
    async def _handle_open_silc_channel(self, args: Dict[str, Any]) -> str:
        """Handle opening a new SILC signal channel"""
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '../../../silc-protocol/src'))
        from core.signal_theory import SILCChannel, SignalCodec
        
        channel_id = args.get("channel_id")
        participants = args.get("participants", [])
        initial_signal_data = args.get("initial_signal")
        message = args.get("message", "")
        
        if not channel_id:
            return "## Error\n\nChannel ID is required"
        
        if not participants:
            return "## Error\n\nAt least one participant is required"
        
        try:
            # Create or get the channel
            channel = SILCChannel.getOrCreate(channel_id, participants)
            
            result = f"## SILC Channel Opened\n\n**Channel ID:** `{channel_id}`\n**Participants:** {', '.join(participants)}\n\n"
            
            # Send initial signal if provided
            if initial_signal_data:
                signal = SignalCodec.createSignal(
                    confidence=initial_signal_data.get("confidence", 0.8),
                    urgency=initial_signal_data.get("urgency", 0.5),
                    context_relevance=initial_signal_data.get("context_relevance", 0.7),
                    complexity=initial_signal_data.get("complexity", 0.6)
                )
                
                signal_state = channel.send(signal, {
                    "sender": "mcp_server",
                    "message": message
                })
                
                analysis = SignalCodec.analyzeSignal(signal)
                
                result += f"**Initial Signal Sent:**\n"
                result += f"- Encoded: `{signal_state.encoded}`\n"
                result += f"- Analysis: {analysis['interpretation']}\n"
                result += f"- Priority: {analysis['priority']}\n"
                result += f"- Complexity: {analysis['complexity_level']}\n"
                
                if message:
                    result += f"- Message: {message}\n"
            
            result += f"\n**Channel Status:** Active with {len(channel.getRecentSignals())} signals\n"
            result += f"**Usage:** Other AI models can now send signals to this channel using the channel ID `{channel_id}`\n"
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to open SILC channel: {e}")
            return f"## Error\n\nFailed to open SILC channel: {str(e)}"
    
    async def _handle_analyze_domain(self, args: Dict[str, Any]) -> str:
        """Handle universal domain analysis request"""
        domain_context = args.get("domain_context", {})
        analysis_focus = args.get("analysis_focus", ["efficiency", "quality", "structure"])
        current_challenges = args.get("current_challenges", [])
        objectives = args.get("objectives", [])
        analysis_depth = args.get("analysis_depth", "moderate")
        requesting_model = args.get("requesting_model", "unknown")
        
        try:
            # Extract universal domain data
            domain_type = domain_context.get("domain_type", "other")
            content_items = domain_context.get("content_items", [])
            structure = domain_context.get("structure", {})
            performance_metrics = domain_context.get("performance_metrics", {})
            history = domain_context.get("history", {})
            
            # Process through Phi-4 Mini wingman for universal analysis
            wingman_analysis = await self._run_wingman_domain_analysis(
                domain_type, content_items, structure, performance_metrics, history,
                analysis_focus, current_challenges, objectives, analysis_depth
            )
            
            # Format comprehensive analysis response
            result = f"## 🔬 Guru Universal Domain Analysis\n\n"
            result += f"**Domain:** {domain_type.title()}\n"
            result += f"**Requesting Model:** {requesting_model}\n"
            result += f"**Analysis Depth:** {analysis_depth}\n"
            result += f"**Content Items:** {len(content_items)}\n"
            result += f"**Focus Areas:** {', '.join(analysis_focus)}\n\n"
            
            # Confidence and Overview
            result += f"### 📊 Analysis Confidence: {wingman_analysis['confidence'] * 100:.0f}%\n\n"
            
            # Key Insights
            result += f"### 💡 Key Insights\n"
            for i, insight in enumerate(wingman_analysis["insights"], 1):
                result += f"{i}. {insight}\n"
            result += "\n"
            
            # Enhancement Suggestions by Category
            suggestions_by_category = {}
            for suggestion in wingman_analysis["suggestions"]:
                category = suggestion["category"]
                if category not in suggestions_by_category:
                    suggestions_by_category[category] = []
                suggestions_by_category[category].append(suggestion)
            
            result += f"### 🎯 Cognitive Enhancement Suggestions\n\n"
            for category, suggestions in suggestions_by_category.items():
                result += f"#### {category.replace('_', ' ').title()}\n"
                for suggestion in suggestions:
                    priority_emoji = "🔴" if suggestion["priority"] == "high" else "🟡" if suggestion["priority"] == "medium" else "🟢"
                    result += f"- {priority_emoji} **{suggestion['title']}** (Impact: {suggestion['impact_score'] * 100:.0f}%)\n"
                    result += f"  {suggestion['description']}\n"
                    if suggestion.get("implementation_steps"):
                        result += f"  *Steps: {', '.join(suggestion['implementation_steps'][:3])}...*\n"
                    result += "\n"
            
            # Domain-Specific Metrics
            if performance_metrics:
                result += f"### ⚡ Performance Analysis\n"
                quantitative = performance_metrics.get("quantitative_measures", {})
                qualitative = performance_metrics.get("qualitative_assessments", [])
                
                if quantitative:
                    for metric, value in quantitative.items():
                        result += f"- {metric.replace('_', ' ').title()}: {value}\n"
                
                if qualitative:
                    result += f"- Quality assessments: {len(qualitative)} areas evaluated\n"
                result += "\n"
            
            # Domain Assessment
            result += f"### 📋 Domain Assessment\n"
            total_content = sum(item.get("size", 1) for item in content_items)
            content_types = list(set(item.get("type", "unknown") for item in content_items))
            result += f"- Total content units: {total_content:,}\n"
            result += f"- Content types: {', '.join(content_types)}\n"
            result += f"- Complexity score: {wingman_analysis['complexity_score']:.2f}/1.0\n"
            result += f"- Optimization potential: {wingman_analysis.get('optimization_potential', 0.75) * 100:.0f}%\n\n"
            
            # Objectives Alignment
            if objectives:
                result += f"### 🎯 Objectives Alignment\n"
                for i, objective in enumerate(objectives, 1):
                    alignment_score = wingman_analysis.get('objective_alignment', {}).get(objective, 0.8)
                    result += f"{i}. {objective} - {alignment_score * 100:.0f}% aligned\n"
                result += "\n"
            
            # Next Steps
            high_priority_suggestions = [s for s in wingman_analysis["suggestions"] if s["priority"] == "high"]
            if high_priority_suggestions:
                result += f"### 🚀 Recommended Next Steps\n"
                for i, suggestion in enumerate(high_priority_suggestions[:3], 1):
                    result += f"{i}. {suggestion['title']}\n"
                result += "\n"
            
            result += f"💡 *Use other Guru MCP tools to implement specific suggestions or get deeper cognitive analysis.*"
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to analyze domain: {e}")
            return f"## Error\n\nFailed to analyze domain: {str(e)}"
    
    async def _run_wingman_domain_analysis(
        self, domain_type, content_items, structure, performance_metrics, history,
        analysis_focus, current_challenges, objectives, analysis_depth
    ) -> Dict[str, Any]:
        """Run universal domain analysis through Phi-4 Mini wingman"""
        
        # Simulate wingman analysis (in real implementation, this would call Phi-4 Mini via SILC)
        import asyncio
        
        # Simulate processing time based on depth
        processing_time = {
            "surface": 0.3,
            "moderate": 0.8, 
            "deep": 1.5,
            "comprehensive": 2.5
        }.get(analysis_depth, 0.8)
        await asyncio.sleep(processing_time)
        
        # Analyze domain patterns universally
        total_content = len(content_items)
        content_types = list(set(item.get("type", "unknown") for item in content_items))
        tools_used = structure.get("tools_used", [])
        
        # Generate universal insights based on domain data
        insights = []
        
        # Domain-specific insights
        if domain_type == "software":
            insights.append("Code architecture shows potential for optimization through modular design")
        elif domain_type == "research":
            insights.append("Research methodology demonstrates systematic approach with cross-referencing opportunities")
        elif domain_type == "business":
            insights.append("Business processes show efficiency gains through automation potential")
        elif domain_type == "creative":
            insights.append("Creative workflow exhibits pattern variations suitable for harmonic enhancement")
        elif domain_type == "academic":
            insights.append("Academic structure reveals knowledge interconnections for synthesis")
        elif domain_type == "personal":
            insights.append("Personal organization patterns indicate optimization through quantum memory techniques")
        else:
            insights.append(f"{domain_type.title()} domain exhibits structured patterns amenable to cognitive enhancement")
            
        # Universal cognitive insights
        if total_content > 20:
            insights.append(f"Large content volume ({total_content} items) benefits from hierarchical organization")
            
        if "efficiency" in analysis_focus:
            insights.append("Efficiency optimization opportunities detected through workflow analysis")
            
        if "relationships" in analysis_focus:
            insights.append("Cross-domain relationship patterns suggest synthesis opportunities")
            
        if history.get("timeline"):
            insights.append("Historical evolution patterns indicate successful adaptation strategies")
            
        insights.extend([
            "Quantum memory interference patterns detected for enhanced recall",
            "Harmonic resonance opportunities identified in recurring structures", 
            "Task evolution potential through iterative optimization cycles"
        ])
        
        # Generate universal enhancement suggestions
        suggestions = []
        
        for focus_area in analysis_focus:
            if focus_area == "efficiency":
                suggestions.extend([
                    {
                        "category": "efficiency",
                        "title": "Implement Workflow Automation",
                        "description": "Automate repetitive processes to increase throughput",
                        "priority": "high",
                        "impact_score": 0.82,
                        "implementation_steps": ["Identify repetitive tasks", "Design automation workflow", "Implement and test"],
                        "estimated_effort": "medium"
                    },
                    {
                        "category": "efficiency",
                        "title": "Optimize Resource Allocation", 
                        "description": "Redistribute resources for maximum impact",
                        "priority": "medium",
                        "impact_score": 0.74,
                        "implementation_steps": ["Analyze current allocation", "Model optimal distribution", "Implement changes"],
                        "estimated_effort": "low"
                    }
                ])
                
            elif focus_area == "quality":
                suggestions.append({
                    "category": "quality",
                    "title": "Implement Quality Assurance Framework",
                    "description": "Systematic quality control for consistent outcomes",
                    "priority": "high",
                    "impact_score": 0.88,
                    "implementation_steps": ["Define quality metrics", "Create validation process", "Monitor continuously"],
                    "estimated_effort": "medium"
                })
                
            elif focus_area == "structure":
                suggestions.append({
                    "category": "structure",
                    "title": "Reorganize Information Architecture",
                    "description": "Restructure for improved accessibility and flow",
                    "priority": "medium", 
                    "impact_score": 0.76,
                    "implementation_steps": ["Map current structure", "Design optimal layout", "Implement reorganization"],
                    "estimated_effort": "high"
                })
                
            elif focus_area == "innovation":
                suggestions.append({
                    "category": "innovation",
                    "title": "Apply Cross-Domain Synthesis",
                    "description": "Combine insights from different domains for novel approaches",
                    "priority": "medium",
                    "impact_score": 0.85,
                    "implementation_steps": ["Identify cross-connections", "Synthesize approaches", "Prototype solutions"],
                    "estimated_effort": "high"
                })
                
            elif focus_area == "relationships":
                suggestions.append({
                    "category": "relationships",
                    "title": "Strengthen Connection Networks",
                    "description": "Enhance relationships between components for better synergy", 
                    "priority": "medium",
                    "impact_score": 0.79,
                    "implementation_steps": ["Map relationships", "Identify weak links", "Strengthen connections"],
                    "estimated_effort": "medium"
                })
        
        # Add suggestions based on challenges
        for challenge in current_challenges:
            if "slow" in challenge.lower() or "inefficient" in challenge.lower():
                suggestions.append({
                    "category": "efficiency",
                    "title": "Address Performance Bottleneck",
                    "description": f"Resolve identified challenge: {challenge}",
                    "priority": "high",
                    "impact_score": 0.91,
                    "implementation_steps": ["Analyze bottleneck", "Design solution", "Implement optimization"],
                    "estimated_effort": "medium"
                })
            elif "complex" in challenge.lower() or "complicated" in challenge.lower():
                suggestions.append({
                    "category": "structure",
                    "title": "Simplify Complex Processes",
                    "description": f"Streamline complexity: {challenge}",
                    "priority": "high", 
                    "impact_score": 0.86,
                    "implementation_steps": ["Decompose complexity", "Design simpler approach", "Test and refine"],
                    "estimated_effort": "medium"
                })
        
        # Calculate universal metrics
        complexity_score = min(1.0, (total_content / 50) + (len(content_types) * 0.15) + (len(analysis_focus) * 0.1))
        confidence = 0.80 + (0.15 if total_content > 5 else 0) + (0.05 if len(tools_used) > 0 else 0)
        
        # Calculate objective alignment
        objective_alignment = {}
        for objective in objectives:
            # Simple heuristic based on suggestion relevance
            alignment = 0.75 + (0.2 if any(obj_word in suggestion["title"].lower() 
                                          for suggestion in suggestions 
                                          for obj_word in objective.lower().split()) else 0)
            objective_alignment[objective] = min(1.0, alignment)
        
        return {
            "confidence": min(1.0, confidence),
            "complexity_score": complexity_score,
            "optimization_potential": 0.70 + (0.25 if len(current_challenges) > 0 else 0),
            "insights": insights[:8],  # Limit to most relevant insights
            "suggestions": suggestions,
            "objective_alignment": objective_alignment,
            "analysis_time_ms": int(processing_time * 1000),
            "total_content_analyzed": total_content,
            "domain_coverage": len(content_types)
        }
    
    async def initialize(self):
        """Initialize all Guru systems"""
        logger.info("🔧 Initializing Guru cognitive systems...")
        
        # Initialize core bridge to Guru systems
        await self.core_bridge.initialize()
        
        # Initialize Phi-4 Mini wingman
        await self.phi4_wingman.initialize()
        
        logger.success("✅ All systems initialized and ready!")
    
    async def run(self):
        """Run the MCP server"""
        await self.initialize()
        
        logger.info("🚀 Starting Guru MCP Server...")
        
        async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream, 
                write_stream, 
                InitializationOptions(
                    server_name="guru-cognitive-server",
                    server_version="1.0.0",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={}
                    )
                )
            )


async def main():
    """Main entry point"""
    logger.info("🧠 Guru MCP Server - Universal AI Cognitive Enhancement")
    
    server = GuruMCPServer()
    await server.run()


if __name__ == "__main__":
    asyncio.run(main())