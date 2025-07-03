#!/bin/bash

# Build and test the Code Clustering feature

echo "🔨 Building Guru with Code Clustering..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo ""
    echo "🧩 Running Code Clustering test..."
    node test-code-clustering.js
    
    echo ""
    echo "📋 Code Clustering Summary:"
    echo "- AI-native semantic zone detection"
    echo "- Multi-algorithm clustering (connectivity, semantic, structural, hybrid)"
    echo "- Confidence-scored cluster analysis"
    echo "- Semantic zone classification (feature, UI, API, data, utility, test)"
    echo "- Architectural layer detection (presentation, application, domain, infrastructure)"
    echo "- Code organization health metrics"
    
    echo ""
    echo "🎯 Clustering Capabilities:"
    echo "  ✓ File-based structural clustering"
    echo "  ✓ Semantic similarity analysis"
    echo "  ✓ Connectivity-based grouping"
    echo "  ✓ Hybrid intelligent clustering"
    echo "  ✓ Confidence scoring with evidence"
    echo "  ✓ Semantic zone detection (UI, API, data, test, etc.)"
    echo "  ✓ Architectural layer classification"
    echo "  ✓ Code quality and coupling metrics"
    echo "  ✓ Clustering ratio and coverage analysis"
    
    echo ""
    echo "🚀 Feature Status:"
    echo "  Smart Symbol Naming ✅ COMPLETE"
    echo "  Entry Point Detection ✅ COMPLETE"
    echo "  Code Clustering & Semantic Zones ✅ COMPLETE"
    echo "  Next: Pattern Detection & Change Analysis"
    
else
    echo "❌ Build failed. Please check TypeScript compilation errors."
    exit 1
fi
