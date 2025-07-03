import { GuruCore } from '../src/core/guru.js';

(async () => {
  const guru = new GuruCore();
  const analysis = await guru.analyzeCodebase({ path: '.', language: 'javascript', includeTests: false });
  const perf = analysis.performanceAnalysis;
  if (!perf) {
    console.error('❌ No performance analysis result found!');
    process.exit(1);
  }
  console.log('\n=== Performance Analysis Test ===');
  // Print issues
  if (perf.issues.length === 0) {
    console.log('✅ No performance issues detected for the tested detectors!');
  } else {
    console.log(`❌ Detected ${perf.issues.length} performance issue(s):`);
    for (const issue of perf.issues) {
      console.log(`- [${issue.severity}] ${issue.type} in ${issue.symbolId}`);
      if (issue.evidence && issue.evidence.length) {
        for (const ev of issue.evidence) {
          console.log(`    Evidence: ${ev}`);
        }
      }
    }
  }
  // Print key metrics
  const m = perf.metrics;
  console.log('\n--- Key Metrics ---');
  console.log(`Total LOC: ${m.totalLOC}`);
  console.log(`Avg Cyclomatic Complexity: ${m.avgCyclomaticComplexity}`);
  console.log(`Function Count: ${m.functionCount}`);
  console.log(`Call Graph Edges: ${m.callGraphEdges}`);
  console.log(`Symbol Count: ${m.symbolCount}`);
  // Assert detectorsRun
  const expected = ['quadratic_complexity','memory_leak','inefficient_db_io','recomputation','ownership_lifetime'];
  const missing = expected.filter(d => !perf.detectorsRun.includes(d));
  if (missing.length) {
    console.error(`❌ Missing detectors: ${missing.join(', ')}`);
    process.exit(1);
  } else {
    console.log('✅ All expected detectors ran.');
  }
})(); 