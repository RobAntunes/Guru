/**
 * Living Task Forest MCP Tools
 * Model Context Protocol tools for controlling and monitoring the task forest
 */

import { McpTool } from '@modelcontextprotocol/sdk/types.js';
import { 
  TaskForest,
  ProjectDiscoveryEngine,
  ParallelWorkflowOrchestrator,
  ProjectGoal,
  ProjectInsight,
  EnvironmentalPressure,
  TaskTree,
  ConfidenceStream,
  ConditionalAction
} from '../living-task-forest/index.js';
import { ForestPersistence } from '../living-task-forest/storage/forest-persistence.js';
import { GuruDiscoveryEngine, GuruToLTFMapper, TaskRelevanceAnalyzer } from '../living-task-forest/integration/guru-integration.js';
import { Guru } from '../core/guru.js';
import { Logger } from '../logging/logger.js';

/**
 * MCP Tool Registry for Living Task Forest
 */
export class LTFMcpTools {
  private forest?: TaskForest;
  private orchestrator?: ParallelWorkflowOrchestrator;
  private persistence?: ForestPersistence;
  private discoveryEngine?: GuruDiscoveryEngine;
  private guru?: Guru;
  private logger = Logger.getInstance();
  
  /**
   * Initialize with existing systems
   */
  initialize(guru: Guru, storagePath?: string): void {
    this.guru = guru;
    this.persistence = new ForestPersistence(storagePath);
    this.discoveryEngine = new GuruDiscoveryEngine(guru);
  }
  
  /**
   * Get all LTF MCP tools
   */
  getTools(): McpTool[] {
    return [
      this.createForestTool(),
      this.plantTaskTool(),
      this.evolveForestTool(),
      this.getForestStatusTool(),
      this.saveForestTool(),
      this.loadForestTool(),
      this.createConfidenceStreamTool(),
      this.addEvidenceTool(),
      this.triggerActionsTool(),
      this.analyzeTaskRelevanceTool(),
      this.findTasksForGoalTool(),
      this.getTaskDetailsTool(),
      this.reproduceTaskTool(),
      this.terminateTaskTool(),
      this.getForestHealthTool()
    ];
  }
  
  /**
   * Tool: Create a new task forest
   */
  private createForestTool(): McpTool {
    return {
      name: 'ltf_create_forest',
      description: 'Create a new Living Task Forest from project analysis',
      inputSchema: {
        type: 'object',
        properties: {
          projectPath: {
            type: 'string',
            description: 'Path to the project to analyze'
          },
          goals: {
            type: 'array',
            description: 'Project goals to guide task creation',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['feature', 'quality', 'performance', 'security', 'refactor', 'documentation'],
                  description: 'Goal type'
                },
                description: {
                  type: 'string',
                  description: 'Goal description'
                },
                priority: {
                  type: 'number',
                  description: 'Priority (0.0 to 1.0)'
                }
              },
              required: ['type', 'description', 'priority']
            }
          }
        },
        required: ['projectPath', 'goals']
      },
      handler: async (params: any) => {
        try {
          if (!this.discoveryEngine || !this.guru) {
            throw new Error('LTF tools not initialized. Call initialize() first.');
          }
          
          const goals: ProjectGoal[] = params.goals.map((g: any) => ({
            id: `goal_${g.type}_${Date.now()}`,
            ...g
          }));
          
          // Create forest from analysis
          this.forest = await this.discoveryEngine.createForestFromAnalysis(
            params.projectPath,
            goals
          );
          
          // Create orchestrator
          this.orchestrator = new ParallelWorkflowOrchestrator();
          
          const stats = this.forest.getStatistics();
          
          return {
            success: true,
            forestId: `forest_${Date.now()}`,
            treesCreated: stats.forest.activeTrees,
            health: stats.health,
            message: `Created forest with ${stats.forest.activeTrees} initial tasks`
          };
          
        } catch (error: any) {
          this.logger.error('Failed to create forest:', error);
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Plant a new task seed
   */
  private plantTaskTool(): McpTool {
    return {
      name: 'ltf_plant_task',
      description: 'Plant a new task seed in the forest',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Insight type (bug, feature, refactor, etc.)'
          },
          discovery: {
            type: 'string',
            description: 'What was discovered'
          },
          confidence: {
            type: 'number',
            description: 'Confidence in the insight (0.0 to 1.0)'
          },
          evidence: {
            type: 'array',
            description: 'Supporting evidence',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                description: { type: 'string' },
                strength: { type: 'number' }
              }
            }
          }
        },
        required: ['type', 'discovery', 'confidence']
      },
      handler: async (params: any) => {
        try {
          if (!this.forest) {
            throw new Error('No active forest. Create a forest first.');
          }
          
          const insight: ProjectInsight = {
            id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: params.type,
            discovery: params.discovery,
            evidence: params.evidence || [],
            confidence: params.confidence,
            timestamp: Date.now(),
            source: 'manual_mcp'
          };
          
          const tree = await this.forest.plantSeed(insight);
          
          if (tree) {
            return {
              success: true,
              treeId: tree.id,
              species: tree.species,
              lifecycle: tree.lifecycle,
              message: `Planted ${tree.species} task: ${tree.trunk.title}`
            };
          } else {
            return {
              success: false,
              message: 'Failed to plant task - forest may be at capacity'
            };
          }
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Apply environmental pressure to evolve forest
   */
  private evolveForestTool(): McpTool {
    return {
      name: 'ltf_evolve_forest',
      description: 'Apply environmental pressure to evolve the forest',
      inputSchema: {
        type: 'object',
        properties: {
          pressureType: {
            type: 'string',
            enum: ['time', 'quality', 'resource', 'innovation', 'stability'],
            description: 'Type of pressure to apply'
          },
          intensity: {
            type: 'number',
            description: 'Pressure intensity (0.0 to 1.0)'
          },
          duration: {
            type: 'number',
            description: 'Duration in milliseconds'
          }
        },
        required: ['pressureType', 'intensity']
      },
      handler: async (params: any) => {
        try {
          if (!this.forest) {
            throw new Error('No active forest.');
          }
          
          const pressure: EnvironmentalPressure = {
            type: params.pressureType,
            intensity: params.intensity,
            duration: params.duration || 3600000 // 1 hour default
          };
          
          const mutation = await this.forest.evolveForest(pressure);
          
          return {
            success: true,
            affectedTrees: mutation.affectedTrees.length,
            environmentBefore: mutation.environmentBefore,
            environmentAfter: mutation.environmentAfter,
            impact: mutation.impact
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Get forest status
   */
  private getForestStatusTool(): McpTool {
    return {
      name: 'ltf_forest_status',
      description: 'Get current forest status and statistics',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        try {
          if (!this.forest) {
            throw new Error('No active forest.');
          }
          
          const stats = this.forest.getStatistics();
          const health = this.forest.assessForestHealth();
          
          return {
            success: true,
            forest: {
              totalTrees: stats.forest.totalTrees,
              activeTrees: stats.forest.activeTrees,
              deadTrees: stats.forest.deadTrees,
              seedlings: stats.forest.seedlings
            },
            health: {
              biodiversity: (health.biodiversity * 100).toFixed(1) + '%',
              stability: (health.stability * 100).toFixed(1) + '%',
              productivity: (health.productivity * 100).toFixed(1) + '%',
              sustainability: (health.sustainability * 100).toFixed(1) + '%',
              overall: (health.overallHealth * 100).toFixed(1) + '%'
            },
            environment: stats.environment,
            lifecycle: {
              totalCreated: stats.forest.totalCreated,
              totalExtinct: stats.forest.totalExtinct,
              totalReproductions: stats.forest.totalReproductions,
              totalMutations: stats.forest.totalMutations
            },
            species: stats.species,
            lifecycleDistribution: stats.lifecycle
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Save forest state
   */
  private saveForestTool(): McpTool {
    return {
      name: 'ltf_save_forest',
      description: 'Save current forest state to persistent storage',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        try {
          if (!this.forest || !this.persistence) {
            throw new Error('Forest or persistence not initialized.');
          }
          
          await this.persistence.initialize();
          
          const streams = this.orchestrator ? 
            this.orchestrator.streams : 
            new Map<string, ConfidenceStream>();
          
          const snapshotId = await this.persistence.saveForest(this.forest, streams);
          
          return {
            success: true,
            snapshotId,
            message: `Forest saved with snapshot ID: ${snapshotId}`
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Load forest state
   */
  private loadForestTool(): McpTool {
    return {
      name: 'ltf_load_forest',
      description: 'Load forest state from storage',
      inputSchema: {
        type: 'object',
        properties: {
          snapshotId: {
            type: 'string',
            description: 'Snapshot ID to load (or "latest" for most recent)'
          }
        },
        required: ['snapshotId']
      },
      handler: async (params: any) => {
        try {
          if (!this.persistence) {
            throw new Error('Persistence not initialized.');
          }
          
          await this.persistence.initialize();
          
          let snapshotId = params.snapshotId;
          
          // Get latest if requested
          if (snapshotId === 'latest') {
            const snapshots = await this.persistence.listSnapshots();
            if (snapshots.length === 0) {
              throw new Error('No snapshots found');
            }
            snapshotId = snapshots[0].id;
          }
          
          const { forest, streams } = await this.persistence.loadForest(snapshotId);
          
          this.forest = forest;
          
          // Recreate orchestrator with loaded streams
          this.orchestrator = new ParallelWorkflowOrchestrator();
          for (const [id, stream] of streams) {
            this.orchestrator.streams.set(id, stream);
          }
          
          return {
            success: true,
            snapshotId,
            treesLoaded: forest.trees.size,
            streamsLoaded: streams.size,
            message: `Loaded forest from snapshot: ${snapshotId}`
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Create confidence stream
   */
  private createConfidenceStreamTool(): McpTool {
    return {
      name: 'ltf_create_confidence_stream',
      description: 'Create a new confidence stream',
      inputSchema: {
        type: 'object',
        properties: {
          purpose: {
            type: 'string',
            description: 'Purpose of the confidence stream'
          },
          domain: {
            type: 'string',
            description: 'Domain area (performance, security, quality, etc.)'
          },
          targetConfidence: {
            type: 'number',
            description: 'Target confidence level (0.0 to 1.0)'
          }
        },
        required: ['purpose', 'domain']
      },
      handler: async (params: any) => {
        try {
          if (!this.orchestrator) {
            this.orchestrator = new ParallelWorkflowOrchestrator();
          }
          
          const stream = this.orchestrator.launchStream(
            params.purpose,
            params.domain,
            params.targetConfidence || 0.8
          );
          
          return {
            success: true,
            streamId: stream.id,
            currentConfidence: stream.currentConfidence,
            targetConfidence: stream.targetConfidence,
            message: `Created confidence stream: ${params.purpose}`
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Add evidence to confidence stream
   */
  private addEvidenceTool(): McpTool {
    return {
      name: 'ltf_add_evidence',
      description: 'Add evidence to a confidence stream',
      inputSchema: {
        type: 'object',
        properties: {
          streamId: {
            type: 'string',
            description: 'Confidence stream ID'
          },
          evidenceType: {
            type: 'string',
            enum: ['observation', 'analysis', 'test', 'historical', 'external'],
            description: 'Type of evidence'
          },
          description: {
            type: 'string',
            description: 'Evidence description'
          },
          strength: {
            type: 'number',
            description: 'Evidence strength (0.0 to 1.0)'
          },
          reliability: {
            type: 'number',
            description: 'Source reliability (0.0 to 1.0)'
          }
        },
        required: ['streamId', 'evidenceType', 'description', 'strength']
      },
      handler: async (params: any) => {
        try {
          if (!this.orchestrator) {
            throw new Error('No orchestrator active.');
          }
          
          const stream = this.orchestrator.streams.get(params.streamId);
          if (!stream) {
            throw new Error(`Stream ${params.streamId} not found`);
          }
          
          const update = stream.addEvidence({
            id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: params.evidenceType,
            description: params.description,
            source: 'mcp_tool',
            strength: params.strength,
            reliability: params.reliability || 0.8,
            timestamp: Date.now()
          });
          
          return {
            success: true,
            previousConfidence: update.previousConfidence,
            newConfidence: update.newConfidence,
            delta: update.delta,
            actionsEnabled: update.actionsEnabled,
            targetReached: stream.currentConfidence >= stream.targetConfidence
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Trigger available actions
   */
  private triggerActionsTool(): McpTool {
    return {
      name: 'ltf_trigger_actions',
      description: 'Trigger available actions in confidence streams',
      inputSchema: {
        type: 'object',
        properties: {
          streamId: {
            type: 'string',
            description: 'Stream ID (optional - triggers all if not specified)'
          }
        }
      },
      handler: async (params: any) => {
        try {
          if (!this.orchestrator) {
            throw new Error('No orchestrator active.');
          }
          
          const results: any[] = [];
          
          if (params.streamId) {
            // Trigger specific stream
            const stream = this.orchestrator.streams.get(params.streamId);
            if (!stream) {
              throw new Error(`Stream ${params.streamId} not found`);
            }
            
            const cascade = await stream.triggerActions();
            results.push({
              streamId: params.streamId,
              triggered: cascade.triggered.length,
              cascaded: cascade.cascaded.length,
              blocked: cascade.blocked.length
            });
          } else {
            // Trigger all streams
            for (const [id, stream] of this.orchestrator.streams) {
              const cascade = await stream.triggerActions();
              results.push({
                streamId: id,
                triggered: cascade.triggered.length,
                cascaded: cascade.cascaded.length,
                blocked: cascade.blocked.length
              });
            }
          }
          
          return {
            success: true,
            results,
            totalTriggered: results.reduce((sum, r) => sum + r.triggered, 0)
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Analyze task relevance to code
   */
  private analyzeTaskRelevanceTool(): McpTool {
    return {
      name: 'ltf_analyze_task_relevance',
      description: 'Analyze how relevant a task is to specific code sections',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task tree ID'
          },
          file: {
            type: 'string',
            description: 'File path'
          },
          startLine: {
            type: 'number',
            description: 'Start line number'
          },
          endLine: {
            type: 'number',
            description: 'End line number'
          }
        },
        required: ['taskId', 'file']
      },
      handler: async (params: any) => {
        try {
          if (!this.forest || !this.guru) {
            throw new Error('Forest or Guru not initialized.');
          }
          
          const task = this.forest.trees.get(params.taskId);
          if (!task) {
            throw new Error(`Task ${params.taskId} not found`);
          }
          
          const analyzer = new TaskRelevanceAnalyzer(this.guru);
          const relevance = analyzer.analyzeTaskRelevance(task, {
            file: params.file,
            startLine: params.startLine || 1,
            endLine: params.endLine || 10000
          });
          
          const affectedCode = analyzer.findAffectedCode(task);
          
          return {
            success: true,
            taskId: params.taskId,
            relevance,
            relevancePercentage: (relevance * 100).toFixed(1) + '%',
            affectedFiles: affectedCode.length,
            affectedCode
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Find tasks for a specific goal
   */
  private findTasksForGoalTool(): McpTool {
    return {
      name: 'ltf_find_tasks_for_goal',
      description: 'Find tasks that contribute to a specific goal',
      inputSchema: {
        type: 'object',
        properties: {
          goalType: {
            type: 'string',
            enum: ['feature', 'quality', 'performance', 'security', 'refactor', 'documentation'],
            description: 'Type of goal'
          },
          minFitness: {
            type: 'number',
            description: 'Minimum fitness score (0.0 to 1.0)'
          }
        },
        required: ['goalType']
      },
      handler: async (params: any) => {
        try {
          if (!this.forest) {
            throw new Error('No active forest.');
          }
          
          const tasks = this.forest.findTrees({
            minFitness: params.minFitness || 0.0
          });
          
          // Filter by goal relevance
          const relevantTasks = tasks.filter(task => {
            const purpose = task.dna.purpose.type.toLowerCase();
            const goalType = params.goalType.toLowerCase();
            
            // Map goal types to task purposes
            const goalMapping: Record<string, string[]> = {
              'performance': ['optimize', 'improve'],
              'security': ['secure', 'fix'],
              'quality': ['test', 'refactor', 'improve'],
              'feature': ['create'],
              'refactor': ['refactor', 'improve'],
              'documentation': ['document', 'analyze']
            };
            
            const relevantPurposes = goalMapping[goalType] || [];
            return relevantPurposes.some(p => purpose.includes(p));
          });
          
          return {
            success: true,
            totalTasks: relevantTasks.length,
            tasks: relevantTasks.map(task => ({
              id: task.id,
              title: task.trunk.title,
              species: task.species,
              lifecycle: task.lifecycle,
              fitness: task.dna.currentFitness,
              progress: task.trunk.progress
            }))
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Get detailed task information
   */
  private getTaskDetailsTool(): McpTool {
    return {
      name: 'ltf_get_task_details',
      description: 'Get detailed information about a specific task',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task tree ID'
          }
        },
        required: ['taskId']
      },
      handler: async (params: any) => {
        try {
          if (!this.forest) {
            throw new Error('No active forest.');
          }
          
          const task = this.forest.trees.get(params.taskId);
          if (!task) {
            throw new Error(`Task ${params.taskId} not found`);
          }
          
          const status = task.getStatus();
          
          return {
            success: true,
            task: {
              id: task.id,
              species: task.species,
              generation: task.generation,
              age: Math.floor(task.age / 1000) + ' seconds',
              lifecycle: task.lifecycle,
              health: (task.health * 100).toFixed(1) + '%',
              energy: (task.energy * 100).toFixed(1) + '%',
              fitness: (task.dna.currentFitness * 100).toFixed(1) + '%',
              progress: (task.trunk.progress * 100).toFixed(1) + '%'
            },
            trunk: task.trunk,
            branches: task.branches.length,
            leaves: {
              total: task.leaves.length,
              completed: status.completed
            },
            genetics: {
              purpose: task.dna.purpose.type,
              approach: task.dna.approach.strategy,
              mutationRate: task.dna.mutationRate,
              heritability: task.dna.heritability
            },
            connections: task.connections.map(c => ({
              treeId: c.treeId,
              type: c.type,
              strength: c.strength
            })),
            totalEffort: status.totalEffort + ' hours'
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Trigger task reproduction
   */
  private reproduceTaskTool(): McpTool {
    return {
      name: 'ltf_reproduce_task',
      description: 'Trigger task reproduction',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Parent task ID'
          },
          reason: {
            type: 'string',
            description: 'Reason for reproduction'
          }
        },
        required: ['taskId', 'reason']
      },
      handler: async (params: any) => {
        try {
          if (!this.forest) {
            throw new Error('No active forest.');
          }
          
          const task = this.forest.trees.get(params.taskId);
          if (!task) {
            throw new Error(`Task ${params.taskId} not found`);
          }
          
          const offspring = await task.reproduce({
            type: 'manual_trigger',
            discovery: params.reason,
            confidence: 0.8
          });
          
          // Add offspring to forest
          for (const child of offspring) {
            this.forest.trees.set(child.id, child);
          }
          
          return {
            success: true,
            parentId: params.taskId,
            offspring: offspring.map(child => ({
              id: child.id,
              title: child.trunk.title,
              species: child.species
            })),
            message: `Task reproduced ${offspring.length} offspring`
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Terminate a task
   */
  private terminateTaskTool(): McpTool {
    return {
      name: 'ltf_terminate_task',
      description: 'Terminate a task',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'Task ID to terminate'
          },
          reason: {
            type: 'string',
            description: 'Reason for termination'
          }
        },
        required: ['taskId', 'reason']
      },
      handler: async (params: any) => {
        try {
          if (!this.forest) {
            throw new Error('No active forest.');
          }
          
          const task = this.forest.trees.get(params.taskId);
          if (!task) {
            throw new Error(`Task ${params.taskId} not found`);
          }
          
          await task.selfTerminate(params.reason);
          
          // Prune dead trees
          this.forest.pruneDeadTrees();
          
          return {
            success: true,
            taskId: params.taskId,
            message: `Task terminated: ${params.reason}`
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Tool: Get forest health report
   */
  private getForestHealthTool(): McpTool {
    return {
      name: 'ltf_forest_health',
      description: 'Get detailed forest health report',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        try {
          if (!this.forest) {
            throw new Error('No active forest.');
          }
          
          const health = this.forest.assessForestHealth();
          const stats = this.forest.getStatistics();
          
          // Calculate additional health metrics
          const taskCompletionRate = Array.from(this.forest.trees.values())
            .filter(t => t.lifecycle !== 'dead' as any)
            .reduce((sum, t) => sum + t.trunk.progress, 0) / Math.max(1, this.forest.trees.size);
          
          const averageFitness = Array.from(this.forest.trees.values())
            .reduce((sum, t) => sum + t.dna.currentFitness, 0) / Math.max(1, this.forest.trees.size);
          
          return {
            success: true,
            health: {
              overall: (health.overallHealth * 100).toFixed(1) + '%',
              biodiversity: {
                value: (health.biodiversity * 100).toFixed(1) + '%',
                species: Object.keys(stats.species).length,
                distribution: stats.species
              },
              stability: {
                value: (health.stability * 100).toFixed(1) + '%',
                mutationRate: stats.forest.totalMutations / Math.max(1, stats.forest.totalCreated),
                extinctionRate: stats.forest.totalExtinct / Math.max(1, stats.forest.totalCreated)
              },
              productivity: {
                value: (health.productivity * 100).toFixed(1) + '%',
                completionRate: (taskCompletionRate * 100).toFixed(1) + '%',
                activeTasks: stats.forest.activeTrees
              },
              sustainability: {
                value: (health.sustainability * 100).toFixed(1) + '%',
                resourceUsage: stats.resources
              }
            },
            metrics: {
              averageFitness: (averageFitness * 100).toFixed(1) + '%',
              reproductionRate: stats.forest.totalReproductions / Math.max(1, stats.forest.totalCreated),
              seedlingCount: stats.forest.seedlings
            },
            recommendations: this.generateHealthRecommendations(health, stats)
          };
          
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    };
  }
  
  /**
   * Generate health recommendations
   */
  private generateHealthRecommendations(health: any, stats: any): string[] {
    const recommendations: string[] = [];
    
    if (health.biodiversity < 0.5) {
      recommendations.push('Low biodiversity - consider adding diverse task types');
    }
    
    if (health.stability < 0.5) {
      recommendations.push('Low stability - reduce environmental pressure');
    }
    
    if (health.productivity < 0.5) {
      recommendations.push('Low productivity - review blocked tasks and add resources');
    }
    
    if (health.sustainability < 0.5) {
      recommendations.push('Low sustainability - prune dead trees and optimize resource usage');
    }
    
    if (stats.forest.seedlings > 10) {
      recommendations.push(`${stats.forest.seedlings} tasks waiting - increase forest capacity`);
    }
    
    return recommendations;
  }
}