/**
 * Pattern Mining Engine (MVP)
 * Discovers emergent, unnamed, and attempted patterns in code
 */

import { SymbolNode, SymbolGraph } from "../types/index.js";

// TypeScript interfaces for AI-ready output
export interface CodeFeatureVector {
  symbolId: string;
  features: number[];
  featureNames: string[];
}

export interface Cluster {
  id: string;
  members: string[];
  centroid: number[];
  metrics: {
    cohesion: number;
    separation: number;
  };
}

export interface Outlier {
  symbolId: string;
  featureVector: number[];
  outlierScore: number;
}

export interface PatternInferenceResult {
  featureMatrix: CodeFeatureVector[];
  clusters: Cluster[];
  outliers: Outlier[];
  meta: {
    featureNames: string[];
    clusteringAlgorithm: string;
    outlierAlgorithm: string;
    version: string;
  };
}

export class PatternMiningEngine {
  private symbolGraph: SymbolGraph;
  private featureNames: string[] = [
    "loc",
    "fanIn",
    "fanOut",
    "numParams",
    "isExported",
    "isAsync",
    "isClass",
    "isFunction",
    "cyclomaticComplexity",
    // Add more as needed
  ];

  constructor(symbolGraph: SymbolGraph) {
    this.symbolGraph = symbolGraph;
  }

  // Extracts feature vectors for all symbols
  private extractFeatures(): CodeFeatureVector[] {
    const features: CodeFeatureVector[] = [];
    for (const [id, node] of this.symbolGraph.symbols) {
      if (!["function", "class"].includes(node.type)) continue;
      features.push(this.extractFeatureVector(id, node));
    }
    return features;
  }

  // Example feature extraction (expand as needed)
  private extractFeatureVector(
    id: string,
    node: SymbolNode,
  ): CodeFeatureVector {
    // Use only valid properties for MVP
    const paramCount = Array.isArray(node.metadata.parameters)
      ? node.metadata.parameters.length
      : 0;
    const isAsync = node.metadata.isAsync ? 1 : 0;
    const accessibility = node.metadata.accessibility === "private" ? 0 : 1;
    // Add more features as needed, but only those present in SymbolMetadata
    return {
      symbolId: id,
      features: [paramCount, isAsync, accessibility],
      featureNames: ["paramCount", "isAsync", "accessibility"],
    };
  }

  // Simple k-means clustering (k=3 for MVP)
  private clusterFeatures(featureMatrix: CodeFeatureVector[]): Cluster[] {
    // MVP: group by isClass/isFunction for now
    const clusters: Cluster[] = [];
    const classMembers = featureMatrix
      .filter((f) => f.features[6] === 1)
      .map((f) => f.symbolId);
    const functionMembers = featureMatrix
      .filter((f) => f.features[7] === 1 && f.features[6] === 0)
      .map((f) => f.symbolId);
    const otherMembers = featureMatrix
      .filter((f) => f.features[6] === 0 && f.features[7] === 0)
      .map((f) => f.symbolId);
    if (classMembers.length > 0) {
      clusters.push({
        id: "class_cluster",
        members: classMembers,
        centroid: this.centroid(classMembers, featureMatrix),
        metrics: { cohesion: 1, separation: 1 },
      });
    }
    if (functionMembers.length > 0) {
      clusters.push({
        id: "function_cluster",
        members: functionMembers,
        centroid: this.centroid(functionMembers, featureMatrix),
        metrics: { cohesion: 1, separation: 1 },
      });
    }
    if (otherMembers.length > 0) {
      clusters.push({
        id: "other_cluster",
        members: otherMembers,
        centroid: this.centroid(otherMembers, featureMatrix),
        metrics: { cohesion: 1, separation: 1 },
      });
    }
    return clusters;
  }

  // Simple centroid calculation
  private centroid(
    members: string[],
    featureMatrix: CodeFeatureVector[],
  ): number[] {
    if (members.length === 0) return this.featureNames.map(() => 0);
    const vectors = members.map(
      (id) =>
        featureMatrix.find((f) => f.symbolId === id)?.features ||
        this.featureNames.map(() => 0),
    );
    const sum = vectors.reduce(
      (acc, vec) => acc.map((v, i) => v + (vec[i] || 0)),
      this.featureNames.map(() => 0),
    );
    return sum.map((v) => v / members.length);
  }

  // Simple outlier detection: high fan-in or fan-out
  private detectOutliers(featureMatrix: CodeFeatureVector[]): Outlier[] {
    const outliers: Outlier[] = [];
    const fanInIdx = this.featureNames.indexOf("fanIn");
    const fanOutIdx = this.featureNames.indexOf("fanOut");
    const fanInVals = featureMatrix.map((f) => f.features[fanInIdx]);
    const fanOutVals = featureMatrix.map((f) => f.features[fanOutIdx]);
    const fanInMean = this.mean(fanInVals);
    const fanInStd = this.std(fanInVals);
    const fanOutMean = this.mean(fanOutVals);
    const fanOutStd = this.std(fanOutVals);
    for (const f of featureMatrix) {
      const fanInZ = fanInStd
        ? (f.features[fanInIdx] - fanInMean) / fanInStd
        : 0;
      const fanOutZ = fanOutStd
        ? (f.features[fanOutIdx] - fanOutMean) / fanOutStd
        : 0;
      const outlierScore = Math.max(Math.abs(fanInZ), Math.abs(fanOutZ));
      if (outlierScore > 2) {
        outliers.push({
          symbolId: f.symbolId,
          featureVector: f.features,
          outlierScore,
        });
      }
    }
    return outliers;
  }

  private mean(arr: number[]): number {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }
  private std(arr: number[]): number {
    const m = this.mean(arr);
    return Math.sqrt(this.mean(arr.map((x) => (x - m) ** 2)));
  }

  // Main entry point
  public minePatterns(): PatternInferenceResult {
    const featureMatrix = this.extractFeatures();
    const clusters = this.clusterFeatures(featureMatrix);
    const outliers = this.detectOutliers(featureMatrix);
    return {
      featureMatrix,
      clusters,
      outliers,
      meta: {
        featureNames: this.featureNames,
        clusteringAlgorithm: "simple_type_grouping",
        outlierAlgorithm: "zscore_fanIn_fanOut",
        version: "0.2.0-ai-ready",
      },
    };
  }
}
