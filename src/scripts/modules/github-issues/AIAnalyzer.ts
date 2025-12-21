/**
 * AI-powered Issue Analyzer using Google Gemini API
 * Provides intelligent analysis of GitHub issues for categorization, complexity assessment, and recommendations
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  GitHubIssue,
  IssueAnalysis,
  ClassificationResult,
  IssueType,
  Priority,
  EffortEstimate,
  AssignmentRecommendation,
  AIConfig,
  WorkloadInfo,
  ExpertiseMatch,
} from "./types";

export class AIAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.model });
  }

  /**
   * Analyze a GitHub issue using AI
   */
  async analyzeIssue(issue: GitHubIssue): Promise<IssueAnalysis> {
    try {
      // Prepare the prompt for comprehensive analysis
      const prompt = this.buildAnalysisPrompt(issue);

      // Get AI response
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the AI response
      const analysis = this.parseAIResponse(text, issue);

      return analysis;
    } catch (error) {
      console.error("AI analysis failed:", error);
      return this.createFallbackAnalysis(issue, error as Error);
    }
  }

  /**
   * Categorize an issue using AI
   */
  async categorizeIssue(issue: GitHubIssue): Promise<ClassificationResult> {
    try {
      const prompt = this.buildCategorizationPrompt(issue);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseCategorizationResponse(text);
    } catch (error) {
      console.error("Issue categorization failed:", error);
      return this.createFallbackCategorization(issue);
    }
  }

  /**
   * Estimate effort for resolving an issue
   */
  async estimateEffort(issue: GitHubIssue): Promise<EffortEstimate> {
    try {
      const prompt = this.buildEffortEstimationPrompt(issue);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseEffortEstimateResponse(text);
    } catch (error) {
      console.error("Effort estimation failed:", error);
      return this.createFallbackEffortEstimate(issue);
    }
  }

  /**
   * Generate assignment recommendations
   */
  async recommendAssignments(
    issue: GitHubIssue,
    teamMembers: string[],
  ): Promise<AssignmentRecommendation[]> {
    try {
      const prompt = this.buildAssignmentPrompt(issue, teamMembers);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAssignmentResponse(text);
    } catch (error) {
      console.error("Assignment recommendation failed:", error);
      return [];
    }
  }

  /**
   * Build comprehensive analysis prompt
   */
  private buildAnalysisPrompt(issue: GitHubIssue): string {
    return `
You are an expert software project manager and senior developer. Analyze the following GitHub issue and provide a comprehensive assessment.

**Issue Details:**
- Title: ${issue.title}
- Number: #${issue.number}
- State: ${issue.state}
- Labels: ${issue.labels.map((l) => l.name).join(", ") || "None"}
- Created: ${new Date(issue.created_at).toLocaleDateString()}
- Body: ${issue.body || "No description provided"}

**Instructions:**
Provide a detailed analysis in JSON format with the following structure:
{
  "category": "bug|feature|enhancement|documentation|question|maintenance",
  "complexity": "low|medium|high|critical",
  "requirements": ["requirement1", "requirement2", ...],
  "acceptanceCriteria": ["criteria1", "criteria2", ...],
  "feasible": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation of your analysis",
  "classification": {
    "type": "same as category",
    "confidence": 0.0-1.0,
    "labels": ["suggested1", "suggested2", ...],
    "priority": "low|medium|high|critical",
    "reasoning": "Why this classification"
  },
  "estimatedEffort": {
    "hours": number,
    "complexity": "same as complexity",
    "uncertainty": 0.0-1.0,
    "factors": ["factor1", "factor2", ...]
  },
  "suggestedAssignees": [] // Will be populated separately
}

**Analysis Criteria:**
1. **Category**: Based on the nature of the request
2. **Complexity**: Consider technical difficulty, scope, and dependencies
3. **Requirements**: Extract specific deliverables needed
4. **Acceptance Criteria**: Conditions that must be met for resolution
5. **Feasibility**: Can this be implemented with reasonable effort?
6. **Effort**: Estimate in hours considering research, implementation, testing, and review
7. **Uncertainty**: How confident are you in the estimate (0=very certain, 1=very uncertain)

Focus on providing actionable insights that would help a development team triage and plan the work effectively.`;
  }

  /**
   * Build categorization prompt
   */
  private buildCategorizationPrompt(issue: GitHubIssue): string {
    return `
Categorize this GitHub issue and provide classification details.

**Issue:**
Title: ${issue.title}
Body: ${issue.body || "No description"}
Labels: ${issue.labels.map((l) => l.name).join(", ") || "None"}

**Response Format (JSON):**
{
  "type": "bug|feature|enhancement|documentation|question|maintenance",
  "confidence": 0.0-1.0,
  "labels": ["suggested1", "suggested2", "suggested3"],
  "priority": "low|medium|high|critical",
  "reasoning": "Explanation for this categorization"
}

Consider the title, content, and any existing labels to determine the most appropriate category.`;
  }

  /**
   * Build effort estimation prompt
   */
  private buildEffortEstimationPrompt(issue: GitHubIssue): string {
    return `
Estimate the effort required to resolve this GitHub issue.

**Issue:**
Title: ${issue.title}
Body: ${issue.body || "No description"}
Labels: ${issue.labels.map((l) => l.name).join(", ") || "None"}

**Response Format (JSON):**
{
  "hours": number,
  "complexity": "low|medium|high|critical",
  "uncertainty": 0.0-1.0,
  "factors": ["factor1", "factor2", "factor3"]
}

Consider:
- Research and planning time
- Implementation complexity
- Testing requirements
- Code review process
- Documentation needs
- Potential risks and dependencies

Hours should be a realistic estimate for an experienced developer.`;
  }

  /**
   * Build assignment recommendation prompt
   */
  private buildAssignmentPrompt(
    issue: GitHubIssue,
    teamMembers: string[],
  ): string {
    return `
Recommend the best assignee for this GitHub issue from the available team members.

**Issue:**
Title: ${issue.title}
Body: ${issue.body || "No description"}
Labels: ${issue.labels.map((l) => l.name).join(", ") || "None"}

**Available Team Members:** ${teamMembers.join(", ")}

**Response Format (JSON Array):**
[
  {
    "assignee": "username",
    "confidence": 0.0-1.0,
    "reasoning": "Why this person is a good fit",
    "expertise": {
      "score": 0.0-1.0,
      "relevantSkills": ["skill1", "skill2"],
      "historicalPerformance": 0.0-1.0,
      "contributionsToRelatedFiles": number
    },
    "workload": {
      "currentIssues": number,
      "totalAssignments": number,
      "averageResolutionTime": number,
      "availability": "high|medium|low"
    }
  }
]

Consider:
- Technical skills and experience
- Past performance on similar issues
- Current workload and availability
- Expertise in relevant code areas
- Historical contribution patterns

Rank by overall suitability, not just availability.`;
  }

  /**
   * Parse AI analysis response
   */
  private parseAIResponse(text: string, issue: GitHubIssue): IssueAnalysis {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        category: this.validateEnum(
          parsed.category,
          [
            "bug",
            "feature",
            "enhancement",
            "documentation",
            "question",
            "maintenance",
            "unknown",
          ],
          "unknown",
        ) as IssueType,
        complexity: this.validateEnum(
          parsed.complexity,
          ["low", "medium", "high", "critical"],
          "medium",
        ) as Priority,
        requirements: Array.isArray(parsed.requirements)
          ? parsed.requirements
          : [],
        acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria)
          ? parsed.acceptanceCriteria
          : [],
        feasible: typeof parsed.feasible === "boolean" ? parsed.feasible : true,
        confidence:
          typeof parsed.confidence === "number"
            ? Math.max(0, Math.min(1, parsed.confidence))
            : 0.5,
        reasoning:
          typeof parsed.reasoning === "string"
            ? parsed.reasoning
            : "AI analysis completed",
        classification: parsed.classification || {
          type: parsed.category || "unknown",
          confidence: 0.5,
          labels: [],
          priority: "medium",
          reasoning: "Default classification",
        },
        estimatedEffort: parsed.estimatedEffort || {
          hours: 8,
          complexity: parsed.complexity || "medium",
          uncertainty: 0.3,
          factors: ["Standard estimation"],
        },
        suggestedAssignees: Array.isArray(parsed.suggestedAssignees)
          ? parsed.suggestedAssignees
          : [],
      };
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return this.createFallbackAnalysis(issue, error as Error);
    }
  }

  /**
   * Parse categorization response
   */
  private parseCategorizationResponse(text: string): ClassificationResult {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in categorization response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        type: this.validateEnum(
          parsed.type,
          [
            "bug",
            "feature",
            "enhancement",
            "documentation",
            "question",
            "maintenance",
            "unknown",
          ],
          "unknown",
        ) as IssueType,
        confidence:
          typeof parsed.confidence === "number"
            ? Math.max(0, Math.min(1, parsed.confidence))
            : 0.5,
        labels: Array.isArray(parsed.labels) ? parsed.labels : [],
        priority: this.validateEnum(
          parsed.priority,
          ["low", "medium", "high", "critical"],
          "medium",
        ) as Priority,
        reasoning:
          typeof parsed.reasoning === "string"
            ? parsed.reasoning
            : "Categorization completed",
      };
    } catch (error) {
      console.error("Failed to parse categorization response:", error);
      return {
        type: "unknown",
        confidence: 0.1,
        labels: [],
        priority: "medium",
        reasoning: "Failed to parse AI categorization response",
      };
    }
  }

  /**
   * Parse effort estimation response
   */
  private parseEffortEstimateResponse(text: string): EffortEstimate {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in effort estimation response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        hours:
          typeof parsed.hours === "number" ? Math.max(0.5, parsed.hours) : 8,
        complexity: this.validateEnum(
          parsed.complexity,
          ["low", "medium", "high", "critical"],
          "medium",
        ) as Priority,
        uncertainty:
          typeof parsed.uncertainty === "number"
            ? Math.max(0, Math.min(1, parsed.uncertainty))
            : 0.3,
        factors: Array.isArray(parsed.factors)
          ? parsed.factors
          : ["Standard estimation"],
      };
    } catch (error) {
      console.error("Failed to parse effort estimation response:", error);
      return {
        hours: 8,
        complexity: "medium",
        uncertainty: 0.5,
        factors: ["Failed to parse AI response"],
      };
    }
  }

  /**
   * Parse assignment recommendation response
   */
  private parseAssignmentResponse(text: string): AssignmentRecommendation[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in assignment response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((rec) => ({
        assignee: {
          id: 0,
          login: rec.assignee || "unknown",
          name: null,
          email: null,
          avatar_url: "",
          type: "User",
          site_admin: false,
        },
        confidence:
          typeof rec.confidence === "number"
            ? Math.max(0, Math.min(1, rec.confidence))
            : 0.5,
        reasoning:
          typeof rec.reasoning === "string"
            ? rec.reasoning
            : "Assignment recommendation",
        workload: rec.workload || {
          currentIssues: 0,
          totalAssignments: 0,
          averageResolutionTime: 0,
          availability: "medium" as const,
        },
        expertise: rec.expertise || {
          score: 0.5,
          relevantSkills: [],
          historicalPerformance: 0.5,
          contributionsToRelatedFiles: 0,
        },
      }));
    } catch (error) {
      console.error("Failed to parse assignment response:", error);
      return [];
    }
  }

  /**
   * Validate enum values
   */
  private validateEnum(
    value: any,
    validValues: string[],
    defaultValue: string,
  ): string {
    if (typeof value !== "string") {
      return defaultValue;
    }
    const lowerValue = value.toLowerCase();
    return validValues.includes(lowerValue) ? lowerValue : defaultValue;
  }

  /**
   * Create fallback analysis when AI fails
   */
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
      reasoning: `AI analysis failed: ${error.message}. Issue requires human review.`,
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
        factors: ["AI analysis failed"],
      },
      suggestedAssignees: [],
    };
  }

  /**
   * Create fallback categorization
   */
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

  /**
   * Create fallback effort estimate
   */
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

  /**
   * Simple label-based categorization fallback
   */
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
