#!/usr/bin/env node

console.time('total-startup');
console.log('1. Starting debug...');

console.time('guru-import');
import { GuruCore } from "./src/core/guru.js";
console.timeEnd('guru-import');
console.log('2. Imported GuruCore');

console.time('guru-create');
const guru = new GuruCore();
console.timeEnd('guru-create');
console.log('3. Created GuruCore instance');

console.time('guru-analyze');
guru.analyzeCodebase('src/core', undefined, 'incremental').then(result => {
  console.timeEnd('guru-analyze');
  console.log('4. Analysis complete');
  console.timeEnd('total-startup');
  console.log('Result size:', JSON.stringify(result).length, 'characters');
}).catch(err => {
  console.timeEnd('guru-analyze');
  console.error('Analysis failed:', err);
  console.timeEnd('total-startup');
});