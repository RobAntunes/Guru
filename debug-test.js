const { Guru } = require('./dist/index.js');

async function debugSymbols() {
  const guru = new Guru();
  
  // Simple React component test
  const reactCode = `
export const UserComponent: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  return <div>Hello</div>;
};
  `;
  
  require('fs').writeFileSync('./debug-react.tsx', reactCode);
  
  try {
    const result = await guru.analyzeCodebase({ path: './debug-react.tsx' });
    console.log('\n=== SYMBOL DEBUG ===');
    console.log('Symbol count:', result.symbolGraph.symbols.size);
    
    for (const [id, symbol] of result.symbolGraph.symbols) {
      console.log(`Symbol: "${symbol.name}" | Type: ${symbol.type} | ID: ${id}`);
      if (symbol.metadata) {
        console.log(`  Metadata:`, symbol.metadata);
      }
    }
    
    console.log('\n=== EDGE DEBUG ===');
    console.log('Edge count:', result.symbolGraph.edges.length);
    result.symbolGraph.edges.forEach((edge, i) => {
      console.log(`Edge ${i}: ${edge.from} --(${edge.type})--> ${edge.to}`);
    });
    
  } finally {
    require('fs').unlinkSync('./debug-react.tsx');
  }
}

debugSymbols().catch(console.error);
