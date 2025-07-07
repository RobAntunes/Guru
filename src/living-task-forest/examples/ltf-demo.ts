/**
 * Living Task Forest Demo
 * Demonstrates the biological task management system in action
 */

import {
  TaskForest,
  ProjectDiscoveryEngine,
  ParallelWorkflowOrchestrator,
  ProjectGoal,
  ProjectInsight,
  TaskPurpose,
  ConditionalAction
} from '../index.js';

async function runLivingTaskForestDemo() {
  console.log('\n🌲 Living Task Forest Demo\n');
  console.log('Watch as tasks emerge, evolve, and self-organize...\n');
  
  // Step 1: Create the forest ecosystem
  console.log('1️⃣ Creating forest ecosystem...');
  const forest = new TaskForest();
  
  // Step 2: Define project goals
  const goals: ProjectGoal[] = [
    {
      id: 'goal_performance',
      type: 'performance',
      description: 'Improve application performance by 50%',
      priority: 0.8
    },
    {
      id: 'goal_quality',
      type: 'quality',
      description: 'Achieve 80% test coverage',
      priority: 0.7
    },
    {
      id: 'goal_refactor',
      type: 'refactor',
      description: 'Reduce code duplication',
      priority: 0.6
    }
  ];
  
  // Step 3: Create discovery engine
  console.log('2️⃣ Initializing discovery engine...');
  const discoveryEngine = new ProjectDiscoveryEngine();
  
  // Step 4: Simulate project insights (would come from actual code analysis)
  const insights: ProjectInsight[] = [
    {
      id: 'insight_1',
      type: 'performance_issue',
      discovery: 'Database queries taking 500ms+ in user authentication',
      evidence: [
        {
          type: 'metric',
          description: 'Query execution time: 523ms average',
          strength: 0.9
        }
      ],
      confidence: 0.85,
      timestamp: Date.now(),
      source: 'performance_analyzer'
    },
    {
      id: 'insight_2',
      type: 'code_duplication',
      discovery: '30% code duplication in payment processing module',
      evidence: [
        {
          type: 'pattern',
          description: 'Identical validation logic in 5 files',
          strength: 0.8
        }
      ],
      confidence: 0.9,
      timestamp: Date.now(),
      source: 'duplication_detector'
    },
    {
      id: 'insight_3',
      type: 'missing_tests',
      discovery: 'Critical auth module has only 20% test coverage',
      evidence: [
        {
          type: 'metric',
          description: 'Test coverage: 20% (10/50 functions)',
          strength: 1.0
        }
      ],
      confidence: 1.0,
      timestamp: Date.now(),
      source: 'coverage_analyzer'
    }
  ];
  
  // Step 5: Plant seeds (create initial tasks from insights)
  console.log('\n3️⃣ Planting task seeds from insights...');
  
  for (const insight of insights) {
    const tree = await forest.plantSeed(insight);
    if (tree) {
      console.log(`  🌱 Planted: ${tree.species} - ${tree.trunk.title}`);
      console.log(`     Health: ${(tree.health * 100).toFixed(0)}%, Energy: ${(tree.energy * 100).toFixed(0)}%`);
    }
  }
  
  // Step 6: Create confidence streams
  console.log('\n4️⃣ Creating parallel confidence streams...');
  const orchestrator = new ParallelWorkflowOrchestrator();
  
  const perfStream = orchestrator.launchStream(
    'Validate performance improvements',
    'performance',
    0.8
  );
  
  const qualityStream = orchestrator.launchStream(
    'Ensure quality standards',
    'quality',
    0.7
  );
  
  // Step 7: Add evidence to streams
  console.log('\n5️⃣ Building confidence through evidence...');
  
  perfStream.addEvidence({
    id: 'ev_1',
    type: 'test',
    description: 'Benchmark shows 300ms improvement with index',
    source: 'performance_test',
    strength: 0.8,
    reliability: 0.9,
    timestamp: Date.now()
  });
  
  qualityStream.addEvidence({
    id: 'ev_2',
    type: 'analysis',
    description: 'Static analysis shows no regressions',
    source: 'code_analyzer',
    strength: 0.7,
    reliability: 0.95,
    timestamp: Date.now()
  });
  
  console.log(`  💧 Performance confidence: ${(perfStream.currentConfidence * 100).toFixed(0)}%`);
  console.log(`  💧 Quality confidence: ${(qualityStream.currentConfidence * 100).toFixed(0)}%`);
  
  // Step 8: Simulate forest evolution
  console.log('\n6️⃣ Applying environmental pressure...');
  
  await forest.evolveForest({
    type: 'time',
    intensity: 0.7,
    duration: 3600000,
    direction: 'urgent_deadline'
  });
  
  console.log('  🌊 Forest evolved under time pressure');
  console.log('  🧬 Tasks adapted for faster execution');
  
  // Step 9: Check forest health
  console.log('\n7️⃣ Assessing forest health...');
  const health = forest.assessForestHealth();
  
  console.log(`  🌿 Biodiversity: ${(health.biodiversity * 100).toFixed(0)}%`);
  console.log(`  🏔️ Stability: ${(health.stability * 100).toFixed(0)}%`);
  console.log(`  ⚡ Productivity: ${(health.productivity * 100).toFixed(0)}%`);
  console.log(`  ♻️ Sustainability: ${(health.sustainability * 100).toFixed(0)}%`);
  console.log(`  💚 Overall Health: ${(health.overallHealth * 100).toFixed(0)}%`);
  
  // Step 10: Simulate task reproduction
  console.log('\n8️⃣ Task reproduction event...');
  
  const matureTrees = forest.findTrees({ lifecycle: 'mature' as any });
  if (matureTrees.length > 0) {
    const parent = matureTrees[0];
    const offspring = await parent.reproduce({
      type: 'complexity_discovered',
      discovery: 'Authentication has 5 different flows',
      confidence: 0.8
    });
    
    if (offspring.length > 0) {
      console.log(`  🌿 Task ${parent.species} reproduced ${offspring.length} offspring!`);
      offspring.forEach((child, i) => {
        console.log(`     ${i + 1}. ${child.trunk.title}`);
      });
    }
  }
  
  // Step 11: Register conditional actions
  console.log('\n9️⃣ Registering conditional actions...');
  
  const deployAction: ConditionalAction = {
    id: 'action_deploy',
    description: 'Deploy performance improvements',
    requiredConfidence: 0.8,
    currentConfidence: perfStream.currentConfidence,
    risks: ['potential_downtime'],
    execute: async () => {
      console.log('  🚀 Deploying performance improvements...');
      return { success: true, deployedAt: Date.now() };
    }
  };
  
  perfStream.registerAction(deployAction);
  
  // Step 12: Add more evidence to trigger action
  console.log('\n🔟 Adding final evidence to trigger action...');
  
  perfStream.addEvidence({
    id: 'ev_3',
    type: 'test',
    description: 'Load test passed with 2x improvement',
    source: 'load_test',
    strength: 0.9,
    reliability: 1.0,
    timestamp: Date.now()
  });
  
  console.log(`  💧 Performance confidence: ${(perfStream.currentConfidence * 100).toFixed(0)}%`);
  
  if (perfStream.currentConfidence >= 0.8) {
    console.log('  ✅ Confidence threshold reached!');
    const cascade = await perfStream.triggerActions();
    console.log(`  🎯 Triggered ${cascade.triggered.length} actions`);
  }
  
  // Step 13: Show final statistics
  console.log('\n📊 Final Forest Statistics:');
  const stats = forest.getStatistics();
  
  console.log(`  🌲 Active trees: ${stats.forest.activeTrees}`);
  console.log(`  💀 Extinct trees: ${stats.forest.totalExtinct}`);
  console.log(`  🌱 Total reproductions: ${stats.forest.totalReproductions}`);
  console.log(`  🧬 Total mutations: ${stats.forest.totalMutations}`);
  
  console.log('\n✨ Living Task Forest Demo Complete!');
  console.log('The forest continues to evolve and adapt...\n');
  
  // Clean up
  forest.stop();
  orchestrator.stop();
}

/**
 * Advanced demo showing task communication
 */
async function demonstrateTaskCommunication() {
  console.log('\n🗣️ Task Communication Demo\n');
  
  const forest = new TaskForest();
  
  // Create two related tasks
  const task1 = await forest.plantSeed({
    id: 'insight_api',
    type: 'refactor',
    discovery: 'API endpoints need restructuring',
    evidence: [],
    confidence: 0.8,
    timestamp: Date.now(),
    source: 'code_analysis'
  });
  
  const task2 = await forest.plantSeed({
    id: 'insight_db',
    type: 'optimize',
    discovery: 'Database schema needs optimization',
    evidence: [],
    confidence: 0.7,
    timestamp: Date.now(),
    source: 'performance_analysis'
  });
  
  if (task1 && task2) {
    // Establish connection
    task1.connections.push({
      treeId: task2.id,
      type: 'collaborates_with',
      strength: 0.8,
      data: { reason: 'Both affect data layer' }
    });
    
    // Simulate discovery sharing
    const discovery = {
      type: 'complexity',
      description: 'Shared data models need refactoring',
      relevance: 0.9
    };
    
    const response1 = await task1.processDiscovery(discovery);
    const response2 = await task2.processDiscovery(discovery);
    
    console.log('Task 1 response:', response1);
    console.log('Task 2 response:', response2);
    
    // Check if tasks evolved
    console.log(`\nTask 1 now has ${task1.branches.length} branches`);
    console.log(`Task 2 now has ${task2.branches.length} branches`);
  }
  
  forest.stop();
}

// Run the demos
if (import.meta.url === `file://${process.argv[1]}`) {
  runLivingTaskForestDemo()
    .then(() => demonstrateTaskCommunication())
    .catch(console.error);
}