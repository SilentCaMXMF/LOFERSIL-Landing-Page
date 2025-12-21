/**
 * Issue Classification Engine
 * Provides intelligent categorization and priority scoring for GitHub issues
 */

import {
  GitHubIssue,
  ClassificationResult,
  IssueType,
  Priority,
} from "./types";

export class IssueClassifier {
  private readonly complexityThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  private readonly supportedLabels: string[];

  constructor(
    complexityThresholds = { low: 2, medium: 4, high: 7 },
    supportedLabels: string[] = [],
  ) {
    this.complexityThresholds = complexityThresholds;
    this.supportedLabels = supportedLabels;
  }

  /**
   * Classify an issue with detailed analysis
   */
  classifyIssue(issue: GitHubIssue): ClassificationResult {
    const category = this.determineCategory(issue);
    const priority = this.calculatePriority(issue);
    const confidence = this.calculateConfidence(issue, category, priority);
    const suggestedLabels = this.suggestLabels(issue, category);
    const reasoning = this.generateReasoning(issue, category, priority);

    return {
      type: category,
      confidence,
      labels: suggestedLabels,
      priority,
      reasoning,
    };
  }

  /**
   * Determine primary category of an issue
   */
  private determineCategory(issue: GitHubIssue): IssueType {
    const title = issue.title.toLowerCase();
    const body = (issue.body || "").toLowerCase();
    const labels = issue.labels.map((l) => l.name.toLowerCase());

    // Priority-based classification
    const categoryScores: Record<string, number> = {
      bug: 0,
      feature: 0,
      enhancement: 0,
      documentation: 0,
      question: 0,
      maintenance: 0,
    };

    // Title-based scoring
    if (
      title.includes("bug") ||
      title.includes("fix") ||
      title.includes("error")
    ) {
      categoryScores.bug += 3;
    }
    if (
      title.includes("feature") ||
      title.includes("add") ||
      title.includes("implement")
    ) {
      categoryScores.feature += 3;
    }
    if (
      title.includes("enhancement") ||
      title.includes("improve") ||
      title.includes("optimize")
    ) {
      categoryScores.enhancement += 3;
    }
    if (
      title.includes("doc") ||
      title.includes("readme") ||
      title.includes("documentation")
    ) {
      categoryScores.documentation += 3;
    }
    if (
      title.includes("question") ||
      title.includes("how to") ||
      title.includes("help")
    ) {
      categoryScores.question += 3;
    }
    if (
      title.includes("maintenance") ||
      title.includes("update") ||
      title.includes("upgrade")
    ) {
      categoryScores.maintenance += 2;
    }

    // Body-based scoring
    if (
      body.includes("bug") ||
      body.includes("crash") ||
      body.includes("exception")
    ) {
      categoryScores.bug += 2;
    }
    if (body.includes("feature request") || body.includes("would like to")) {
      categoryScores.feature += 2;
    }
    if (body.includes("enhancement") || body.includes("improvement")) {
      categoryScores.enhancement += 2;
    }
    if (body.includes("documentation") || body.includes("readme")) {
      categoryScores.documentation += 2;
    }
    if (
      body.includes("?") ||
      body.includes("how do i") ||
      body.includes("confused")
    ) {
      categoryScores.question += 2;
    }

    // Label-based scoring
    for (const label of labels) {
      if (label.includes("bug") || label.includes("fix")) {
        categoryScores.bug += 4;
      }
      if (label.includes("feature")) {
        categoryScores.feature += 4;
      }
      if (label.includes("enhancement")) {
        categoryScores.enhancement += 4;
      }
      if (label.includes("docs") || label.includes("documentation")) {
        categoryScores.documentation += 4;
      }
      if (label.includes("question") || label.includes("help")) {
        categoryScores.question += 4;
      }
      if (label.includes("maintenance")) {
        categoryScores.maintenance += 3;
      }
    }

    // Find the category with highest score
    let maxScore = 0;
    let bestCategory: IssueType = "unknown";

    for (const [category, score] of Object.entries(categoryScores)) {
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category as IssueType;
      }
    }

    return maxScore > 0 ? bestCategory : "unknown";
  }

  /**
   * Calculate priority based on various factors
   */
  private calculatePriority(issue: GitHubIssue): Priority {
    let score = 0;
    const title = issue.title.toLowerCase();
    const body = (issue.body || "").toLowerCase();
    const labels = issue.labels.map((l) => l.name.toLowerCase());

    // Label-based priority
    for (const label of labels) {
      if (label.includes("critical") || label.includes("urgent")) {
        score += 10;
      }
      if (label.includes("high") || label.includes("priority")) {
        score += 7;
      }
      if (label.includes("medium")) {
        score += 4;
      }
      if (label.includes("low")) {
        score += 1;
      }
    }

    // Title urgency indicators
    if (title.includes("urgent") || title.includes("asap")) score += 8;
    if (title.includes("critical") || title.includes("broken")) score += 6;
    if (title.includes("security") || title.includes("vulnerability"))
      score += 10;
    if (title.includes("blocker") || title.includes("blocking")) score += 9;

    // Body urgency indicators
    if (body.includes("production") || body.includes("live")) score += 5;
    if (body.includes("regression") || body.includes("broke")) score += 4;
    if (body.includes("customer") || body.includes("user impact")) score += 6;

    // Issue age (older issues might be lower priority)
    const daysSinceCreation =
      (Date.now() - new Date(issue.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 30) score -= 2;
    if (daysSinceCreation > 90) score -= 3;

    // Number of comments (indicates engagement/urgency)
    if (issue.comments > 10) score += 3;
    if (issue.comments > 20) score += 5;

    // Determine priority level
    if (score >= 15) return "critical";
    if (score >= 10) return "high";
    if (score >= 5) return "medium";
    return "low";
  }

  /**
   * Calculate confidence in classification
   */
  private calculateConfidence(
    issue: GitHubIssue,
    category: IssueType,
    priority: Priority,
  ): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence with existing labels that match our classification
    const labels = issue.labels.map((l) => l.name.toLowerCase());
    const categoryKeywords: Record<string, string[]> = {
      bug: ["bug", "fix", "error", "crash"],
      feature: ["feature", "add", "implement", "new"],
      enhancement: ["enhancement", "improve", "optimize"],
      documentation: ["doc", "readme", "documentation"],
      question: ["question", "help", "how"],
      maintenance: ["maintenance", "update", "upgrade"],
    };

    const matchingLabels = labels.filter((label: string) =>
      categoryKeywords[category]?.some((keyword) => label.includes(keyword)),
    );

    if (matchingLabels.length > 0) {
      confidence += 0.3 * (matchingLabels.length / labels.length);
    }

    // Higher confidence with descriptive content
    const contentLength = (issue.body || "").length;
    if (contentLength > 500) confidence += 0.1;
    if (contentLength > 1000) confidence += 0.1;

    // Lower confidence for "unknown" category
    if (category === "unknown") {
      confidence = Math.min(confidence, 0.3);
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Suggest labels based on analysis
   */
  private suggestLabels(issue: GitHubIssue, category: IssueType): string[] {
    const suggestions = new Set<string>();

    // Category-based labels
    const categoryLabels: Record<string, string[]> = {
      bug: ["bug", "triage-needed"],
      feature: ["enhancement", "feature-request"],
      enhancement: ["enhancement", "improvement"],
      documentation: ["documentation"],
      question: ["question"],
      maintenance: ["maintenance"],
    };

    if (categoryLabels[category]) {
      categoryLabels[category].forEach((label: string) =>
        suggestions.add(label),
      );
    }

    // Priority-based labels
    const priority = this.calculatePriority(issue);
    if (priority === "critical") {
      suggestions.add("critical");
      suggestions.add("urgent");
    } else if (priority === "high") {
      suggestions.add("high-priority");
    }

    // Content-based suggestions
    const title = issue.title.toLowerCase();
    const body = (issue.body || "").toLowerCase();
    const content = `${title} ${body}`;

    if (content.includes("security")) suggestions.add("security");
    if (content.includes("performance")) suggestions.add("performance");
    if (content.includes("ui") || content.includes("ux")) suggestions.add("ui");
    if (content.includes("api")) suggestions.add("api");
    if (content.includes("test")) suggestions.add("testing");
    if (content.includes("deploy") || content.includes("deployment"))
      suggestions.add("deployment");

    // Technical complexity indicators
    if (content.includes("database") || content.includes("migration")) {
      suggestions.add("database");
      suggestions.add("complex");
    }

    if (content.match(/```[\s\S]*```/)) {
      suggestions.add("technical");
    }

    // Remove existing labels to avoid duplicates
    const existingLabels = new Set(issue.labels.map((l) => l.name));
    const uniqueSuggestions = Array.from(suggestions).filter(
      (label: string) => !existingLabels.has(label),
    );

    return uniqueSuggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Generate reasoning for classification
   */
  private generateReasoning(
    issue: GitHubIssue,
    category: IssueType,
    priority: Priority,
  ): string {
    const reasons: string[] = [];

    // Category reasoning
    const labels = issue.labels.map((l) => l.name.toLowerCase());
    const categoryLabels = labels.filter((label: string) => {
      const categoryKeywords: Record<string, string[]> = {
        bug: ["bug", "fix", "error"],
        feature: ["feature", "add"],
        enhancement: ["enhancement", "improve"],
        documentation: ["doc", "readme"],
        question: ["question", "help"],
        maintenance: ["maintenance", "update"],
      };
      return categoryKeywords[category]?.some((keyword) =>
        label.includes(keyword),
      );
    });

    if (categoryLabels.length > 0) {
      reasons.push(
        `Categorized as ${category} based on existing labels: ${categoryLabels.join(", ")}`,
      );
    } else {
      reasons.push(`Categorized as ${category} based on content analysis`);
    }

    // Priority reasoning
    if (priority === "critical") {
      reasons.push(
        "Marked as critical due to urgency indicators or potential impact",
      );
    } else if (priority === "high") {
      reasons.push(
        "Marked as high priority due to significant impact or user needs",
      );
    } else if (priority === "medium") {
      reasons.push("Standard priority - regular issue with normal impact");
    } else {
      reasons.push("Low priority - minor issue or long-term improvement");
    }

    // Content analysis
    const contentLength = (issue.body || "").length;
    if (contentLength < 50) {
      reasons.push("Limited description provided - may need clarification");
    } else if (contentLength > 1000) {
      reasons.push("Detailed issue description with comprehensive information");
    }

    // Comments analysis
    if (issue.comments > 10) {
      reasons.push(
        "High engagement with many comments indicating community interest",
      );
    }

    return reasons.join(". ");
  }

  /**
   * Batch classify multiple issues
   */
  batchClassify(issues: GitHubIssue[]): ClassificationResult[] {
    return issues.map((issue) => this.classifyIssue(issue));
  }

  /**
   * Get classification statistics for a batch
   */
  getBatchStatistics(results: ClassificationResult[]): {
    categories: Record<string, number>;
    priorities: Record<string, number>;
    averageConfidence: number;
  } {
    const categories: Record<string, number> = {};
    const priorities: Record<string, number> = {};
    let totalConfidence = 0;

    for (const result of results) {
      categories[result.type] = (categories[result.type] || 0) + 1;
      priorities[result.priority] = (priorities[result.priority] || 0) + 1;
      totalConfidence += result.confidence;
    }

    return {
      categories,
      priorities,
      averageConfidence:
        results.length > 0 ? totalConfidence / results.length : 0,
    };
  }
}
