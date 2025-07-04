import { Guru } from './dist/index.js';
import { writeFileSync, unlinkSync } from 'fs';

async function debugSymbols() {
  const guru = new Guru();
  
  // Simple TypeScript function test
  const tsCode = `
export const processUser = (user: User) => {
  const result = user.name.toUpperCase();
  return result;
};

interface User {
  name: string;
  id: number;
}
  `;
  
  writeFileSync('./debug-ts.ts', tsCode);
  
  try {
    const result = await guru.analyzeCodebase({ path: './debug-ts.ts' });
    console.log('\n=== AI-NATIVE SYMBOL ANALYSIS (.ts) ===');
    console.log('Symbol count:', result.symbolGraph.symbols.size);
    
    for (const [id, symbol] of result.symbolGraph.symbols) {
      console.log(`Symbol: "${symbol.name}" | Type: ${symbol.type} | ID: ${id}`);
      if (symbol.metadata?.isComponent) {
        console.log(`  🔹 AI-detected component pattern!`);
      }
    }
    
  } finally {
    unlinkSync('./debug-ts.ts');
  }
}

debugSymbols().catch(console.error);
