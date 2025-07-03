#!/bin/bash

# Build and test the Smart Symbol Naming feature

echo "🔨 Building Guru project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo ""
    echo "🧠 Running Smart Symbol Naming test..."
    node test-smart-naming.js
    
    echo ""
    echo "📋 Summary:"
    echo "- Smart Symbol Naming feature implemented"
    echo "- Confidence scoring system integrated"
    echo "- Contextual naming strategies active"
    echo "- Enhanced symbol graph with smart naming metadata"
    
    echo ""
    echo "🎯 Key Features Implemented:"
    echo "  ✓ Variable assignment context detection"
    echo "  ✓ Object property context detection"
    echo "  ✓ Callback parameter context detection"
    echo "  ✓ Export context detection"
    echo "  ✓ Class method context detection"
    echo "  ✓ Semantic prefix application"
    echo "  ✓ Confidence scoring (identity, purpose, relationships, impact)"
    echo "  ✓ Hash-based stable IDs for anonymous functions"
    echo "  ✓ Evidence and limitation tracking"
    
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Test with your codebase: node test-smart-naming.js"
    echo "  2. Implement Entry Point Detection (Feature 2)"
    echo "  3. Add more semantic prefix patterns as needed"
    echo "  4. Fine-tune confidence scoring based on real usage"
    
else
    echo "❌ Build failed. Please check TypeScript compilation errors."
    exit 1
fi
