/**
 * Recommendation Engine
 * AI-powered task recommendation system with multiple strategies and algorithms
 */

import { GeminiService } from "../../gemini/GeminiService";
import type { TaskInfo } from "../../../TaskManager";
import type {
  RecommendationRequest,
  RecommendationResponse,
  TaskRecommendation,
  RecommendationContext,
  ResponseMetadata,
  RecommendationInsight,
  AlternativeRecommendation,
} from "./types";
import {
  RecommendationStrategy,
  RecommendationType,
  InsightType,
} from "./types";
import { BalancedRecommender } from "./strategies/BalancedRecommender";
import {
  UrgencyRecommender,
  SkillBasedRecommender,
  WorkloadBalancedRecommender,
  DeadlineDrivenRecommender,
  QualityFocusedRecommender,
  StrategicRecommender,
  ModelManager,
  ContextAnalyzer,
} from "./strategies/PlaceholderRecommenders";

/**
 * Main Recommendation Engine Class
 */
export class RecommendationEngine {
  private geminiService: GeminiService;
  private modelManager: ModelManager;
  private contextAnalyzer: ContextAnalyzer;
  private recommenders: Map<RecommendationStrategy, any>;
  private cache: Map<string, RecommendationResponse>;
  private stats: EngineStats;

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
    this.modelManager = new ModelManager();
    this.contextAnalyzer = new ContextAnalyzer(geminiService);
    this.cache = new Map();
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      strategyUsage: new Map(),
    };

    this.initializeRecommenders();
  }

  /**
   * Generate task recommendations based on context and strategy
   */
  async generateRecommendations(
    request: RecommendationRequest,
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      console.log(`Generating recommendations for request: ${requestId}`);

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      if (this.cache.has(cacheKey)) {
        const cachedResponse = this.cache.get(cacheKey)!;
        this.stats.cacheHits++;
        console.log(`Cache hit for request: ${requestId}`);
        return cachedResponse;
      }

      // Analyze context if not provided
      const enrichedContext = await this.contextAnalyzer.analyzeContext(
        request.context,
      );

      // Select and run recommendation strategy
      const strategy = request.strategy || RecommendationStrategy.BALANCED;
      const recommender = this.recommenders.get(strategy);

      if (!recommender) {
        throw new Error(`Unknown recommendation strategy: ${strategy}`);
      }

      // Generate primary recommendations
      const recommendations = await recommender.generateRecommendations(
        enrichedContext,
        request.limit || 10,
        request.filters,
      );

      // Generate alternative strategies
      const alternatives = await this.generateAlternatives(
        enrichedContext,
        strategy,
        request.limit,
      );

      // Generate insights
      const insights = await this.generateInsights(
        enrichedContext,
        recommendations,
      );

      // Create response
      const response: RecommendationResponse = {
        recommendations,
        strategy,
        context: enrichedContext,
        metadata: {
          requestId,
          generatedAt: new Date(),
          processingTime: Date.now() - startTime,
          algorithm: recommender.constructor.name,
          confidence: this.calculateOverallConfidence(recommendations),
          cacheHit: false,
          sourceCount: enrichedContext.tasks.pending.length,
          filteredCount: recommendations.length,
        },
        alternatives,
        insights,
      };

      // Cache the response
      this.cache.set(cacheKey, response);

      // Update stats
      this.updateStats(Date.now() - startTime, strategy);

      console.log(
        `Recommendations generated in ${response.metadata.processingTime}ms`,
      );
      return response;
    } catch (error) {
      console.error("Recommendation generation failed:", error);
      throw new Error(
        `Recommendation generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Batch generate recommendations for multiple users
   */
  async generateBatchRecommendations(
    requests: RecommendationRequest[],
  ): Promise<RecommendationResponse[]> {
    console.log(
      `Generating batch recommendations for ${requests.length} requests`,
    );

    const results: RecommendationResponse[] = [];
    const batchSize = 3; // Process in batches to respect rate limits

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      const batchPromises = batch.map((request) =>
        this.generateRecommendations(request).catch((error) => {
          console.error(`Failed to generate recommendations for user:`, error);
          return this.createErrorResponse(error, request);
        }),
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < requests.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Get personalized recommendations for a specific task
   */
  async getTaskSpecificRecommendations(
    taskId: string,
    context: RecommendationContext,
    limit: number = 5,
  ): Promise<TaskRecommendation[]> {
    try {
      // Find the task in context
      const task = context.tasks.pending.find((t) => t.id === taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Create focused request
      const request: RecommendationRequest = {
        context,
        strategy: RecommendationStrategy.BALANCED,
        limit,
        filters: {
          assignees: [context.user.id],
        },
      };

      // Generate recommendations
      const response = await this.generateRecommendations(request);

      // Filter to task-specific recommendations
      return response.recommendations.filter((rec) => rec.task.id === taskId);
    } catch (error) {
      console.error("Task-specific recommendations failed:", error);
      throw new Error(
        `Task-specific recommendations failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update recommendation model based on feedback
   */
  async updateRecommendationFeedback(
    recommendationId: string,
    feedback: "accepted" | "rejected" | "ignored",
    rating?: number,
    comment?: string,
  ): Promise<void> {
    try {
      console.log(`Updating feedback for recommendation: ${recommendationId}`);

      // Find the recommendation in cache
      let foundRecommendation = false;
      for (const response of this.cache.values()) {
        const recommendation = response.recommendations.find(
          (r) => r.id === recommendationId,
        );
        if (recommendation) {
          // Update feedback logic would go here
          // In a real system, this would train the models
          foundRecommendation = true;
          break;
        }
      }

      if (!foundRecommendation) {
        console.warn(
          `Recommendation not found for feedback: ${recommendationId}`,
        );
      }

      // Update model manager with feedback
      await this.modelManager.recordFeedback(
        recommendationId,
        feedback,
        rating,
        comment,
      );
    } catch (error) {
      console.error("Feedback update failed:", error);
      throw new Error(
        `Feedback update failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get recommendation explanations
   */
  async getRecommendationExplanation(
    recommendationId: string,
  ): Promise<string> {
    try {
      // Find the recommendation
      let recommendation: TaskRecommendation | null = null;
      let strategy: RecommendationStrategy | null = null;

      for (const response of this.cache.values()) {
        const found = response.recommendations.find(
          (r) => r.id === recommendationId,
        );
        if (found) {
          recommendation = found;
          strategy = response.strategy;
          break;
        }
      }

      if (!recommendation) {
        throw new Error(`Recommendation not found: ${recommendationId}`);
      }

      // Generate detailed explanation
      const prompt = `
Recommendation ID: ${recommendationId}
Task: ${recommendation.task.title}
Strategy: ${strategy}
Priority: ${recommendation.priority}
Confidence: ${recommendation.confidence}

Reasoning: ${recommendation.reasoning.primary}

Explain in detail why this task was recommended to the user. Focus on:
1. Why this specific task
2. How it aligns with user skills and preferences
3. How it benefits the project and team
4. Why now is the right time
5. What makes it better than alternatives

Provide a clear, actionable explanation that helps the user understand the value of this recommendation.
      `;

      const explanation = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.7,
      });

      return explanation;
    } catch (error) {
      console.error("Explanation generation failed:", error);
      return "Unable to generate explanation at this time.";
    }
  }

  /**
   * Get recommendation analytics
   */
  getAnalytics(): EngineAnalytics {
    return {
      stats: { ...this.stats },
      modelStats: this.modelManager.getStats(),
      contextStats: this.contextAnalyzer.getStats(),
      cacheSize: this.cache.size,
      topStrategies: this.getTopStrategies(),
    };
  }

  /**
   * Clear cache and reset stats
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    this.modelManager.clearCache();
    this.contextAnalyzer.clearCache();
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      strategyUsage: new Map(),
    };
  }

  /**
   * Destroy the engine
   */
  destroy(): void {
    this.modelManager.destroy();
    this.contextAnalyzer.destroy();
    this.cache.clear();
    this.recommenders.clear();
  }

  /**
   * Private helper methods
   */
  private initializeRecommenders(): void {
    this.recommenders = new Map([
      [
        RecommendationStrategy.BALANCED,
        new BalancedRecommender(this.geminiService),
      ],
      [
        RecommendationStrategy.URGENCY,
        new UrgencyRecommender(this.geminiService),
      ],
      [
        RecommendationStrategy.SKILL_BASED,
        new SkillBasedRecommender(this.geminiService),
      ],
      [
        RecommendationStrategy.WORKLOAD_BALANCED,
        new WorkloadBalancedRecommender(this.geminiService),
      ],
      [
        RecommendationStrategy.DEADLINE_DRIVEN,
        new DeadlineDrivenRecommender(this.geminiService),
      ],
      [
        RecommendationStrategy.QUALITY_FOCUSED,
        new QualityFocusedRecommender(this.geminiService),
      ],
      [
        RecommendationStrategy.STRATEGIC,
        new StrategicRecommender(this.geminiService),
      ],
    ]);
  }

  private async generateAlternatives(
    context: RecommendationContext,
    primaryStrategy: RecommendationStrategy,
    limit: number,
  ): Promise<AlternativeRecommendation[]> {
    const alternatives: AlternativeRecommendation[] = [];

    // Select 2-3 alternative strategies
    const alternativeStrategies = this.getAlternativeStrategies(
      primaryStrategy,
      3,
    );

    for (const strategy of alternativeStrategies) {
      const recommender = this.recommenders.get(strategy);
      if (recommender) {
        const recommendations = await recommender.generateRecommendations(
          context,
          Math.min(5, limit),
          {},
        );

        alternatives.push({
          strategy,
          recommendations,
          reasoning: `Alternative approach using ${strategy} strategy`,
        });
      }
    }

    return alternatives;
  }

  private getAlternativeStrategies(
    primary: RecommendationStrategy,
    count: number,
  ): RecommendationStrategy[] {
    const allStrategies = Object.values(RecommendationStrategy);
    const alternatives = allStrategies.filter((s) => s !== primary);

    // Select diverse strategies
    const selected: RecommendationStrategy[] = [];

    // Always include BALANCED if not primary
    if (
      primary !== RecommendationStrategy.BALANCED &&
      alternatives.includes(RecommendationStrategy.BALANCED)
    ) {
      selected.push(RecommendationStrategy.BALANCED);
    }

    // Add other strategies based on priority
    const priorityOrder = [
      RecommendationStrategy.SKILL_BASED,
      RecommendationStrategy.DEADLINE_DRIVEN,
      RecommendationStrategy.WORKLOAD_BALANCED,
      RecommendationStrategy.QUALITY_FOCUSED,
      RecommendationStrategy.URGENCY,
      RecommendationStrategy.STRATEGIC,
    ];

    for (const strategy of priorityOrder) {
      if (selected.length >= count) break;
      if (alternatives.includes(strategy) && !selected.includes(strategy)) {
        selected.push(strategy);
      }
    }

    return selected.slice(0, count);
  }

  private async generateInsights(
    context: RecommendationContext,
    recommendations: TaskRecommendation[],
  ): Promise<RecommendationInsight[]> {
    const insights: RecommendationInsight[] = [];

    try {
      const contextSummary = this.summarizeContext(context);
      const recommendationsSummary =
        this.summarizeRecommendations(recommendations);

      const prompt = `
Context Summary:
${contextSummary}

Recommendations Summary:
${recommendationsSummary}

Generate insights about the recommendation patterns and opportunities. Focus on:
1. Workload patterns
2. Skill gaps or strengths
3. Deadline risks
4. Quality trends
5. Collaboration opportunities
6. Resource optimization

Respond with JSON array of insights:
[
  {
    "type": "workload_pattern" | "skill_gap" | "deadline_risk" | "quality_trend" | "collaboration_opportunity" | "resource_optimization",
    "title": "Insight Title",
    "description": "Detailed description of the insight",
    "impact": 75,
    "actionable": true,
    "suggestions": ["Suggestion 1", "Suggestion 2"]
  }
]

Impact: 0-100, Actionable: boolean
      `;

      const response = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.5,
      });

      const parsedInsights = JSON.parse(response);
      insights.push(...parsedInsights);
    } catch (error) {
      console.error("Insight generation failed:", error);

      // Fallback insights
      insights.push(...this.generateFallbackInsights(context, recommendations));
    }

    return insights;
  }

  private summarizeContext(context: RecommendationContext): string {
    return `
User: ${context.user.name} (${context.user.role})
Team Size: ${context.team.members.length}
Project Phase: ${context.project.phase}
Pending Tasks: ${context.tasks.pending.length}
Average Team Workload: ${context.team.workload.utilizationRate * 100}%
    `.trim();
  }

  private summarizeRecommendations(
    recommendations: TaskRecommendation[],
  ): string {
    const types = recommendations.reduce(
      (acc, rec) => {
        acc[rec.type] = (acc[rec.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const avgPriority =
      recommendations.reduce((sum, rec) => sum + rec.priority, 0) /
      recommendations.length;
    const avgConfidence =
      recommendations.reduce((sum, rec) => sum + rec.confidence, 0) /
      recommendations.length;

    return `
Total Recommendations: ${recommendations.length}
Types: ${JSON.stringify(types)}
Average Priority: ${avgPriority.toFixed(1)}
Average Confidence: ${(avgConfidence * 100).toFixed(1)}%
    `.trim();
  }

  private generateFallbackInsights(
    context: RecommendationContext,
    recommendations: TaskRecommendation[],
  ): RecommendationInsight[] {
    const insights: RecommendationInsight[] = [];

    // Workload pattern insight
    if (context.team.workload.utilizationRate > 0.8) {
      insights.push({
        type: InsightType.WORKLOAD_PATTERN,
        title: "High Team Utilization",
        description:
          "Team is operating at high capacity. Consider workload redistribution or prioritization.",
        impact: 80,
        actionable: true,
        suggestions: [
          "Review task distribution",
          "Consider deadline adjustments",
          "Identify bottlenecks",
        ],
      });
    }

    // Skill gap insight
    const skillGaps = context.team.skills.filter((skill) => skill.gap > 0);
    if (skillGaps.length > 0) {
      insights.push({
        type: InsightType.SKILL_GAP,
        title: "Skill Gaps Identified",
        description: `${skillGaps.length} skill gaps identified that may impact task completion.`,
        impact: 70,
        actionable: true,
        suggestions: [
          "Plan skill development",
          "Consider external resources",
          "Pair junior with senior members",
        ],
      });
    }

    // Quality insight
    const qualityRecs = recommendations.filter(
      (rec) => rec.type === RecommendationType.QUALITY_IMPROVEMENT,
    );
    if (qualityRecs.length === 0 && context.tasks.pending.length > 10) {
      insights.push({
        type: InsightType.QUALITY_TREND,
        title: "Quality Focus Needed",
        description:
          "Consider adding quality improvement tasks to maintain code quality.",
        impact: 60,
        actionable: true,
        suggestions: [
          "Add code review tasks",
          "Schedule refactoring",
          "Plan technical debt reduction",
        ],
      });
    }

    return insights;
  }

  private calculateOverallConfidence(
    recommendations: TaskRecommendation[],
  ): number {
    if (recommendations.length === 0) return 0;

    const totalConfidence = recommendations.reduce(
      (sum, rec) => sum + rec.confidence,
      0,
    );
    return totalConfidence / recommendations.length;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(request: RecommendationRequest): string {
    const keyData = {
      userId: request.context.user.id,
      strategy: request.strategy || RecommendationStrategy.BALANCED,
      limit: request.limit || 10,
      filters: request.filters,
      // Hash the relevant context data
      contextHash: this.hashContext(request.context),
    };
    return btoa(JSON.stringify(keyData));
  }

  private hashContext(context: RecommendationContext): string {
    // Simple hash implementation - in production, use a proper hashing function
    const contextData = {
      taskCount: context.tasks.pending.length,
      teamSize: context.team.members.length,
      projectPhase: context.project.phase,
    };
    return btoa(JSON.stringify(contextData));
  }

  private updateStats(
    responseTime: number,
    strategy: RecommendationStrategy,
  ): void {
    this.stats.totalRequests++;
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) +
        responseTime) /
      this.stats.totalRequests;

    const currentUsage = this.stats.strategyUsage.get(strategy) || 0;
    this.stats.strategyUsage.set(strategy, currentUsage + 1);
  }

  private getTopStrategies(): {
    strategy: RecommendationStrategy;
    usage: number;
  }[] {
    return Array.from(this.stats.strategyUsage.entries())
      .map(([strategy, usage]) => ({ strategy, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);
  }

  private createErrorResponse(
    error: any,
    request: RecommendationRequest,
  ): RecommendationResponse {
    return {
      recommendations: [],
      strategy: request.strategy || RecommendationStrategy.BALANCED,
      context: request.context,
      metadata: {
        requestId: this.generateRequestId(),
        generatedAt: new Date(),
        processingTime: 0,
        algorithm: "error",
        confidence: 0,
        cacheHit: false,
        sourceCount: request.context.tasks.pending.length,
        filteredCount: 0,
      },
      alternatives: [],
      insights: [
        {
          type: InsightType.WORKLOAD_PATTERN,
          title: "Recommendation Error",
          description: "Unable to generate recommendations due to an error.",
          impact: 100,
          actionable: false,
          suggestions: [
            "Try again later",
            "Contact support if the issue persists",
          ],
        },
      ],
    };
  }
}

/**
 * Supporting interfaces
 */
interface EngineStats {
  totalRequests: number;
  cacheHits: number;
  averageResponseTime: number;
  strategyUsage: Map<RecommendationStrategy, number>;
}

interface EngineAnalytics {
  stats: EngineStats;
  modelStats: any;
  contextStats: any;
  cacheSize: number;
  topStrategies: { strategy: RecommendationStrategy; usage: number }[];
}
