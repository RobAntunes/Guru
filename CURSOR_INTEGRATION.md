# 🧠 Guru MCP Server - AI-Native Code Intelligence

Revolutionary code understanding through symbol graphs, execution tracing, and purpose inference.

## 🚀 Quick Setup for Cursor

### 1. Install Dependencies
```bash
cd /Users/boss/Documents/projects/guru
npm install
npm run build
```

### 2. Configure Cursor MCP Settings

Add this to your Cursor MCP configuration:

**For Mac/Linux** (`~/.cursor/mcp_settings.json`):
```json
{
  "mcpServers": {
    "guru": {
      "command": "node",
      "args": ["/Users/boss/Documents/projects/guru/dist/index.js"],
      "env": {}
    }
  }
}
```

**For Windows** (`%APPDATA%\\Cursor\\mcp_settings.json`):
```json
{
  "mcpServers": {
    "guru": {
      "command": "node",
      "args": ["C:\\path\\to\\guru\\dist\\index.js"],
      "env": {}
    }
  }
}
```

### 3. Restart Cursor

After adding the configuration, restart Cursor to load the Guru MCP server.

## 🎯 Available Tools

Once integrated, Claude in Cursor will have access to these revolutionary tools:

### `analyze_codebase`
- **Purpose**: Complete codebase analysis with symbol graphs and purpose inference
- **Parameters**: 
  - `path` (required): Path to analyze
  - `language` (optional): Programming language
  - `includeTests` (optional): Include test files
  - `goalSpec` (optional): YAML goal specification

### `trace_execution` 
- **Purpose**: Static execution tracing without running code
- **Parameters**:
  - `entryPoint` (required): Function/method to trace from
  - `maxDepth` (optional): Maximum call depth
  - `followBranches` (optional): Follow all execution branches

### `infer_purpose`
- **Purpose**: Infer why code exists through multi-layer evidence analysis
- **Parameters**:
  - `symbolId` (optional): Specific symbol to analyze
  - `codeBlock` (optional): Code to analyze directly
  - `context` (optional): Additional context

### `get_symbol_graph`
- **Purpose**: Export symbol graph in various formats
- **Parameters**:
  - `format` (optional): json, dot, or mermaid
  - `scope` (optional): Limit to specific module
  - `includeBuiltins` (optional): Include built-in symbols

### `find_related_code`
- **Purpose**: Semantic code search using natural language
- **Parameters**:
  - `query` (required): Natural language description
  - `similarity` (optional): Similarity threshold (0-1)
  - `limit` (optional): Maximum results

## 🎪 Example Usage in Cursor

Once configured, you can ask Claude things like:

**"Analyze the Canon API codebase structure"**
```
Claude will use: analyze_codebase with path="/Users/boss/Documents/projects/canon/api/src"
```

**"What's the purpose of the server.ts file?"**
```
Claude will: analyze_codebase → infer_purpose for server.ts symbols
```

**"Show me execution flow for payment processing"**
```
Claude will: find_related_code for "payment" → trace_execution from found entry points
```

**"Find all validation-related code"**
```
Claude will: find_related_code with query="validation"
```

## 🧠 Context Engineering Benefits

- **Structured Understanding**: Claude gets rich symbol graphs instead of raw code
- **Purpose Awareness**: Understands WHY code exists, not just WHAT it does  
- **Execution Intelligence**: Sees probable execution paths without running code
- **Pattern Recognition**: Detects architectural patterns automatically
- **Confidence Scoring**: Knows how certain it is about its analysis

## 🔧 Troubleshooting

If Guru doesn't appear in Cursor:

1. **Check build**: Ensure `npm run build` completed successfully
2. **Check path**: Verify the path in mcp_settings.json is correct
3. **Check logs**: Look at Cursor's developer console for MCP errors
4. **Restart**: Try restarting Cursor completely

## 🚀 Advanced Usage

For complex analysis, combine tools:
1. `analyze_codebase` for overview
2. `trace_execution` for specific flows  
3. `infer_purpose` for understanding intent
4. `find_related_code` for discovering connections

---

**Ready to revolutionize how Claude understands your codebase!** 🎉
