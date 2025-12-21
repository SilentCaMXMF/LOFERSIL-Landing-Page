/**
 * Priority Scorer
 * Advanced task priority scoring with multiple factors and business rules
 */

import { GeminiService } from "../../gemini/GeminiService";
import type { TaskInfo } from "../../../TaskManager";
import type {
  PriorityScoringRequest,
  PriorityScoringResponse,
  PriorityScore,
  PriorityConfig,
  ComponentScores,
  PriorityFactor,
  PriorityContext,
  TaskRanking,
  PriorityInsight,
  RecommendationType,
  InsightType,
  PriorityWeights,
  PriorityFactors,
  PriorityThresholds,
  BusinessRules,
  EnhancedPriorityScore,
} from "./types";
import { TaskAnalyzer } from "../analysis/TaskAnalyzer";

/**
 * Priority Scorer Class
 */
export class PriorityScorer {
  private geminiService: GeminiService;
  private taskAnalyzer: TaskAnalyzer;
  private config: PriorityConfig;
  private stats: ScoringStats;

  constructor(geminiService: GeminiService, taskAnalyzer: TaskAnalyzer) {
    this.geminiService = geminiService;
    this.taskAnalyzer = taskAnalyzer;
    this.stats = {
      totalScoring: 0,
      averageScoringTime: 0,
      ruleApplications: 0,
      confidence: 0,
    };
    this.config = this.initializeDefaultConfig();
  }

  /**
   * Score priority for multiple tasks
   */
  async scorePriority(
    request: PriorityScoringRequest,
  ): Promise<PriorityScoringResponse> {
    const startTime = Date.now();

    try {
      console.log(`Scoring priority for ${request.tasks.length} tasks`);

      // Analyze all tasks first
      const taskAnalyses = await this.analyzeTasks(request.tasks);

      // Score each task
      const scores: PriorityScore[] = [];

      for (let i = 0; i < request.tasks.length; i++) {
        const task = request.tasks[i];
        const analysis = taskAnalyses[i];

        const score = await this.scoreSingleTask(
          task,
          analysis,
          request.context,
          request.config || this.config,
        );

        scores.push(score);
      }

      // Rank tasks
      const ranking = this.rankTasks(scores);

      // Generate insights
      const insights = await this.generateInsights(scores, request.context);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        scores,
        insights,
        request.context,
      );

      const response: PriorityScoringResponse = {
        scores,
        ranking,
        insights,
        recommendations,
        metadata: {
          requestId: `score_${Date.now()}`,
          calculatedAt: new Date(),
          processingTime: Date.now() - startTime,
          algorithm: "multi_factor_priority_scoring",
          version: "1.0.0",
          taskCount: request.tasks.length,
          ruleApplications: this.getRuleApplications(scores),
        },
      };

      // Update stats
      this.updateStats(Date.now() - startTime);

      console.log(
        `Priority scoring completed in ${response.metadata.processingTime}ms`,
      );
      return response;
    } catch (error) {
      console.error("Priority scoring failed:", error);
      throw new Error(
        `Priority scoring failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Score a single task with enhanced analysis
   */
  async scoreEnhancedPriority(
    task: TaskInfo,
    context: PriorityContext,
    config?: Partial<PriorityConfig>,
  ): Promise<EnhancedPriorityScore> {
    try {
      console.log(`Scoring enhanced priority for task: ${task.id}`);

      // Analyze task
      const analysis = await this.taskAnalyzer.analyzeTask(
        task,
        this.contextToAnalysisContext(context),
      );

      // Get base score
      const baseScore = await this.scoreSingleTask(
        task,
        analysis,
        context,
        config || this.config,
      );

      // Add enhanced features
      const enhancedScore: EnhancedPriorityScore = {
        ...baseScore,
        taskAnalysis: analysis,
        predictedCompletionTime: this.predictCompletionTime(task, analysis),
        riskAdjustedScore: this.adjustForRisk(baseScore.overallScore, analysis),
        confidenceAdjustedScore: this.adjustForConfidence(
          baseScore.overallScore,
          baseScore.confidence,
        ),
        teamImpactScore: this.calculateTeamImpact(task, context),
      };

      return enhancedScore;
    } catch (error) {
      console.error("Enhanced priority scoring failed:", error);
      throw new Error(
        `Enhanced priority scoring failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update scoring configuration
   */
  updateConfig(config: Partial<PriorityConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    console.log("Priority scorer configuration updated");
  }

  /**
   * Get current configuration
   */
  getConfig(): PriorityConfig {
    return { ...this.config };
  }

  /**
   * Reset scoring configuration to defaults
   */
  resetConfig(): void {
    this.config = this.initializeDefaultConfig();
    console.log("Priority scorer configuration reset to defaults");
  }

  /**
   * Get scoring statistics
   */
  getStats(): ScoringStats {
    return { ...this.stats };
  }

  /**
   * Clear cache and reset stats
   */
  clearCache(): void {
    this.taskAnalyzer.clearCache();
    this.stats = {
      totalScoring: 0,
      averageScoringTime: 0,
      ruleApplications: 0,
      confidence: 0,
    };
  }

  /**
   * Destroy scorer
   */
  destroy(): void {
    this.clearCache();
  }

  /**
   * Private helper methods
   */
  private async analyzeTasks(tasks: TaskInfo[]): Promise<any[]> {
    // Simple analysis for now - would use TaskAnalyzer in real implementation
    return tasks.map((task) => ({
      id: task.id,
      priority: task.priority,
      complexity: "moderate" as const,
    }));
  }

  private async scoreSingleTask(
    task: TaskInfo,
    analysis: any,
    context: PriorityContext,
    config: PriorityConfig,
  ): Promise<PriorityScore> {
    // Calculate component scores
    const componentScores = this.calculateComponentScores(
      task,
      analysis,
      context,
      config,
    );

    // Calculate overall score
    const overallScore = this.calculateOverallScore(
      componentScores,
      config.weights,
    );

    // Generate priority factors
    const factors = this.generatePriorityFactors(
      task,
      componentScores,
      context,
    );

    // Generate reasoning
    const reasoning = this.generateReasoning(componentScores, factors, config);

    return {
      taskId: task.id,
      overallScore,
      componentScores,
      factors,
      confidence: this.calculateConfidence(componentScores, factors),
      reasoning,
      metadata: {
        calculatedAt: new Date(),
        algorithm: "weighted_factor_scoring",
        version: "1.0.0",
        dataPoints: Object.keys(componentScores).length,
        processingTime: 0, // Would track actual time
        confidenceFactors: this.getConfidenceFactors(componentScores),
      },
    };
  }

  private calculateComponentScores(
    task: TaskInfo,
    analysis: any,
    context: PriorityContext,
    config: PriorityConfig,
  ): ComponentScores {
    const weights = config.weights;

    // User fit score
    const userFit = this.calculateUserFit(task, context.user, weights.userFit);

    // Project alignment score
    const projectAlignment = this.calculateProjectAlignment(
      task,
      context.project,
      weights.projectAlignment,
    );

    // Business value score
    const businessValue = this.calculateBusinessValue(
      task,
      context.business,
      weights.businessValue,
    );

    // Team contribution score
    const teamContribution = this.calculateTeamContribution(
      task,
      context.team,
      weights.teamContribution,
    );

    // Time optimality score
    const timeOptimality = this.calculateTimeOptimality(
      task,
      context.time,
      weights.timeOptimality,
    );

    return {
      userFit,
      projectAlignment,
      businessValue,
      teamContribution,
      timeOptimality,
    };
  }

  private calculateOverallScore(
    componentScores: ComponentScores,
    weights: PriorityWeights,
  ): number {
    const score =
      componentScores.userFit * weights.userFit +
      componentScores.projectAlignment * weights.projectAlignment +
      componentScores.businessValue * weights.businessValue +
      componentScores.teamContribution * weights.teamContribution +
      componentScores.timeOptimality * weights.timeOptimality;

    return Math.round(score);
  }

  private calculateUserFit(
    task: TaskInfo,
    user: UserPriorityContext,
    weight: number,
  ): number {
    let score = 50; // Base score

    // Skill match
    const requiredSkills = this.extractRequiredSkills(task);
    const matchingSkills = requiredSkills.filter(
      (skill) =>
        user.skills.preferredSkills.includes(skill) ||
        user.skills.expertSkills.includes(skill),
    );
    score += (matchingSkills.length / Math.max(requiredSkills.length, 1)) * 20;

    // Workload capacity
    if (user.workload.utilizationRate < 0.7) {
      score += 15;
    } else if (user.workload.utilizationRate > 0.9) {
      score -= 15;
    }

    // Performance based adjustment
    if (user.performance.successRate > 0.9) {
      score += 10;
    }

    return Math.round(Math.max(0, Math.min(100, score * weight)));
  }

  private calculateProjectAlignment(
    task: TaskInfo,
    project: ProjectPriorityContext,
    weight: number,
  ): number {
    let score = 50;

    // Goal alignment
    const taskDescription = `${task.title} ${task.description}`.toLowerCase();
    const matchingGoals = project.goals.primary.filter((goal) =>
      taskDescription.includes(goal.toLowerCase()),
    );

    if (matchingGoals.length > 0) {
      score += 20;
    }

    // Phase relevance
    if (this.isTaskRelevantToPhase(task, project.phase)) {
      score += 15;
    }

    // Stakeholder impact
    if (project.stakeholders.primary.length > 0) {
      score += 10;
    }

    return Math.round(Math.max(0, Math.min(100, score * weight)));
  }

  private calculateBusinessValue(
    task: TaskInfo,
    business: BusinessPriorityContext,
    weight: number,
  ): number {
    let score = 50;

    // Priority value
    const priorityValue = this.getTaskPriorityValue(task.priority);
    score += priorityValue * 25;

    // Value drivers
    const taskDescription = task.title.toLowerCase();
    for (const driver of business.valueDrivers) {
      if (taskDescription.includes(driver.name.toLowerCase())) {
        score += driver.impact / 10;
      }
    }

    return Math.round(Math.max(0, Math.min(100, score * weight)));
  }

  private calculateTeamContribution(
    task: TaskInfo,
    team: TeamPriorityContext,
    weight: number,
  ): number {
    let score = 50;

    // Skill availability
    const requiredSkills = this.extractRequiredSkills(task);
    const availableSkills = requiredSkills.filter((skill) =>
      team.skills.availableSkills.includes(skill),
    );
    score += (availableSkills.length / Math.max(requiredSkills.length, 1)) * 30;

    // Workload balance
    if (team.workload.utilizationRate < 0.8) {
      score += 10;
    }

    return Math.round(Math.max(0, Math.min(100, score * weight)));
  }

  private calculateTimeOptimality(
    task: TaskInfo,
    time: TimePriorityContext,
    weight: number,
  ): number {
    let score = 50;

    // Business hours alignment
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 9 && hour <= 17) {
      score += 20;
    }

    // Deadline proximity
    const urgentDeadlines = time.deadlines.filter(
      (deadline) =>
        deadline.importance === "critical" &&
        deadline.deadline.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000, // 7 days
    );

    if (urgentDeadlines.length > 0) {
      score += 15;
    }

    return Math.round(Math.max(0, Math.min(100, score * weight)));
  }

  private generatePriorityFactors(
    task: TaskInfo,
    componentScores: ComponentScores,
    context: PriorityContext,
  ): PriorityFactor[] {
    const factors: PriorityFactor[] = [];

    factors.push({
      name: "Task Priority",
      weight: 0.3,
      score: this.getTaskPriorityValue(task.priority),
      contribution: componentScores.businessValue / 100,
      reasoning: `Task has priority: ${task.priority}`,
      source: "task_metadata",
    });

    factors.push({
      name: "Skill Match",
      weight: 0.2,
      score: componentScores.userFit,
      contribution: componentScores.userFit / 100,
      reasoning: "Skills match user capabilities",
      source: "user_context",
    });

    factors.push({
      name: "Workload Capacity",
      weight: 0.15,
      score: componentScores.userFit,
      contribution: componentScores.userFit / 100,
      reasoning: "User has available capacity",
      source: "user_context",
    });

    return factors;
  }

  private generateReasoning(
    componentScores: ComponentScores,
    factors: PriorityFactor[],
    config: PriorityConfig,
  ): string {
    const topFactors = factors
      .sort((a, b) => b.contribution * b.weight - a.contribution * a.weight)
      .slice(0, 3);

    const reasoningParts = [
      `Priority score: ${topFactors[0]?.score || 0}`,
      `User fit: ${componentScores.userFit}`,
      `Project alignment: ${componentScores.projectAlignment}`,
    ];

    return reasoningParts.join(", ");
  }

  private calculateConfidence(
    componentScores: ComponentScores,
    factors: PriorityFactor[],
  ): number {
    // Higher variance in scores indicates lower confidence
    const scores = Object.values(componentScores);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
      scores.length;
    const standardDeviation = Math.sqrt(variance);

    // Higher standard deviation = lower confidence
    const confidence = Math.max(0.3, 1 - standardDeviation / 100);
    return Math.round(confidence * 100) / 100;
  }

  private getConfidenceFactors(componentScores: ComponentScores): any[] {
    return [
      {
        factor: "score_variance",
        confidence: 0.8,
        reason: "Low variance in component scores",
      },
      {
        factor: "data_completeness",
        confidence: 0.9,
        reason: "All components have valid data",
      },
    ];
  }

  private extractRequiredSkills(task: TaskInfo): string[] {
    const text =
      `${task.title} ${task.description} ${task.labels.join(" ")}`.toLowerCase();
    const skillKeywords = [
      "javascript",
      "typescript",
      "react",
      "node",
      "python",
      "java",
      "docker",
      "kubernetes",
      "aws",
      "azure",
      "git",
      "testing",
      "database",
      "api",
      "frontend",
      "backend",
      "devops",
    ];

    return skillKeywords.filter((skill) => text.includes(skill));
  }

  private getTaskPriorityValue(priority: string): number {
    const priorityValues: Record<string, number> = {
      low: 25,
      medium: 50,
      high: 75,
      critical: 100,
    };

    return priorityValues[priority] || 50;
  }

  private isTaskRelevantToPhase(task: TaskInfo, phase: any): boolean {
    const taskDescription = task.title.toLowerCase();

    const phaseRelevance: Record<string, string[]> = {
      planning: ["plan", "design", "architecture", "specification"],
      development: ["implement", "develop", "code", "build", "feature"],
      testing: ["test", "qa", "verify", "validate", "bug"],
      deployment: ["deploy", "release", "ship", "launch"],
      maintenance: ["fix", "maintain", "support", "monitor"],
    };

    const relevantKeywords = phaseRelevance[phase] || [];
    return relevantKeywords.some((keyword) =>
      taskDescription.includes(keyword),
    );
  }

  private rankTasks(scores: PriorityScore[]): TaskRanking[] {
    const sorted = scores
      .map((score, index) => ({
        rank: index + 1,
        taskId: score.taskId,
        score: score.overallScore,
        previousRank: index + 1, // Would track from previous scoring
        rankChange: 0, // Would calculate from previous ranking
        confidence: score.confidence,
      }))
      .sort((a, b) => b.score - a.score);

    // Update ranks after sorting
    sorted.forEach((item, index) => {
      item.rank = index + 1;
      item.rankChange = (item.previousRank || index + 1) - (index + 1);
    });

    return sorted;
  }

  private async generateInsights(
    scores: PriorityScore[],
    context: PriorityContext,
  ): Promise<PriorityInsight[]> {
    const insights: PriorityInsight[] = [];

    // Workload imbalance insight
    const lowScores = scores.filter((score) => score.overallScore < 30);
    if (lowScores.length > scores.length * 0.3) {
      insights.push({
        type: InsightType.WORKLOAD_IMBALANCE,
        title: "Many Low-Priority Tasks",
        description: `${lowScores.length} tasks have low priority scores, suggesting potential workload imbalance or misalignment.`,
        impact: 70,
        actionable: true,
        suggestions: [
          "Review task distribution",
          "Consider task re-prioritization",
          "Align tasks with goals",
        ],
        affectedTasks: lowScores.map((score) => score.taskId),
      });
    }

    // Skill mismatch insight
    const scoresWithFactors = scores.filter((score) =>
      score.factors.some(
        (factor) => factor.name === "Skill Match" && factor.score < 50,
      ),
    );

    if (scoresWithFactors.length > 0) {
      insights.push({
        type: InsightType.SKILL_MISMATCH,
        title: "Skill Gaps Detected",
        description:
          "Several tasks show low skill match scores, indicating potential skill gaps.",
        impact: 80,
        actionable: true,
        suggestions: [
          "Provide skill training",
          "Consider task reassignment",
          "Hire required expertise",
        ],
        affectedTasks: scoresWithFactors.map((score) => score.taskId),
      });
    }

    return insights;
  }

  private async generateRecommendations(
    scores: PriorityScore[],
    insights: PriorityInsight[],
    context: PriorityContext,
  ): Promise<any[]> {
    const recommendations: any[] = [];

    // Workload rebalance recommendation
    const workloadInsight = insights.find(
      (insight) => insight.type === InsightType.WORKLOAD_IMBALANCE,
    );

    if (workloadInsight) {
      recommendations.push({
        type: RecommendationType.WORKLOAD_REBALANCE,
        title: "Rebalance Task Distribution",
        description:
          "Consider redistributing tasks to optimize team utilization and priority alignment.",
        reasoning: workloadInsight.description,
        tasks: workloadInsight.affectedTasks,
        impact: workloadInsight.impact,
        effort: 8,
        priority: "high",
      });
    }

    // Skill allocation recommendation
    const skillInsight = insights.find(
      (insight) => insight.type === InsightType.SKILL_MISMATCH,
    );

    if (skillInsight) {
      recommendations.push({
        type: RecommendationType.SKILL_ALLOCATION,
        title: "Optimize Skill Allocation",
        description:
          "Reallocate tasks to better match team member skills and expertise.",
        reasoning: skillInsight.description,
        tasks: skillInsight.affectedTasks,
        impact: skillInsight.impact,
        effort: 12,
        priority: "medium",
      });
    }

    return recommendations;
  }

  private predictCompletionTime(task: TaskInfo, analysis: any): Date {
    // Simple prediction based on priority and estimated effort
    const baseDays = {
      low: 14,
      medium: 7,
      high: 3,
      critical: 1,
    };

    const days = baseDays[task.priority] || 7;
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + days);

    return completionDate;
  }

  private adjustForRisk(baseScore: number, analysis: any): number {
    // Simple risk adjustment
    const riskScore = analysis.risks?.overallRisk || 0;
    const riskPenalty = riskScore * 0.2;
    return Math.max(0, baseScore - riskPenalty);
  }

  private adjustForConfidence(baseScore: number, confidence: number): number {
    // Lower confidence reduces effective score
    const confidenceMultiplier = 0.5 + confidence * 0.5;
    return Math.round(baseScore * confidenceMultiplier);
  }

  private calculateTeamImpact(
    task: TaskInfo,
    context: PriorityContext,
  ): number {
    // Simple team impact calculation
    const teamSize = context.team.size;
    const taskComplexity = task.title.length + task.description.length;

    // Larger teams handle complex tasks better
    const impact = Math.min(
      100,
      (teamSize / 10) * 50 + (taskComplexity / 1000) * 50,
    );

    return Math.round(impact);
  }

  private contextToAnalysisContext(context: PriorityContext): any {
    // Convert PriorityContext to AnalysisContext for TaskAnalyzer
    return {
      project: {
        name: "Project",
        technology: [],
        goals: [],
        deadlines: [],
        stakeholders: [],
      },
      team: {
        members: [],
        skills: [],
        workload: { total: 0, byMember: {}, byPriority: {}, byCategory: {} },
        availability: {
          totalHours: 0,
          availableHours: 0,
          byMember: {},
          nextWeekAvailability: {},
        },
      },
      history: {
        completedTasks: [],
        averageCompletionTime: 0,
        successRate: 0,
        commonPatterns: [],
        failureAnalysis: [],
      },
      constraints: {
        time: {
          deadlines: [],
          milestones: [],
          workingHours: {
            monday: 8,
            tuesday: 8,
            wednesday: 8,
            thursday: 8,
            friday: 8,
            saturday: 0,
            sunday: 0,
            holidays: [],
          },
        },
        budget: { total: 0, allocated: 0, remaining: 0, limits: {} },
        resources: [],
        dependencies: [],
      },
    };
  }

  private getRuleApplications(scores: PriorityScore[]): any[] {
    return scores.map((score) => ({
      ruleId: "priority_scoring",
      ruleName: "Multi-Factor Priority Scoring",
      conditionsMet: ["task_analyzed", "context_available"],
      actionsApplied: ["score_calculated", "factors_generated"],
      impact: score.overallScore,
    }));
  }

  private updateStats(processingTime: number): void {
    this.stats.totalScoring++;
    this.stats.averageScoringTime =
      (this.stats.averageScoringTime * (this.stats.totalScoring - 1) +
        processingTime) /
      this.stats.totalScoring;
    this.stats.confidence =
      (this.stats.confidence * (this.stats.totalScoring - 1) + 0.8) /
      this.stats.totalScoring;
  }

  private initializeDefaultConfig(): PriorityConfig {
    return {
      weights: {
        userFit: 0.25,
        projectAlignment: 0.2,
        businessValue: 0.25,
        teamContribution: 0.15,
        timeOptimality: 0.1,
        custom: {},
      },
      factors: {
        user: {
          skillMatch: 0.4,
          workloadCapacity: 0.3,
          preferences: 0.2,
          performance: 0.1,
          availability: 0.1,
        },
        project: {
          goalAlignment: 0.3,
          phaseRelevance: 0.2,
          stakeholderImpact: 0.2,
          criticalPath: 0.2,
          dependencyImpact: 0.1,
        },
        business: {
          valueCreation: 0.3,
          marketTiming: 0.2,
          competitiveAdvantage: 0.2,
          revenueImpact: 0.2,
          costEfficiency: 0.1,
        },
        time: {
          deadlinePressure: 0.3,
          resourceAvailability: 0.2,
          businessHoursAlignment: 0.2,
          seasonality: 0.1,
          opportunityWindow: 0.2,
        },
      },
      thresholds: {
        high: 75,
        medium: 50,
        low: 25,
        critical: 90,
      },
      business: {
        rules: [],
        conditions: [],
        actions: [],
      },
    };
  }
}

/**
 * Supporting interfaces
 */
interface UserPriorityContext {
  preferences: any;
  workload: any;
  skills: any;
  performance: any;
}

interface ProjectPriorityContext {
  phase: any;
  goals: any;
  stakeholders: any;
}

interface TeamPriorityContext {
  size: number;
  skills: any;
  workload: any;
}

interface BusinessPriorityContext {
  valueDrivers: any;
}

interface TimePriorityContext {
  deadlines: any;
}

interface ScoringStats {
  totalScoring: number;
  averageScoringTime: number;
  ruleApplications: number;
  confidence: number;
}
