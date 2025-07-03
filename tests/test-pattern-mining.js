import { GuruCore } from './dist/core/guru.js';

(async () => {
  const guru = new GuruCore();
  await guru.analyzeCodebase({ path: './' });
  const result = guru.minePatterns();

  console.log('=== Pattern Mining Clusters ===');
  result.clusters.forEach(cluster => {
    console.log(`\n[${cluster.id}] Cohesion: ${(cluster.cohesion * 100).toFixed(1)}%`);
    console.log(`Summary: ${cluster.summary}`);
    cluster.members.slice(0, 3).forEach(member => {
      console.log(`  - ${member.type} ${member.name} (${member.file})`);
    });
    if (cluster.members.length > 3) {
      console.log(`  ...and ${cluster.members.length - 3} more`);
    }
  });

  console.log('\n=== Outliers ===');
  result.outliers.forEach(outlier => {
    console.log(`- ${outlier.type} ${outlier.name} (${outlier.file})`);
  });

  console.log('\n=== Pattern Inference Result (AI-Ready) ===');
  console.log(JSON.stringify(result, null, 2));
})(); 