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
from .bridge.core_bridge import GuruCoreBridge
from .models.phi4_mini import Phi4MiniWingman


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