/**
 * MCP Synthesis Client - Connects the UI to the multi-stage synthesis MCP tool
 */

import { guruService } from './guru-integration';

export interface SynthesisSession {
  sessionId: string;
  stage: 'analysis' | 'pattern_review' | 'generation' | 'complete';
  patterns?: PatternTemplate[];
  selectedPatterns?: string[];
  workItems?: any[];
}

export interface PatternTemplate {
  id: string;
  framework: string;
  template_type: string;
  instructions: string;
  methods?: any[];
  prompts?: string[];
  document_refs: string[];
}

class SynthesisMCPClient {
  private currentSession: SynthesisSession | null = null;

  /**
   * Start a new synthesis session
   */
  async startSession(documents: any[]): Promise<SynthesisSession> {
    try {
      const result = await guruService.callMCPTool('guru_knowledge_synthesis', {
        action: 'start',
        documents: documents.map(doc => ({
          id: doc.id,
          content: doc.content || '',
          title: doc.filename || doc.title,
          metadata: doc.metadata || {}
        }))
      });

      this.currentSession = {
        sessionId: result.session_id,
        stage: 'analysis'
      };

      return this.currentSession;
    } catch (error) {
      console.error('Failed to start synthesis session:', error);
      throw error;
    }
  }

  /**
   * Analyze patterns using AI frameworks
   */
  async analyzePatterns(sessionId: string): Promise<PatternTemplate[]> {
    try {
      const result = await guruService.callMCPTool('guru_knowledge_synthesis', {
        action: 'analyze',
        session_id: sessionId
      });

      if (this.currentSession && this.currentSession.sessionId === sessionId) {
        this.currentSession.patterns = result.pattern_templates;
        this.currentSession.stage = 'pattern_review';
      }

      return result.pattern_templates || [];
    } catch (error) {
      console.error('Failed to analyze patterns:', error);
      throw error;
    }
  }

  /**
   * Let AI select patterns based on the templates
   * In the real implementation, the AI would analyze documents using these templates
   */
  async selectPatterns(sessionId: string, patternIds: string[]): Promise<void> {
    try {
      await guruService.callMCPTool('guru_knowledge_synthesis', {
        action: 'select_patterns',
        session_id: sessionId,
        selected_patterns: patternIds
      });

      if (this.currentSession && this.currentSession.sessionId === sessionId) {
        this.currentSession.selectedPatterns = patternIds;
        this.currentSession.stage = 'generation';
      }
    } catch (error) {
      console.error('Failed to select patterns:', error);
      throw error;
    }
  }

  /**
   * Generate work items from selected patterns
   */
  async generateWork(sessionId: string, synthesisType: string): Promise<any[]> {
    try {
      const result = await guruService.callMCPTool('guru_knowledge_synthesis', {
        action: 'generate',
        session_id: sessionId,
        synthesis_type: synthesisType
      });

      if (this.currentSession && this.currentSession.sessionId === sessionId) {
        this.currentSession.workItems = result.work_items;
        this.currentSession.stage = 'complete';
      }

      return result.work_items || [];
    } catch (error) {
      console.error('Failed to generate work:', error);
      throw error;
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(sessionId: string): Promise<any> {
    try {
      const result = await guruService.callMCPTool('guru_knowledge_synthesis', {
        action: 'get_status',
        session_id: sessionId
      });

      return result;
    } catch (error) {
      console.error('Failed to get session status:', error);
      throw error;
    }
  }

  /**
   * Run a complete synthesis flow (simplified for UI)
   */
  async runCompleteSynthesis(
    documents: any[],
    synthesisType: string,
    onProgress?: (stage: string, message: string) => void
  ): Promise<{
    patterns: PatternTemplate[];
    workItems: any[];
    sessionId: string;
  }> {
    // Start session
    onProgress?.('starting', 'Starting synthesis session...');
    const session = await this.startSession(documents);

    // Analyze patterns
    onProgress?.('analyzing', 'Analyzing documents for patterns...');
    const patterns = await this.analyzePatterns(session.sessionId);

    // Auto-select all patterns for simplicity
    // In a real UI, you'd let users choose
    const patternIds = patterns.map(p => p.id);
    onProgress?.('selecting', `Found ${patterns.length} patterns, selecting all...`);
    await this.selectPatterns(session.sessionId, patternIds);

    // Generate work
    onProgress?.('generating', `Generating ${synthesisType} from patterns...`);
    const workItems = await this.generateWork(session.sessionId, synthesisType);

    onProgress?.('complete', 'Synthesis complete!');

    return {
      patterns,
      workItems,
      sessionId: session.sessionId
    };
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSession = null;
  }
}

export const synthesisMCPClient = new SynthesisMCPClient();