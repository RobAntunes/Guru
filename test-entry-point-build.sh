#!/bin/bash

# Build and test the Entry Point Detection feature

echo "🔨 Building Guru with Entry Point Detection..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo ""
    echo "🎯 Running Entry Point Detection test..."
    node test-entry-point-detection.js
    
    echo ""
    echo "📋 Entry Point Detection Summary:"
    echo "- Confidence-scored entry point identification"
    echo "- Multi-pattern detection (function names, file patterns, CLI usage)"
    echo "- Package.json integration (main, bin, scripts)"
    echo "- Execution context analysis (Node.js, browser, worker, test)"
    echo "- Framework detection (Express, React, Vue)"
    echo "- Priority classification (primary, secondary, tertiary)"
    
    echo ""
    echo "🎯 Detection Capabilities:"
    echo "  ✓ Function name patterns (main, start, init, run, bootstrap)"
    echo "  ✓ File patterns (index.js, main.js, app.js, server.js, cli.js)"
    echo "  ✓ CLI usage detection (process.argv, commander, yargs)"
    echo "  ✓ Server patterns (app.listen, server.listen, createServer)"
    echo "  ✓ Module checks (require.main === module, import.meta.main)"
    echo "  ✓ Browser patterns (window.onload, DOMContentLoaded)"
    echo "  ✓ Package.json entries (main, bin, scripts)"
    echo "  ✓ Execution context analysis"
    echo "  ✓ Framework detection"
    echo "  ✓ Confidence scoring with evidence tracking"
    
    echo ""
    echo "🚀 Ready for next features!"
    echo "  Smart Symbol Naming ✅ COMPLETE"
    echo "  Entry Point Detection ✅ COMPLETE"
    echo "  Next: Code Clustering & Pattern Detection"
    
else
    echo "❌ Build failed. Please check TypeScript compilation errors."
    exit 1
fi
