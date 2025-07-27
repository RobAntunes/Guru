# Guru Desktop App - New Features Guide

## 🚀 Running the App

```bash
# Development mode
bun run tauri dev

# Or just the web version
bun run dev
```

## 🎯 New Features Available

### 1. 📁 Filesystem Analysis
Navigate to the **Filesystem** tab in the sidebar.

- **Analyze Folder**: Click "📂 Select Folder" to choose a directory for deep analysis
- **Analyze Files**: Click "📄 Select Files" to choose specific files for comparative analysis
- View cognitive insights, recommendations, and file categorization

### 2. 📄 Document Upload & Processing
Navigate to the **Documents** tab in the sidebar.

- Click "📤 Upload Documents" to select multiple documents
- Documents are automatically categorized and analyzed
- Each batch shows:
  - Number of documents
  - Total size
  - Individual document insights
- Click "➕ Add to KB" to add documents to a knowledge base

### 3. 🎯 RAG Knowledge Base
Navigate to the **Knowledge Base** tab in the sidebar.

- **Create KB**: Click "+ New Knowledge Base" to create a new knowledge base
- **Select KB**: Click on any knowledge base card to select it
- **Query**: Type your question and press Enter or click Search
- View:
  - AI-generated answers
  - Source documents with relevance scores
  - Cognitive insights from harmonic and quantum analysis

## 🔧 Technical Details

### Mock Service
The app currently uses a mock service for demonstration. This provides:
- Realistic file analysis results
- Document processing simulation
- RAG query responses with cognitive insights

### Switching to Real Backend
To use the real Guru backend, edit `src/services/guru-integration.ts`:

```typescript
// Change this line:
const USE_MOCK = true;
// To:
const USE_MOCK = false;
```

### Architecture
- **Frontend**: React + TypeScript + Tauri
- **Integration**: `GuruIntegrationService` bridges UI with backend
- **Mock Service**: Provides realistic demos without backend dependencies
- **Backend Ready**: Full Rust/Node.js integration prepared for production

## 🧠 Cognitive Features

Each feature includes advanced cognitive analysis:
- **Harmonic Analysis**: Pattern detection across documents
- **Quantum Synthesis**: Cross-referencing and insight generation
- **Evolution Engine**: Adaptive learning from usage patterns
- **Wingman AI**: Specialized analysis for complex queries

## 🎨 UI Navigation

1. Use the sidebar to switch between features
2. Each view has its own state management
3. Loading states show during operations
4. Results update in real-time

Enjoy exploring the new Guru features! 🚀