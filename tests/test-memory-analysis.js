import { GuruCore } from '../src/core/guru';

(async () => {
  const guru = new GuruCore();
  const analysis = await guru.analyzeCodebase({ path: '.', language: 'javascript', includeTests: false });
  const mem = analysis.memoryIntelligence;
  if (!mem) {
    console.error('❌ No memory intelligence analysis result found!');
    process.exit(1);
  }
  console.log('\n=== Memory Intelligence Analysis Test ===');
  // Print stale closure risks
  const stale = mem.fundamentalAnalysis.staleClosure;
  if (stale.closureRisks.length === 0) {
    console.log('✅ No stale closure risks detected!');
  } else {
    console.log(`❌ Detected ${stale.closureRisks.length} stale closure risk(s):`);
    for (const risk of stale.closureRisks) {
      console.log(`- [${risk.severity}] ${risk.riskType} in ${risk.symbolId}`);
      if (risk.evidence && risk.evidence.length) {
        for (const ev of risk.evidence) {
          console.log(`    Evidence: ${ev}`);
        }
      }
    }
  }
  // Print memory health score
  const health = mem.fundamentalAnalysis.memoryHealth;
  console.log(`\nMemory Health Score: ${health.overallScore}/100`);
  if (health.criticalIssues.length) {
    console.log('Critical Issues:');
    for (const issue of health.criticalIssues) {
      console.log(`- [${issue.severity}] ${issue.issue} in ${issue.symbolId}`);
    }
  }
  // Print data flow summary
  const dataFlow = mem.fundamentalAnalysis.dataFlow;
  console.log(`\nData Flows: ${dataFlow.dataFlows.length}`);
  if (dataFlow.dataFlows.length) {
    for (const flow of dataFlow.dataFlows.slice(0, 3)) {
      console.log(`- ${flow.sourceSymbol} → [${flow.sinkSymbols.join(', ')}], leakRisk: ${flow.leakRisk}`);
    }
    if (dataFlow.dataFlows.length > 3) console.log('...');
  }
  // Print pseudo-stack summary
  const stack = mem.fundamentalAnalysis.pseudoStack;
  console.log(`\nMax Stack Depth: ${stack.maxStackDepth}`);
  console.log(`Recursion Patterns: ${stack.recursionPatterns.length}`);
  if (stack.recursionPatterns.length) {
    for (const rec of stack.recursionPatterns) {
      console.log(`- Recursion in ${rec.functionChain.join(' → ')}, type: ${rec.recursionType}`);
    }
  }
  // Print meta/performance
  const meta = mem.metaMemoryAnalysis;
  if (meta && meta.allocationFingerprint) {
    console.log(`\nAllocation Rhythm: ${meta.allocationFingerprint.allocationRhythm}`);
    console.log(`Size Distribution: mean=${meta.allocationFingerprint.sizeDistribution.mean}, stddev=${meta.allocationFingerprint.sizeDistribution.stddev}`);
    console.log(`Complexity Class: ${meta.allocationFingerprint.complexitySignature.complexityClass}`);
  }
  // Print side-channel analysis
  const side = mem.sideChannelAnalysis;
  if (side && side.cacheEfficiency) {
    console.log(`\nCache Line Utilization: ${side.cacheEfficiency.cacheLineUtilization}`);
    console.log(`Cache Miss Risk: ${side.cacheEfficiency.cacheMissRisk}`);
  }
  // Print scalability
  const anti = mem.antiPatternAnalysis;
  if (anti && anti.scalability) {
    console.log(`\nScalability Prediction: ${anti.scalability.resourceGrowthPrediction.pattern}`);
    console.log(`Scalability Score: ${anti.scalability.scalabilityScore}`);
  }
  // Print sensitive data paths
  if (dataFlow.sensitiveDataPaths && dataFlow.sensitiveDataPaths.length) {
    console.log(`\nSensitive Data Paths: ${dataFlow.sensitiveDataPaths.length}`);
    for (const path of dataFlow.sensitiveDataPaths.slice(0, 3)) {
      console.log(`- ${path.sourceSymbol} → [${path.sinkSymbols.join(', ')}], confidence: ${path.confidence}`);
    }
    if (dataFlow.sensitiveDataPaths.length > 3) console.log('...');
  }
  // Print data lifetimes
  if (dataFlow.dataLifetimes && dataFlow.dataLifetimes.length) {
    console.log(`\nData Lifetimes: ${dataFlow.dataLifetimes.length}`);
    for (const life of dataFlow.dataLifetimes.slice(0, 3)) {
      console.log(`- ${life.symbolId}: lifetime=${life.lifetime}`);
    }
    if (dataFlow.dataLifetimes.length > 3) console.log('...');
  }
  // Print flow security issues
  if (dataFlow.flowSecurity && dataFlow.flowSecurity.issues && dataFlow.flowSecurity.issues.length) {
    console.log(`\nFlow Security Issues: ${dataFlow.flowSecurity.issues.length}`);
    for (const issue of dataFlow.flowSecurity.issues.slice(0, 3)) {
      console.log(`- ${issue.symbolId}: ${issue.issue}`);
    }
    if (dataFlow.flowSecurity.issues.length > 3) console.log('...');
  }
  // Print lifetime/ownership conflicts
  if (stale.lifetimeConflicts && stale.lifetimeConflicts.length) {
    console.log(`\nLifetime/Ownership Conflicts: ${stale.lifetimeConflicts.length}`);
    for (const conflict of stale.lifetimeConflicts.slice(0, 3)) {
      console.log(`- ${conflict.symbolId}: ${conflict.conflict}`);
    }
    if (stale.lifetimeConflicts.length > 3) console.log('...');
  }
  // Print ownership graph
  const ownership = mem.ownershipGraph;
  if (ownership) {
    console.log(`\nOwnership Graph: ${ownership.nodes.length} nodes, ${ownership.edges.length} edges, ${ownership.cycles.length} cycles`);
    if (ownership.cycles.length) {
      for (const cycle of ownership.cycles.slice(0, 2)) {
        console.log(`- Cycle: ${cycle.join(' -> ')}`);
      }
      if (ownership.cycles.length > 2) console.log('...');
    }
  }
  // Print aliasing analysis
  const aliasing = mem.aliasing;
  if (aliasing && aliasing.length) {
    const aliased = aliasing.filter(a => a.isAliased);
    console.log(`\nAliased Symbols: ${aliased.length}`);
    for (const a of aliased.slice(0, 3)) {
      console.log(`- ${a.symbolId}, mutated after share: ${a.isMutatedAfterShare}`);
    }
    if (aliased.length > 3) console.log('...');
  }
  // Print lifetime regions
  const lifetimes = mem.lifetimeRegions;
  if (lifetimes && lifetimes.length) {
    console.log(`\nLifetime Regions: ${lifetimes.length}`);
    for (const l of lifetimes.slice(0, 3)) {
      console.log(`- ${l.symbolId}: [${l.validFrom}, ${l.validTo}]`);
    }
    if (lifetimes.length > 3) console.log('...');
  }
  // Print resource leaks
  const leaks = mem.resourceLeaks;
  if (leaks && leaks.length) {
    console.log(`\nResource Leaks: ${leaks.length}`);
    for (const leak of leaks.slice(0, 3)) {
      console.log(`- ${leak.symbolId}: ${leak.leakType}`);
    }
    if (leaks.length > 3) console.log('...');
  }
  // Print API ownership contracts
  const contracts = mem.apiContracts;
  if (contracts && contracts.length) {
    const takes = contracts.filter(c => c.takesOwnership);
    const borrows = contracts.filter(c => c.borrows);
    const returns = contracts.filter(c => c.returnsOwnership);
    console.log(`\nAPI Ownership Contracts: ${contracts.length}`);
    console.log(`- Takes Ownership: ${takes.length}`);
    console.log(`- Borrows: ${borrows.length}`);
    console.log(`- Returns Ownership: ${returns.length}`);
    for (const c of contracts.slice(0, 2)) {
      console.log(`- ${c.symbolId}: takes=${c.takesOwnership}, borrows=${c.borrows}, returns=${c.returnsOwnership}`);
    }
    if (contracts.length > 2) console.log('...');
  }
  // Print memory hotspots
  const hotspots = mem.memoryHotspots;
  if (hotspots && hotspots.length) {
    console.log(`\nMemory Hotspots: ${hotspots.length}`);
    for (const h of hotspots.slice(0, 3)) {
      console.log(`- ${h.symbolId}: pressure=${h.pressureScore.toFixed(2)}, allocFreq=${h.allocationFrequency}, churn=${h.churnRate.toFixed(2)}, retention=${h.retentionScore.toFixed(2)}`);
    }
    if (hotspots.length > 3) console.log('...');
  }
  // Print data type psychology
  const psych = mem.dataTypePsychology;
  if (psych && psych.length) {
    const known = psych.filter(p => p.inferredType !== 'unknown');
    console.log(`\nData Type Psychology: ${known.length} classified`);
    for (const p of known.slice(0, 3)) {
      console.log(`- ${p.symbolId}: type=${p.inferredType}, confidence=${p.confidence}`);
    }
    if (known.length > 3) console.log('...');
  }
  // Print side-channel issues (real logic)
  const sideChannel = mem.sideChannelIssues;
  if (sideChannel && sideChannel.length) {
    console.log(`\nSide-Channel Issues: ${sideChannel.length}`);
    for (const s of sideChannel.slice(0, 3)) {
      console.log(`- ${s.symbolId}: ${s.issue}, confidence=${s.confidence}, feedback=${s.feedback?.status}`);
      if (s.evidence && s.evidence.length) console.log(`  Evidence: ${s.evidence[0]}`);
    }
    if (sideChannel.length > 3) console.log('...');
  }
  // Print universal memory anti-patterns (real logic)
  const antiPatterns = mem.universalMemoryAntiPatterns;
  if (antiPatterns && antiPatterns.length) {
    console.log(`\nUniversal Memory Anti-Patterns: ${antiPatterns.length}`);
    for (const a of antiPatterns.slice(0, 3)) {
      console.log(`- ${a.symbolId}: ${a.pattern}, confidence=${a.confidence}, feedback=${a.feedback?.status}`);
      if (a.evidence && a.evidence.length) console.log(`  Evidence: ${a.evidence[0]}`);
    }
    if (antiPatterns.length > 3) console.log('...');
  }
  // Print keyword analysis
  const keywordAnalysis = mem.keywordAnalysis;
  if (keywordAnalysis && keywordAnalysis.length) {
    console.log(`\nKeyword Analysis: ${keywordAnalysis.length} symbols with keywords`);
    for (const k of keywordAnalysis.slice(0, 3)) {
      console.log(`- ${k.symbolId}:`);
      for (const kw of k.keywords.slice(0, 5)) {
        console.log(`  keyword='${kw.keyword}', context=${kw.context}, confidence=${kw.confidence}`);
      }
      if (k.keywords.length > 5) console.log('  ...');
    }
    if (keywordAnalysis.length > 3) console.log('...');
  }
  // Print flow prediction
  const flowPrediction = mem.flowPrediction;
  if (flowPrediction && flowPrediction.length) {
    console.log(`\nFlow Prediction: ${flowPrediction.length} symbols`);
    for (const f of flowPrediction.slice(0, 3)) {
      console.log(`- ${f.symbolId}: downstream=${f.downstream.length}, upstream=${f.upstream.length}, confidence=${f.confidence}`);
    }
    if (flowPrediction.length > 3) console.log('...');
  }
  // Print impact analysis
  const impactAnalysis = mem.impactAnalysis;
  if (impactAnalysis && impactAnalysis.length) {
    console.log(`\nImpact Analysis: ${impactAnalysis.length} symbols`);
    for (const i of impactAnalysis.slice(0, 3)) {
      console.log(`- ${i.symbolId}: impactedSymbols=${i.impactedSymbols.length}, riskScore=${i.riskScore}`);
    }
    if (impactAnalysis.length > 3) console.log('...');
  }
  // Print health scores
  const healthScores = mem.healthScores;
  if (healthScores && healthScores.length) {
    console.log(`\nHealth Scores: ${healthScores.length} symbols`);
    for (const h of healthScores.slice(0, 3)) {
      console.log(`- ${h.symbolId}: score=${h.score}, breakdown=${JSON.stringify(h.breakdown)}, suggestions=${h.suggestions.join('; ')}`);
    }
    if (healthScores.length > 3) console.log('...');
  }
  // Assert output structure
  if (typeof health.overallScore !== 'number' || !('dimensions' in health)) {
    console.error('❌ Malformed memory health score!');
    process.exit(1);
  }
  if (!('dataFlows' in dataFlow) || !('maxStackDepth' in stack) || !meta || !('allocationFingerprint' in meta)) {
    console.error('❌ Malformed memory intelligence output!');
    process.exit(1);
  }
  if (!('allocationFingerprint' in meta) || !('cacheEfficiency' in side) || !('scalability' in anti)) {
    console.error('❌ Malformed meta-memory/side-channel output!');
    process.exit(1);
  }
  if (!('dataLifetimes' in dataFlow) || !('lifetimeConflicts' in stale) || !('sensitiveDataPaths' in dataFlow) || !('flowSecurity' in dataFlow)) {
    console.error('❌ Malformed lifetime/ownership/sensitive data output!');
    process.exit(1);
  }
  if (!('ownershipGraph' in mem) || !('aliasing' in mem) || !('lifetimeRegions' in mem) || !('resourceLeaks' in mem) || !('apiContracts' in mem)) {
    console.error('❌ Malformed ownership/aliasing/leak/contract output!');
    process.exit(1);
  }
  if (!('memoryHotspots' in mem) || !('dataTypePsychology' in mem) || !('sideChannelIssues' in mem) || !('universalMemoryAntiPatterns' in mem)) {
    console.error('❌ Malformed memory hotspots/psychology/side-channel/anti-pattern output!');
    process.exit(1);
  }
  console.log('✅ Memory intelligence analysis output structure is valid.');
})(); 