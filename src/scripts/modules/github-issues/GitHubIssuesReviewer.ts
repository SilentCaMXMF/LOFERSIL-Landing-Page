/**
 * Real GitHub Issues Reviewer with AI Integration
 * Production-ready system for analyzing, categorizing, and providing intelligent recommendations for GitHub issues
 */

import { GitHubApiClient } from "./GitHubApiClient";
import { AIAnalyzer } from "./AIAnalyzer";
import { IssueClassifier } from "./IssueClassifier";
import { AssignmentEngine } from "./AssignmentEngine";
import {
  GitHubIssue,
  IssueAnalysis,
  GitHubConfig,
  AIConfig,
  AnalysisConfig,
  ClassificationResult,
  AssignmentRecommendation,
  APIResponse,
  Priority,
  IssueType,
  Metrics,
} from "./types";

export class GitHubIssuesReviewer {
  private githubClient: GitHubApiClient;
  private aiAnalyzer: AIAnalyzer;
  private issueClassifier: IssueClassifier;
  private assignmentEngine: AssignmentEngine;
  private config: AnalysisConfig;
  private metrics: Metrics;

  constructor(
    githubConfig: GitHubConfig,
    aiConfig: AIConfig,
    analysisConfig: AnalysisConfig,
  ) {
    // Initialize components
    this.githubClient = new GitHubApiClient(githubConfig);
    this.aiAnalyzer = new AIAnalyzer(aiConfig);
    this.issueClassifier = new IssueClassifier(
      analysisConfig.complexityThresholds,
      analysisConfig.supportedLabels,
    );
    this.assignmentEngine = new AssignmentEngine();

    this.config = analysisConfig;
    this.metrics = {
      totalIssues: 0,
      analyzedIssues: 0,
      classificationAccuracy: 0,
      averageAnalysisTime: 0,
      assignmentSuccess: 0,
      errorRate: 0,
    };
  }

  /**
   * Get a single issue by number
   */
  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    const issueResponse = await this.githubClient.getIssue(issueNumber);

    if (!issueResponse.success || !issueResponse.data) {
      throw new Error(issueResponse.error || "Failed to fetch issue");
    }

    return issueResponse.data;
  }

  /**
   * Analyze a single issue by number
   */
  async analyzeIssue(issueNumber: number): Promise<IssueAnalysis> {
    const startTime = Date.now();
    this.metrics.totalIssues++;

    try {
      // Fetch issue from GitHub
      const issueResponse = await this.githubClient.getIssue(issueNumber);

      if (!issueResponse.success || !issueResponse.data) {
        throw new Error(issueResponse.error || "Failed to fetch issue");
      }

      const issue = issueResponse.data;

      // Perform comprehensive analysis
      const analysis = await this.performComprehensiveAnalysis(issue);

      // Update metrics
      this.updateAnalysisMetrics(Date.now() - startTime, true);

      return analysis;
    } catch (error) {
      console.error(`Failed to analyze issue #${issueNumber}:`, error);

      // Update error metrics
      this.updateAnalysisMetrics(Date.now() - startTime, false);

      // Create fallback analysis
      return this.createFallbackAnalysis(issueNumber, error as Error);
    }
  }

  /**
   * Analyze multiple issues in batch
   */
  async analyzeBatchIssues(
    issueNumbers: number[],
  ): Promise<Map<number, IssueAnalysis>> {
    const results = new Map<number, IssueAnalysis>();
    const batchSize = 5; // Process in batches to respect rate limits

    for (let i = 0; i < issueNumbers.length; i += batchSize) {
      const batch = issueNumbers.slice(i, i + batchSize);

      // Process batch in parallel
      const batchPromises = batch.map(async (issueNumber) => {
        const analysis = await this.analyzeIssue(issueNumber);
        return { issueNumber, analysis };
      });

      const batchResults = await Promise.allSettled(batchPromises);

      // Collect results
      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.set(result.value.issueNumber, result.value.analysis);
        } else {
          console.error("Batch analysis failed:", result.reason);
        }
      }

      // Small delay between batches to respect rate limits
      if (i + batchSize < issueNumbers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Analyze all open issues in repository
   */
  async analyzeAllOpenIssues(): Promise<Map<number, IssueAnalysis>> {
    try {
      // Get all open issues
      const issuesResponse = await this.githubClient.listIssues({
        state: "open",
        per_page: 100,
      });

      if (!issuesResponse.success || !issuesResponse.data) {
        throw new Error(issuesResponse.error || "Failed to fetch issues");
      }

      const issueNumbers = issuesResponse.data.map((issue) => issue.number);
      return await this.analyzeBatchIssues(issueNumbers);
    } catch (error) {
      console.error("Failed to analyze all open issues:", error);
      throw error;
    }
  }

  /**
   * Get assignment recommendations for an issue
   */
  async getAssignmentRecommendations(
    issueNumber: number,
    maxRecommendations: number = 3,
  ): Promise<AssignmentRecommendation[]> {
    try {
      // Fetch issue
      const issueResponse = await this.githubClient.getIssue(issueNumber);

      if (!issueResponse.success || !issueResponse.data) {
        throw new Error(issueResponse.error || "Failed to fetch issue");
      }

      const issue = issueResponse.data;

      // Get team members (mock implementation - in real app would fetch from team management)
      const teamMembers = await this.getTeamMembers();

      // Get recommendations from assignment engine
      const recommendations = await this.assignmentEngine.recommendAssignments(
        issue,
        maxRecommendations,
      );

      return recommendations;
    } catch (error) {
      console.error(
        `Failed to get assignments for issue #${issueNumber}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Perform comprehensive analysis of an issue
   */
  private async performComprehensiveAnalysis(
    issue: GitHubIssue,
  ): Promise<IssueAnalysis> {
    // AI-powered analysis
    let aiAnalysis: IssueAnalysis | null = null;
    try {
      aiAnalysis = await this.aiAnalyzer.analyzeIssue(issue);
    } catch (error) {
      console.warn("AI analysis failed, using fallback:", error);
    }

    // Rule-based classification as fallback or enhancement
    const classification = this.issueClassifier.classifyIssue(issue);

    // Merge AI and rule-based results
    if (aiAnalysis) {
      // Use AI results as primary, enhance with rule-based
      return {
        ...aiAnalysis,
        classification: classification, // Use our classification for consistency
        confidence: Math.max(aiAnalysis.confidence, classification.confidence),
      };
    } else {
      // Use rule-based analysis only
      return this.createRuleBasedAnalysis(issue, classification);
    }
  }

  /**
   * Create rule-based analysis when AI fails
   */
  private createRuleBasedAnalysis(
    issue: GitHubIssue,
    classification: ClassificationResult,
  ): IssueAnalysis {
    return {
      category: classification.type,
      complexity: classification.priority,
      requirements: this.extractRequirements(issue),
      acceptanceCriteria: this.extractAcceptanceCriteria(issue),
      feasible: this.isFeasible(classification.type, classification.priority),
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      classification,
      estimatedEffort: {
        hours: this.estimateHours(classification.type, classification.priority),
        complexity: classification.priority,
        uncertainty: 0.4,
        factors: [
          "Rule-based estimation",
          "Issue complexity",
          "Historical patterns",
        ],
      },
      suggestedAssignees: [], // Will be populated separately
    };
  }

  /**
   * Extract requirements from issue content
   */
  private extractRequirements(issue: GitHubIssue): string[] {
    const requirements: string[] = [];
    const body = (issue.body || "").toLowerCase();

    // Look for requirement indicators
    const lines = body.split("\n");
    let inRequirementsSection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.includes("requirement") || trimmed.includes("deliverable")) {
        inRequirementsSection = true;
        continue;
      }

      if (trimmed.startsWith("##") && inRequirementsSection) {
        break; // End of requirements section
      }

      if (
        inRequirementsSection &&
        (trimmed.startsWith("-") ||
          trimmed.startsWith("*") ||
          /^\d+\./.test(trimmed))
      ) {
        const requirement = trimmed.replace(/^[-*]\s+|\d+\.\s+/, "").trim();
        if (requirement.length > 10) {
          // Filter out short entries
          requirements.push(requirement);
        }
      }
    }

    // If no structured requirements found, extract from title and body
    if (requirements.length === 0) {
      requirements.push(issue.title);

      // Add key points from body
      const sentences = body.split(/[.!?]+/);
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (
          trimmed.length > 20 &&
          (trimmed.includes("need") ||
            trimmed.includes("should") ||
            trimmed.includes("implement") ||
            trimmed.includes("add") ||
            trimmed.includes("fix"))
        ) {
          requirements.push(trimmed);
          break; // Add just one key requirement from body
        }
      }
    }

    return requirements.slice(0, 5); // Limit to 5 requirements
  }

  /**
   * Extract acceptance criteria from issue content
   */
  private extractAcceptanceCriteria(issue: GitHubIssue): string[] {
    const criteria: string[] = [];
    const body = (issue.body || "").toLowerCase();

    // Look for acceptance criteria indicators
    const lines = body.split("\n");
    let inCriteriaSection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (
        trimmed.includes("acceptance") ||
        trimmed.includes("criteria") ||
        trimmed.includes("definition of done")
      ) {
        inCriteriaSection = true;
        continue;
      }

      if (trimmed.startsWith("##") && inCriteriaSection) {
        break; // End of criteria section
      }

      if (
        inCriteriaSection &&
        (trimmed.startsWith("-") ||
          trimmed.startsWith("*") ||
          /^\d+\./.test(trimmed))
      ) {
        const criterion = trimmed.replace(/^[-*]\s+|\d+\.\s+/, "").trim();
        if (criterion.length > 10) {
          // Filter out short entries
          criteria.push(criterion);
        }
      }
    }

    return criteria.slice(0, 5); // Limit to 5 criteria
  }

  /**
   * Determine if issue is feasible for autonomous resolution
   */
  private isFeasible(type: IssueType, priority: Priority): boolean {
    // Critical and high priority issues require human review
    if (priority === "critical" || priority === "high") return false;

    // Questions need human clarification
    if (type === "question") return false;

    // Unknown issues require investigation
    if (type === "unknown") return false;

    return true;
  }

  /**
   * Estimate effort in hours based on type and priority
   */
  private estimateHours(type: IssueType, priority: Priority): number {
    let baseHours = 4; // Default

    // Adjust based on type
    const typeMultipliers = {
      bug: 0.8,
      feature: 1.5,
      enhancement: 1.2,
      documentation: 0.6,
      question: 0.3,
      maintenance: 1.0,
      unknown: 1.5, // Conservative estimate for unknown
    };

    baseHours *= typeMultipliers[type] || 1.0;

    // Adjust based on priority
    const priorityMultipliers = {
      low: 0.7,
      medium: 1.0,
      high: 1.5,
      critical: 2.0,
    };

    baseHours *= priorityMultipliers[priority] || 1.0;

    return Math.max(0.5, Math.min(40, baseHours)); // Range: 30min to 40 hours
  }

  /**
   * Create fallback analysis when analysis fails
   */
  private createFallbackAnalysis(
    issueNumber: number,
    error: Error,
  ): IssueAnalysis {
    return {
      category: "unknown",
      complexity: "medium",
      requirements: [],
      acceptanceCriteria: [],
      feasible: false,
      confidence: 0.1,
      reasoning: `Analysis failed: ${error.message}. Issue #${issueNumber} requires human review.`,
      classification: {
        type: "unknown",
        confidence: 0.1,
        labels: [],
        priority: "medium",
        reasoning: "Fallback classification due to analysis failure",
      },
      estimatedEffort: {
        hours: 0,
        complexity: "medium" as Priority,
        uncertainty: 1.0,
        factors: ["Analysis failed"],
      },
      suggestedAssignees: [],
    };
  }

  /**
   * Get team members (mock implementation)
   */
  private async getTeamMembers(): Promise<string[]> {
    // In a real implementation, this would fetch from team management system
    return ["alice", "bob", "charlie", "diana", "eve"];
  }

  /**
   * Update analysis metrics
   */
  private updateAnalysisMetrics(analysisTime: number, success: boolean): void {
    this.metrics.analyzedIssues++;

    // Update average analysis time
    const totalTime =
      this.metrics.averageAnalysisTime * (this.metrics.analyzedIssues - 1) +
      analysisTime;
    this.metrics.averageAnalysisTime = totalTime / this.metrics.analyzedIssues;

    // Update success/error rates
    if (success) {
      this.metrics.assignmentSuccess =
        (this.metrics.assignmentSuccess * (this.metrics.analyzedIssues - 1) +
          1) /
        this.metrics.analyzedIssues;
    } else {
      this.metrics.errorRate =
        (this.metrics.errorRate * (this.metrics.analyzedIssues - 1) + 1) /
        this.metrics.analyzedIssues;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  /**
   * Test system health
   */
  async healthCheck(): Promise<{
    github: boolean;
    ai: boolean;
    overall: boolean;
    metrics: Metrics;
  }> {
    const githubHealth = await this.testGitHubConnection();
    const aiHealth = await this.testAIConnection();
    const overall = githubHealth && aiHealth;

    return {
      github: githubHealth,
      ai: aiHealth,
      overall,
      metrics: this.getMetrics(),
    };
  }

  /**
   * Test GitHub connection
   */
  private async testGitHubConnection(): Promise<boolean> {
    try {
      // Try to fetch repository info
      const response = await this.githubClient.getRepository();
      return response.success;
    } catch (error) {
      console.error("GitHub connection test failed:", error);
      return false;
    }
  }

  /**
   * Test AI connection
   */
  private async testAIConnection(): Promise<boolean> {
    try {
      // Try a simple AI analysis
      const testIssue: GitHubIssue = {
        id: 0,
        number: 0,
        title: "Test Issue",
        body: "This is a test issue for connection checking",
        state: "open",
        locked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_at: null,
        user: {
          id: 0,
          login: "test",
          name: "Test User",
          email: null,
          avatar_url: "",
          type: "User",
          site_admin: false,
        },
        assignee: null,
        assignees: [],
        milestone: null,
        labels: [],
        html_url: "",
        url: "",
        repository_url: "",
        comments: 0,
      };

      await this.aiAnalyzer.analyzeIssue(testIssue);
      return true;
    } catch (error) {
      console.error("AI connection test failed:", error);
      return false;
    }
  }
}
