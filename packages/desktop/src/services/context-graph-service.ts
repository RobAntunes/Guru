/**
 * Context Graph Service
 * Manages the unified view of all context available to the AI
 */

import { EventEmitter } from 'events';

export interface ContextNode {
  id: string;
  type: 'document' | 'file' | 'directory' | 'tool' | 'memory' | 'session' | 'group';
  label: string;
  category: 'knowledge' | 'filesystem' | 'tools' | 'memory' | 'session';
  active: boolean;
  metadata?: any;
  children?: string[]; // Child node IDs
  parent?: string; // Parent node ID
}

export interface ContextEdge {
  id: string;
  source: string;
  target: string;
  type: 'contains' | 'references' | 'uses' | 'learns_from' | 'synthesizes';
  label?: string;
}

export interface ContextGraphData {
  nodes: ContextNode[];
  edges: ContextEdge[];
  stats: {
    totalNodes: number;
    activeNodes: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  };
}

export interface FileSystemContext {
  rootPath: string;
  allowedPaths: string[];
  fileCount: number;
  totalSize: number;
  fileTypes: Record<string, number>;
}

export interface ToolContext {
  availableTools: Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    category: string;
  }>;
  activeToolCount: number;
}

export interface MemoryContext {
  patterns: number;
  insights: number;
  interactions: number;
  lastUpdated: Date;
}

export interface SessionContext {
  activeSessions: Array<{
    id: string;
    type: string;
    startTime: Date;
    status: string;
  }>;
  conversationLength: number;
  contextTokens: number;
}

class ContextGraphService extends EventEmitter {
  private nodes: Map<string, ContextNode> = new Map();
  private edges: Map<string, ContextEdge> = new Map();
  private fileSystemContext: FileSystemContext | null = null;
  private toolContext: ToolContext | null = null;
  private memoryContext: MemoryContext | null = null;
  private sessionContext: SessionContext | null = null;

  /**
   * Update knowledge graph nodes (documents and groups)
   */
  updateKnowledgeNodes(groups: any[]): void {
    // Clear existing knowledge nodes
    const knowledgeNodes = Array.from(this.nodes.values())
      .filter(node => node.category === 'knowledge');
    knowledgeNodes.forEach(node => this.nodes.delete(node.id));

    // Add group and document nodes
    groups.forEach(group => {
      this.addGroupNode(group);
    });

    this.emit('graphUpdated', this.getGraphData());
  }

  private addGroupNode(group: any, parentId?: string): void {
    // Count all documents including nested groups
    const countDocuments = (g: any): number => {
      let count = g.documents?.length || 0;
      if (g.groups) {
        g.groups.forEach((nested: any) => {
          count += countDocuments(nested);
        });
      }
      return count;
    };

    // Count active documents
    const countActiveDocuments = (g: any): number => {
      let count = (g.documents || []).filter((d: any) => d.membership?.isActive).length;
      if (g.groups) {
        g.groups.forEach((nested: any) => {
          count += countActiveDocuments(nested);
        });
      }
      return count;
    };

    const totalDocs = countDocuments(group);
    const activeDocs = countActiveDocuments(group);

    const groupNode: ContextNode = {
      id: `group-${group.id}`,
      type: 'group',
      label: group.name,
      category: 'knowledge',
      active: true, // Groups are always "active" as containers
      metadata: { 
        documentCount: totalDocs,
        activeDocumentCount: activeDocs,
        directDocumentCount: group.documents?.length || 0,
        createdAt: group.createdAt 
      },
      parent: parentId,
      children: []
    };

    this.nodes.set(groupNode.id, groupNode);

    // Add documents in this group
    group.documents?.forEach((docRef: any) => {
      const docNode: ContextNode = {
        id: `doc-${docRef.doc.id}`,
        type: 'document',
        label: docRef.doc.title,
        category: 'knowledge',
        active: docRef.membership?.isActive || false,
        metadata: {
          fileType: docRef.doc.type,
          size: docRef.doc.size,
          addedAt: docRef.membership?.addedAt
        },
        parent: groupNode.id
      };

      this.nodes.set(docNode.id, docNode);
      groupNode.children!.push(docNode.id);

      // Add edge from group to document
      const edgeId = `${groupNode.id}-${docNode.id}`;
      this.edges.set(edgeId, {
        id: edgeId,
        source: groupNode.id,
        target: docNode.id,
        type: 'contains'
      });
    });

    // Add nested groups
    group.groups?.forEach((nestedGroup: any) => {
      const nestedId = this.addGroupNode(nestedGroup, groupNode.id);
      groupNode.children!.push(`group-${nestedGroup.id}`);
    });
  }

  /**
   * Update file system context
   */
  updateFileSystemContext(context: FileSystemContext): void {
    this.fileSystemContext = context;

    // Remove old filesystem nodes
    const fsNodes = Array.from(this.nodes.values())
      .filter(node => node.category === 'filesystem');
    fsNodes.forEach(node => this.nodes.delete(node.id));

    // Add root filesystem node
    const rootNode: ContextNode = {
      id: 'fs-root',
      type: 'directory',
      label: 'File System Access',
      category: 'filesystem',
      active: true,
      metadata: {
        rootPath: context.rootPath,
        fileCount: context.fileCount,
        totalSize: context.totalSize
      },
      children: []
    };

    this.nodes.set(rootNode.id, rootNode);

    // Add allowed paths as child nodes
    context.allowedPaths.forEach((path, index) => {
      const pathNode: ContextNode = {
        id: `fs-path-${index}`,
        type: 'directory',
        label: path.startsWith('./') ? path : path.split('/').pop() || path,
        category: 'filesystem',
        active: true,
        metadata: {
          fullPath: path,
          fileTypes: Object.entries(context.fileTypes)
            .filter(([ext]) => ext !== 'total')
            .slice(0, 3)
            .map(([ext, count]) => `${ext}: ${count}`)
            .join(', ')
        },
        parent: rootNode.id
      };

      this.nodes.set(pathNode.id, pathNode);
      rootNode.children!.push(pathNode.id);

      this.edges.set(`${rootNode.id}-${pathNode.id}`, {
        id: `${rootNode.id}-${pathNode.id}`,
        source: rootNode.id,
        target: pathNode.id,
        type: 'contains'
      });
    });

    this.emit('graphUpdated', this.getGraphData());
  }

  /**
   * Update tool context
   */
  updateToolContext(context: ToolContext): void {
    this.toolContext = context;

    // Remove old tool nodes
    const toolNodes = Array.from(this.nodes.values())
      .filter(node => node.category === 'tools');
    toolNodes.forEach(node => this.nodes.delete(node.id));

    // Add tools root node
    const rootNode: ContextNode = {
      id: 'tools-root',
      type: 'tool',
      label: 'Available Tools',
      category: 'tools',
      active: true,
      metadata: {
        totalTools: context.availableTools.length,
        activeTools: context.activeToolCount
      },
      children: []
    };

    this.nodes.set(rootNode.id, rootNode);

    // Group tools by category
    const toolsByCategory = context.availableTools.reduce((acc, tool) => {
      const category = tool.category || 'general';
      if (!acc[category]) acc[category] = [];
      acc[category].push(tool);
      return acc;
    }, {} as Record<string, typeof context.availableTools>);

    // Add tool nodes by category
    Object.entries(toolsByCategory).forEach(([category, tools]) => {
      const categoryNode: ContextNode = {
        id: `tools-cat-${category}`,
        type: 'tool',
        label: category.charAt(0).toUpperCase() + category.slice(1),
        category: 'tools',
        active: true,
        parent: rootNode.id,
        children: []
      };

      this.nodes.set(categoryNode.id, categoryNode);
      rootNode.children!.push(categoryNode.id);

      tools.forEach(tool => {
        const toolNode: ContextNode = {
          id: `tool-${tool.id}`,
          type: 'tool',
          label: tool.name,
          category: 'tools',
          active: tool.enabled,
          metadata: {
            description: tool.description
          },
          parent: categoryNode.id
        };

        this.nodes.set(toolNode.id, toolNode);
        categoryNode.children!.push(toolNode.id);
      });
    });

    this.emit('graphUpdated', this.getGraphData());
  }

  /**
   * Update memory context
   */
  updateMemoryContext(context: MemoryContext): void {
    this.memoryContext = context;

    // Remove old memory nodes
    const memoryNodes = Array.from(this.nodes.values())
      .filter(node => node.category === 'memory');
    memoryNodes.forEach(node => this.nodes.delete(node.id));

    // Add memory root node
    const rootNode: ContextNode = {
      id: 'memory-root',
      type: 'memory',
      label: 'Adaptive Learning',
      category: 'memory',
      active: true,
      metadata: context,
      children: []
    };

    this.nodes.set(rootNode.id, rootNode);

    // Add memory type nodes
    const memoryTypes = [
      { id: 'patterns', label: `${context.patterns} Patterns`, count: context.patterns },
      { id: 'insights', label: `${context.insights} Insights`, count: context.insights },
      { id: 'interactions', label: `${context.interactions} Interactions`, count: context.interactions }
    ];

    memoryTypes.forEach(type => {
      if (type.count > 0) {
        const typeNode: ContextNode = {
          id: `memory-${type.id}`,
          type: 'memory',
          label: type.label,
          category: 'memory',
          active: true,
          parent: rootNode.id
        };

        this.nodes.set(typeNode.id, typeNode);
        rootNode.children!.push(typeNode.id);
      }
    });

    this.emit('graphUpdated', this.getGraphData());
  }

  /**
   * Update session context
   */
  updateSessionContext(context: SessionContext): void {
    this.sessionContext = context;

    // Remove old session nodes
    const sessionNodes = Array.from(this.nodes.values())
      .filter(node => node.category === 'session');
    sessionNodes.forEach(node => this.nodes.delete(node.id));

    // Add session root node
    const rootNode: ContextNode = {
      id: 'session-root',
      type: 'session',
      label: 'Active Sessions',
      category: 'session',
      active: true,
      metadata: {
        conversationLength: context.conversationLength,
        contextTokens: context.contextTokens
      },
      children: []
    };

    this.nodes.set(rootNode.id, rootNode);

    // Add active sessions
    context.activeSessions.forEach(session => {
      const sessionNode: ContextNode = {
        id: `session-${session.id}`,
        type: 'session',
        label: `${session.type} Session`,
        category: 'session',
        active: session.status === 'active',
        metadata: session,
        parent: rootNode.id
      };

      this.nodes.set(sessionNode.id, sessionNode);
      rootNode.children!.push(sessionNode.id);
    });

    this.emit('graphUpdated', this.getGraphData());
  }

  /**
   * Get complete graph data
   */
  getGraphData(): ContextGraphData {
    const nodes = Array.from(this.nodes.values());
    const edges = Array.from(this.edges.values());

    // Calculate stats
    const stats = {
      totalNodes: nodes.length,
      activeNodes: nodes.filter(n => n.active).length,
      byCategory: {} as Record<string, number>,
      byType: {} as Record<string, number>
    };

    nodes.forEach(node => {
      stats.byCategory[node.category] = (stats.byCategory[node.category] || 0) + 1;
      stats.byType[node.type] = (stats.byType[node.type] || 0) + 1;
    });

    return { nodes, edges, stats };
  }

  /**
   * Toggle node active state
   */
  toggleNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.active = !node.active;
      
      // If it's a group node, toggle all children
      if (node.type === 'group' && node.children) {
        node.children.forEach(childId => {
          const child = this.nodes.get(childId);
          if (child) child.active = node.active;
        });
      }

      this.emit('graphUpdated', this.getGraphData());
      this.emit('nodeToggled', { nodeId, active: node.active });
    }
  }

  /**
   * Get active context summary
   */
  getActiveContextSummary(): string {
    const data = this.getGraphData();
    const summary = [
      `Total Context: ${data.stats.totalNodes} nodes (${data.stats.activeNodes} active)`,
      `Knowledge: ${data.stats.byCategory.knowledge || 0} items`,
      `File System: ${this.fileSystemContext?.fileCount || 0} files accessible`,
      `Tools: ${this.toolContext?.activeToolCount || 0} tools enabled`,
      `Memory: ${this.memoryContext?.patterns || 0} patterns learned`,
      `Sessions: ${this.sessionContext?.activeSessions.length || 0} active`
    ];

    return summary.join('\n');
  }
}

export const contextGraphService = new ContextGraphService();