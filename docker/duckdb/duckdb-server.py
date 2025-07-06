#!/usr/bin/env python3
"""
DuckDB Analytics Server for Guru Harmonic Intelligence
Provides HTTP API for analytics queries on harmonic pattern data
"""

import os
import json
import duckdb
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

app = FastAPI(title="Guru DuckDB Analytics Server", version="1.0.0")

# Database connection
DUCKDB_PATH = os.environ.get('DUCKDB_PATH', '/data/guru_analytics.db')
conn = duckdb.connect(DUCKDB_PATH)

class QueryRequest(BaseModel):
    sql: str
    params: Optional[Dict[str, Any]] = {}

class QueryResponse(BaseModel):
    columns: List[str]
    data: List[List[Any]]
    row_count: int
    execution_time_ms: float

@app.on_event("startup")
async def startup_event():
    """Initialize DuckDB schema"""
    
    # Create pattern analytics table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS pattern_analytics (
            pattern_id VARCHAR PRIMARY KEY,
            category VARCHAR,
            type VARCHAR,
            strength DOUBLE,
            occurrences INTEGER,
            complexity DOUBLE,
            coordinates_x DOUBLE,
            coordinates_y DOUBLE,
            coordinates_z DOUBLE,
            file_locations VARCHAR[], -- JSON array
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create pattern evolution table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS pattern_evolution (
            id INTEGER PRIMARY KEY,
            pattern_id VARCHAR,
            analysis_timestamp TIMESTAMP,
            strength DOUBLE,
            occurrences INTEGER,
            file_locations VARCHAR[], -- JSON array
            change_type VARCHAR,
            FOREIGN KEY (pattern_id) REFERENCES pattern_analytics(pattern_id)
        )
    """)
    
    # Create pattern correlations table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS pattern_correlations (
            id INTEGER PRIMARY KEY,
            pattern_a VARCHAR,
            pattern_b VARCHAR,
            correlation_strength DOUBLE,
            co_occurrence_count INTEGER,
            statistical_significance DOUBLE,
            calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pattern_a) REFERENCES pattern_analytics(pattern_id),
            FOREIGN KEY (pattern_b) REFERENCES pattern_analytics(pattern_id)
        )
    """)
    
    # Create indexes for performance
    try:
        conn.execute("CREATE INDEX IF NOT EXISTS idx_pattern_category ON pattern_analytics(category)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_pattern_type ON pattern_analytics(type)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_pattern_strength ON pattern_analytics(strength)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_evolution_timestamp ON pattern_evolution(analysis_timestamp)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_correlations_strength ON pattern_correlations(correlation_strength)")
    except:
        pass  # Indexes might already exist

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        result = conn.execute("SELECT 1").fetchone()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def execute_query(request: QueryRequest):
    """Execute a DuckDB query"""
    try:
        import time
        start_time = time.time()
        
        # Execute query with parameters
        if request.params:
            result = conn.execute(request.sql, request.params)
        else:
            result = conn.execute(request.sql)
        
        # Fetch results
        data = result.fetchall()
        columns = [desc[0] for desc in result.description] if result.description else []
        
        execution_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        return QueryResponse(
            columns=columns,
            data=data,
            row_count=len(data),
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query error: {str(e)}")

@app.get("/analytics/pattern-distribution")
async def get_pattern_distribution():
    """Get pattern distribution by category"""
    try:
        result = conn.execute("""
            SELECT 
                category,
                COUNT(*) as pattern_count,
                AVG(strength) as avg_strength,
                SUM(occurrences) as total_occurrences,
                AVG(complexity) as avg_complexity
            FROM pattern_analytics
            GROUP BY category
            ORDER BY pattern_count DESC
        """).fetchall()
        
        return {
            "distribution": [
                {
                    "category": row[0],
                    "pattern_count": row[1], 
                    "avg_strength": row[2],
                    "total_occurrences": row[3],
                    "avg_complexity": row[4]
                }
                for row in result
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

@app.get("/analytics/pattern-hotspots")
async def get_pattern_hotspots(min_patterns: int = 5):
    """Find files with many patterns (hotspots)"""
    try:
        result = conn.execute("""
            WITH file_patterns AS (
                SELECT 
                    unnest(file_locations) as file_path,
                    pattern_id,
                    category,
                    strength
                FROM pattern_analytics
                WHERE file_locations IS NOT NULL
            )
            SELECT 
                file_path,
                COUNT(*) as pattern_count,
                AVG(strength) as avg_strength,
                array_agg(DISTINCT category) as categories
            FROM file_patterns
            GROUP BY file_path
            HAVING COUNT(*) >= ?
            ORDER BY pattern_count DESC, avg_strength DESC
        """, [min_patterns]).fetchall()
        
        return {
            "hotspots": [
                {
                    "file_path": row[0],
                    "pattern_count": row[1],
                    "avg_strength": row[2],
                    "categories": row[3]
                }
                for row in result
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

@app.post("/bulk-import")
async def bulk_import_patterns(patterns: List[Dict[str, Any]]):
    """Bulk import pattern data"""
    try:
        # Convert patterns to tuples for bulk insert
        pattern_tuples = []
        for pattern in patterns:
            pattern_tuples.append((
                pattern.get('pattern_id'),
                pattern.get('category'),
                pattern.get('type'),
                pattern.get('strength'),
                pattern.get('occurrences'),
                pattern.get('complexity'),
                pattern.get('coordinates_x'),
                pattern.get('coordinates_y'), 
                pattern.get('coordinates_z'),
                pattern.get('file_locations', [])
            ))
        
        # Bulk insert
        conn.executemany("""
            INSERT OR REPLACE INTO pattern_analytics 
            (pattern_id, category, type, strength, occurrences, complexity, 
             coordinates_x, coordinates_y, coordinates_z, file_locations)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, pattern_tuples)
        
        return {"imported": len(patterns), "status": "success"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import error: {str(e)}")

@app.get("/analytics/summary")
async def get_analytics_summary():
    """Get overall analytics summary"""
    try:
        # Get basic counts
        total_patterns = conn.execute("SELECT COUNT(*) FROM pattern_analytics").fetchone()[0]
        total_categories = conn.execute("SELECT COUNT(DISTINCT category) FROM pattern_analytics").fetchone()[0]
        avg_strength = conn.execute("SELECT AVG(strength) FROM pattern_analytics").fetchone()[0]
        
        # Get top categories
        top_categories = conn.execute("""
            SELECT category, COUNT(*) as count 
            FROM pattern_analytics 
            GROUP BY category 
            ORDER BY count DESC 
            LIMIT 5
        """).fetchall()
        
        return {
            "summary": {
                "total_patterns": total_patterns,
                "total_categories": total_categories,
                "average_strength": avg_strength,
                "top_categories": [{"category": row[0], "count": row[1]} for row in top_categories]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)