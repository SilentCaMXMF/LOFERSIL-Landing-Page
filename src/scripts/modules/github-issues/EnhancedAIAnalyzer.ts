/**
 * Enhanced AI Analyzer using new Gemini Service
 * Integrates with the comprehensive Gemini API integration
 */

import { GeminiService, type GeminiConfig } from "../ai";
import type {
  GitHubIssue,
  IssueAnalysis,
  ClassificationResult,
  IssueType,
  Priority,
  EffortEstimate,
  AssignmentRecommendation,
  AIConfig,
} from "./types";

export class EnhancedAIAnalyzer {
  private geminiService: GeminiService;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;

    // Convert AIConfig to GeminiConfig
    const geminiConfig: GeminiConfig = {
      apiKey: config.apiKey,
      model: config.model as any,
      temperature: 0.7,
      maxTokens: 2048,
      topK: 40,
      topP: 0.95,
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerDay: 1500,
        maxConcurrent: 5,
        refillRate: 1,
        bucketCapacity: 10,
      },
      cache: {
        enabled: true,
        defaultTtl: 3600,
        maxSize: 1000,
        cleanupInterval: 300,
      },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
      },
    };

    this.geminiService = new GeminiService(geminiConfig);
  }

  /**
   * Analyze a GitHub issue using enhanced AI capabilities
   */
  async analyzeIssue(issue: GitHubIssue): Promise<IssueAnalysis> {
    try {
      // Use the new Gemini service for comprehensive analysis
      const issueAnalysis = await this.geminiService.analyzeIssue({
        title: issue.title,
        description: issue.body || "",
        labels: issue.labels.map((label) => label.name),
        repoContext: {
          language: "TypeScript/JavaScript", // Could be dynamic
          features: [
            "Web Development",
            "API Integration",
            "Project Management",
          ],
          teamSize: 5, // Could be dynamic
        },
        analysisType: "comprehensive",
      });

      // Convert Gemini response to existing format
      return this.convertGeminiAnalysisToIssueAnalysis(issueAnalysis, issue);
    } catch (error) {
      console.error("Enhanced AI analysis failed:", error);
      return this.createFallbackAnalysis(issue, error as Error);
    }
  }

  /**
   * Categorize an issue using enhanced AI
   */
  async categorizeIssue(issue: GitHubIssue): Promise<ClassificationResult> {
    try {
      const classification = await this.geminiService.analyzeIssue({
        title: issue.title,
        description: issue.body || "",
        labels: issue.labels.map((label) => label.name),
        repoContext: {
          language: "TypeScript/JavaScript",
          features: ["Web Development", "API Integration"],
          teamSize: 5,
        },
        analysisType: "classify",
      });

      return this.convertGeminiClassificationToClassificationResult(
        classification,
        issue,
      );
    } catch (error) {
      console.error("Enhanced issue categorization failed:", error);
      return this.createFallbackCategorization(issue);
    }
  }

  /**
   * Estimate effort using enhanced AI
   */
  async estimateEffort(issue: GitHubIssue): Promise<EffortEstimate> {
    try {
      // Use text processing to estimate complexity and effort
      const complexityAnalysis = await this.geminiService.processText({
        text: `${issue.title}\n\n${issue.body || ""}`,
        type: "summarize",
      });

      // Calculate effort based on analysis
      const baseHours = this.calculateBaseHours(issue);
      const confidence = complexityAnalysis.confidence || 0.5;

      // Adjust based on AI confidence and issue characteristics
      let adjustedHours = baseHours;
      if (confidence < 0.3) adjustedHours *= 1.5; // Low confidence, increase estimate
      if (confidence > 0.8) adjustedHours *= 0.8; // High confidence, reduce estimate

      const complexity = this.determineComplexity(adjustedHours);

      return {
        hours: Math.round(adjustedHours * 2) / 2, // Round to nearest 0.5
        complexity,
        uncertainty: 1 - confidence,
        factors: [
          "AI-powered analysis",
          `Confidence: ${Math.round(confidence * 100)}%`,
          "Content length analysis",
          "Label consideration",
        ],
      };
    } catch (error) {
      console.error("Enhanced effort estimation failed:", error);
      return this.createFallbackEffortEstimate(issue);
    }
  }

  /**
   * Generate assignment recommendations using enhanced AI
   */
  async recommendAssignments(
    issue: GitHubIssue,
    teamMembers: string[],
  ): Promise<AssignmentRecommendation[]> {
    try {
      // Use decision support for assignment recommendations
      const recommendations = await this.geminiService.getRecommendations({
        currentState: `Issue: ${issue.title}\nDescription: ${issue.body || ""}\nLabels: ${issue.labels.map((l) => l.name).join(", ")}`,
        goal: "Assign the most suitable team member to resolve this issue effectively",
        constraints: `Available team members: ${teamMembers.join(", ")}`,
        resources: "Team expertise, current workload, historical performance",
        decisionType: "recommendation",
      });

      // Convert Gemini recommendations to assignment format
      return recommendations.recommendations.map((rec, index) => ({
        assignee: {
          id: index,
          login: teamMembers[index] || "unknown",
          name: null,
          email: null,
          avatar_url: "",
          type: "User",
          site_admin: false,
        },
        confidence:
          rec.priority === "critical"
            ? 0.9
            : rec.priority === "high"
              ? 0.8
              : rec.priority === "medium"
                ? 0.6
                : 0.4,
        reasoning: rec.description,
        workload: {
          currentIssues: 0, // Could be fetched from API
          totalAssignments: 0,
          averageResolutionTime: 0,
          availability: "medium" as const,
        },
        expertise: {
          score:
            rec.priority === "critical"
              ? 0.9
              : rec.priority === "high"
                ? 0.8
                : rec.priority === "medium"
                  ? 0.6
                  : 0.4,
          relevantSkills: [rec.title],
          historicalPerformance: 0.7,
          contributionsToRelatedFiles: 0,
        },
      }));
    } catch (error) {
      console.error("Enhanced assignment recommendation failed:", error);
      return [];
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return this.geminiService.getStats();
  }

  /**
   * Clear service cache
   */
  async clearCache(): Promise<void> {
    await this.geminiService.clearCache();
  }

  /**
   * Destroy the analyzer
   */
  destroy(): void {
    this.geminiService.destroy();
  }

  // Private helper methods

  private convertGeminiAnalysisToIssueAnalysis(
    geminiAnalysis: any,
    issue: GitHubIssue,
  ): IssueAnalysis {
    // Extract classification from Gemini analysis
    const classification =
      geminiAnalysis.classification || geminiAnalysis.recommendations?.[0];

    return {
      category: this.mapGeminiTypeToIssueType(
        classification?.issueType || "enhancement",
      ),
      complexity: this.mapGeminiComplexityToPriority(
        classification?.complexity || "moderate",
      ),
      requirements: classification?.requirements || [],
      acceptanceCriteria: [],
      feasible: true,
      confidence: geminiAnalysis.confidence || 0.5,
      reasoning: geminiAnalysis.reasoning || "Enhanced AI analysis completed",
      classification: {
        type: this.mapGeminiTypeToIssueType(
          classification?.issueType || "enhancement",
        ),
        confidence: geminiAnalysis.confidence || 0.5,
        labels: classification?.labels || [],
        priority: this.mapGeminiComplexityToPriority(
          classification?.complexity || "moderate",
        ),
        reasoning: classification?.reasoning || "AI-powered classification",
      },
      estimatedEffort: {
        hours: classification?.estimatedHours || 8,
        complexity: this.mapGeminiComplexityToPriority(
          classification?.complexity || "moderate",
        ),
        uncertainty: 0.3,
        factors: ["Enhanced AI analysis", "Complexity assessment"],
      },
      suggestedAssignees: [],
    };
  }

  private convertGeminiClassificationToClassificationResult(
    geminiClassification: any,
    issue: GitHubIssue,
  ): ClassificationResult {
    const classification =
      geminiClassification.classification || geminiClassification;

    return {
      type: this.mapGeminiTypeToIssueType(
        classification?.issueType || "enhancement",
      ),
      confidence: geminiClassification.confidence || 0.5,
      labels: classification?.labels || issue.labels.map((l) => l.name),
      priority: this.mapGeminiComplexityToPriority(
        classification?.complexity || "moderate",
      ),
      reasoning: classification?.reasoning || "Enhanced AI categorization",
    };
  }

  private mapGeminiTypeToIssueType(geminiType: string): IssueType {
    const typeMap: Record<string, IssueType> = {
      bug: "bug",
      feature: "feature",
      enhancement: "enhancement",
      documentation: "documentation",
      question: "question",
      maintenance: "maintenance",
    };
    return typeMap[geminiType] || "unknown";
  }

  private mapGeminiComplexityToPriority(geminiComplexity: string): Priority {
    const complexityMap: Record<string, Priority> = {
      simple: "low",
      low: "low",
      moderate: "medium",
      medium: "medium",
      complex: "high",
      high: "high",
      "very-complex": "critical",
      critical: "critical",
    };
    return complexityMap[geminiComplexity] || "medium";
  }

  private calculateBaseHours(issue: GitHubIssue): number {
    let hours = 4; // Base estimate

    const bodyLength = (issue.body || "").length;
    const labelCount = issue.labels.length;

    // Adjust for content length
    if (bodyLength > 500) hours += 2;
    if (bodyLength > 1500) hours += 4;

    // Adjust for number of labels
    if (labelCount > 3) hours += 2;
    if (labelCount > 6) hours += 4;

    // Adjust for specific labels
    const labelNames = issue.labels.map((l) => l.name.toLowerCase());
    if (
      labelNames.some((l) => l.includes("complex") || l.includes("difficult"))
    )
      hours += 4;
    if (labelNames.some((l) => l.includes("urgent") || l.includes("critical")))
      hours += 2;
    if (
      labelNames.some(
        (l) => l.includes("good first issue") || l.includes("beginner"),
      )
    )
      hours -= 2;

    return Math.max(1, hours);
  }

  private determineComplexity(hours: number): Priority {
    if (hours <= 4) return "low";
    if (hours <= 12) return "medium";
    if (hours <= 24) return "high";
    return "critical";
  }

  private createFallbackAnalysis(
    issue: GitHubIssue,
    error: Error,
  ): IssueAnalysis {
    return {
      category: "unknown",
      complexity: "medium",
      requirements: [],
      acceptanceCriteria: [],
      feasible: false,
      confidence: 0.1,
      reasoning: `Enhanced AI analysis failed: ${error.message}. Issue requires human review.`,
      classification: {
        type: "unknown",
        confidence: 0.1,
        labels: [],
        priority: "medium",
        reasoning: "Fallback classification due to AI failure",
      },
      estimatedEffort: {
        hours: 0,
        complexity: "medium",
        uncertainty: 1.0,
        factors: ["Enhanced AI analysis failed"],
      },
      suggestedAssignees: [],
    };
  }

  private createFallbackCategorization(
    issue: GitHubIssue,
  ): ClassificationResult {
    // Use label-based fallback
    const category = this.categorizeByLabels(issue.labels);

    return {
      type: category,
      confidence: 0.3,
      labels: issue.labels.map((l) => l.name),
      priority: "medium",
      reasoning: "Fallback categorization based on existing labels",
    };
  }

  private createFallbackEffortEstimate(issue: GitHubIssue): EffortEstimate {
    // Simple heuristics based on content
    const bodyLength = (issue.body || "").length;
    let hours = 4; // Base estimate

    if (bodyLength > 1000) hours += 4;
    if (bodyLength > 2000) hours += 8;
    if (issue.labels.some((l) => l.name.toLowerCase().includes("complex")))
      hours += 8;
    if (issue.labels.some((l) => l.name.toLowerCase().includes("bug")))
      hours -= 2;

    return {
      hours: Math.max(1, hours),
      complexity: hours > 16 ? "high" : hours > 8 ? "medium" : "low",
      uncertainty: 0.6,
      factors: ["Heuristic estimation", "Content length", "Label analysis"],
    };
  }

  private categorizeByLabels(labels: any[]): IssueType {
    for (const label of labels) {
      const name = label.name.toLowerCase();
      if (name.includes("bug")) return "bug";
      if (name.includes("feature")) return "feature";
      if (name.includes("enhancement")) return "enhancement";
      if (name.includes("docs") || name.includes("documentation"))
        return "documentation";
      if (name.includes("question") || name.includes("help")) return "question";
      if (name.includes("maintenance")) return "maintenance";
    }
    return "unknown";
  }
}
