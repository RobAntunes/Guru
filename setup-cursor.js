#!/usr/bin/env node

/**
 * 🚀 Guru MCP Setup Script for Cursor
 * Automatically configures Guru as an MCP server in Cursor
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const GURU_PATH = '/Users/boss/Documents/projects/guru';

function getCursorConfigPath() {
  const platform = os.platform();
  const homeDir = os.homedir();
  
  switch (platform) {
    case 'darwin': // macOS
      return path.join(homeDir, '.cursor', 'mcp.json');
    case 'win32': // Windows
      return path.join(process.env.APPDATA || '', 'Cursor', 'mcp.json');
    case 'linux':
      return path.join(homeDir, '.cursor', 'mcp.json');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function createMCPConfig() {
  return {
    mcpServers: {
      guru: {
        command: 'node',
        args: [path.join(GURU_PATH, 'dist', 'index.js')],
        env: {}
      }
    }
  };
}

async function setupCursorIntegration() {
  console.log('🧠 Setting up Guru MCP integration for Cursor...');
  console.log('='.repeat(50));
  
  try {
    // Check if Guru is built
    const distPath = path.join(GURU_PATH, 'dist', 'index.js');
    if (!fs.existsSync(distPath)) {
      console.log('⚠️  Guru not built yet. Building now...');
      const { execSync } = await import('child_process');
      execSync('npm run build', { cwd: GURU_PATH, stdio: 'inherit' });
      console.log('✅ Guru built successfully');
    }
    
    // Get Cursor config path
    const configPath = getCursorConfigPath();
    const configDir = path.dirname(configPath);
    
    console.log(`📁 Cursor config path: ${configPath}`);
    
    // Create config directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log('📁 Created Cursor config directory');
    }
    
    // Read existing config or create new one
    let config = {};
    if (fs.existsSync(configPath)) {
      const existingConfig = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(existingConfig);
      console.log('📖 Read existing Cursor configuration');
    } else {
      console.log('📝 Creating new Cursor configuration');
    }
    
    // Add or update Guru MCP server
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    
    config.mcpServers.guru = {
      command: 'node',
      args: [path.join(GURU_PATH, 'dist', 'index.js')],
      env: {}
    };
    
    // Write updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Guru MCP server added to Cursor configuration');
    
    console.log('\\n🎯 SETUP COMPLETE!');
    console.log('='.repeat(30));
    console.log('📋 What to do next:');
    console.log('  1. Restart Cursor completely');
    console.log('  2. Open your Canon project in Cursor');
    console.log('  3. Ask Claude to analyze your codebase!');
    
    console.log('\\n🧠 Try asking Claude:');
    console.log('  • "Analyze the Canon API codebase structure"');
    console.log('  • "What\'s the purpose of the server.ts file?"');
    console.log('  • "Show me all validation-related code"');
    console.log('  • "Trace execution flow for payment processing"');
    
    console.log('\\n🚀 Claude now has revolutionary code intelligence!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\\n🔧 Manual setup instructions:');
    console.error(`  1. Create: ${getCursorConfigPath()}`);
    console.error('  2. Add this content:');
    console.error(JSON.stringify(createMCPConfig(), null, 2));
    process.exit(1);
  }
}

// Run setup
setupCursorIntegration().catch(console.error);
