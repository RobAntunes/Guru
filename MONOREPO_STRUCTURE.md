# Guru Monorepo Structure

## 📁 Proposed Directory Structure

```
guru/
├── packages/                      # All packages managed by npm/yarn workspaces
│   ├── core/                     # Existing Guru core (current codebase)
│   │   ├── src/
│   │   ├── tests/
│   │   └── package.json
│   │
│   ├── desktop/                  # Electron desktop app
│   │   ├── src/
│   │   │   ├── main/            # Electron main process
│   │   │   ├── renderer/        # React UI
│   │   │   └── preload/         # Preload scripts
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── mcp-server/              # Python MCP server
│   │   ├── guru_mcp/
│   │   │   ├── server.py
│   │   │   ├── tools/
│   │   │   └── silc_bridge.py
│   │   ├── tests/
│   │   └── pyproject.toml
│   │
│   ├── models/                   # AI model integrations
│   │   ├── phi4-mini/           # Phi-4 Mini integration
│   │   │   ├── src/
│   │   │   └── quantization/
│   │   ├── shared/              # Shared model utilities
│   │   └── package.json
│   │
│   ├── shared/                   # Shared TypeScript types & utils
│   │   ├── types/
│   │   ├── utils/
│   │   └── package.json
│   │
│   └── silc-protocol/           # SILC protocol implementation
│       ├── src/
│       └── package.json
│
├── apps/                         # Example applications
│   ├── vscode-extension/
│   └── web-demo/
│
├── scripts/                      # Build and dev scripts
├── docs/                        # Documentation
├── .github/                     # GitHub workflows
├── package.json                 # Root package.json with workspaces
├── turbo.json                   # Turborepo config (optional)
└── README.md
```

## 🛠️ Technology Stack

### Desktop App (Electron + React + TypeScript)
- **Electron**: Cross-platform desktop app
- **React**: Modern UI with shadcn/ui components
- **Vite**: Fast build tooling
- **TypeScript**: Type safety across the board
- **Tailwind CSS**: Styling

### MCP Server (Python)
- **Python 3.11+**: For MCP SDK compatibility
- **asyncio**: Async server implementation
- **Poetry**: Python dependency management
- **pytest**: Testing

### Model Integration
- **ONNX Runtime**: For quantized model inference
- **transformers**: Hugging Face integration
- **llama.cpp**: Alternative for extreme optimization

### Shared Infrastructure
- **npm/yarn workspaces**: Monorepo management
- **TypeScript**: Shared types between packages
- **Turborepo**: Build optimization (optional)
- **ESLint/Prettier**: Code quality

## 🚀 Implementation Plan

### Phase 1: Monorepo Setup (Week 1)
1. Restructure current code into `packages/core/`
2. Set up npm workspaces
3. Create shared types package
4. Set up build scripts

### Phase 2: Desktop App (Week 2-3)
1. Initialize Electron + React app
2. Create UI for Guru features
3. IPC communication with core
4. Auto-update functionality

### Phase 3: MCP Server (Week 3-4)
1. Python MCP server setup
2. Implement all 5 tools
3. Bridge to TypeScript core
4. Testing and validation

### Phase 4: Model Integration (Week 4-5)
1. Phi-4 Mini quantization (4-bit/8-bit)
2. ONNX optimization
3. Local inference pipeline
4. Performance benchmarking

### Phase 5: SILC Protocol (Week 5-6)
1. Define SILC message format
2. Implement protocol handlers
3. AI-to-AI communication
4. Integration testing

## 📦 Package Dependencies

### Root package.json
```json
{
  "name": "guru-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "desktop": "npm run dev --workspace=@guru/desktop",
    "mcp": "cd packages/mcp-server && poetry run python -m guru_mcp.server"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### Desktop App Tech Stack
```json
{
  "name": "@guru/desktop",
  "dependencies": {
    "electron": "^28.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "latest"
  }
}
```

## 🎯 Key Benefits of Monorepo

1. **Shared Code**: Core Guru logic used by both desktop and MCP server
2. **Unified Types**: TypeScript types shared across all packages
3. **Atomic Changes**: Update multiple packages in single commit
4. **Consistent Tooling**: Same build/test/lint setup everywhere
5. **Easy Deployment**: Build all packages with one command

## 🔥 Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/yourusername/guru
cd guru
npm install

# Development
npm run dev          # Start all dev servers
npm run desktop      # Start desktop app only
npm run mcp          # Start MCP server only

# Building
npm run build        # Build all packages
npm run build:desktop # Build desktop app for distribution

# Testing
npm test             # Run all tests
npm run test:core    # Test core package only
```

This structure sets us up for success with clear separation of concerns while maintaining the ability to share code efficiently!