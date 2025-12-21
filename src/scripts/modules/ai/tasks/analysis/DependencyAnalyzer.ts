/**
 * Dependency Analyzer
 * Analyzes task dependencies, relationships, and impact
 */

import type {
  TaskInput,
  AnalysisContext,
  DependencyAnalysis,
  Dependency,
} from "./types";
import { DependencyType } from "./types";

/**
 * Dependency Analyzer Class
 */
export class DependencyAnalyzer {
  private stats: DependencyStats;
  private cache: Map<string, DependencyAnalysis>;

  constructor() {
    this.stats = {
      totalAnalyses: 0,
      averageAnalysisTime: 0,
      dependenciesFound: 0,
      circularDependencies: 0,
    };
    this.cache = new Map();
  }

  /**
   * Analyze dependencies for a task
   */
  async analyzeDependencies(
    task: TaskInput,
    context: AnalysisContext,
  ): Promise<DependencyAnalysis> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(task, context);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      console.log(`Analyzing dependencies for task: ${task.id}`);

      // Extract dependencies from different sources
      const blockers = await this.extractBlockers(task, context);
      const dependents = await this.extractDependents(task, context);
      const circularDependencies = await this.detectCircularDependencies(
        task,
        blockers,
        dependents,
      );
      const externalDependencies = await this.extractExternalDependencies(
        task,
        context,
      );

      // Calculate impact score
      const impactScore = this.calculateImpactScore(
        blockers,
        dependents,
        circularDependencies,
        task,
      );

      // Determine if on critical path
      const criticalPath = this.isOnCriticalPath(
        task,
        blockers,
        dependents,
        context,
      );

      const analysis: DependencyAnalysis = {
        blockers,
        dependents,
        circularDependencies,
        externalDependencies,
        impactScore,
        criticalPath,
      };

      // Update stats
      const analysisTime = Date.now() - startTime;
      this.updateStats(
        analysisTime,
        blockers.length + dependents.length,
        circularDependencies.length,
      );

      // Cache the result
      this.cache.set(cacheKey, analysis);

      console.log(`Dependency analysis completed in ${analysisTime}ms`);
      return analysis;
    } catch (error) {
      console.error("Dependency analysis failed:", error);
      throw new Error(
        `Dependency analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Extract tasks that block this task
   */
  private async extractBlockers(
    task: TaskInput,
    context: AnalysisContext,
  ): Promise<Dependency[]> {
    const blockers: Dependency[] = [];

    // Extract from explicit dependencies
    if (task.dependencies) {
      for (const depId of task.dependencies) {
        blockers.push({
          taskId: depId,
          type: DependencyType.REQUIRES,
          strength: 0.8, // High strength for explicit dependencies
          description: `Task ${task.id} requires completion of ${depId}`,
          resolved: false,
        });
      }
    }

    // Extract from task description
    const descriptionBlockers = this.extractDependenciesFromText(
      task.description,
      DependencyType.REQUIRES,
    );
    blockers.push(...descriptionBlockers);

    // Extract from labels
    const labelBlockers = this.extractDependenciesFromLabels(task.labels);
    blockers.push(...labelBlockers);

    // Extract from project context constraints
    const contextBlockers = this.extractDependenciesFromContext(task, context);
    blockers.push(...contextBlockers);

    return blockers;
  }

  /**
   * Extract tasks that depend on this task
   */
  private async extractDependents(
    task: TaskInput,
    context: AnalysisContext,
  ): Promise<Dependency[]> {
    const dependents: Dependency[] = [];

    // Find tasks that explicitly depend on this task
    // In a real implementation, this would query the task database
    const allTasks = context.history.completedTasks;

    for (const otherTask of allTasks) {
      if (otherTask.id === task.id) continue;

      // Check if other task has dependency on this task
      if (otherTask.metadata?.dependencies?.includes(task.id)) {
        dependents.push({
          taskId: otherTask.id,
          type: DependencyType.BLOCKS,
          strength: 0.7,
          description: `Task ${task.id} blocks completion of ${otherTask.id}`,
          resolved: false,
        });
      }
    }

    // Find implied dependencies from task relationships
    const impliedDependents = this.findImpliedDependents(task, allTasks);
    dependents.push(...impliedDependents);

    return dependents;
  }

  /**
   * Detect circular dependencies
   */
  private async detectCircularDependencies(
    task: TaskInput,
    blockers: Dependency[],
    dependents: Dependency[],
  ): Promise<Dependency[]> {
    const circular: Dependency[] = [];

    // Check each blocker to see if it depends on the current task
    for (const blocker of blockers) {
      // In a real implementation, this would check the blocker's dependencies
      // For now, we'll use a simplified approach

      // If blocker and dependent names suggest circular relationship
      if (this.suggestsCircularDependency(task, blocker)) {
        circular.push({
          taskId: blocker.taskId,
          type: DependencyType.CONFLICTS,
          strength: 1.0,
          description: `Circular dependency detected between ${task.id} and ${blocker.taskId}`,
          resolved: false,
        });
      }
    }

    return circular;
  }

  /**
   * Extract external dependencies
   */
  private async extractExternalDependencies(
    task: TaskInput,
    context: AnalysisContext,
  ): Promise<Dependency[]> {
    const external: Dependency[] = [];

    // Look for external system dependencies in description
    const text = (task.title + " " + task.description).toLowerCase();

    // Common external dependencies
    const externalPatterns = [
      { pattern: /api.*endpoint/gi, type: "API" },
      { pattern: /third.*party/gi, type: "Third Party" },
      { pattern: /external.*service/gi, type: "External Service" },
      { pattern: /vendor/gi, type: "Vendor" },
      { pattern: /database.*migration/gi, type: "Database" },
      { pattern: /infrastructure/gi, type: "Infrastructure" },
    ];

    for (const { pattern, type } of externalPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        external.push({
          taskId: `external-${type}`,
          type: DependencyType.REQUIRES,
          strength: 0.6,
          description: `External dependency on ${type} identified in task description`,
          resolved: false,
        });
      }
    }

    // Add project-specific external dependencies
    const projectExternals = context.project.technology.filter(
      (tech) => !this.isInternalTechnology(tech),
    );

    for (const tech of projectExternals) {
      if (text.includes(tech.toLowerCase())) {
        external.push({
          taskId: `external-${tech}`,
          type: DependencyType.REQUIRES,
          strength: 0.5,
          description: `External dependency on ${tech} technology`,
          resolved: false,
        });
      }
    }

    return external;
  }

  /**
   * Helper methods
   */
  private generateCacheKey(task: TaskInput, context: AnalysisContext): string {
    const relevantData = {
      taskId: task.id,
      dependencies: task.dependencies?.sort() || [],
      labels: task.labels.sort(),
      contextVersion: this.getContextVersion(context),
    };
    return btoa(JSON.stringify(relevantData));
  }

  private extractDependenciesFromText(
    text: string,
    type: DependencyType,
  ): Dependency[] {
    const dependencies: Dependency[] = [];
    const lowerText = text.toLowerCase();

    // Dependency patterns
    const patterns = [
      /depends on\s+([a-z0-9-_]+)/gi,
      /requires\s+([a-z0-9-_]+)/gi,
      /blocked by\s+([a-z0-9-_]+)/gi,
      /needs\s+([a-z0-9-_]+)/gi,
      /waiting for\s+([a-z0-9-_]+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = Array.from(lowerText.matchAll(pattern));

      for (const match of matches) {
        if (match[1]) {
          dependencies.push({
            taskId: match[1],
            type,
            strength: 0.6,
            description: `Dependency extracted from text: "${match[0]}"`,
            resolved: false,
          });
        }
      }
    }

    return dependencies;
  }

  private extractDependenciesFromLabels(labels: string[]): Dependency[] {
    const dependencies: Dependency[] = [];

    for (const label of labels) {
      // Look for dependency indicators in labels
      if (
        label.toLowerCase().startsWith("dep:") ||
        label.toLowerCase().startsWith("dependency:")
      ) {
        const depId = label.split(":")[1];
        if (depId) {
          dependencies.push({
            taskId: depId,
            type: DependencyType.REQUIRES,
            strength: 0.7,
            description: `Dependency from label: ${label}`,
            resolved: false,
          });
        }
      }

      // Look for blocked labels
      if (label.toLowerCase().includes("blocked")) {
        dependencies.push({
          taskId: "unknown-blocker",
          type: DependencyType.BLOCKS,
          strength: 0.5,
          description: `Task blocked (from label: ${label})`,
          resolved: false,
        });
      }
    }

    return dependencies;
  }

  private extractDependenciesFromContext(
    task: TaskInput,
    context: AnalysisContext,
  ): Dependency[] {
    const dependencies: Dependency[] = [];

    // Check constraint dependencies
    for (const constraint of context.constraints.dependencies) {
      if (constraint.taskId === task.id) {
        for (const depId of constraint.dependsOn) {
          dependencies.push({
            taskId: depId,
            type: DependencyType.REQUIRES,
            strength: 0.8,
            description: `Contextual dependency: ${constraint.impact}`,
            resolved: false,
          });
        }
      }
    }

    return dependencies;
  }

  private findImpliedDependents(
    task: TaskInput,
    allTasks: TaskInput[],
  ): Dependency[] {
    const dependents: Dependency[] = [];

    for (const otherTask of allTasks) {
      // Check if tasks have related keywords suggesting dependency
      const similarity = this.calculateTaskSimilarity(task, otherTask);

      if (similarity > 0.7) {
        dependents.push({
          taskId: otherTask.id,
          type: DependencyType.RELATED,
          strength: similarity,
          description: `Related task with similarity ${similarity.toFixed(2)}`,
          resolved: false,
        });
      }
    }

    return dependents;
  }

  private calculateTaskSimilarity(task1: TaskInput, task2: TaskInput): number {
    // Simple similarity calculation based on common keywords
    const words1 = new Set(
      (task1.title + " " + task1.description).toLowerCase().split(/\s+/),
    );
    const words2 = new Set(
      (task2.title + " " + task2.description).toLowerCase().split(/\s+/),
    );

    const intersection = new Set(
      [...words1].filter((word) => words2.has(word)),
    );
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private suggestsCircularDependency(
    task: TaskInput,
    blocker: Dependency,
  ): boolean {
    // Simplified circular dependency detection
    // In a real implementation, this would be more sophisticated
    const taskWords = (task.title + " " + task.description).toLowerCase();
    const blockerId = blocker.taskId.toLowerCase();

    // Check if task description suggests it should enable the blocker
    const enablingWords = [
      "enable",
      "unblock",
      "allow",
      "support",
      "facilitate",
    ];

    return (
      enablingWords.some((word) => taskWords.includes(word)) &&
      taskWords.includes(blockerId)
    );
  }

  private isInternalTechnology(tech: string): boolean {
    const internalTechs = [
      "javascript",
      "typescript",
      "react",
      "node",
      "css",
      "html",
      "git",
      "docker",
      "kubernetes",
    ];
    return internalTechs.some((internal) =>
      tech.toLowerCase().includes(internal),
    );
  }

  private calculateImpactScore(
    blockers: Dependency[],
    dependents: Dependency[],
    circularDependencies: Dependency[],
    task: TaskInput,
  ): number {
    let impact = 0;

    // Impact from blockers (reduces impact)
    impact -= blockers.reduce((sum, dep) => sum + dep.strength, 0) * 0.3;

    // Impact from dependents (increases impact)
    impact += dependents.reduce((sum, dep) => sum + dep.strength, 0) * 0.4;

    // Impact from circular dependencies (major impact)
    impact += circularDependencies.length * 0.5;

    // Priority adjustment
    const priorityMultiplier = this.getPriorityMultiplier(task.priority);
    impact *= priorityMultiplier;

    // Normalize to 0-1 scale
    return Math.max(0, Math.min(1, impact));
  }

  private getPriorityMultiplier(priority: string): number {
    const multipliers: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.5,
      critical: 2.0,
    };
    return multipliers[priority] || 1.0;
  }

  private isOnCriticalPath(
    task: TaskInput,
    blockers: Dependency[],
    dependents: Dependency[],
    context: AnalysisContext,
  ): boolean {
    // Simplified critical path detection
    // In a real implementation, this would use project scheduling algorithms

    // High number of dependents suggests critical path
    if (dependents.length >= 3) return true;

    // High priority tasks are likely on critical path
    if (task.priority === "critical") return true;

    // Tasks with external dependencies might be on critical path
    const hasExternalDeps = blockers.some((dep) =>
      dep.taskId.startsWith("external-"),
    );
    if (hasExternalDeps) return true;

    // Check if task is part of critical milestones
    const isCriticalMilestone = context.constraints.time.milestones.some(
      (milestone) =>
        milestone.deliverables.some(
          (deliverable) =>
            task.title.toLowerCase().includes(deliverable.toLowerCase()) ||
            task.description.toLowerCase().includes(deliverable.toLowerCase()),
        ),
    );

    return isCriticalMilestone;
  }

  private getContextVersion(context: AnalysisContext): string {
    // Create a simple version identifier for context
    const keyData = {
      projectDeadlines: context.constraints.time.deadlines.length,
      teamSize: context.team.members.length,
      constraintCount: context.constraints.dependencies.length,
    };
    return btoa(JSON.stringify(keyData));
  }

  private updateStats(
    analysisTime: number,
    dependenciesFound: number,
    circularDependencies: number,
  ): void {
    this.stats.totalAnalyses++;
    this.stats.averageAnalysisTime =
      (this.stats.averageAnalysisTime * (this.stats.totalAnalyses - 1) +
        analysisTime) /
      this.stats.totalAnalyses;
    this.stats.dependenciesFound += dependenciesFound;
    this.stats.circularDependencies += circularDependencies;
  }

  /**
   * Get analyzer statistics
   */
  getStats(): DependencyStats {
    return { ...this.stats };
  }

  /**
   * Clear cache and reset stats
   */
  clearCache(): void {
    this.cache.clear();
    this.stats = {
      totalAnalyses: 0,
      averageAnalysisTime: 0,
      dependenciesFound: 0,
      circularDependencies: 0,
    };
  }

  /**
   * Destroy analyzer
   */
  destroy(): void {
    this.clearCache();
  }
}

/**
 * Statistics interface
 */
interface DependencyStats {
  totalAnalyses: number;
  averageAnalysisTime: number;
  dependenciesFound: number;
  circularDependencies: number;
}
