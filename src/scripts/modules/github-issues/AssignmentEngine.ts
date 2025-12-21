/**
 * Assignment Recommendation Engine
 * Provides intelligent issue assignment recommendations based on expertise, workload, and availability
 */

import {
  GitHubIssue,
  GitHubUser,
  AssignmentRecommendation,
  WorkloadInfo,
  ExpertiseMatch,
  Priority,
} from "./types";

export interface TeamMemberProfile {
  user: GitHubUser;
  skills: string[];
  expertise: Record<string, number>; // skill -> confidence (0-1)
  workload: WorkloadInfo;
  timezone: string;
  availability: Record<string, string>; // day -> available_hours
  historicalAssignments: {
    total: number;
    successful: number;
    averageResolutionTime: number;
    byType: Record<string, number>;
  };
}

export class AssignmentEngine {
  private teamMembers: Map<string, TeamMemberProfile> = new Map();
  private readonly skillWeights = {
    expertise: 0.4,
    workload: 0.25,
    availability: 0.2,
    historicalPerformance: 0.15,
  };

  /**
   * Add or update a team member profile
   */
  addTeamMember(profile: TeamMemberProfile): void {
    this.teamMembers.set(profile.user.login, profile);
  }

  /**
   * Get assignment recommendations for an issue
   */
  async recommendAssignments(
    issue: GitHubIssue,
    maxRecommendations: number = 3,
  ): Promise<AssignmentRecommendation[]> {
    const recommendations: AssignmentRecommendation[] = [];
    const issueKeywords = this.extractKeywords(issue);

    for (const [profileUser, profile] of this.teamMembers) {
      const expertiseMatch = this.calculateExpertiseMatch(
        profile,
        issueKeywords,
        issue,
      );
      const workloadScore = this.calculateWorkloadScore(profile.workload);
      const availabilityScore = this.calculateAvailabilityScore(profile);
      const historicalScore = this.calculateHistoricalScore(profile, issue);

      // Calculate overall confidence
      const confidence =
        expertiseMatch.score * this.skillWeights.expertise +
        workloadScore * this.skillWeights.workload +
        availabilityScore * this.skillWeights.availability +
        historicalScore * this.skillWeights.historicalPerformance;

      // Generate reasoning
      const reasoning = this.generateAssignmentReasoning(
        profile,
        expertiseMatch,
        workloadScore,
        availabilityScore,
        historicalScore,
      );

      recommendations.push({
        assignee: profile.user,
        confidence: Math.max(0, Math.min(1, confidence)),
        reasoning,
        workload: profile.workload,
        expertise: expertiseMatch,
      });
    }

    // Sort by confidence and return top recommendations
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxRecommendations);
  }

  /**
   * Extract relevant keywords from an issue
   */
  private extractKeywords(issue: GitHubIssue): string[] {
    const text = `${issue.title} ${issue.body || ""}`.toLowerCase();
    const keywords = new Set<string>();

    // Common technical keywords
    const technicalTerms = [
      "api",
      "backend",
      "frontend",
      "ui",
      "ux",
      "database",
      "sql",
      "nosql",
      "javascript",
      "typescript",
      "react",
      "vue",
      "angular",
      "node",
      "python",
      "java",
      "docker",
      "kubernetes",
      "aws",
      "azure",
      "gcp",
      "security",
      "authentication",
      "authorization",
      "oauth",
      "jwt",
      "performance",
      "optimization",
      "testing",
      "unit",
      "integration",
      "e2e",
      "ci",
      "cd",
      "git",
      "github",
      "deployment",
      "monitoring",
      "logging",
      "cache",
      "redis",
      "mongodb",
      "postgresql",
      "mysql",
      "graphql",
      "rest",
    ];

    // Extract technical terms
    for (const term of technicalTerms) {
      if (text.includes(term)) {
        keywords.add(term);
      }
    }

    // Extract words that look like skills (capitalized words, specific patterns)
    const words = text.match(/\b[A-Z][a-z]+\b/g) || [];
    for (const word of words) {
      keywords.add(word.toLowerCase());
    }

    // Extract from labels
    for (const label of issue.labels) {
      keywords.add(label.name.toLowerCase());
    }

    return Array.from(keywords);
  }

  /**
   * Calculate expertise match for a team member
   */
  private calculateExpertiseMatch(
    profile: TeamMemberProfile,
    keywords: string[],
    issue: GitHubIssue,
  ): ExpertiseMatch {
    let totalMatchScore = 0;
    const relevantSkills: string[] = [];
    let keywordMatches = 0;

    for (const keyword of keywords) {
      // Check direct skill match
      const skillMatch = profile.skills.find(
        (skill) =>
          skill.toLowerCase().includes(keyword) ||
          keyword.includes(skill.toLowerCase()),
      );

      if (skillMatch) {
        totalMatchScore += profile.expertise[skillMatch] || 0.5;
        relevantSkills.push(skillMatch);
        keywordMatches++;
      } else if (profile.expertise[keyword]) {
        totalMatchScore += profile.expertise[keyword];
        relevantSkills.push(keyword);
        keywordMatches++;
      }
    }

    // Normalize score
    const maxPossibleScore = keywords.length;
    const baseScore =
      maxPossibleScore > 0 ? totalMatchScore / maxPossibleScore : 0;

    // Boost score based on issue category and specialization
    let categoryBonus = 0;
    const issueType = this.classifyIssueType(issue);
    if (
      profile.skills.some((skill) => skill.toLowerCase().includes(issueType))
    ) {
      categoryBonus = 0.2;
    }

    // Consider historical performance on similar issues
    const historicalPerformance =
      profile.historicalAssignments.byType[issueType] || 0;
    const performanceBonus = historicalPerformance * 0.1;

    const finalScore = Math.min(
      1,
      baseScore + categoryBonus + performanceBonus,
    );

    return {
      score: finalScore,
      relevantSkills,
      historicalPerformance: historicalPerformance / 100 || 0,
      contributionsToRelatedFiles: this.estimateContributionsToRelatedFiles(
        profile,
        issue,
      ),
    };
  }

  /**
   * Calculate workload score (higher is better for assignment)
   */
  private calculateWorkloadScore(workload: WorkloadInfo): number {
    if (workload.currentIssues === 0) return 1.0;
    if (workload.currentIssues <= 2) return 0.8;
    if (workload.currentIssues <= 5) return 0.5;
    if (workload.currentIssues <= 10) return 0.2;
    return 0.0; // Too busy
  }

  /**
   * Calculate availability score
   */
  private calculateAvailabilityScore(profile: TeamMemberProfile): number {
    const today = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const availableHours = parseInt(profile.availability[today] || "0");

    if (availableHours >= 6) return 1.0;
    if (availableHours >= 4) return 0.8;
    if (availableHours >= 2) return 0.5;
    if (availableHours >= 1) return 0.3;
    return 0.0;
  }

  /**
   * Calculate historical performance score
   */
  private calculateHistoricalScore(
    profile: TeamMemberProfile,
    _issue: GitHubIssue,
  ): number {
    const successRate =
      profile.historicalAssignments.total > 0
        ? profile.historicalAssignments.successful /
          profile.historicalAssignments.total
        : 0.5;

    // Consider resolution time (faster is better)
    const timeScore =
      profile.historicalAssignments.averageResolutionTime > 0
        ? Math.max(
            0,
            1 - profile.historicalAssignments.averageResolutionTime / 168,
          ) // Normalize to week
        : 0.5;

    return successRate * 0.7 + timeScore * 0.3;
  }

  /**
   * Classify issue type for matching
   */
  private classifyIssueType(issue: GitHubIssue): string {
    const title = issue.title.toLowerCase();
    const body = (issue.body || "").toLowerCase();
    const text = `${title} ${body}`;

    if (text.includes("bug") || text.includes("fix") || text.includes("error"))
      return "bug";
    if (
      text.includes("feature") ||
      text.includes("add") ||
      text.includes("implement")
    )
      return "feature";
    if (text.includes("enhancement") || text.includes("improve"))
      return "enhancement";
    if (text.includes("doc") || text.includes("readme")) return "documentation";
    if (text.includes("security") || text.includes("auth")) return "security";
    if (text.includes("performance") || text.includes("optimize"))
      return "performance";
    if (text.includes("test") || text.includes("testing")) return "testing";
    if (text.includes("deploy") || text.includes("deployment"))
      return "deployment";
    if (text.includes("ui") || text.includes("frontend")) return "frontend";
    if (text.includes("api") || text.includes("backend")) return "backend";

    return "general";
  }

  /**
   * Estimate contributions to related files (mock implementation)
   */
  private estimateContributionsToRelatedFiles(
    _profile: TeamMemberProfile,
    _issue: GitHubIssue,
  ): number {
    // In a real implementation, this would analyze the issue description
    // for file paths and check the user's contribution history
    return Math.floor(Math.random() * 10); // Mock value
  }

  /**
   * Generate assignment reasoning
   */
  private generateAssignmentReasoning(
    profile: TeamMemberProfile,
    expertiseMatch: ExpertiseMatch,
    workloadScore: number,
    availabilityScore: number,
    historicalScore: number,
  ): string {
    const reasons: string[] = [];

    if (expertiseMatch.score > 0.7) {
      reasons.push(
        `Strong expertise match (${Math.round(expertiseMatch.score * 100)}%)`,
      );
    } else if (expertiseMatch.score > 0.4) {
      reasons.push(
        `Good expertise match (${Math.round(expertiseMatch.score * 100)}%)`,
      );
    }

    if (workloadScore > 0.7) {
      reasons.push("Low current workload");
    } else if (workloadScore < 0.3) {
      reasons.push("High current workload");
    }

    if (availabilityScore > 0.7) {
      reasons.push("High availability today");
    }

    if (historicalScore > 0.7) {
      reasons.push("Strong historical performance");
    }

    if (expertiseMatch.relevantSkills.length > 0) {
      reasons.push(
        `Relevant skills: ${expertiseMatch.relevantSkills.join(", ")}`,
      );
    }

    return reasons.join(". ");
  }

  /**
   * Update team member workload
   */
  updateWorkload(_username: string, currentIssues: number): void {
    // Mock implementation - in real code would update specific user
    console.log(`Updating workload to ${currentIssues} issues`);
  }

  /**
   * Get team statistics
   */
  getTeamStatistics(): {
    totalMembers: number;
    averageWorkload: number;
    expertiseDistribution: Record<string, number>;
    availabilityStatus: Record<string, number>;
  } {
    const members = Array.from(this.teamMembers.values());
    const totalWorkload = members.reduce(
      (sum, m) => sum + m.workload.currentIssues,
      0,
    );

    const expertiseDistribution: Record<string, number> = {};
    const availabilityStatus: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const member of members) {
      // Aggregate expertise
      for (const [skill, level] of Object.entries(member.expertise)) {
        expertiseDistribution[skill] =
          (expertiseDistribution[skill] || 0) + level;
      }

      // Aggregate availability
      availabilityStatus[member.workload.availability]++;
    }

    return {
      totalMembers: members.length,
      averageWorkload: members.length > 0 ? totalWorkload / members.length : 0,
      expertiseDistribution,
      availabilityStatus,
    };
  }

  /**
   * Generate balanced assignment recommendations for multiple issues
   */
  async recommendBalancedAssignments(
    issues: GitHubIssue[],
  ): Promise<Map<number, AssignmentRecommendation[]>> {
    const recommendations = new Map<number, AssignmentRecommendation[]>();
    const memberAssignmentCounts = new Map<string, number>();

    // Initialize assignment counts
    for (const username of this.teamMembers.keys()) {
      memberAssignmentCounts.set(username, 0);
    }

    // Process issues sorted by priority
    const sortedIssues = issues.sort((a, b) => {
      const priorityOrder: Record<Priority, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      const aPriority = this.classifyIssuePriority(a);
      const bPriority = this.classifyIssuePriority(b);
      return priorityOrder[bPriority] - priorityOrder[aPriority];
    });

    for (const issue of sortedIssues) {
      const issueRecommendations = await this.recommendAssignments(issue, 5);

      // Filter and balance assignments
      const balancedRecommendations = issueRecommendations
        .filter((rec) => {
          const currentAssignments =
            memberAssignmentCounts.get(rec.assignee.login) || 0;
          const maxAssignments = Math.ceil(
            issues.length / this.teamMembers.size,
          );
          return currentAssignments < maxAssignments + 1; // Allow some flexibility
        })
        .slice(0, 3);

      recommendations.set(issue.number, balancedRecommendations);

      // Update assignment counts
      for (const rec of balancedRecommendations) {
        const currentCount =
          memberAssignmentCounts.get(rec.assignee.login) || 0;
        memberAssignmentCounts.set(rec.assignee.login, currentCount + 1);
      }
    }

    return recommendations;
  }

  /**
   * Classify issue priority for sorting
   */
  private classifyIssuePriority(issue: GitHubIssue): Priority {
    const title = issue.title.toLowerCase();
    const body = (issue.body || "").toLowerCase();
    const labels = issue.labels.map((l) => l.name.toLowerCase());

    // Check labels first
    if (labels.some((l) => l.includes("critical") || l.includes("urgent")))
      return "critical";
    if (labels.some((l) => l.includes("high"))) return "high";
    if (labels.some((l) => l.includes("medium"))) return "medium";
    if (labels.some((l) => l.includes("low"))) return "low";

    // Check title and content
    if (
      title.includes("critical") ||
      title.includes("urgent") ||
      body.includes("security")
    )
      return "critical";
    if (title.includes("high") || title.includes("important")) return "high";
    if (title.includes("low") || title.includes("minor")) return "low";

    return "medium";
  }
}
