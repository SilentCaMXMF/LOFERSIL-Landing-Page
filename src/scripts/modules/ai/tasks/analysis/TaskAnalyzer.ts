/**
 * Task Analyzer
 * Comprehensive task analysis engine that classifies, extracts features, and provides insights
 */

import { GeminiService } from "../../gemini/GeminiService";
import type {
  TaskInput,
  TaskAnalysis,
  AnalysisContext,
  TaskClassification,
  DependencyAnalysis,
  RequirementAnalysis,
  RiskAnalysis,
  TaskFeatures,
  AnalysisRecommendation,
} from "./types";
import { TaskClassifier } from "./TaskClassifier";
import { FeatureExtractor } from "./FeatureExtractor";
import { DependencyAnalyzer } from "./DependencyAnalyzer";
import { RequirementAnalyzer } from "./RequirementAnalyzer";
import { RiskAnalyzer } from "./RiskAnalyzer";

/**
 * Task Analyzer Class
 */
export class TaskAnalyzer {
  private geminiService: GeminiService;
  private classifier: TaskClassifier;
  private featureExtractor: FeatureExtractor;
  private dependencyAnalyzer: DependencyAnalyzer;
  private requirementAnalyzer: RequirementAnalyzer;
  private riskAnalyzer: RiskAnalyzer;

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
    this.classifier = new TaskClassifier(geminiService);
    this.featureExtractor = new FeatureExtractor();
    this.dependencyAnalyzer = new DependencyAnalyzer();
    this.requirementAnalyzer = new RequirementAnalyzer(geminiService);
    this.riskAnalyzer = new RiskAnalyzer(geminiService);
  }

  /**
   * Comprehensive task analysis
   */
  async analyzeTask(
    task: TaskInput,
    context: AnalysisContext,
  ): Promise<TaskAnalysis> {
    const startTime = Date.now();

    try {
      console.log(`Starting analysis for task: ${task.id}`);

      // Extract features first (used by other analyzers)
      const features = await this.featureExtractor.extractFeatures(task);

      // Classify the task
      const classification = await this.classifier.classifyTask(
        task,
        features,
        context,
      );

      // Analyze dependencies
      const dependencies = await this.dependencyAnalyzer.analyzeDependencies(
        task,
        context,
      );

      // Analyze requirements
      const requirements = await this.requirementAnalyzer.analyzeRequirements(
        task,
        features,
        context,
      );

      // Analyze risks
      const risks = await this.riskAnalyzer.analyzeRisks(
        task,
        classification,
        dependencies,
        context,
      );

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        task,
        classification,
        dependencies,
        requirements,
        risks,
        context,
      );

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(
        classification.confidence,
        dependencies.impactScore,
        risks.overallRisk,
        recommendations.length,
      );

      const processingTime = Date.now() - startTime;

      const analysis: TaskAnalysis = {
        task,
        classification,
        dependencies,
        requirements,
        risks,
        recommendations,
        confidence,
        processingTime,
        timestamp: new Date(),
      };

      console.log(
        `Task analysis completed in ${processingTime}ms with confidence ${confidence.toFixed(2)}`,
      );
      return analysis;
    } catch (error) {
      console.error("Task analysis failed:", error);
      throw new Error(
        `Task analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Batch analysis for multiple tasks
   */
  async analyzeTasks(
    tasks: TaskInput[],
    context: AnalysisContext,
  ): Promise<TaskAnalysis[]> {
    console.log(`Starting batch analysis for ${tasks.length} tasks`);

    const results: TaskAnalysis[] = [];
    const batchSize = 5; // Process in batches to avoid overwhelming the AI service

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tasks.length / batchSize)}`,
      );

      const batchPromises = batch.map((task) =>
        this.analyzeTask(task, context).catch((error) => {
          console.error(`Failed to analyze task ${task.id}:`, error);
          return null;
        }),
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(
        ...batchResults.filter(
          (result): result is TaskAnalysis => result !== null,
        ),
      );

      // Add small delay between batches to respect rate limits
      if (i + batchSize < tasks.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `Batch analysis completed. Successfully analyzed ${results.length}/${tasks.length} tasks`,
    );
    return results;
  }

  /**
   * Update task analysis based on new information
   */
  async updateAnalysis(
    taskId: string,
    updates: Partial<TaskInput>,
    currentAnalysis: TaskAnalysis,
    context: AnalysisContext,
  ): Promise<TaskAnalysis> {
    console.log(`Updating analysis for task: ${taskId}`);

    const updatedTask: TaskInput = {
      ...currentAnalysis.task,
      ...updates,
      updatedAt: new Date(),
    };

    // Re-run analysis with updated task
    return this.analyzeTask(updatedTask, context);
  }

  /**
   * Get task similarity score
   */
  async getSimilarityScore(
    task1: TaskInput,
    task2: TaskInput,
  ): Promise<number> {
    const features1 = await this.featureExtractor.extractFeatures(task1);
    const features2 = await this.featureExtractor.extractFeatures(task2);

    return this.calculateFeatureSimilarity(features1, features2);
  }

  /**
   * Find similar tasks
   */
  async findSimilarTasks(
    targetTask: TaskInput,
    candidateTasks: TaskInput[],
    threshold: number = 0.7,
  ): Promise<{ task: TaskInput; similarity: number }[]> {
    const targetFeatures =
      await this.featureExtractor.extractFeatures(targetTask);
    const similarities: { task: TaskInput; similarity: number }[] = [];

    for (const candidate of candidateTasks) {
      if (candidate.id === targetTask.id) continue;

      const candidateFeatures =
        await this.featureExtractor.extractFeatures(candidate);
      const similarity = this.calculateFeatureSimilarity(
        targetFeatures,
        candidateFeatures,
      );

      if (similarity >= threshold) {
        similarities.push({ task: candidate, similarity });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Generate comprehensive recommendations
   */
  private async generateRecommendations(
    task: TaskInput,
    classification: TaskClassification,
    dependencies: DependencyAnalysis,
    requirements: RequirementAnalysis,
    risks: RiskAnalysis,
    context: AnalysisContext,
  ): Promise<AnalysisRecommendation[]> {
    const recommendations: AnalysisRecommendation[] = [];

    // Classification recommendations
    if (classification.confidence < 0.8) {
      recommendations.push({
        id: `clarification-${task.id}`,
        type: "classification" as const,
        title: "Improve Task Description",
        description:
          "Task classification confidence is low. Consider adding more details to improve accuracy.",
        priority: "medium",
        effort: "low",
        impact: 70,
        confidence: 0.9,
        reasoning: `Classification confidence is ${classification.confidence.toFixed(2)}, below the 0.8 threshold`,
        dependencies: [],
        benefits: [
          "Improved task categorization",
          "Better prioritization",
          "Enhanced resource allocation",
        ],
      });
    }

    // Dependency recommendations
    if (dependencies.impactScore > 0.8) {
      recommendations.push({
        id: `dependency-focus-${task.id}`,
        type: "dependency" as const,
        title: "Focus on Dependencies",
        description:
          "This task has high dependency impact. Consider addressing dependencies first.",
        priority: "high",
        effort: "medium",
        impact: 85,
        confidence: 0.8,
        reasoning: `Dependency impact score is ${dependencies.impactScore.toFixed(2)}`,
        dependencies: dependencies.blockers.map((d) => d.taskId),
        benefits: [
          "Reduced bottlenecks",
          "Smoother execution",
          "Lower risk of delays",
        ],
      });
    }

    // Risk mitigation recommendations
    if (risks.overallRisk > 70) {
      recommendations.push({
        id: `risk-mitigation-${task.id}`,
        type: "risk" as const,
        title: "Implement Risk Mitigation",
        description:
          "This task has high risk factors. Implement mitigation strategies before starting.",
        priority: "high",
        effort: "medium",
        impact: 90,
        confidence: 0.85,
        reasoning: `Overall risk score is ${risks.overallRisk.toFixed(0)}`,
        dependencies: [],
        benefits: [
          "Reduced failure probability",
          "Better outcome predictability",
          "Resource protection",
        ],
      });
    }

    // Requirements gap recommendations
    if (requirements.gaps.length > 0) {
      recommendations.push({
        id: `requirements-gap-${task.id}`,
        type: "classification" as const,
        title: "Address Requirements Gaps",
        description: `${requirements.gaps.length} requirement gaps identified. Clarify requirements before implementation.`,
        priority: "medium",
        effort: "medium",
        impact: 75,
        confidence: 0.8,
        reasoning: `Found ${requirements.gaps.length} requirement gaps`,
        dependencies: [],
        benefits: [
          "Clearer scope",
          "Reduced rework",
          "Better stakeholder alignment",
        ],
      });
    }

    // Complexity-based recommendations
    if (classification.complexity === "very_complex") {
      recommendations.push({
        id: `complexity-breakdown-${task.id}`,
        type: "optimization" as const,
        title: "Break Down Complex Task",
        description:
          "This task is very complex. Consider breaking it down into smaller, manageable subtasks.",
        priority: "high",
        effort: "high",
        impact: 85,
        confidence: 0.9,
        reasoning: "Task classified as very complex",
        dependencies: [],
        benefits: [
          "Easier estimation",
          "Better progress tracking",
          "Reduced cognitive load",
        ],
      });
    }

    return recommendations;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    classificationConfidence: number,
    dependencyImpact: number,
    riskScore: number,
    recommendationCount: number,
  ): number {
    // Weighted confidence calculation
    const weights = {
      classification: 0.4,
      dependency: 0.2,
      risk: 0.2,
      recommendations: 0.2,
    };

    const recommendationScore = Math.min(recommendationCount / 5, 1); // Normalize to 0-1
    const riskConfidence = 1 - riskScore / 100; // Convert risk to confidence

    const overallConfidence =
      classificationConfidence * weights.classification +
      (1 - dependencyImpact) * weights.dependency +
      riskConfidence * weights.risk +
      recommendationScore * weights.recommendations;

    return Math.round(overallConfidence * 100) / 100;
  }

  /**
   * Calculate similarity between two feature sets
   */
  private calculateFeatureSimilarity(
    features1: TaskFeatures,
    features2: TaskFeatures,
  ): number {
    // Simple similarity calculation based on text and metadata features
    // In a production system, this would use more sophisticated ML algorithms

    const textSimilarity = this.calculateTextSimilarity(
      features1.textFeatures,
      features2.textFeatures,
    );

    const metadataSimilarity = this.calculateMetadataSimilarity(
      features1.metadataFeatures,
      features2.metadataFeatures,
    );

    const contextualSimilarity = this.calculateContextualSimilarity(
      features1.contextualFeatures,
      features2.contextualFeatures,
    );

    // Weighted average
    return (
      textSimilarity * 0.5 +
      metadataSimilarity * 0.3 +
      contextualSimilarity * 0.2
    );
  }

  /**
   * Calculate text feature similarity
   */
  private calculateTextSimilarity(
    features1: TaskFeatures["textFeatures"],
    features2: TaskFeatures["textFeatures"],
  ): number {
    // Normalize features
    const normalize = (value: number, max: number) => value / max;

    const wordSimilarity =
      1 -
      Math.abs(
        normalize(features1.wordCount, 1000) -
          normalize(features2.wordCount, 1000),
      );
    const urgencySimilarity =
      1 - Math.abs(features1.urgencyKeywords - features2.urgencyKeywords);
    const technicalSimilarity =
      1 -
      Math.abs(
        normalize(features1.technicalTerms, 50) -
          normalize(features2.technicalTerms, 50),
      );
    const sentimentSimilarity =
      1 - Math.abs(features1.sentiment - features2.sentiment);

    return (
      (wordSimilarity +
        urgencySimilarity +
        technicalSimilarity +
        sentimentSimilarity) /
      4
    );
  }

  /**
   * Calculate metadata feature similarity
   */
  private calculateMetadataSimilarity(
    features1: TaskFeatures["metadataFeatures"],
    features2: TaskFeatures["metadataFeatures"],
  ): number {
    let similarity = 0;
    let factors = 0;

    // Priority level similarity
    similarity +=
      1 - Math.abs(features1.priorityLevel - features2.priorityLevel) / 3;
    factors++;

    // Label count similarity
    const maxLabels = Math.max(features1.labelCount, features2.labelCount, 1);
    similarity +=
      1 - Math.abs(features1.labelCount - features2.labelCount) / maxLabels;
    factors++;

    // Dependency count similarity
    const maxDeps = Math.max(
      features1.dependencyCount,
      features2.dependencyCount,
      1,
    );
    similarity +=
      1 -
      Math.abs(features1.dependencyCount - features2.dependencyCount) / maxDeps;
    factors++;

    // Has assignee similarity
    similarity += features1.hasAssignee === features2.hasAssignee ? 1 : 0;
    factors++;

    return similarity / factors;
  }

  /**
   * Calculate contextual feature similarity
   */
  private calculateContextualSimilarity(
    features1: TaskFeatures["contextualFeatures"],
    features2: TaskFeatures["contextualFeatures"],
  ): number {
    let similarity = 0;
    let factors = 0;

    // Team size similarity
    const maxTeamSize = Math.max(features1.teamSize, features2.teamSize, 1);
    similarity +=
      1 - Math.abs(features1.teamSize - features2.teamSize) / maxTeamSize;
    factors++;

    // Skill requirement similarity
    similarity +=
      1 -
      Math.abs(
        features1.skillRequirementLevel - features2.skillRequirementLevel,
      ) /
        10;
    factors++;

    // Deadline pressure similarity
    similarity +=
      1 -
      Math.abs(features1.deadlinePressure - features2.deadlinePressure) / 10;
    factors++;

    return similarity / factors;
  }

  /**
   * Get analyzer statistics
   */
  getStats() {
    return {
      classifier: this.classifier.getStats(),
      featureExtractor: this.featureExtractor.getStats(),
      dependencyAnalyzer: this.dependencyAnalyzer.getStats(),
      requirementAnalyzer: this.requirementAnalyzer.getStats(),
      riskAnalyzer: this.riskAnalyzer.getStats(),
    };
  }

  /**
   * Clear caches and reset state
   */
  async clearCache(): Promise<void> {
    await this.classifier.clearCache();
    this.featureExtractor.clearCache();
    this.dependencyAnalyzer.clearCache();
    this.requirementAnalyzer.clearCache();
    this.riskAnalyzer.clearCache();
  }

  /**
   * Destroy the analyzer and cleanup resources
   */
  destroy(): void {
    this.classifier.destroy();
    this.featureExtractor.destroy();
    this.dependencyAnalyzer.destroy();
    this.requirementAnalyzer.destroy();
    this.riskAnalyzer.destroy();
  }
}
