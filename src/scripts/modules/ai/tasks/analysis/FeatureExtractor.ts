/**
 * Feature Extractor
 * Extracts meaningful features from tasks for ML analysis and pattern recognition
 */

import type {
  TaskInput,
  TaskFeatures,
  TextFeatures,
  MetadataFeatures,
  ContextualFeatures,
  TemporalFeatures,
} from "./types";

/**
 * Feature Extractor Class
 */
export class FeatureExtractor {
  private urgencyKeywords: string[];
  private technicalTerms: string[];
  private actionVerbs: string[];
  private complexityIndicators: string[];
  private stats: ExtractionStats;
  private cache: Map<string, TaskFeatures>;

  constructor() {
    this.stats = {
      totalExtractions: 0,
      averageExtractionTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    this.cache = new Map();
    this.initializeFeatureSets();
  }

  /**
   * Extract comprehensive features from a task
   */
  async extractFeatures(task: TaskInput): Promise<TaskFeatures> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(task);

    // Check cache first
    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey)!;
    }

    this.stats.cacheMisses++;

    try {
      console.log(`Extracting features for task: ${task.id}`);

      // Extract different feature categories
      const textFeatures = this.extractTextFeatures(task);
      const metadataFeatures = this.extractMetadataFeatures(task);
      const contextualFeatures = this.extractContextualFeatures(task);
      const temporalFeatures = this.extractTemporalFeatures(task);

      const features: TaskFeatures = {
        textFeatures,
        metadataFeatures,
        contextualFeatures,
        temporalFeatures,
      };

      // Cache the result
      this.cache.set(cacheKey, features);

      // Update stats
      const extractionTime = Date.now() - startTime;
      this.updateStats(extractionTime);

      console.log(`Feature extraction completed in ${extractionTime}ms`);
      return features;
    } catch (error) {
      console.error("Feature extraction failed:", error);
      throw new Error(
        `Feature extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Extract text-based features
   */
  private extractTextFeatures(task: TaskInput): TextFeatures {
    const text = `${task.title} ${task.description}`.toLowerCase();
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Basic metrics
    const wordCount = words.length;
    const charCount = text.length;
    const sentenceCount = sentences.length;

    // Keyword counting
    const urgencyKeywords = this.countKeywords(text, this.urgencyKeywords);
    const complexityKeywords = this.countKeywords(
      text,
      this.complexityIndicators,
    );
    const technicalTerms = this.countKeywords(text, this.technicalTerms);
    const actionVerbs = this.countKeywords(text, this.actionVerbs);

    // Sentiment analysis (simple approach)
    const sentiment = this.analyzeSentiment(text);

    // Readability score (simplified Flesch Reading Ease)
    const readabilityScore = this.calculateReadabilityScore(text);

    return {
      wordCount,
      charCount,
      sentenceCount,
      urgencyKeywords,
      complexityKeywords,
      technicalTerms,
      actionVerbs,
      sentiment,
      readabilityScore,
    };
  }

  /**
   * Extract metadata-based features
   */
  private extractMetadataFeatures(task: TaskInput): MetadataFeatures {
    const labelCount = task.labels.length;
    const hasAssignee = !!task.assignee;
    const priorityLevel = this.mapPriorityToLevel(task.priority);
    const milestoneCount = this.extractMilestoneCount(task);
    const dependencyCount = task.dependencies?.length || 0;
    const stakeholderCount = this.extractStakeholderCount(task);

    return {
      labelCount,
      hasAssignee,
      priorityLevel,
      milestoneCount,
      dependencyCount,
      stakeholderCount,
    };
  }

  /**
   * Extract contextual features (simplified implementation)
   */
  private extractContextualFeatures(task: TaskInput): ContextualFeatures {
    // In a real implementation, these would come from project context
    // For now, we'll use reasonable defaults based on task characteristics
    const projectComplexity = this.estimateProjectComplexity(task);
    const teamSize = this.estimateTeamSize(task);
    const skillRequirementLevel = this.estimateSkillRequirements(task);
    const resourcePressure = this.estimateResourcePressure(task);
    const deadlinePressure = this.estimateDeadlinePressure(task);
    const budgetPressure = this.estimateBudgetPressure(task);

    return {
      projectComplexity,
      teamSize,
      skillRequirementLevel,
      resourcePressure,
      deadlinePressure,
      budgetPressure,
    };
  }

  /**
   * Extract temporal features
   */
  private extractTemporalFeatures(task: TaskInput): TemporalFeatures {
    const now = new Date();
    const createdDate = new Date(task.createdAt);
    const updatedDate = new Date(task.updatedAt);

    const dayOfWeek = createdDate.getDay();
    const month = createdDate.getMonth();

    // Estimate days to deadline (simplified)
    const daysToDeadline = this.estimateDaysToDeadline(task);

    // Seasonality (simple seasonal pattern)
    const seasonality = Math.sin((month / 12) * 2 * Math.PI);

    // Recent activity (time since last update)
    const recentActivity = Math.max(
      0,
      7 - (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      dayOfWeek,
      month,
      daysToDeadline,
      seasonality,
      recentActivity,
    };
  }

  /**
   * Initialize feature sets and keyword lists
   */
  private initializeFeatureSets(): void {
    // Urgency indicators
    this.urgencyKeywords = [
      "urgent",
      "asap",
      "immediate",
      "critical",
      "emergency",
      "priority",
      "high",
      "important",
      "needed",
      "required",
      "deadline",
      "blocker",
      "showstopper",
      "p0",
      "p1",
    ];

    // Technical terms
    this.technicalTerms = [
      "api",
      "database",
      "frontend",
      "backend",
      "javascript",
      "typescript",
      "react",
      "node",
      "database",
      "sql",
      "nosql",
      "cloud",
      "aws",
      "azure",
      "docker",
      "kubernetes",
      "ci",
      "cd",
      "pipeline",
      "repository",
      "git",
      "algorithm",
      "data",
      "security",
      "authentication",
      "authorization",
      "performance",
      "optimization",
      "cache",
      "memory",
      "server",
      "client",
    ];

    // Action verbs
    this.actionVerbs = [
      "implement",
      "create",
      "build",
      "develop",
      "design",
      "architect",
      "fix",
      "resolve",
      "debug",
      "test",
      "verify",
      "validate",
      "review",
      "optimize",
      "improve",
      "enhance",
      "refactor",
      "update",
      "modify",
      "deploy",
      "release",
      "document",
      "research",
      "investigate",
      "analyze",
    ];

    // Complexity indicators
    this.complexityIndicators = [
      "complex",
      "complicated",
      "difficult",
      "challenging",
      "advanced",
      "sophisticated",
      "intricate",
      "multi",
      "integration",
      "architecture",
      "system",
      "platform",
      "framework",
      "enterprise",
      "scalable",
    ];
  }

  /**
   * Helper methods
   */
  private generateCacheKey(task: TaskInput): string {
    const relevantData = {
      title: task.title,
      description: task.description,
      labels: task.labels.sort(),
      priority: task.priority,
    };
    return btoa(JSON.stringify(relevantData));
  }

  private countKeywords(text: string, keywords: string[]): number {
    let count = 0;
    const lowerText = text.toLowerCase();

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, "gi");
      const matches = lowerText.match(regex);
      if (matches) {
        count += matches.length;
      }
    }

    return count;
  }

  private analyzeSentiment(text: string): number {
    // Simple sentiment analysis using keyword matching
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "improve",
      "better",
      "success",
      "complete",
      "finished",
    ];
    const negativeWords = [
      "bad",
      "issue",
      "problem",
      "error",
      "bug",
      "broken",
      "failed",
      "urgent",
      "critical",
    ];

    const positiveCount = this.countKeywords(text, positiveWords);
    const negativeCount = this.countKeywords(text, negativeWords);

    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) return 0;

    return (positiveCount - negativeCount) / totalSentimentWords;
  }

  private calculateReadabilityScore(text: string): number {
    // Simplified Flesch Reading Ease score
    const words = text.split(/\s+/).length || 1;
    const sentences = text.split(/[.!?]+/).length || 1;
    const syllables = this.estimateSyllables(text);

    // Flesch formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    const score =
      206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private estimateSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let syllableCount = 0;

    for (const word of words) {
      // Simple syllable estimation
      const vowelGroups = word.match(/[aeiouy]+/g);
      const wordSyllables = vowelGroups ? vowelGroups.length : 1;
      syllableCount += Math.max(1, wordSyllables);
    }

    return syllableCount;
  }

  private mapPriorityToLevel(priority: string): number {
    const priorityMap: Record<string, number> = {
      low: 0,
      medium: 1,
      high: 2,
      critical: 3,
    };

    return priorityMap[priority] || 1;
  }

  private extractMilestoneCount(task: TaskInput): number {
    // Extract milestone information from labels and metadata
    const milestoneLabels = task.labels.filter(
      (label) =>
        label.toLowerCase().includes("milestone") ||
        label.toLowerCase().includes("release"),
    );
    return milestoneLabels.length;
  }

  private extractStakeholderCount(task: TaskInput): number {
    // Estimate stakeholder involvement from task characteristics
    let stakeholderCount = 1; // At least the assignee

    if (task.priority === "critical") stakeholderCount += 2;
    if (task.labels.some((label) => label.toLowerCase().includes("customer")))
      stakeholderCount += 1;
    if (task.labels.some((label) => label.toLowerCase().includes("management")))
      stakeholderCount += 1;

    return stakeholderCount;
  }

  private estimateProjectComplexity(task: TaskInput): number {
    // Estimate project complexity based on task characteristics
    let complexity = 5; // Base complexity

    // Add complexity based on technical terms
    complexity += Math.min(task.description.length / 100, 5);

    // Add complexity based on dependencies
    complexity += (task.dependencies?.length || 0) * 0.5;

    // Add complexity based on labels
    complexity += task.labels.length * 0.2;

    return Math.min(10, Math.round(complexity));
  }

  private estimateTeamSize(task: TaskInput): number {
    // Estimate team size based on project characteristics
    // This is a simplified approach - in reality, this would come from project context
    const baseSize = 5;

    // Adjust based on task complexity
    const complexityAdjustment = task.description.length / 500;

    // Adjust based on dependencies
    const dependencyAdjustment = (task.dependencies?.length || 0) * 0.3;

    return Math.round(baseSize + complexityAdjustment + dependencyAdjustment);
  }

  private estimateSkillRequirements(task: TaskInput): number {
    // Estimate required skill level based on task content
    let skillLevel = 5; // Base skill level

    // Increase for technical tasks
    const technicalCount = this.countKeywords(
      task.title + " " + task.description,
      this.technicalTerms,
    );
    skillLevel += technicalCount * 0.5;

    // Increase for complex tasks
    const complexityCount = this.countKeywords(
      task.title + " " + task.description,
      this.complexityIndicators,
    );
    skillLevel += complexityCount;

    return Math.min(10, Math.round(skillLevel));
  }

  private estimateResourcePressure(task: TaskInput): number {
    // Estimate resource pressure based on priority and dependencies
    let pressure = 3; // Base pressure

    // Adjust for priority
    const priorityPressure = this.mapPriorityToLevel(task.priority) * 1.5;
    pressure += priorityPressure;

    // Adjust for dependencies
    const dependencyPressure = (task.dependencies?.length || 0) * 0.8;
    pressure += dependencyPressure;

    return Math.min(10, Math.round(pressure));
  }

  private estimateDeadlinePressure(task: TaskInput): number {
    // Estimate deadline pressure (simplified)
    let pressure = 3; // Base pressure

    // Increase for urgent tasks
    if (task.priority === "critical") pressure += 4;
    else if (task.priority === "high") pressure += 2;

    // Check for deadline indicators in labels
    if (
      task.labels.some(
        (label) =>
          label.toLowerCase().includes("deadline") ||
          label.toLowerCase().includes("urgent"),
      )
    ) {
      pressure += 3;
    }

    return Math.min(10, pressure);
  }

  private estimateBudgetPressure(task: TaskInput): number {
    // Estimate budget pressure (simplified)
    let pressure = 2; // Base pressure

    // Increase for complex tasks
    if (task.description.length > 500) pressure += 2;
    if (task.dependencies && task.dependencies.length > 3) pressure += 2;

    // Adjust for priority
    if (task.priority === "critical") pressure += 2;

    return Math.min(10, pressure);
  }

  private estimateDaysToDeadline(task: TaskInput): number {
    // Estimate days to deadline based on task characteristics
    let days = 30; // Default 30 days

    // Adjust based on priority
    if (task.priority === "critical") days = 3;
    else if (task.priority === "high") days = 7;
    else if (task.priority === "medium") days = 14;

    // Adjust based on urgency indicators
    const urgencyCount = this.countKeywords(
      task.title + " " + task.description,
      this.urgencyKeywords,
    );
    days -= urgencyCount * 2; // Reduce days for urgent tasks

    return Math.max(1, days);
  }

  private updateStats(extractionTime: number): void {
    this.stats.totalExtractions++;
    this.stats.averageExtractionTime =
      (this.stats.averageExtractionTime * (this.stats.totalExtractions - 1) +
        extractionTime) /
      this.stats.totalExtractions;
  }

  /**
   * Get extraction statistics
   */
  getStats(): ExtractionStats {
    return { ...this.stats };
  }

  /**
   * Clear cache and reset stats
   */
  clearCache(): void {
    this.cache.clear();
    this.stats = {
      totalExtractions: 0,
      averageExtractionTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * Destroy feature extractor
   */
  destroy(): void {
    this.clearCache();
    this.urgencyKeywords = [];
    this.technicalTerms = [];
    this.actionVerbs = [];
    this.complexityIndicators = [];
  }
}

/**
 * Statistics interface
 */
interface ExtractionStats {
  totalExtractions: number;
  averageExtractionTime: number;
  cacheHits: number;
  cacheMisses: number;
}
