/**
 * Multi-Stage Thinking Tool Service
 * Provides Chain of Thought reasoning with sandbox execution and scratchpad
 */

import { sandboxService } from './sandbox-service';
import { adaptiveLearningService } from './adaptive-learning';

export interface ThoughtNode {
  id: string;
  stage: number;
  type: 'reasoning' | 'hypothesis' | 'code' | 'calculation' | 'observation' | 'conclusion' | 'question';
  content: string;
  
  // Execution results for code/calculation nodes
  executionResult?: {
    success: boolean;
    output?: any;
    error?: string;
    executionTime?: number;
  };
  
  // Metadata
  confidence: number;
  timestamp: Date;
  dependencies: string[]; // IDs of nodes this thought depends on
  tags: string[];
  
  // For branching thoughts
  alternatives?: ThoughtNode[];
  selectedBranch?: number;
}

export interface ScratchpadEntry {
  id: string;
  content: string;
  type: 'note' | 'variable' | 'diagram' | 'reference';
  linkedThoughts: string[]; // IDs of related thought nodes
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ThoughtChain {
  id: string;
  goal: string;
  context: string;
  
  // Multi-stage thinking
  stages: {
    [stageNumber: number]: {
      name: string;
      objective: string;
      nodes: ThoughtNode[];
      status: 'pending' | 'active' | 'completed' | 'skipped';
      summary?: string;
    };
  };
  
  // Shared context
  scratchpad: ScratchpadEntry[];
  sharedVariables: Record<string, any>;
  
  // Overall status
  status: 'initializing' | 'thinking' | 'executing' | 'concluded' | 'failed';
  currentStage: number;
  
  // Results
  conclusion?: string;
  confidence: number;
  insights: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  model?: string;
  totalThinkingTime?: number;
  totalExecutionTime?: number;
}

export interface ThinkingStrategy {
  id: string;
  name: string;
  description: string;
  stages: Array<{
    name: string;
    objective: string;
    prompts?: string[];
    requiredNodeTypes?: ThoughtNode['type'][];
  }>;
  tags: string[];
  successRate?: number;
}

// Predefined thinking strategies
const defaultStrategies: ThinkingStrategy[] = [
  {
    id: 'problem-solving',
    name: 'Systematic Problem Solving',
    description: 'Break down complex problems into manageable steps',
    stages: [
      {
        name: 'Problem Analysis',
        objective: 'Understand the problem deeply',
        prompts: ['What is being asked?', 'What are the constraints?', 'What information do I have?'],
        requiredNodeTypes: ['reasoning', 'question']
      },
      {
        name: 'Hypothesis Generation',
        objective: 'Generate potential solutions',
        prompts: ['What approaches could work?', 'What patterns do I recognize?'],
        requiredNodeTypes: ['hypothesis', 'reasoning']
      },
      {
        name: 'Solution Development',
        objective: 'Implement and test solutions',
        prompts: ['Let me implement this approach', 'Testing with examples'],
        requiredNodeTypes: ['code', 'calculation']
      },
      {
        name: 'Verification',
        objective: 'Validate the solution',
        prompts: ['Does this solve all cases?', 'Are there edge cases?'],
        requiredNodeTypes: ['observation', 'reasoning']
      },
      {
        name: 'Conclusion',
        objective: 'Synthesize findings',
        prompts: ['The solution is...', 'Key insights are...'],
        requiredNodeTypes: ['conclusion']
      }
    ],
    tags: ['general', 'problem-solving']
  },
  {
    id: 'code-analysis',
    name: 'Deep Code Analysis',
    description: 'Analyze code with executable verification',
    stages: [
      {
        name: 'Static Analysis',
        objective: 'Understand code structure and patterns',
        requiredNodeTypes: ['reasoning', 'observation']
      },
      {
        name: 'Dynamic Analysis',
        objective: 'Execute and test code behavior',
        requiredNodeTypes: ['code', 'observation']
      },
      {
        name: 'Performance Analysis',
        objective: 'Measure and optimize performance',
        requiredNodeTypes: ['code', 'calculation', 'observation']
      },
      {
        name: 'Recommendations',
        objective: 'Provide actionable improvements',
        requiredNodeTypes: ['conclusion', 'reasoning']
      }
    ],
    tags: ['code', 'analysis']
  },
  {
    id: 'research',
    name: 'Research & Synthesis',
    description: 'Explore topics deeply with iterative refinement',
    stages: [
      {
        name: 'Initial Exploration',
        objective: 'Map out the knowledge landscape',
        requiredNodeTypes: ['question', 'reasoning']
      },
      {
        name: 'Deep Dive',
        objective: 'Investigate specific aspects',
        requiredNodeTypes: ['reasoning', 'hypothesis']
      },
      {
        name: 'Synthesis',
        objective: 'Connect ideas and find patterns',
        requiredNodeTypes: ['reasoning', 'observation']
      },
      {
        name: 'Validation',
        objective: 'Test understanding with examples',
        requiredNodeTypes: ['code', 'calculation']
      },
      {
        name: 'Knowledge Integration',
        objective: 'Create comprehensive understanding',
        requiredNodeTypes: ['conclusion', 'reasoning']
      }
    ],
    tags: ['research', 'learning']
  }
];

class ThoughtChainService {
  private activeChains: Map<string, ThoughtChain> = new Map();
  private strategies: Map<string, ThinkingStrategy> = new Map();

  constructor() {
    // Initialize default strategies
    defaultStrategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });
  }

  /**
   * Create a new thought chain
   */
  async createThoughtChain(
    goal: string,
    context: string,
    strategyId?: string,
    model?: string
  ): Promise<ThoughtChain> {
    const strategy = strategyId ? this.strategies.get(strategyId) : null;
    const stages = strategy ? this.createStagesFromStrategy(strategy) : this.createDefaultStages();

    const chain: ThoughtChain = {
      id: `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      goal,
      context,
      stages,
      scratchpad: [],
      sharedVariables: {},
      status: 'initializing',
      currentStage: 1,
      confidence: 0,
      insights: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model
    };

    this.activeChains.set(chain.id, chain);
    return chain;
  }

  /**
   * Add a thought node to the current stage
   */
  async addThought(
    chainId: string,
    thought: Omit<ThoughtNode, 'id' | 'timestamp' | 'stage'>
  ): Promise<ThoughtNode> {
    const chain = this.activeChains.get(chainId);
    if (!chain) throw new Error('Chain not found');

    const node: ThoughtNode = {
      ...thought,
      id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stage: chain.currentStage,
      timestamp: new Date()
    };

    // Execute if it's a code or calculation node
    if (node.type === 'code' || node.type === 'calculation') {
      node.executionResult = await this.executeThought(node, chain);
    }

    // Add to current stage
    chain.stages[chain.currentStage].nodes.push(node);
    chain.updatedAt = new Date();

    // Update adaptive learning with thought pattern
    await this.updateLearning(chain, node);

    return node;
  }

  /**
   * Execute a code/calculation thought in the sandbox
   */
  private async executeThought(
    node: ThoughtNode,
    chain: ThoughtChain
  ): Promise<ThoughtNode['executionResult']> {
    const startTime = Date.now();

    try {
      // Prepare context with shared variables and previous results
      const context = {
        ...chain.sharedVariables,
        scratchpad: chain.scratchpad.reduce((acc, entry) => {
          if (entry.type === 'variable') {
            acc[entry.id] = entry.content;
          }
          return acc;
        }, {} as Record<string, any>)
      };

      const result = await sandboxService.executeCode(
        node.content,
        'javascript', // Could be dynamic based on node metadata
        { context }
      );

      // Update shared variables if execution produced new values
      if (result.success && result.context) {
        Object.assign(chain.sharedVariables, result.context);
      }

      return {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Add entry to scratchpad
   */
  async addToScratchpad(
    chainId: string,
    entry: Omit<ScratchpadEntry, 'id' | 'timestamp'>
  ): Promise<ScratchpadEntry> {
    const chain = this.activeChains.get(chainId);
    if (!chain) throw new Error('Chain not found');

    const scratchpadEntry: ScratchpadEntry = {
      ...entry,
      id: `scratch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    chain.scratchpad.push(scratchpadEntry);
    chain.updatedAt = new Date();

    // If it's a variable, update shared variables
    if (entry.type === 'variable' && entry.metadata?.name) {
      chain.sharedVariables[entry.metadata.name] = entry.content;
    }

    return scratchpadEntry;
  }

  /**
   * Progress to next stage
   */
  async progressStage(chainId: string, summary?: string): Promise<void> {
    const chain = this.activeChains.get(chainId);
    if (!chain) throw new Error('Chain not found');

    // Complete current stage
    const currentStage = chain.stages[chain.currentStage];
    currentStage.status = 'completed';
    currentStage.summary = summary;

    // Move to next stage
    const nextStageNum = chain.currentStage + 1;
    if (chain.stages[nextStageNum]) {
      chain.currentStage = nextStageNum;
      chain.stages[nextStageNum].status = 'active';
      chain.status = 'thinking';
    } else {
      // All stages complete
      chain.status = 'concluded';
      await this.concludeChain(chainId);
    }

    chain.updatedAt = new Date();
  }

  /**
   * Conclude the thought chain
   */
  private async concludeChain(chainId: string): Promise<void> {
    const chain = this.activeChains.get(chainId);
    if (!chain) return;

    // Calculate overall confidence
    const allNodes = Object.values(chain.stages)
      .flatMap(stage => stage.nodes);
    
    chain.confidence = allNodes.reduce((sum, node) => sum + node.confidence, 0) / allNodes.length;

    // Extract key insights
    chain.insights = allNodes
      .filter(node => node.type === 'conclusion' || node.confidence > 0.8)
      .map(node => node.content);

    // Generate final conclusion
    const conclusions = allNodes.filter(node => node.type === 'conclusion');
    if (conclusions.length > 0) {
      chain.conclusion = conclusions[conclusions.length - 1].content;
    }

    // Calculate timing
    chain.totalThinkingTime = chain.updatedAt.getTime() - chain.createdAt.getTime();
    chain.totalExecutionTime = allNodes
      .filter(node => node.executionResult)
      .reduce((sum, node) => sum + (node.executionResult?.executionTime || 0), 0);

    // Update adaptive learning with complete pattern
    const pattern = `${this.findStrategyId(chain)}-${chain.goal}`;
    const context = {
      strategyId: this.findStrategyId(chain),
      goal: chain.goal,
      stages: Object.keys(chain.stages).length,
      totalNodes: allNodes.length,
      executionNodes: allNodes.filter(n => n.type === 'code' || n.type === 'calculation').length,
      confidence: chain.confidence,
      success: chain.confidence > 0.7,
      duration: chain.totalThinkingTime
    };
    const outcome = {
      success: chain.confidence > 0.7,
      confidence: chain.confidence
    };
    await adaptiveLearningService.recordThoughtPattern(pattern, context, outcome);
  }

  /**
   * Get active thought chain
   */
  getChain(chainId: string): ThoughtChain | undefined {
    return this.activeChains.get(chainId);
  }

  /**
   * Get all strategies
   */
  getStrategies(): ThinkingStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Create stages from strategy
   */
  private createStagesFromStrategy(strategy: ThinkingStrategy): ThoughtChain['stages'] {
    const stages: ThoughtChain['stages'] = {};
    
    strategy.stages.forEach((stage, index) => {
      stages[index + 1] = {
        name: stage.name,
        objective: stage.objective,
        nodes: [],
        status: index === 0 ? 'active' : 'pending'
      };
    });

    return stages;
  }

  /**
   * Create default stages
   */
  private createDefaultStages(): ThoughtChain['stages'] {
    return {
      1: {
        name: 'Understanding',
        objective: 'Understand the problem or question',
        nodes: [],
        status: 'active'
      },
      2: {
        name: 'Exploration',
        objective: 'Explore solutions and approaches',
        nodes: [],
        status: 'pending'
      },
      3: {
        name: 'Implementation',
        objective: 'Implement and test solutions',
        nodes: [],
        status: 'pending'
      },
      4: {
        name: 'Conclusion',
        objective: 'Synthesize findings and insights',
        nodes: [],
        status: 'pending'
      }
    };
  }

  /**
   * Update adaptive learning with thought patterns
   */
  private async updateLearning(chain: ThoughtChain, node: ThoughtNode): Promise<void> {
    // Track successful thought patterns
    if (node.confidence > 0.8 || (node.executionResult?.success)) {
      const operation = `thought_${node.type}_stage_${node.stage}`;
      const context = {
        type: 'thought_pattern',
        pattern: {
          stage: chain.stages[node.stage].name,
          nodeType: node.type,
          confidence: node.confidence,
          hasExecution: !!node.executionResult
        }
      };
      await adaptiveLearningService.recordSuccess(operation, context);
    }
  }

  /**
   * Find strategy ID for a chain
   */
  private findStrategyId(chain: ThoughtChain): string | undefined {
    // Match based on stage structure
    for (const [id, strategy] of this.strategies) {
      if (Object.keys(chain.stages).length === strategy.stages.length) {
        return id;
      }
    }
    return undefined;
  }

  /**
   * Get all active chains
   */
  getAllChains(): ThoughtChain[] {
    return Array.from(this.activeChains.values());
  }

  /**
   * Export thought chain as markdown
   */
  exportAsMarkdown(chainId: string): string {
    const chain = this.activeChains.get(chainId);
    if (!chain) return '';

    let markdown = `# Thought Chain: ${chain.goal}\n\n`;
    markdown += `**Context:** ${chain.context}\n\n`;
    markdown += `**Status:** ${chain.status} | **Confidence:** ${(chain.confidence * 100).toFixed(1)}%\n\n`;

    // Export stages
    Object.entries(chain.stages).forEach(([stageNum, stage]) => {
      markdown += `## Stage ${stageNum}: ${stage.name}\n`;
      markdown += `*Objective: ${stage.objective}*\n\n`;

      stage.nodes.forEach(node => {
        markdown += `### ${node.type.toUpperCase()}: ${node.id}\n`;
        markdown += `${node.content}\n`;
        
        if (node.executionResult) {
          markdown += `\n**Execution Result:**\n`;
          markdown += `\`\`\`\n${JSON.stringify(node.executionResult.output, null, 2)}\n\`\`\`\n`;
        }
        
        markdown += `\n*Confidence: ${(node.confidence * 100).toFixed(1)}%*\n\n`;
      });

      if (stage.summary) {
        markdown += `**Stage Summary:** ${stage.summary}\n\n`;
      }
    });

    // Export scratchpad
    if (chain.scratchpad.length > 0) {
      markdown += `## Scratchpad\n\n`;
      chain.scratchpad.forEach(entry => {
        markdown += `- **${entry.type}**: ${entry.content}\n`;
      });
    }

    // Export conclusion
    if (chain.conclusion) {
      markdown += `\n## Conclusion\n\n${chain.conclusion}\n`;
    }

    // Export insights
    if (chain.insights.length > 0) {
      markdown += `\n## Key Insights\n\n`;
      chain.insights.forEach(insight => {
        markdown += `- ${insight}\n`;
      });
    }

    return markdown;
  }
}

export const thoughtChainService = new ThoughtChainService();