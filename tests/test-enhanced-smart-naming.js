//Enhanced Smart Symbol Naming Test
// Tests the improved confidence scoring and semantic patterns
import { SymbolGraphBuilder } from '../src/parsers/symbol-graph.js';
import path from 'path';

console.log('🧠 Testing Enhanced Smart Symbol Naming...');

async function testEnhancedSmartNaming() {
    try {
        const builder = new SymbolGraphBuilder();
        // Test on our complex patterns file
        const projectPath = process.cwd();
        console.log(`Analyzing enhanced patterns at: ${projectPath}`);
        const graph = await builder.build({
            path: projectPath,
            includeTests: true
        });
        console.log(`📊 Enhanced Analysis Results:`);
        console.log(`- Total symbols: ${graph.symbols.size}`);
        console.log(`- Total edges: ${graph.edges.length}`);
        console.log(`- Analyzed files: ${graph.metadata.analyzedFiles.length}`);
        console.log(`- Coverage: ${((graph.metadata.coverage || 0) * 100).toFixed(1)}%`);
        // Find symbols with smart naming enhancements    
        const enhancedSymbols = Array.from(graph.symbols.values()).filter(symbol => symbol.smartNaming).sort((a, b) => b.smartNaming.confidence.overall - a.smartNaming.confidence.overall);
        console.log(`🎯 Enhanced Smart Naming Results:`);
        console.log(`- Enhanced symbols: ${enhancedSymbols.length}`);
        // Categorize by confidence levels    
        const highConfidence = enhancedSymbols.filter(s => s.smartNaming.confidence.overall > 0.8);
        const mediumConfidence = enhancedSymbols.filter(s => s.smartNaming.confidence.overall > 0.6 && s.smartNaming.confidence.overall <= 0.8);
        const lowConfidence = enhancedSymbols.filter(s => s.smartNaming.confidence.overall <= 0.6);
        console.log(`📈 Confidence Distribution:`);
        console.log(`- High confidence (>80%): ${highConfidence.length}`);
        console.log(`- Medium confidence (60-80%): ${mediumConfidence.length}`);
        console.log(`- Low confidence (≤60%): ${lowConfidence.length}`);
        // Show top examples from each category
        if (highConfidence.length > 0) {
            console.log(`🏆 High Confidence Examples:`);
            highConfidence.slice(0, 3).forEach(symbol => {
                const smart = symbol.smartNaming;
                console.log(`  ${symbol.name} → ${smart.inferredName}`);
                console.log(`    Confidence: ${(smart.confidence.overall * 100).toFixed(1)}%`);
                console.log(`    Context: ${smart.context.assignmentVariable ? 'Variable Assignment' : smart.context.objectProperty ? 'Object Property' : smart.context.callbackParameter ? 'Callback Parameter' : 'Other'}`);
                console.log(`    Evidence: ${smart.confidence.evidence.join(', ')}`);
            });
        }
        if (mediumConfidence.length > 0) {
            console.log(`⚖️  Medium Confidence Examples:`);
            mediumConfidence.slice(0, 3).forEach(symbol => {
                const smart = symbol.smartNaming;
                console.log(`  ${symbol.name} → ${smart.inferredName}`);
                console.log(`    Confidence: ${(smart.confidence.overall * 100).toFixed(1)}%`);
                console.log(`    Strategy: ${(smart.confidence.strategy * 100).toFixed(0)}%, Context: ${(smart.confidence.context * 100).toFixed(0)}%`);
                if (smart.confidence.evidence && smart.confidence.evidence.length > 0) {
                    console.log(`    Evidence: ${smart.confidence.evidence.slice(0, 2).join(', ')}`);
                }
            });
        }
        // Analyze semantic patterns detected
        const semanticPatterns = new Map();
        enhancedSymbols.forEach(symbol => {
            const inferredName = symbol.smartNaming.inferredName;
            const prefix = inferredName.split('_')[0];
            if (prefix !== inferredName) {
                semanticPatterns.set(prefix, (semanticPatterns.get(prefix) || 0) + 1);
            }
        });
        if (semanticPatterns.size > 0) {
            console.log(`🏷️  Semantic Patterns Detected:`);
            Array.from(semanticPatterns.entries())
                .sort((a, b) => b[1] - a[1])
                .forEach(([pattern, count]) => {
                    console.log(`    ${pattern}: ${count} symbols`);
                });
        }
        // Show files with the most enhancements
        const fileEnhancements = new Map();
        enhancedSymbols.forEach(symbol => {
            const file = symbol.location.file;
            fileEnhancements.set(file, (fileEnhancements.get(file) || 0) + 1);
        });
        if (fileEnhancements.size > 0) {
            console.log(`📁 Files with Most Enhancements:`);
            Array.from(fileEnhancements.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([file, count]) => {
                    console.log(`    ${file}: ${count} enhanced symbols`);
                });
        }
        // Overall confidence stats
        if (enhancedSymbols.length > 0) {
            const confidenceScores = enhancedSymbols.map(s => s.smartNaming.confidence.overall);
            const avgConfidence = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
            const maxConfidence = Math.max(...confidenceScores);
            const minConfidence = Math.min(...confidenceScores);
            console.log(`📊 Overall Confidence Statistics:`);
            console.log(`- Average: ${(avgConfidence * 100).toFixed(1)}%`);
            console.log(`- Maximum: ${(maxConfidence * 100).toFixed(1)}%`);
            console.log(`- Minimum: ${(minConfidence * 100).toFixed(1)}%`);
            console.log(`- Standard deviation: ${(calculateStandardDeviation(confidenceScores) * 100).toFixed(1)}%`);
        }
        console.log(`✅ Enhanced Smart Symbol Naming test completed successfully!`);
    } catch (error) {
        console.error('❌ Enhanced test failed:', error);
        process.exit(1);
    }
}

function calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
}

testEnhancedSmartNaming();