"""
RAG Knowledge Base Tool - Retrieval-Augmented Generation system like Claude Projects
"""

import asyncio
import json
import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from loguru import logger
import hashlib
import numpy as np
from datetime import datetime, timezone


class RAGKnowledgeBaseTool:
    """
    RAG (Retrieval-Augmented Generation) system for building and querying knowledge bases
    Similar to Claude Projects but powered by Guru's cognitive systems
    """
    
    def __init__(self, core_bridge, phi4_wingman):
        self.core_bridge = core_bridge
        self.phi4_wingman = phi4_wingman
        self.name = "guru_rag_knowledge_base"
        
        # Knowledge base storage
        self.knowledge_base_dir = Path.home() / ".guru" / "knowledge_bases"
        self.knowledge_base_dir.mkdir(parents=True, exist_ok=True)
        
        # Vector similarity threshold for retrieval
        self.similarity_threshold = 0.7
        
        # Maximum chunks to retrieve for context
        self.max_retrieval_chunks = 10
        
        # Chunk size for document processing
        self.chunk_size = 1000  # characters
        self.chunk_overlap = 200  # character overlap between chunks
        
        # Knowledge base operations
        self.operations = {
            "create": self._create_knowledge_base,
            "add_documents": self._add_documents_to_kb,
            "query": self._query_knowledge_base,
            "list": self._list_knowledge_bases,
            "info": self._get_knowledge_base_info,
            "delete": self._delete_knowledge_base,
            "update": self._update_knowledge_base
        }
        
    async def execute(self, args: Dict[str, Any]) -> str:
        """Execute RAG knowledge base operation"""
        operation = args.get("operation", "query")
        kb_name = args.get("knowledge_base_name", "")
        
        if operation not in self.operations:
            return f"## Error\n\nUnknown operation: {operation}. Available: {', '.join(self.operations.keys())}"
        
        try:
            logger.info(f"🧠 Executing RAG operation: {operation} on KB: {kb_name}")
            
            # Execute the requested operation
            result = await self.operations[operation](args)
            
            return result
            
        except Exception as e:
            logger.error(f"RAG operation failed: {e}")
            return f"## Error\n\nRAG operation failed: {str(e)}"
    
    async def _create_knowledge_base(self, args: Dict[str, Any]) -> str:
        """Create a new knowledge base"""
        kb_name = args.get("knowledge_base_name", "")
        description = args.get("description", "")
        cognitive_systems = args.get("cognitive_systems", ["harmonic_analysis", "quantum_synthesis"])
        
        if not kb_name:
            return "## Error\n\nKnowledge base name is required"
        
        # Sanitize kb_name for filesystem
        safe_kb_name = "".join(c for c in kb_name if c.isalnum() or c in ('-', '_')).strip()
        if not safe_kb_name:
            return "## Error\n\nInvalid knowledge base name"
        
        kb_path = self.knowledge_base_dir / safe_kb_name
        
        if kb_path.exists():
            return f"## Error\n\nKnowledge base '{kb_name}' already exists"
        
        # Create knowledge base directory structure
        kb_path.mkdir(parents=True)
        (kb_path / "documents").mkdir()
        (kb_path / "chunks").mkdir()
        (kb_path / "vectors").mkdir()
        
        # Initialize SQLite database for metadata and retrieval
        db_path = kb_path / "knowledge_base.db"
        await self._initialize_kb_database(db_path, kb_name, description, cognitive_systems)
        
        # Create configuration file
        config = {
            "name": kb_name,
            "safe_name": safe_kb_name,
            "description": description,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "cognitive_systems": cognitive_systems,
            "document_count": 0,
            "chunk_count": 0,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "version": "1.0"
        }
        
        with open(kb_path / "config.json", "w") as f:
            json.dump(config, f, indent=2)
        
        logger.info(f"✅ Created knowledge base: {kb_name}")
        
        return f"""## 🧠 Knowledge Base Created Successfully

**Name:** {kb_name}
**Description:** {description or 'No description provided'}
**Location:** `{kb_path}`
**Cognitive Systems:** {', '.join(cognitive_systems)}

### Next Steps:
1. Use `add_documents` operation to add content
2. Use `query` operation to retrieve augmented information
3. Use `info` operation to check status

*Your knowledge base is ready to receive documents and answer questions!*"""
    
    async def _initialize_kb_database(self, db_path: Path, kb_name: str, description: str, cognitive_systems: List[str]):
        """Initialize SQLite database for knowledge base"""
        
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Metadata table
        cursor.execute("""
            CREATE TABLE metadata (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)
        
        # Documents table
        cursor.execute("""
            CREATE TABLE documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                content_hash TEXT UNIQUE NOT NULL,
                content TEXT NOT NULL,
                category TEXT,
                size_bytes INTEGER,
                word_count INTEGER,
                added_at TEXT,
                metadata TEXT
            )
        """)
        
        # Chunks table for retrieval
        cursor.execute("""
            CREATE TABLE chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER,
                chunk_index INTEGER,
                content TEXT NOT NULL,
                content_hash TEXT UNIQUE NOT NULL,
                start_position INTEGER,
                end_position INTEGER,
                vector_embedding TEXT,
                created_at TEXT,
                FOREIGN KEY (document_id) REFERENCES documents (id)
            )
        """)
        
        # Cognitive analysis results
        cursor.execute("""
            CREATE TABLE cognitive_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER,
                chunk_id INTEGER,
                system_name TEXT NOT NULL,
                analysis_result TEXT,
                confidence_score REAL,
                created_at TEXT,
                FOREIGN KEY (document_id) REFERENCES documents (id),
                FOREIGN KEY (chunk_id) REFERENCES chunks (id)
            )
        """)
        
        # Knowledge graph nodes
        cursor.execute("""
            CREATE TABLE knowledge_nodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                node_id TEXT UNIQUE NOT NULL,
                node_type TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                source_document_id INTEGER,
                metadata TEXT,
                created_at TEXT,
                FOREIGN KEY (source_document_id) REFERENCES documents (id)
            )
        """)
        
        # Knowledge graph relationships
        cursor.execute("""
            CREATE TABLE knowledge_relationships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_node_id TEXT NOT NULL,
                to_node_id TEXT NOT NULL,
                relationship_type TEXT NOT NULL,
                strength REAL,
                metadata TEXT,
                created_at TEXT
            )
        """)
        
        # Indexes for performance
        cursor.execute("CREATE INDEX idx_chunks_document_id ON chunks (document_id)")
        cursor.execute("CREATE INDEX idx_chunks_content_hash ON chunks (content_hash)")
        cursor.execute("CREATE INDEX idx_cognitive_analysis_document_id ON cognitive_analysis (document_id)")
        cursor.execute("CREATE INDEX idx_knowledge_nodes_node_id ON knowledge_nodes (node_id)")
        
        # Insert metadata
        metadata_entries = [
            ("kb_name", kb_name),
            ("description", description),
            ("cognitive_systems", json.dumps(cognitive_systems)),
            ("created_at", datetime.now(timezone.utc).isoformat()),
            ("version", "1.0")
        ]
        
        cursor.executemany("INSERT INTO metadata (key, value) VALUES (?, ?)", metadata_entries)
        
        conn.commit()
        conn.close()
    
    async def _add_documents_to_kb(self, args: Dict[str, Any]) -> str:
        """Add documents to an existing knowledge base"""
        kb_name = args.get("knowledge_base_name", "")
        documents = args.get("documents", [])
        enable_cognitive_analysis = args.get("enable_cognitive_analysis", True)
        chunk_documents = args.get("chunk_documents", True)
        
        if not kb_name or not documents:
            return "## Error\n\nKnowledge base name and documents are required"
        
        # Load knowledge base
        kb_config, kb_path = await self._load_knowledge_base_config(kb_name)
        if not kb_config:
            return f"## Error\n\nKnowledge base '{kb_name}' not found"
        
        db_path = kb_path / "knowledge_base.db"
        
        added_documents = []
        skipped_documents = []
        total_chunks_created = 0
        
        for doc in documents:
            try:
                # Process document
                doc_info = await self._process_document_for_kb(
                    doc, kb_path, db_path, enable_cognitive_analysis, chunk_documents
                )
                
                if doc_info:
                    added_documents.append(doc_info)
                    total_chunks_created += doc_info.get("chunk_count", 0)
                else:
                    skipped_documents.append(doc.get("filename", "unknown"))
                    
            except Exception as e:
                logger.warning(f"Failed to process document {doc.get('filename', 'unknown')}: {e}")
                skipped_documents.append(doc.get("filename", "unknown"))
        
        # Update knowledge base configuration
        kb_config["document_count"] += len(added_documents)
        kb_config["chunk_count"] = kb_config.get("chunk_count", 0) + total_chunks_created
        kb_config["last_updated"] = datetime.now(timezone.utc).isoformat()
        
        config_path = kb_path / "config.json"
        with open(config_path, "w") as f:
            json.dump(kb_config, f, indent=2)
        
        # Generate summary
        result = f"""## 📚 Documents Added to Knowledge Base

**Knowledge Base:** {kb_name}
**Documents Added:** {len(added_documents)}
**Documents Skipped:** {len(skipped_documents)}
**Total Chunks Created:** {total_chunks_created}

### Added Documents:"""
        
        for doc_info in added_documents[:5]:  # Show first 5
            result += f"\n- **{doc_info['filename']}** ({doc_info['category']}) - {doc_info['chunk_count']} chunks"
        
        if len(added_documents) > 5:
            result += f"\n- ... and {len(added_documents) - 5} more documents"
        
        if skipped_documents:
            result += f"\n\n### Skipped Documents:\n- {', '.join(skipped_documents)}"
        
        result += f"\n\n### Knowledge Base Status:\n- **Total Documents:** {kb_config['document_count']}\n- **Total Chunks:** {kb_config['chunk_count']}\n- **Last Updated:** {kb_config['last_updated'][:19]}\n\n*Your knowledge base has been updated and is ready for querying!*"
        
        return result
    
    async def _process_document_for_kb(self, doc: Dict[str, Any], kb_path: Path, db_path: Path, enable_cognitive_analysis: bool, chunk_documents: bool) -> Optional[Dict[str, Any]]:
        """Process a single document for knowledge base storage"""
        
        filename = doc.get("filename", "unknown")
        content = doc.get("content", "")
        category = doc.get("category", "document")
        
        if not content.strip():
            return None
        
        content_hash = hashlib.md5(content.encode()).hexdigest()
        
        # Check if document already exists
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM documents WHERE content_hash = ?", (content_hash,))
        if cursor.fetchone():
            conn.close()
            logger.info(f"Document {filename} already exists (same content hash)")
            return None
        
        # Insert document
        cursor.execute("""
            INSERT INTO documents (filename, content_hash, content, category, size_bytes, word_count, added_at, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            filename,
            content_hash,
            content,
            category,
            len(content.encode()),
            len(content.split()),
            datetime.now(timezone.utc).isoformat(),
            json.dumps({"original_metadata": doc.get("metadata", {})})
        ))
        
        document_id = cursor.lastrowid
        
        # Create chunks if requested
        chunks_created = 0
        if chunk_documents:
            chunks = self._create_document_chunks(content)
            
            for i, chunk in enumerate(chunks):
                chunk_hash = hashlib.md5(chunk["content"].encode()).hexdigest()
                
                # Create simple vector embedding (in real implementation, use proper embeddings)
                vector_embedding = self._create_simple_embedding(chunk["content"])
                
                cursor.execute("""
                    INSERT INTO chunks (document_id, chunk_index, content, content_hash, start_position, end_position, vector_embedding, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    document_id,
                    i,
                    chunk["content"],
                    chunk_hash,
                    chunk["start"],
                    chunk["end"],
                    json.dumps(vector_embedding),
                    datetime.now(timezone.utc).isoformat()
                ))
                
                chunks_created += 1
                
                # Apply cognitive analysis to chunk if enabled
                if enable_cognitive_analysis:
                    await self._apply_cognitive_analysis_to_chunk(cursor, document_id, cursor.lastrowid, chunk["content"])
        
        conn.commit()
        conn.close()
        
        return {
            "filename": filename,
            "category": category,
            "document_id": document_id,
            "chunk_count": chunks_created,
            "content_hash": content_hash
        }
    
    def _create_document_chunks(self, content: str) -> List[Dict[str, Any]]:
        """Create overlapping chunks from document content"""
        
        chunks = []
        start = 0
        
        while start < len(content):
            end = min(start + self.chunk_size, len(content))
            
            # Try to end at a sentence boundary
            if end < len(content):
                # Look for sentence endings within the last 100 characters
                last_sentence_end = max(
                    content.rfind('.', start, end),
                    content.rfind('!', start, end),
                    content.rfind('?', start, end)
                )
                
                if last_sentence_end > start + self.chunk_size // 2:
                    end = last_sentence_end + 1
            
            chunk_content = content[start:end].strip()
            
            if chunk_content:
                chunks.append({
                    "content": chunk_content,
                    "start": start,
                    "end": end
                })
            
            # Move start position with overlap
            start = max(start + self.chunk_size - self.chunk_overlap, end)
            
            if start >= len(content):
                break
        
        return chunks
    
    def _create_simple_embedding(self, text: str) -> List[float]:
        """Create a simple vector embedding for text (placeholder for real embeddings)"""
        
        # This is a very simple embedding based on word frequency
        # In a real implementation, you'd use proper embeddings like sentence-transformers
        
        words = text.lower().split()
        word_freq = {}
        
        for word in words:
            if len(word) > 2 and word.isalpha():
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Create a fixed-size vector (64 dimensions)
        vector_size = 64
        vector = [0.0] * vector_size
        
        # Use word hashes to map to vector positions
        for word, freq in word_freq.items():
            word_hash = hash(word) % vector_size
            vector[word_hash] += freq / len(words)
        
        # Normalize vector
        magnitude = sum(x * x for x in vector) ** 0.5
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
        
        return vector
    
    async def _apply_cognitive_analysis_to_chunk(self, cursor, document_id: int, chunk_id: int, content: str):
        """Apply Guru's cognitive systems to analyze a chunk"""
        
        try:
            # Apply harmonic analysis
            harmonic_result = await self.core_bridge.invoke_harmonic_analyzer(content, "surface")
            
            cursor.execute("""
                INSERT INTO cognitive_analysis (document_id, chunk_id, system_name, analysis_result, confidence_score, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                document_id,
                chunk_id,
                "harmonic_analysis",
                json.dumps(harmonic_result),
                harmonic_result.get("analysis_confidence", 0.8),
                datetime.now(timezone.utc).isoformat()
            ))
            
            # Apply quantum synthesis (limited to avoid overwhelming)
            if len(content) > 200:  # Only for substantial chunks
                quantum_result = await self.core_bridge.invoke_quantum_synthesizer(
                    f"Extract key insights from text chunk", [content[:500]]
                )
                
                cursor.execute("""
                    INSERT INTO cognitive_analysis (document_id, chunk_id, system_name, analysis_result, confidence_score, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    document_id,
                    chunk_id,
                    "quantum_synthesis",
                    json.dumps(quantum_result),
                    quantum_result.get("synthesis_confidence", 0.8),
                    datetime.now(timezone.utc).isoformat()
                ))
            
        except Exception as e:
            logger.warning(f"Cognitive analysis failed for chunk {chunk_id}: {e}")
    
    async def _query_knowledge_base(self, args: Dict[str, Any]) -> str:
        """Query the knowledge base using RAG"""
        kb_name = args.get("knowledge_base_name", "")
        query = args.get("query", "")
        max_results = args.get("max_results", self.max_retrieval_chunks)
        include_cognitive_insights = args.get("include_cognitive_insights", True)
        response_mode = args.get("response_mode", "comprehensive")  # comprehensive, concise, analytical
        
        if not kb_name or not query:
            return "## Error\n\nKnowledge base name and query are required"
        
        # Load knowledge base
        kb_config, kb_path = await self._load_knowledge_base_config(kb_name)
        if not kb_config:
            return f"## Error\n\nKnowledge base '{kb_name}' not found"
        
        db_path = kb_path / "knowledge_base.db"
        
        # Retrieve relevant chunks
        relevant_chunks = await self._retrieve_relevant_chunks(db_path, query, max_results)
        
        if not relevant_chunks:
            return f"""## 🔍 No Relevant Information Found

**Query:** {query}
**Knowledge Base:** {kb_name}

No relevant information was found in the knowledge base. Try:
1. Using different keywords
2. Adding more documents to the knowledge base
3. Using broader search terms"""
        
        # Generate response using retrieved context
        response = await self._generate_rag_response(
            query, relevant_chunks, kb_config, include_cognitive_insights, response_mode
        )
        
        return response
    
    async def _retrieve_relevant_chunks(self, db_path: Path, query: str, max_results: int) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks using vector similarity and keyword matching"""
        
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Create query embedding
        query_embedding = self._create_simple_embedding(query)
        
        # Get all chunks with their embeddings
        cursor.execute("""
            SELECT c.id, c.content, c.vector_embedding, c.document_id, d.filename, d.category
            FROM chunks c
            JOIN documents d ON c.document_id = d.id
        """)
        
        chunks = cursor.fetchall()
        
        # Calculate similarities and keyword matches
        scored_chunks = []
        query_words = set(query.lower().split())
        
        for chunk_id, content, vector_embedding_json, doc_id, filename, category in chunks:
            try:
                chunk_embedding = json.loads(vector_embedding_json)
                
                # Vector similarity
                vector_similarity = self._calculate_cosine_similarity(query_embedding, chunk_embedding)
                
                # Keyword similarity
                chunk_words = set(content.lower().split())
                keyword_overlap = len(query_words.intersection(chunk_words)) / len(query_words) if query_words else 0
                
                # Combined score
                combined_score = (vector_similarity * 0.7) + (keyword_overlap * 0.3)
                
                if combined_score > 0.1:  # Basic threshold
                    scored_chunks.append({
                        "chunk_id": chunk_id,
                        "content": content,
                        "document_id": doc_id,
                        "filename": filename,
                        "category": category,
                        "score": combined_score,
                        "vector_similarity": vector_similarity,
                        "keyword_overlap": keyword_overlap
                    })
                    
            except Exception as e:
                logger.warning(f"Error processing chunk {chunk_id}: {e}")
                continue
        
        conn.close()
        
        # Sort by score and return top results
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        
        return scored_chunks[:max_results]
    
    def _calculate_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        
        if len(vec1) != len(vec2):
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude1 = sum(a * a for a in vec1) ** 0.5
        magnitude2 = sum(b * b for b in vec2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    async def _generate_rag_response(self, query: str, relevant_chunks: List[Dict[str, Any]], kb_config: Dict[str, Any], include_cognitive_insights: bool, response_mode: str) -> str:
        """Generate response using retrieved chunks and Guru's cognitive systems"""
        
        # Compile context from relevant chunks
        context_parts = []
        source_documents = set()
        
        for chunk in relevant_chunks:
            context_parts.append(f"[{chunk['filename']}] {chunk['content']}")
            source_documents.add(chunk['filename'])
        
        context = "\n\n".join(context_parts)
        
        # Use Phi-4 Mini wingman for response generation
        response_prompt = f"""Based on the following context from the knowledge base, provide a comprehensive answer to the query.

Query: {query}

Context:
{context[:3000]}  # Limit context to avoid overwhelming

Please provide a detailed, accurate response based on the provided context."""
        
        # Generate response using wingman
        wingman_response = await self.phi4_wingman.generate_specialized_response(
            response_prompt, "analytical_reasoning"
        )
        
        # Apply cognitive enhancement if requested
        cognitive_insights = []
        if include_cognitive_insights and relevant_chunks:
            # Use quantum synthesis to find cross-connections
            quantum_result = await self.core_bridge.invoke_quantum_synthesizer(
                f"Synthesize insights from knowledge base query: {query}",
                [chunk["content"][:300] for chunk in relevant_chunks[:3]]
            )
            
            cognitive_insights = quantum_result.get("quantum_insights", [])
        
        # Format final response
        result = f"""## 🧠 Knowledge Base Response

**Query:** {query}
**Knowledge Base:** {kb_config['name']}
**Sources:** {len(source_documents)} documents, {len(relevant_chunks)} relevant chunks

### 📖 Answer

{wingman_response}

### 📚 Sources
"""
        
        for i, chunk in enumerate(relevant_chunks[:5], 1):
            result += f"{i}. **{chunk['filename']}** ({chunk['category']}) - Relevance: {chunk['score']:.2f}\n"
        
        if len(relevant_chunks) > 5:
            result += f"   ... and {len(relevant_chunks) - 5} more sources\n"
        
        # Add cognitive insights
        if cognitive_insights:
            result += f"\n### 🔬 Cognitive Insights\n"
            for insight in cognitive_insights[:3]:
                result += f"- {insight}\n"
        
        # Add retrieval metadata
        result += f"""
### 🔍 Retrieval Details
- **Vector Similarity Range:** {min(c['vector_similarity'] for c in relevant_chunks):.3f} - {max(c['vector_similarity'] for c in relevant_chunks):.3f}
- **Keyword Overlap Range:** {min(c['keyword_overlap'] for c in relevant_chunks):.3f} - {max(c['keyword_overlap'] for c in relevant_chunks):.3f}
- **Total KB Documents:** {kb_config.get('document_count', 0)}
- **Total KB Chunks:** {kb_config.get('chunk_count', 0)}

*Response generated using Guru's RAG system with cognitive enhancement*"""
        
        return result
    
    async def _list_knowledge_bases(self, args: Dict[str, Any]) -> str:
        """List all available knowledge bases"""
        
        if not self.knowledge_base_dir.exists():
            return "## 📚 No Knowledge Bases Found\n\nCreate your first knowledge base using the `create` operation."
        
        knowledge_bases = []
        
        for kb_dir in self.knowledge_base_dir.iterdir():
            if kb_dir.is_dir() and (kb_dir / "config.json").exists():
                try:
                    with open(kb_dir / "config.json", "r") as f:
                        config = json.load(f)
                    knowledge_bases.append(config)
                except Exception as e:
                    logger.warning(f"Error reading config for {kb_dir.name}: {e}")
        
        if not knowledge_bases:
            return "## 📚 No Knowledge Bases Found\n\nCreate your first knowledge base using the `create` operation."
        
        # Sort by last updated
        knowledge_bases.sort(key=lambda x: x.get("last_updated", ""), reverse=True)
        
        result = f"## 📚 Available Knowledge Bases ({len(knowledge_bases)})\n\n"
        
        for kb in knowledge_bases:
            result += f"### {kb['name']}\n"
            result += f"- **Description:** {kb.get('description', 'No description')}\n"
            result += f"- **Documents:** {kb.get('document_count', 0)}\n"
            result += f"- **Chunks:** {kb.get('chunk_count', 0)}\n"
            result += f"- **Created:** {kb.get('created_at', 'Unknown')[:19]}\n"
            result += f"- **Last Updated:** {kb.get('last_updated', 'Unknown')[:19]}\n"
            result += f"- **Cognitive Systems:** {', '.join(kb.get('cognitive_systems', []))}\n\n"
        
        return result
    
    async def _get_knowledge_base_info(self, args: Dict[str, Any]) -> str:
        """Get detailed information about a specific knowledge base"""
        kb_name = args.get("knowledge_base_name", "")
        
        if not kb_name:
            return "## Error\n\nKnowledge base name is required"
        
        kb_config, kb_path = await self._load_knowledge_base_config(kb_name)
        if not kb_config:
            return f"## Error\n\nKnowledge base '{kb_name}' not found"
        
        db_path = kb_path / "knowledge_base.db"
        
        # Get database statistics
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Document statistics
        cursor.execute("SELECT COUNT(*), SUM(size_bytes), SUM(word_count) FROM documents")
        doc_count, total_size, total_words = cursor.fetchone()
        
        # Category distribution
        cursor.execute("SELECT category, COUNT(*) FROM documents GROUP BY category")
        categories = dict(cursor.fetchall())
        
        # Chunk statistics
        cursor.execute("SELECT COUNT(*) FROM chunks")
        chunk_count = cursor.fetchone()[0]
        
        # Cognitive analysis statistics
        cursor.execute("SELECT system_name, COUNT(*) FROM cognitive_analysis GROUP BY system_name")
        cognitive_stats = dict(cursor.fetchall())
        
        conn.close()
        
        result = f"""## 📊 Knowledge Base Information

### Basic Information
- **Name:** {kb_config['name']}
- **Description:** {kb_config.get('description', 'No description')}
- **Created:** {kb_config.get('created_at', 'Unknown')[:19]}
- **Last Updated:** {kb_config.get('last_updated', 'Unknown')[:19]}
- **Version:** {kb_config.get('version', '1.0')}

### Content Statistics
- **Documents:** {doc_count}
- **Total Size:** {(total_size or 0) / 1024:.1f} KB
- **Total Words:** {total_words or 0:,}
- **Chunks:** {chunk_count}
- **Avg Words/Document:** {(total_words or 0) // max(doc_count, 1):,}

### Document Categories"""
        
        for category, count in categories.items():
            result += f"\n- **{category.title()}:** {count} documents"
        
        result += f"\n\n### Cognitive Analysis"
        if cognitive_stats:
            for system, count in cognitive_stats.items():
                result += f"\n- **{system.replace('_', ' ').title()}:** {count} analyses"
        else:
            result += "\n- No cognitive analyses performed yet"
        
        result += f"""

### Configuration
- **Cognitive Systems:** {', '.join(kb_config.get('cognitive_systems', []))}
- **Storage Path:** `{kb_path}`
- **Database Size:** {(kb_path / 'knowledge_base.db').stat().st_size / 1024:.1f} KB

### Usage
- Use `query` operation to search this knowledge base
- Use `add_documents` to add more content
- Use `update` to modify configuration"""
        
        return result
    
    async def _delete_knowledge_base(self, args: Dict[str, Any]) -> str:
        """Delete a knowledge base (with confirmation)"""
        kb_name = args.get("knowledge_base_name", "")
        confirm = args.get("confirm", False)
        
        if not kb_name:
            return "## Error\n\nKnowledge base name is required"
        
        if not confirm:
            return f"""## ⚠️ Delete Knowledge Base Confirmation

**Knowledge Base:** {kb_name}

**This action cannot be undone!**

To confirm deletion, call this operation again with:
```json
{{
  "operation": "delete",
  "knowledge_base_name": "{kb_name}",
  "confirm": true
}}
```

This will permanently delete all documents, chunks, and analysis data."""
        
        kb_config, kb_path = await self._load_knowledge_base_config(kb_name)
        if not kb_config:
            return f"## Error\n\nKnowledge base '{kb_name}' not found"
        
        # Delete the entire knowledge base directory
        import shutil
        shutil.rmtree(kb_path)
        
        return f"""## 🗑️ Knowledge Base Deleted

**Knowledge Base:** {kb_name}
**Documents Removed:** {kb_config.get('document_count', 0)}
**Chunks Removed:** {kb_config.get('chunk_count', 0)}

The knowledge base has been permanently deleted."""
    
    async def _update_knowledge_base(self, args: Dict[str, Any]) -> str:
        """Update knowledge base configuration"""
        kb_name = args.get("knowledge_base_name", "")
        new_description = args.get("description")
        new_cognitive_systems = args.get("cognitive_systems")
        
        if not kb_name:
            return "## Error\n\nKnowledge base name is required"
        
        kb_config, kb_path = await self._load_knowledge_base_config(kb_name)
        if not kb_config:
            return f"## Error\n\nKnowledge base '{kb_name}' not found"
        
        # Update configuration
        if new_description is not None:
            kb_config["description"] = new_description
        
        if new_cognitive_systems is not None:
            kb_config["cognitive_systems"] = new_cognitive_systems
        
        kb_config["last_updated"] = datetime.now(timezone.utc).isoformat()
        
        # Save updated configuration
        config_path = kb_path / "config.json"
        with open(config_path, "w") as f:
            json.dump(kb_config, f, indent=2)
        
        return f"""## ✅ Knowledge Base Updated

**Knowledge Base:** {kb_name}
**Description:** {kb_config['description']}
**Cognitive Systems:** {', '.join(kb_config['cognitive_systems'])}
**Last Updated:** {kb_config['last_updated'][:19]}

Configuration has been successfully updated."""
    
    async def _load_knowledge_base_config(self, kb_name: str) -> Tuple[Optional[Dict[str, Any]], Optional[Path]]:
        """Load knowledge base configuration"""
        
        # Find knowledge base by name
        for kb_dir in self.knowledge_base_dir.iterdir():
            if kb_dir.is_dir():
                config_path = kb_dir / "config.json"
                if config_path.exists():
                    try:
                        with open(config_path, "r") as f:
                            config = json.load(f)
                        
                        if config.get("name") == kb_name or config.get("safe_name") == kb_name:
                            return config, kb_dir
                    except Exception as e:
                        logger.warning(f"Error reading config for {kb_dir.name}: {e}")
        
        return None, None