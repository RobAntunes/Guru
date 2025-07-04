import { Guru } from './dist/index.js';
import { writeFileSync, unlinkSync } from 'fs';

async function debugSymbols() {
  const guru = new Guru();
  
  // Simple React component test
  const reactCode = `
export const UserComponent: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  return <div>Hello</div>;
};
  `;
  
  writeFileSync('./debug-react.tsx', reactCode);
  
  try {
    const result = await guru.analyzeCodebase({ path: './debug-react.tsx' });
    console.log('\n=== AI-NATIVE SYMBOL ANALYSIS ===');
    console.log('Symbol count:', result.symbolGraph.symbols.size);
    
    for (const [id, symbol] of result.symbolGraph.symbols) {
      console.log(`Symbol: "${symbol.name}" | Type: ${symbol.type} | ID: ${id}`);
      if (symbol.metadata) {
        console.log(`  Metadata:`, JSON.stringify(symbol.metadata, null, 2));
      }
    }
    
    console.log('\n=== LATENT RELATIONSHIPS ===');
    console.log('Edge count:', result.symbolGraph.edges.length);
    result.symbolGraph.edges.forEach((edge, i) => {
      console.log(`Edge ${i}: ${edge.from} --(${edge.type})--> ${edge.to} [weight: ${edge.weight}]`);
    });
    
  } finally {
    unlinkSync('./debug-react.tsx');
  }
}

debugSymbols().catch(console.error);
