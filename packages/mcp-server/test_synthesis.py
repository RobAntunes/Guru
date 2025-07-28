#!/usr/bin/env python3
"""
Test script for the multi-stage synthesis tool
"""

import asyncio
import json
from guru_mcp.tools.synthesis_tool import SynthesisTool

async def test_synthesis_workflow():
    """Test the complete synthesis workflow"""
    
    # Initialize the tool
    tool = SynthesisTool()
    
    # Test documents
    test_docs = [
        {
            "id": "doc1",
            "title": "AI Architecture Design",
            "content": "We need to design a scalable AI architecture that can handle real-time inference and batch processing. The system should support multiple models and provide a unified API."
        },
        {
            "id": "doc2", 
            "title": "Knowledge Management System",
            "content": "Building a knowledge management system that can extract insights from documents, organize them into hierarchies, and provide semantic search capabilities."
        },
        {
            "id": "doc3",
            "title": "User Experience Guidelines",
            "content": "The interface should be intuitive and responsive. Users need to be able to quickly access their most important documents and see relationships between concepts."
        }
    ]
    
    print("=== Testing Multi-Stage Synthesis Tool ===\n")
    
    # Stage 1: Start session
    print("1. Starting synthesis session...")
    start_result = await tool.execute(
        action="start",
        documents=test_docs,
        context={
            "project_type": "AI Platform",
            "technology_stack": ["Python", "React", "TypeScript"],
            "goals": ["Scalability", "User Experience", "AI Integration"]
        }
    )
    print(f"Session ID: {start_result['session_id']}")
    print(f"Status: {start_result['status']}\n")
    
    session_id = start_result['session_id']
    
    # Stage 2: Analyze patterns
    print("2. Analyzing patterns...")
    analysis_result = await tool.execute(
        action="analyze",
        session_id=session_id
    )
    print(f"Patterns found: {len(analysis_result['patterns'])}")
    for pattern in analysis_result['patterns'][:3]:  # Show first 3
        print(f"  - [{pattern['framework']}] {pattern['name']}: {pattern['description']}")
    print()
    
    # Stage 3: Select patterns
    print("3. Selecting patterns for synthesis...")
    pattern_ids = [p['id'] for p in analysis_result['patterns'][:2]]  # Select first 2
    select_result = await tool.execute(
        action="select_patterns",
        session_id=session_id,
        selected_patterns=pattern_ids
    )
    print(f"Selected {select_result['selected_count']} patterns")
    print(f"Available synthesis types: {', '.join(select_result['available_types'])}\n")
    
    # Stage 4: Generate features
    print("4. Generating feature ideas...")
    feature_result = await tool.execute(
        action="generate",
        session_id=session_id,
        synthesis_type="features"
    )
    print(f"Generated {len(feature_result['work_items'])} features:")
    for item in feature_result['work_items']:
        print(f"  - {item['title']}: {item['description']}")
        print(f"    Priority: {item['priority']}, Impact: {item['impact']}")
    print()
    
    # Get final status
    print("5. Getting session status...")
    status_result = await tool.execute(
        action="get_status",
        session_id=session_id
    )
    print(json.dumps(status_result, indent=2))

if __name__ == "__main__":
    asyncio.run(test_synthesis_workflow())