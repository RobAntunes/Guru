/**
 * Cross-System Learning Transfer
 * 
 * Enables different learning subsystems to share knowledge, insights, and
 * learned patterns. Implements transfer learning principles to accelerate
 * learning across domains and systems.
 */

import { EventEmitter } from 'events';

export interface TransferableKnowledge {
  id: string;
  source: string;
  type: 'pattern' | 'insight' | 'model' | 'parameter' | 'strategy';
  domain: string;
  content: any;
  metadata: {
    confidence: number;
    generalizability: number;
    complexity: number;
    dependencies: string[];
  };
  created: Date;
  lastUsed: Date;
  useCount: number;
}

export interface TransferRequest {
  requestId: string;
  requester: string;
  targetDomain: string;
  knowledgeType?: string;
  constraints?: {
    minConfidence?: number;
    maxComplexity?: number;
    recency?: number; // hours
  };
  urgency: 'low' | 'medium' | 'high';
}

export interface TransferResult {
  requestId: string;
  success: boolean;
  transferred: TransferableKnowledge[];
  adaptations: {
    knowledgeId: string;
    adaptationType: string;
    changes: any;
  }[];
  impact: {
    immediateValue: number;
    potentialValue: number;
    learningAcceleration: number;
  };
}

export interface DomainMapping {
  sourceDomain: string;
  targetDomain: string;
  similarity: number;
  transferRules: {
    type: string;
    transformation?: (knowledge: any) => any;
    conditions?: any;
  }[];
  successHistory: {
    transfers: number;
    successRate: number;
    averageImpact: number;
  };
}

export interface TransferConfig {
  enableAutoTransfer: boolean;
  similarityThreshold: number;
  adaptationDepth: number;
  knowledgeRetentionDays: number;
  maxTransferSize: number;
  transferCooldown: number; // ms between transfers
}

export class CrossSystemLearningTransfer extends EventEmitter {
  private knowledgeBase: Map<string, TransferableKnowledge> = new Map();
  private domainMappings: Map<string, DomainMapping> = new Map();
  private transferQueue: TransferRequest[] = [];
  private transferHistory: TransferResult[] = [];
  private activeTransfers: Set<string> = new Set();
  private lastTransferTime: Map<string, number> = new Map();
  
  constructor(private config: TransferConfig) {
    super();
    this.startTransferProcessor();
  }
  
  /**
   * Register knowledge for potential transfer
   */
  async registerKnowledge(knowledge: Omit<TransferableKnowledge, 'id' | 'created' | 'lastUsed' | 'useCount'>): Promise<string> {
    const id = this.generateKnowledgeId(knowledge);
    
    const transferable: TransferableKnowledge = {
      ...knowledge,
      id,
      created: new Date(),
      lastUsed: new Date(),
      useCount: 0
    };
    
    this.knowledgeBase.set(id, transferable);
    
    // Check for auto-transfer opportunities
    if (this.config.enableAutoTransfer) {
      await this.checkAutoTransferOpportunities(transferable);
    }
    
    this.emit('knowledge-registered', transferable);
    
    return id;
  }
  
  /**
   * Request knowledge transfer
   */
  async requestTransfer(request: TransferRequest): Promise<TransferResult> {
    // Check if we can transfer immediately
    if (this.canTransferNow(request.requester)) {
      return await this.executeTransfer(request);
    }
    
    // Queue the request
    this.transferQueue.push(request);
    this.emit('transfer-queued', request);
    
    // Return a pending result
    return {
      requestId: request.requestId,
      success: false,
      transferred: [],
      adaptations: [],
      impact: {
        immediateValue: 0,
        potentialValue: 0,
        learningAcceleration: 0
      }
    };
  }
  
  /**
   * Execute knowledge transfer
   */
  private async executeTransfer(request: TransferRequest): Promise<TransferResult> {
    this.activeTransfers.add(request.requestId);
    
    try {
      // Find relevant knowledge
      const candidates = this.findRelevantKnowledge(request);
      
      // Adapt knowledge for target domain
      const adaptations = await this.adaptKnowledge(candidates, request.targetDomain);
      
      // Calculate transfer impact
      const impact = this.calculateTransferImpact(candidates, adaptations);
      
      // Update usage statistics
      for (const knowledge of candidates) {
        knowledge.useCount++;
        knowledge.lastUsed = new Date();
      }
      
      // Record transfer
      const result: TransferResult = {
        requestId: request.requestId,
        success: candidates.length > 0,
        transferred: candidates,
        adaptations,
        impact
      };
      
      this.transferHistory.push(result);
      this.lastTransferTime.set(request.requester, Date.now());
      
      // Update domain mappings
      this.updateDomainMappings(result);
      
      this.emit('transfer-completed', result);
      
      return result;
      
    } finally {
      this.activeTransfers.delete(request.requestId);
    }
  }
  
  /**
   * Find relevant knowledge for transfer
   */
  private findRelevantKnowledge(request: TransferRequest): TransferableKnowledge[] {
    const candidates: TransferableKnowledge[] = [];
    const now = Date.now();
    
    for (const knowledge of this.knowledgeBase.values()) {
      // Check type match
      if (request.knowledgeType && knowledge.type !== request.knowledgeType) {
        continue;
      }
      
      // Check constraints
      if (request.constraints) {
        const { minConfidence, maxComplexity, recency } = request.constraints;
        
        if (minConfidence && knowledge.metadata.confidence < minConfidence) {
          continue;
        }
        
        if (maxComplexity && knowledge.metadata.complexity > maxComplexity) {
          continue;
        }
        
        if (recency) {
          const age = (now - knowledge.lastUsed.getTime()) / 3600000; // hours
          if (age > recency) {
            continue;
          }
        }
      }
      
      // Check domain relevance
      const relevance = this.calculateDomainRelevance(
        knowledge.domain,
        request.targetDomain
      );
      
      if (relevance >= this.config.similarityThreshold) {
        candidates.push(knowledge);
      }
    }
    
    // Sort by relevance and confidence
    return candidates
      .sort((a, b) => {
        const scoreA = a.metadata.confidence * a.metadata.generalizability;
        const scoreB = b.metadata.confidence * b.metadata.generalizability;
        return scoreB - scoreA;
      })
      .slice(0, this.config.maxTransferSize);
  }
  
  /**
   * Calculate domain relevance
   */
  private calculateDomainRelevance(source: string, target: string): number {
    if (source === target) return 1.0;
    
    // Check explicit mappings
    const mappingKey = `${source}->${target}`;
    const mapping = this.domainMappings.get(mappingKey);
    
    if (mapping) {
      return mapping.similarity;
    }
    
    // Calculate implicit similarity
    return this.calculateImplicitSimilarity(source, target);
  }
  
  /**
   * Calculate implicit domain similarity
   */
  private calculateImplicitSimilarity(source: string, target: string): number {
    // Simple heuristic based on common terms
    const sourceTerms = source.toLowerCase().split(/[^a-z]+/);
    const targetTerms = target.toLowerCase().split(/[^a-z]+/);
    
    const commonTerms = sourceTerms.filter(term => targetTerms.includes(term));
    const unionSize = new Set([...sourceTerms, ...targetTerms]).size;
    
    return commonTerms.length / unionSize;
  }
  
  /**
   * Adapt knowledge for target domain
   */
  private async adaptKnowledge(
    knowledge: TransferableKnowledge[],
    targetDomain: string
  ): Promise<Array<{
    knowledgeId: string;
    adaptationType: string;
    changes: any;
  }>> {
    const adaptations: Array<any> = [];
    
    for (const item of knowledge) {
      if (item.domain === targetDomain) {
        // No adaptation needed
        continue;
      }
      
      const mappingKey = `${item.domain}->${targetDomain}`;
      const mapping = this.domainMappings.get(mappingKey);
      
      if (mapping) {
        // Apply transfer rules
        for (const rule of mapping.transferRules) {
          if (rule.type === item.type) {
            const adaptation = {
              knowledgeId: item.id,
              adaptationType: 'rule-based',
              changes: rule.transformation ? rule.transformation(item.content) : item.content
            };
            adaptations.push(adaptation);
            break;
          }
        }
      } else {
        // Generic adaptation
        const adaptation = await this.performGenericAdaptation(item, targetDomain);
        adaptations.push(adaptation);
      }
    }
    
    return adaptations;
  }
  
  /**
   * Perform generic adaptation when no specific rules exist
   */
  private async performGenericAdaptation(
    knowledge: TransferableKnowledge,
    targetDomain: string
  ): Promise<any> {
    const adaptation = {
      knowledgeId: knowledge.id,
      adaptationType: 'generic',
      changes: {}
    };
    
    switch (knowledge.type) {
      case 'pattern':
        // Adjust pattern thresholds based on domain characteristics
        adaptation.changes = {
          ...knowledge.content,
          thresholds: this.adjustThresholds(knowledge.content.thresholds, targetDomain),
          confidence: knowledge.metadata.confidence * 0.8 // Reduce confidence for generic transfer
        };
        break;
        
      case 'parameter':
        // Scale parameters based on domain complexity
        const scaleFactor = this.getdomainScaleFactor(targetDomain);
        adaptation.changes = {
          ...knowledge.content,
          values: this.scaleParameters(knowledge.content.values, scaleFactor)
        };
        break;
        
      case 'strategy':
        // Modify strategy priorities for target domain
        adaptation.changes = {
          ...knowledge.content,
          priority: this.adjustStrategyPriority(knowledge.content.priority, targetDomain)
        };
        break;
        
      default:
        // Direct transfer with confidence reduction
        adaptation.changes = {
          ...knowledge.content,
          transferredFrom: knowledge.domain,
          confidence: knowledge.metadata.confidence * 0.7
        };
    }
    
    return adaptation;
  }
  
  /**
   * Calculate transfer impact
   */
  private calculateTransferImpact(
    transferred: TransferableKnowledge[],
    adaptations: any[]
  ): {
    immediateValue: number;
    potentialValue: number;
    learningAcceleration: number;
  } {
    if (transferred.length === 0) {
      return {
        immediateValue: 0,
        potentialValue: 0,
        learningAcceleration: 1.0
      };
    }
    
    // Calculate immediate value based on confidence and generalizability
    const immediateValue = transferred.reduce((sum, k) => 
      sum + k.metadata.confidence * k.metadata.generalizability, 0
    ) / transferred.length;
    
    // Calculate potential value based on complexity and adaptations
    const adaptationQuality = adaptations.filter(a => a.adaptationType !== 'generic').length / adaptations.length;
    const potentialValue = immediateValue * (1 + adaptationQuality * 0.5);
    
    // Calculate learning acceleration
    const avgComplexity = transferred.reduce((sum, k) => sum + k.metadata.complexity, 0) / transferred.length;
    const learningAcceleration = 1 + (avgComplexity * potentialValue);
    
    return {
      immediateValue: Math.min(1, immediateValue),
      potentialValue: Math.min(1, potentialValue),
      learningAcceleration: Math.min(3, learningAcceleration)
    };
  }
  
  /**
   * Update domain mappings based on transfer results
   */
  private updateDomainMappings(result: TransferResult): void {
    if (!result.success || result.transferred.length === 0) return;
    
    // Group transfers by source domain
    const domainGroups = new Map<string, TransferableKnowledge[]>();
    for (const knowledge of result.transferred) {
      const group = domainGroups.get(knowledge.domain) || [];
      group.push(knowledge);
      domainGroups.set(knowledge.domain, group);
    }
    
    // Update mappings
    for (const [sourceDomain, knowledgeItems] of domainGroups) {
      const targetDomain = result.transferred[0].domain; // Assume same target
      const mappingKey = `${sourceDomain}->${targetDomain}`;
      
      let mapping = this.domainMappings.get(mappingKey);
      if (!mapping) {
        mapping = {
          sourceDomain,
          targetDomain,
          similarity: this.calculateImplicitSimilarity(sourceDomain, targetDomain),
          transferRules: [],
          successHistory: {
            transfers: 0,
            successRate: 0,
            averageImpact: 0
          }
        };
        this.domainMappings.set(mappingKey, mapping);
      }
      
      // Update success history
      const history = mapping.successHistory;
      history.transfers++;
      history.successRate = (history.successRate * (history.transfers - 1) + 1) / history.transfers;
      history.averageImpact = (
        history.averageImpact * (history.transfers - 1) +
        result.impact.immediateValue
      ) / history.transfers;
      
      // Update similarity based on success
      mapping.similarity = mapping.similarity * 0.9 + history.averageImpact * 0.1;
    }
  }
  
  /**
   * Check for auto-transfer opportunities
   */
  private async checkAutoTransferOpportunities(knowledge: TransferableKnowledge): Promise<void> {
    // Find domains that could benefit from this knowledge
    const beneficiaryDomains = this.findBeneficiaryDomains(knowledge);
    
    for (const domain of beneficiaryDomains) {
      const request: TransferRequest = {
        requestId: `auto-${Date.now()}-${domain}`,
        requester: 'auto-transfer',
        targetDomain: domain,
        knowledgeType: knowledge.type,
        urgency: 'low'
      };
      
      // Queue auto-transfer
      this.transferQueue.push(request);
    }
  }
  
  /**
   * Find domains that could benefit from knowledge
   */
  private findBeneficiaryDomains(knowledge: TransferableKnowledge): string[] {
    const domains: string[] = [];
    
    // Check all known domain mappings
    for (const [key, mapping] of this.domainMappings) {
      if (mapping.sourceDomain === knowledge.domain &&
          mapping.similarity >= this.config.similarityThreshold &&
          mapping.successHistory.successRate > 0.5) {
        domains.push(mapping.targetDomain);
      }
    }
    
    return domains;
  }
  
  /**
   * Process transfer queue
   */
  private async processTransferQueue(): Promise<void> {
    while (this.transferQueue.length > 0) {
      const request = this.transferQueue.shift()!;
      
      if (this.canTransferNow(request.requester)) {
        await this.executeTransfer(request);
      } else {
        // Put back in queue
        this.transferQueue.unshift(request);
        break;
      }
    }
  }
  
  /**
   * Check if transfer can happen now
   */
  private canTransferNow(requester: string): boolean {
    const lastTransfer = this.lastTransferTime.get(requester) || 0;
    return Date.now() - lastTransfer >= this.config.transferCooldown;
  }
  
  /**
   * Start transfer processor
   */
  private startTransferProcessor(): void {
    setInterval(() => {
      this.processTransferQueue();
      this.cleanOldKnowledge();
    }, 5000); // Process every 5 seconds
  }
  
  /**
   * Clean old knowledge
   */
  private cleanOldKnowledge(): void {
    const retentionMs = this.config.knowledgeRetentionDays * 86400000;
    const cutoff = Date.now() - retentionMs;
    
    for (const [id, knowledge] of this.knowledgeBase) {
      if (knowledge.lastUsed.getTime() < cutoff && knowledge.useCount < 3) {
        this.knowledgeBase.delete(id);
      }
    }
  }
  
  /**
   * Helper methods for adaptation
   */
  
  private adjustThresholds(thresholds: any, targetDomain: string): any {
    // Simple heuristic: adjust based on domain name
    const adjustment = targetDomain.includes('complex') ? 1.2 : 1.0;
    
    const adjusted: any = {};
    for (const [key, value] of Object.entries(thresholds)) {
      if (typeof value === 'number') {
        adjusted[key] = value * adjustment;
      } else {
        adjusted[key] = value;
      }
    }
    
    return adjusted;
  }
  
  private getdomainScaleFactor(domain: string): number {
    // Domain-specific scaling
    if (domain.includes('micro')) return 0.1;
    if (domain.includes('macro')) return 10;
    if (domain.includes('large')) return 5;
    return 1.0;
  }
  
  private scaleParameters(params: any, factor: number): any {
    const scaled: any = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'number') {
        scaled[key] = value * factor;
      } else if (Array.isArray(value)) {
        scaled[key] = value.map(v => typeof v === 'number' ? v * factor : v);
      } else {
        scaled[key] = value;
      }
    }
    
    return scaled;
  }
  
  private adjustStrategyPriority(priority: number, targetDomain: string): number {
    // Adjust priority based on domain characteristics
    if (targetDomain.includes('critical')) return Math.max(1, priority - 1);
    if (targetDomain.includes('experimental')) return Math.min(5, priority + 1);
    return priority;
  }
  
  private generateKnowledgeId(knowledge: Omit<TransferableKnowledge, 'id' | 'created' | 'lastUsed' | 'useCount'>): string {
    const hash = `${knowledge.source}-${knowledge.type}-${knowledge.domain}-${Date.now()}`;
    return Buffer.from(hash).toString('base64').substring(0, 16);
  }
  
  /**
   * Get transfer analytics
   */
  getTransferAnalytics(): {
    totalKnowledge: number;
    knowledgeByType: Map<string, number>;
    transferHistory: {
      total: number;
      successful: number;
      averageImpact: number;
    };
    domainConnections: Array<{
      source: string;
      target: string;
      strength: number;
      transfers: number;
    }>;
    activeTransfers: number;
    queueLength: number;
  } {
    // Count knowledge by type
    const knowledgeByType = new Map<string, number>();
    for (const knowledge of this.knowledgeBase.values()) {
      knowledgeByType.set(
        knowledge.type,
        (knowledgeByType.get(knowledge.type) || 0) + 1
      );
    }
    
    // Calculate transfer history stats
    const successfulTransfers = this.transferHistory.filter(t => t.success);
    const avgImpact = successfulTransfers.length > 0
      ? successfulTransfers.reduce((sum, t) => sum + t.impact.immediateValue, 0) / successfulTransfers.length
      : 0;
    
    // Get domain connections
    const domainConnections = Array.from(this.domainMappings.values())
      .map(mapping => ({
        source: mapping.sourceDomain,
        target: mapping.targetDomain,
        strength: mapping.similarity,
        transfers: mapping.successHistory.transfers
      }))
      .sort((a, b) => b.strength - a.strength);
    
    return {
      totalKnowledge: this.knowledgeBase.size,
      knowledgeByType,
      transferHistory: {
        total: this.transferHistory.length,
        successful: successfulTransfers.length,
        averageImpact: avgImpact
      },
      domainConnections,
      activeTransfers: this.activeTransfers.size,
      queueLength: this.transferQueue.length
    };
  }
  
  /**
   * Create explicit domain mapping
   */
  createDomainMapping(
    sourceDomain: string,
    targetDomain: string,
    similarity: number,
    rules?: any[]
  ): void {
    const mappingKey = `${sourceDomain}->${targetDomain}`;
    
    this.domainMappings.set(mappingKey, {
      sourceDomain,
      targetDomain,
      similarity,
      transferRules: rules || [],
      successHistory: {
        transfers: 0,
        successRate: 0,
        averageImpact: 0
      }
    });
    
    this.emit('mapping-created', { sourceDomain, targetDomain, similarity });
  }
}