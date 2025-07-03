/**
 * Sample Entry Points for Testing
 * Various patterns that should be detected as entry points
 */

// Classic main function
function main() {
  console.log('Application starting...');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node main.js <command>');
    process.exit(1);
  }
  
  const command = args[0];
  
  switch (command) {
    case 'serve':
      startServer();
      break;
    case 'build':
      buildProject();
      break;
    default:
      console.log('Unknown command:', command);
      process.exit(1);
  }
}

// Server startup function
function startServer() {
  const express = require('express');
  const app = express();
  
  app.get('/', (req, res) => {
    res.send('Hello World!');
  });
  
  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
}

// Build function
function buildProject() {
  console.log('Building project...');
  // Build logic here
}

// CLI entry point check
if (require.main === module) {
  main();
}

module.exports = { main, startServer, buildProject };
