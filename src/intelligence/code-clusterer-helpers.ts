import { SymbolGraph } from "../types/index.js";

export type SemanticZoneType = "feature" | "ui" | "api" | "data" | "utility";

export interface CodeCluster {
  id: string;
  symbols: string[];
  metrics: {
    size: number;
    cohesion: number;
    coupling: number;
  };
}

export class CodeClustererHelpers {
  private inferResponsibilities(
    type: SemanticZoneType,
    names: string[],
  ): string[] {
    const responsibilities: string[] = [];

    switch (type) {
      case "feature":
        responsibilities.push(
          "Business logic implementation",
          "Feature workflow coordination",
        );
        break;
      case "ui":
        responsibilities.push(
          "User interface rendering",
          "User interaction handling",
        );
        break;
      case "api":
        responsibilities.push("HTTP request handling", "Response formatting");
        break;
      case "data":
        responsibilities.push("Data modeling", "Database interaction");
        break;
      case "utility":
        responsibilities.push("Shared functionality", "Helper operations");
        break;
    }

    return responsibilities;
  }

  private calculateSizeDistribution(
    clusters: CodeCluster[],
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const cluster of clusters) {
      const sizeRange =
        cluster.metrics.size <= 5
          ? "small"
          : cluster.metrics.size <= 15
            ? "medium"
            : "large";
      distribution[sizeRange] = (distribution[sizeRange] || 0) + 1;
    }

    return distribution;
  }

  private calculateQualityMetrics(
    clusters: CodeCluster[],
    symbolGraph: SymbolGraph,
  ): any {
    if (clusters.length === 0) {
      return {
        silhouetteScore: 0,
        modularityScore: 0,
        cohesionScore: 0,
        separationScore: 0,
      };
    }

    const avgCohesion =
      clusters.reduce((sum, c) => sum + c.metrics.cohesion, 0) /
      clusters.length;
    const avgSeparation =
      clusters.reduce((sum, c) => sum + (1 - c.metrics.coupling), 0) /
      clusters.length;

    return {
      silhouetteScore: (avgCohesion + avgSeparation) / 2,
      modularityScore: avgCohesion - avgSeparation * 0.5,
      cohesionScore: avgCohesion,
      separationScore: avgSeparation,
    };
  }
}
