# Guru (PRIVATE/PROPRIETARY)

**NOTE:** This project is not open source. License and usage terms will be determined before any public release. Do not distribute or use without explicit permission.

# 🧠 Guru - AI-Native Code Intelligence for Cursor

Code understanding through symbol graphs, execution tracing, and purpose inference. Supercharge Claude's understanding of your codebase!

## 🚀 One-Command Setup

```bash
cd /Users/boss/Documents/projects/guru
npm install
npm run setup-cursor
```

That's it! Restart Cursor and Claude will have deep code intelligence! 🎉

## 🎯 What Guru Gives Claude

### 🕸️ **Symbol Graph Intelligence**
- **Dependencies**: Understands how code connects together
- **Relationships**: Sees calls, imports, inheritance patterns  
- **Architecture**: Detects hubs, facades, utilities automatically

### ⚡ **Execution Tracing** 
- **Static Simulation**: Traces execution without running code
- **Probabilistic Paths**: 85% happy path, 15% error scenarios
- **Stack Visualization**: Call hierarchies and data flow

### 🧠 **Purpose Inference**
- **Multi-Layer Evidence**: Naming + Behavioral + Structural + Dependency
- **Pattern Recognition**: Validation, coordination, transformation patterns
- **Confidence Scoring**: How certain the analysis is (up to 98%)

## 💬 Example Conversations with Claude

### **Analyze Your Codebase**
```
You: "Analyze the Canon API codebase structure"

Claude: *Uses analyze_codebase tool*
"I can see Canon is a TypeScript crypto analytics API with:
- 23 symbols across 8 files  
- Central processPayment function (hub pattern, 90% confidence)
- 3 validation functions with error handling
- WebSocket integration for real-time data
- Prometheus metrics for observability..."
```

### **Understand Specific Code**
```
You: "What's the purpose of the server.ts file?"

Claude: *Uses infer_purpose tool*
"The server.ts serves as the main application entry point and orchestrator (95% confidence). Evidence includes:
- High fan-out to 6 different components
- Initialization patterns in function names  
- Central coordination of HTTP routes, WebSocket handlers, and middleware..."
```

### **Find Related Code**
```
You: "Show me all validation-related code"

Claude: *Uses find_related_code tool*
"Found 4 validation-related symbols:
- validateUserInput (98% validation purpose)
- checkCardFormat (85% validation purpose)  
- verifyApiKey (92% security validation)
- sanitizeInput (78% data validation)..."
```

### **Trace Execution Flow**
```
You: "How does payment processing work?"

Claude: *Uses trace_execution from processPayment*
"Payment processing follows this execution flow:
1. validateCard() - Input validation (90% probability)
2. checkFraud() - Security check (85% probability) 
3. chargeCard() - External API call (95% probability)
4. Error path: handlePaymentError() (15% probability)..."
```

## 🎪 Advanced Usage Patterns

### **Architecture Understanding**
```
You: "What's the overall architecture of this system?"

Claude: *Combines analyze_codebase + get_symbol_graph*
"This is a layered REST API architecture:
- Controller layer: HTTP route handlers
- Service layer: Business logic (hub patterns detected)
- Model layer: Data structures and validation
- Integration layer: External API clients
Key insight: Strong separation of concerns with clear data flow."
```

### **Code Quality Analysis**  
```
You: "Are there any code quality issues?"

Claude: *Uses infer_purpose + analyze_codebase*
"Based on purpose inference analysis:
✅ High confidence (>80%) on core business logic
⚠️  Medium confidence on utility functions (need better naming)
✅ Clear architectural patterns detected
💡 Recommendation: Add documentation for ambiguous functions"
```

### **Refactoring Guidance**
```
You: "How should I refactor the validation code?"

Claude: *Uses find_related_code + trace_execution*
"Validation code analysis reveals:
- 4 validation functions with overlapping concerns
- validateUserInput is a hub (called by 3 other functions)
- Suggests: Extract common validation logic into shared utility
- Pattern: All validation functions follow similar error handling"
```

## 🔧 Manual Configuration (if needed)

If automatic setup doesn't work, manually add to `~/.cursor/mcp_settings.json`:

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

## 🛠️ Troubleshooting

### Guru not appearing in Cursor?
1. Check if build succeeded: `npm run build`
2. Verify path in config: `~/.cursor/mcp_settings.json`
3. Restart Cursor completely
4. Check Cursor developer console for errors

### Analysis taking too long?
Guru is optimized for speed but complex codebases may take a few seconds:
- Symbol graph building: <2 seconds
- Execution tracing: <3 seconds  
- Purpose inference: <1 second per symbol

### Getting low confidence scores?
This is normal! Guru is honest about uncertainty:
- >80% = High confidence, trust the analysis
- 60-80% = Medium confidence, useful but verify
- <60% = Low confidence, needs more context

## 🎊 What Makes This Awesome

### **Context Engineering > Prompt Engineering**
Instead of giving Claude raw code, Guru provides:
- **Structured relationships** (symbol graphs)
- **Behavioral patterns** (execution traces)  
- **Semantic understanding** (purpose inference)
- **Confidence metrics** (trust calibration)

### **AI-First Design**
Every component optimized for LLM consumption:
- JSON output with semantic labels
- Confidence scores for calibration
- Alternative interpretations for nuance
- Weighted relationships for importance

### **Zero Runtime Overhead**
Pure static analysis means:
- No code execution required
- Instant results
- Safe for any codebase
- Works on incomplete code

---

**Welcome to the future of AI-assisted development!** 🚀

Claude now understands your code like never before. Ask questions, explore architecture, understand purpose - the possibilities are endless!
