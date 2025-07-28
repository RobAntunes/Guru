import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { guruService } from './services/guru-integration';
import type { KnowledgeBase as GuruKnowledgeBase, FileAnalysisResult as GuruFileAnalysisResult } from './services/guru-integration';
import { KnowledgeHub } from './components/KnowledgeHub';
import { AdaptiveLearningLab } from './components/AdaptiveLearningLab';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './components/Dashboard';
import { ThoughtChainTool } from './components/ThoughtChainTool';
import { dataMigration } from './services/data-migration';
import './hooks/use-tauri-api';

// Guru Core Feature Interfaces
interface GuruTask {
  id: string;
  title: string;
  description: string;
  status: 'evolving' | 'optimized' | 'completed';
  fitness_score: number;
  generations: number;
  strategies: string[];
  current_strategy: string;
  evolution_history: Array<{
    generation: number;
    strategy: string;
    fitness: number;
    timestamp: number;
  }>;
}

interface GuruMemory {
  id: string;
  type: 'quantum' | 'harmonic' | 'pattern';
  content: string;
  confidence: number;
  connections: string[];
  last_accessed: number;
  frequency: number;
  interference_patterns: Array<{
    memory_id: string;
    coherence: number;
    phase_shift: number;
  }>;
}

interface GuruSuggestion {
  id: string;
  type: 'optimization' | 'improvement' | 'new_approach' | 'learning';
  title: string;
  description: string;
  confidence: number;
  impact_score: number;
  domain: string;
  generated_by: 'harmonic_analyzer' | 'quantum_synthesizer' | 'task_evolver' | 'adaptive_learner';
  wingman_analysis?: {
    reasoning: string[];
    supporting_evidence: string[];
    implementation_steps: string[];
    risk_assessment: number;
  };
}

interface WingmanAnalysis {
  analysis_type: string;
  confidence: number;
  insights: string[];
  reasoning_chain: string[];
  patterns_detected: Array<{
    type: string;
    confidence: number;
    description: string;
    cross_references: string[];
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
    expected_impact: number;
  }>;
  silc_signals?: {
    request_encoded: string;
    response_encoded: string;
    coherence_score: number;
  };
}

interface FileAnalysisResult extends GuruFileAnalysisResult {
  insights: string[];
  recommendations: any[];
}

// Helper to convert GuruFileAnalysisResult to FileAnalysisResult
const toFileAnalysisResult = (result: GuruFileAnalysisResult): FileAnalysisResult => ({
  ...result,
  insights: result.cognitiveAnalysis?.insights || [],
  recommendations: result.cognitiveAnalysis?.recommendations || []
});

function App() {
  // State Management
  const [currentView, setCurrentView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Guru Core State
  const [tasks, setTasks] = useState<GuruTask[]>([]);
  const [memories, setMemories] = useState<GuruMemory[]>([]);
  const [suggestions, setSuggestions] = useState<GuruSuggestion[]>([]);
  const [wingmanAnalyses, setWingmanAnalyses] = useState<WingmanAnalysis[]>([]);

  // Knowledge Base State
  const [knowledgeBases, setKnowledgeBases] = useState<GuruKnowledgeBase[]>([]);
  const [selectedKB, setSelectedKB] = useState<string>('');
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState<any>(null);
  const [showCreateKBDialog, setShowCreateKBDialog] = useState(false);
  const [newKBName, setNewKBName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // File Analysis State
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileAnalysisResults, setFileAnalysisResults] = useState<FileAnalysisResult[]>([]);
  const [cognitiveInsights, setCognitiveInsights] = useState<any[]>([]);

  // Load initial data
  useEffect(() => {
    checkAndMigrateData();
  }, []);

  const checkAndMigrateData = async () => {
    try {
      // Check if migration is needed
      const needsMigration = await dataMigration.isMigrationNeeded();
      if (needsMigration) {
        console.log('Data migration needed, starting migration...');
        const result = await dataMigration.migrateToProjects();
        console.log('Migration result:', result);
        
        if (!result.success && result.errors.length > 0) {
          console.error('Migration errors:', result.errors);
        }
      }
    } catch (error) {
      console.error('Failed to check/perform migration:', error);
    }
    
    // Load data after migration check
    loadGuruData();
  };

  // Data Loading Functions
  const loadGuruData = async () => {
    setIsLoading(true);
    try {
      // Load mock data for now - in production, this would connect to Tauri backend
      setTasks([
        {
          id: '1',
          title: 'Optimize Neural Architecture',
          description: 'Evolve optimal neural network architecture for pattern recognition',
          status: 'evolving',
          fitness_score: 0.87,
          generations: 142,
          strategies: ['gradient_descent', 'genetic_algorithm', 'particle_swarm'],
          current_strategy: 'genetic_algorithm',
          evolution_history: []
        },
        {
          id: '2',
          title: 'Harmonic Code Analysis',
          description: 'Analyze codebase for harmonic patterns and resonance',
          status: 'optimized',
          fitness_score: 0.94,
          generations: 89,
          strategies: ['fourier_analysis', 'wavelet_transform', 'harmonic_resonance'],
          current_strategy: 'harmonic_resonance',
          evolution_history: []
        }
      ]);

      setMemories([
        {
          id: '1',
          type: 'quantum',
          content: 'Discovered optimal learning rate schedule through quantum tunneling',
          confidence: 0.92,
          connections: ['task-1', 'memory-3'],
          last_accessed: Date.now() - 3600000,
          frequency: 12,
          interference_patterns: []
        },
        {
          id: '2',
          type: 'harmonic',
          content: 'Pattern: Fibonacci sequences in optimal neural layer sizing',
          confidence: 0.88,
          connections: ['task-2', 'memory-1'],
          last_accessed: Date.now() - 7200000,
          frequency: 8,
          interference_patterns: []
        }
      ]);

      setSuggestions([
        {
          id: '1',
          type: 'optimization',
          title: 'Implement Quantum-Inspired Optimization',
          description: 'Apply quantum tunneling principles to escape local optima',
          confidence: 0.91,
          impact_score: 0.85,
          domain: 'neural_architecture',
          generated_by: 'quantum_synthesizer'
        }
      ]);

      // Load knowledge bases
      await loadKnowledgeBases();
    } catch (error) {
      console.error("Failed to load Guru data:", error);
    }
    setIsLoading(false);
  };

  const loadKnowledgeBases = async () => {
    try {
      const kbs = await guruService.listKnowledgeBases();
      setKnowledgeBases(kbs);
      if (kbs.length > 0 && !selectedKB) {
        setSelectedKB(kbs[0].id);
      }
    } catch (error) {
      console.error("Failed to load knowledge bases:", error);
    }
  };

  const evolveTask = async (taskId: string) => {
    try {
      const result = await invoke('evolve_task', { taskId });
      console.log('Task evolution result:', result);
      loadGuruData(); // Reload to see updates
    } catch (error) {
      console.error("Task evolution failed:", error);
    }
  };

  const synthesizeQuantumMemory = async () => {
    try {
      const result = await invoke('synthesize_quantum_memory');
      console.log('Quantum synthesis result:', result);
      loadGuruData();
    } catch (error) {
      console.error("Quantum synthesis failed:", error);
    }
  };

  const analyzeWithWingman = async (context: string) => {
    try {
      const result = await invoke('analyze_with_wingman', { context });
      console.log('Wingman analysis:', result);
      setWingmanAnalyses(prev => [...prev, result as WingmanAnalysis]);
    } catch (error) {
      console.error("Wingman analysis failed:", error);
    }
  };

  const performHarmonicAnalysis = async () => {
    try {
      const result = await invoke('perform_harmonic_analysis');
      console.log('Harmonic analysis result:', result);
    } catch (error) {
      console.error("Harmonic analysis failed:", error);
    }
  };

  // Knowledge Base Operations
  const createKnowledgeBase = async () => {
    if (!newKBName.trim()) return;

    setIsLoading(true);
    try {
      const newKB = await guruService.createKnowledgeBase(
        newKBName,
        `Knowledge base created on ${new Date().toLocaleDateString()}`
      );

      setKnowledgeBases(prev => [...prev, newKB]);
      setSelectedKB(newKB.id);
      setNewKBName('');
      setShowCreateKBDialog(false);
    } catch (error) {
      console.error("Failed to create knowledge base:", error);
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(files);
  };


  const performRAGQuery = async () => {
    if (!selectedKB || !ragQuery.trim()) return;

    setIsLoading(true);
    try {
      const result = await guruService.queryKnowledgeBase(
        selectedKB,
        ragQuery,
        {
          includeCognitiveInsights: true,
          responseMode: 'comprehensive'
        }
      );
      setRagResults(result as any);
    } catch (error) {
      console.error("RAG query failed:", error);
    }
    setIsLoading(false);
  };

  // Render functions for different views
  const renderDashboard = () => (
    <Dashboard
      tasks={tasks}
      memories={memories}
      experiments={[]}
      knowledgeBases={knowledgeBases}
    />
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <KnowledgeHub
          knowledgeBases={knowledgeBases}
          setKnowledgeBases={setKnowledgeBases}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />;
      case 'thinking':
        return <ThoughtChainTool 
          goal="Explore ideas and solve problems" 
          context="Use multi-stage thinking with executable sandbox" 
        />;
      case 'learning':
        return <AdaptiveLearningLab />;
      case 'tasks':
        return <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-light tracking-tight">Task Evolution</h1>
            <p className="text-sm text-muted-foreground mt-1">Evolving task optimization system</p>
          </div>
        </div>;
      case 'memories':
        return <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-light tracking-tight">Quantum Memory</h1>
            <p className="text-sm text-muted-foreground mt-1">Quantum memory synthesis and management</p>
          </div>
        </div>;
      case 'dashboard':
        return renderDashboard();
      default:
        return renderDashboard();
    }
  };

  return (
    <AppLayout activeView={currentView} onViewChange={setCurrentView}>
      {renderCurrentView()}
    </AppLayout>
  );
}

export default App;