#!/usr/bin/env node

// Quick test to identify where the delay is coming from
console.log('Starting quick test...');
console.time('total');

console.time('imports');
import('./src/index.js').then(() => {
  console.timeEnd('imports');
  console.log('Import complete');
  console.timeEnd('total');
}).catch(err => {
  console.error('Import failed:', err);
  console.timeEnd('total');
});