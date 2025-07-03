#!/bin/bash

# Build and test the Enhanced Smart Symbol Naming feature

echo "🔨 Building Enhanced Guru project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🧠 Running Enhanced Smart Symbol Naming test..."
    node test-enhanced-smart-naming.js
    echo ""
    echo "📋 Enhanced Features Summary:"
    echo "- Smart Symbol Naming with contextual detection"
    echo "- Advanced confidence scoring system"
    echo "- Comprehensive semantic prefix patterns"
    echo "- Function body analysis for purpose inference"
    echo "- Pattern detection (async, error handling, API calls, etc.)"
    echo ""
    echo "🎯 Test completed!"
else
    echo "❌ Build failed!"
    exit 1
fi
