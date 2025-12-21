/**
 * Task Classifier
 * AI-powered task classification with multiple models and confidence scoring
 */

import { GeminiService } from "../../gemini/GeminiService";
import type {
  TaskInput,
  TaskClassification,
  TaskFeatures,
  AnalysisContext,
} from "./types";
import { TaskCategory, ComplexityLevel, EffortEstimate } from "./types";

/**
 * Task Classifier Class
 */
export class TaskClassifier {
  private geminiService: GeminiService;
  private categoryKeywords: Map<TaskCategory, string[]>;
  private complexityIndicators: Map<ComplexityLevel, string[]>;
  private effortPatterns: Map<EffortEstimate, RegExp[]>;
  private stats: ClassificationStats;

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
    this.stats = {
      totalClassifications: 0,
      accurateClassifications: 0,
      averageConfidence: 0,
      modelUsage: new Map(),
    };
    this.initializeClassificationModels();
  }

  /**
   * Classify a task using multiple approaches
   */
  async classifyTask(
    task: TaskInput,
    features: TaskFeatures,
    context: AnalysisContext,
  ): Promise<TaskClassification> {
    const startTime = Date.now();

    try {
      console.log(`Classifying task: ${task.id}`);

      // Run multiple classification approaches
      const [keywordResult, aiResult, patternResult] = await Promise.all([
        this.classifyByKeywords(task, features),
        this.classifyByAI(task, context),
        this.classifyByPattern(task, features),
      ]);

      // Combine results using weighted voting
      const combinedResult = this.combineClassificationResults(
        keywordResult,
        aiResult,
        patternResult,
        features,
      );

      // Enhance with additional analysis
      const enhancedResult = await this.enhanceClassification(
        combinedResult,
        task,
        features,
        context,
      );

      this.stats.totalClassifications++;
      this.updateStats(enhancedResult);

      const processingTime = Date.now() - startTime;
      console.log(`Task classification completed in ${processingTime}ms`);

      return enhancedResult;
    } catch (error) {
      console.error("Task classification failed:", error);

      // Fallback classification
      return this.getFallbackClassification(task, features);
    }
  }

  /**
   * Classify task using keyword-based approach
   */
  private async classifyByKeywords(
    task: TaskInput,
    features: TaskFeatures,
  ): Promise<PartialTaskClassification> {
    const text = `${task.title} ${task.description}`.toLowerCase();
    const scores: Map<TaskCategory, number> = new Map();

    // Score each category based on keyword matches
    for (const [category, keywords] of this.categoryKeywords) {
      let score = 0;

      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, "gi");
        const matches = text.match(regex);
        if (matches) {
          score += matches.length;
        }
      }

      scores.set(category, score);
    }

    // Find best category
    let bestCategory = TaskCategory.FEATURE_DEVELOPMENT;
    let bestScore = 0;

    for (const [category, score] of scores) {
      if (score > bestScore) {
        bestCategory = category;
        bestScore = score;
      }
    }

    const confidence = Math.min(bestScore / 5, 1); // Normalize to 0-1

    return {
      category: bestCategory,
      confidence: confidence > 0.3 ? confidence : 0.5,
      approach: "keyword",
    };
  }

  /**
   * Classify task using AI analysis
   */
  private async classifyByAI(
    task: TaskInput,
    context: AnalysisContext,
  ): Promise<PartialTaskClassification> {
    try {
      const prompt = `
Task Title: ${task.title}
Task Description: ${task.description}
Labels: ${task.labels.join(", ")}
Priority: ${task.priority}

Project Context:
- Technologies: ${context.project.technology.join(", ")}
- Goals: ${context.project.goals.join(", ")}
- Team Size: ${context.team.members.length}

Analyze this task and provide:
1. Task category (feature_development, bug_fix, refactoring, documentation, testing, maintenance, research, performance, security, integration)
2. Complexity level (simple, moderate, complex, very_complex)
3. Effort estimate (very_low, low, medium, high, very_high)
4. Risk level (low, medium, high, critical)
5. Reasoning for classification

Respond with JSON in this format:
{
  "category": "category_name",
  "complexity": "complexity_level",
  "effort": "effort_estimate",
  "riskLevel": "risk_level",
  "reasoning": "detailed explanation",
  "confidence": 0.85
}
      `;

      const response = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.3,
      });

      const parsed = JSON.parse(response);

      return {
        category: this.mapToTaskCategory(parsed.category),
        complexity: this.mapToComplexityLevel(parsed.complexity),
        effort: this.mapToEffortEstimate(parsed.effort),
        riskLevel: parsed.riskLevel || "medium",
        confidence: parsed.confidence || 0.7,
        reasoning: parsed.reasoning || "AI classification",
        approach: "ai",
      };
    } catch (error) {
      console.error("AI classification failed:", error);
      return {
        category: TaskCategory.FEATURE_DEVELOPMENT,
        confidence: 0.3,
        approach: "ai-fallback",
      };
    }
  }

  /**
   * Classify task using pattern matching
   */
  private async classifyByPattern(
    task: TaskInput,
    features: TaskFeatures,
  ): Promise<PartialTaskClassification> {
    const text = `${task.title} ${task.description}`.toLowerCase();
    let effort: EffortEstimate = EffortEstimate.MEDIUM;
    let maxScore = 0;

    // Score each effort pattern
    for (const [effortLevel, patterns] of this.effortPatterns) {
      let score = 0;

      for (const pattern of patterns) {
        if (pattern.test(text)) {
          score += 1;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        effort = effortLevel;
      }
    }

    // Determine complexity based on text features
    let complexity: ComplexityLevel = ComplexityLevel.MODERATE;

    if (
      features.textFeatures.technicalTerms > 10 ||
      features.textFeatures.wordCount > 200
    ) {
      complexity = ComplexityLevel.VERY_COMPLEX;
    } else if (
      features.textFeatures.technicalTerms > 5 ||
      features.textFeatures.wordCount > 100
    ) {
      complexity = ComplexityLevel.COMPLEX;
    } else if (
      features.textFeatures.wordCount < 50 &&
      features.textFeatures.technicalTerms < 3
    ) {
      complexity = ComplexityLevel.SIMPLE;
    }

    // Infer category from patterns
    let category = TaskCategory.FEATURE_DEVELOPMENT;

    if (/bug|fix|error|crash|issue/.test(text)) {
      category = TaskCategory.BUG_FIX;
    } else if (/refactor|improve|optimize|cleanup/.test(text)) {
      category = TaskCategory.REFACTORING;
    } else if (/test|spec|coverage|unit|integration/.test(text)) {
      category = TaskCategory.TESTING;
    } else if (/doc|document|readme|guide/.test(text)) {
      category = TaskCategory.DOCUMENTATION;
    } else if (/security|auth|vulnerability|permission/.test(text)) {
      category = TaskCategory.SECURITY;
    }

    const confidence = maxScore > 0 ? 0.6 + maxScore / 10 : 0.4;

    return {
      category,
      complexity,
      effort,
      confidence: Math.min(confidence, 0.8),
      approach: "pattern",
    };
  }

  /**
   * Combine multiple classification results
   */
  private combineClassificationResults(
    keywordResult: PartialTaskClassification,
    aiResult: PartialTaskClassification,
    patternResult: PartialTaskClassification,
    features: TaskFeatures,
  ): TaskClassification {
    // Weight the different approaches
    const weights = {
      ai: 0.5,
      keyword: 0.2,
      pattern: 0.3,
    };

    // Combine category votes
    const categoryVotes = new Map<TaskCategory, number>();

    this.addVote(
      categoryVotes,
      keywordResult.category,
      weights.keyword * keywordResult.confidence,
    );
    this.addVote(
      categoryVotes,
      aiResult.category,
      weights.ai * aiResult.confidence,
    );
    this.addVote(
      categoryVotes,
      patternResult.category,
      weights.pattern * patternResult.confidence,
    );

    const bestCategory = this.getHighestVote(categoryVotes);

    // Combine complexity
    const complexityVotes = new Map<ComplexityLevel, number>();

    if (aiResult.complexity) {
      this.addVote(
        complexityVotes,
        aiResult.complexity,
        weights.ai * aiResult.confidence,
      );
    }
    if (patternResult.complexity) {
      this.addVote(
        complexityVotes,
        patternResult.complexity,
        weights.pattern * patternResult.confidence,
      );
    }

    const bestComplexity =
      aiResult.complexity ||
      patternResult.complexity ||
      ComplexityLevel.MODERATE;

    // Combine effort
    const effortVotes = new Map<EffortEstimate, number>();

    if (aiResult.effort) {
      this.addVote(
        effortVotes,
        aiResult.effort,
        weights.ai * aiResult.confidence,
      );
    }
    if (patternResult.effort) {
      this.addVote(
        effortVotes,
        patternResult.effort,
        weights.pattern * patternResult.confidence,
      );
    }

    const bestEffort =
      aiResult.effort || patternResult.effort || EffortEstimate.MEDIUM;

    // Calculate combined confidence
    const combinedConfidence =
      aiResult.confidence * weights.ai +
      keywordResult.confidence * weights.keyword +
      patternResult.confidence * weights.pattern;

    // Generate combined reasoning
    const reasoning = `Combined classification using AI (${aiResult.confidence.toFixed(2)}), keywords (${keywordResult.confidence.toFixed(2)}), and patterns (${patternResult.confidence.toFixed(2)})`;

    return {
      category: bestCategory,
      confidence: combinedConfidence,
      tags: this.extractTags(features.textFeatures),
      complexity: bestComplexity,
      effort: bestEffort,
      estimatedHours: this.estimateHours(bestEffort, bestComplexity),
      riskLevel: aiResult.riskLevel || this.assessRiskLevel(features),
      reasoning,
      features,
    };
  }

  /**
   * Enhance classification with additional analysis
   */
  private async enhanceClassification(
    classification: TaskClassification,
    task: TaskInput,
    features: TaskFeatures,
    context: AnalysisContext,
  ): Promise<TaskClassification> {
    // Adjust complexity based on team skills
    const skillMatch = this.assessSkillMatch(classification, context);

    if (skillMatch < 0.5) {
      // Increase complexity if team lacks required skills
      const complexityLevels = [
        ComplexityLevel.SIMPLE,
        ComplexityLevel.MODERATE,
        ComplexityLevel.COMPLEX,
        ComplexityLevel.VERY_COMPLEX,
      ];
      const currentIndex = complexityLevels.indexOf(classification.complexity);

      if (currentIndex < complexityLevels.length - 1) {
        classification.complexity = complexityLevels[currentIndex + 1];
        classification.reasoning += " (increased due to skill gap)";
      }
    }

    // Adjust effort based on team workload
    const workloadPressure =
      context.team.workload.total / context.team.members.length;

    if (workloadPressure > 5) {
      // Increase effort if team is overloaded
      const effortLevels = [
        EffortEstimate.VERY_LOW,
        EffortEstimate.LOW,
        EffortEstimate.MEDIUM,
        EffortEstimate.HIGH,
        EffortEstimate.VERY_HIGH,
      ];
      const currentIndex = effortLevels.indexOf(classification.effort);

      if (currentIndex < effortLevels.length - 1) {
        classification.effort = effortLevels[currentIndex + 1];
        classification.reasoning += " (increased due to high workload)";
      }
    }

    // Enhance tags with project-specific tags
    classification.tags.push(...this.generateProjectTags(task, context));

    return classification;
  }

  /**
   * Initialize classification models and patterns
   */
  private initializeClassificationModels(): void {
    // Category keywords
    this.categoryKeywords = new Map([
      [
        TaskCategory.FEATURE_DEVELOPMENT,
        [
          "feature",
          "implement",
          "add",
          "create",
          "build",
          "develop",
          "new",
          "enhance",
        ],
      ],
      [
        TaskCategory.BUG_FIX,
        [
          "bug",
          "fix",
          "error",
          "issue",
          "crash",
          "problem",
          "broken",
          "defect",
          "incorrect",
        ],
      ],
      [
        TaskCategory.REFACTORING,
        [
          "refactor",
          "improve",
          "optimize",
          "cleanup",
          "restructure",
          "reorganize",
          "simplify",
        ],
      ],
      [
        TaskCategory.DOCUMENTATION,
        [
          "doc",
          "document",
          "readme",
          "guide",
          "manual",
          "tutorial",
          "wiki",
          "help",
        ],
      ],
      [
        TaskCategory.TESTING,
        [
          "test",
          "spec",
          "coverage",
          "unit",
          "integration",
          "e2e",
          "automated",
          "verify",
        ],
      ],
      [
        TaskCategory.MAINTENANCE,
        [
          "maintain",
          "update",
          "upgrade",
          "patch",
          "service",
          "support",
          "monitor",
        ],
      ],
      [
        TaskCategory.RESEARCH,
        [
          "research",
          "investigate",
          "explore",
          "study",
          "analyze",
          "evaluate",
          "prototype",
        ],
      ],
      [
        TaskCategory.PERFORMANCE,
        [
          "performance",
          "speed",
          "slow",
          "optimize",
          "benchmark",
          "latency",
          "memory",
        ],
      ],
      [
        TaskCategory.SECURITY,
        [
          "security",
          "auth",
          "authentication",
          "authorization",
          "vulnerability",
          "permission",
          "secure",
        ],
      ],
      [
        TaskCategory.INTEGRATION,
        [
          "integrate",
          "connect",
          "api",
          "webhook",
          "sync",
          "interface",
          "bridge",
        ],
      ],
    ]);

    // Complexity indicators
    this.complexityIndicators = new Map([
      [
        ComplexityLevel.SIMPLE,
        ["simple", "basic", "minor", "small", "quick", "easy", "trivial"],
      ],
      [
        ComplexityLevel.MODERATE,
        ["moderate", "standard", "normal", "regular", "typical"],
      ],
      [
        ComplexityLevel.COMPLEX,
        ["complex", "challenging", "difficult", "involved", "detailed"],
      ],
      [
        ComplexityLevel.VERY_COMPLEX,
        [
          "very complex",
          "extremely",
          "highly",
          "advanced",
          "sophisticated",
          "enterprise",
        ],
      ],
    ]);

    // Effort estimation patterns
    this.effortPatterns = new Map([
      [
        EffortEstimate.VERY_LOW,
        [/\b(quick|simple|minor|trivial|small|tiny)\b/gi],
      ],
      [
        EffortEstimate.LOW,
        [/\b(easy|basic|simple|quick|minor)\b/gi, /\b(1|one)\s+hour/gi],
      ],
      [
        EffortEstimate.MEDIUM,
        [
          /\b(moderate|standard|normal|regular)\b/gi,
          /\b([2-8]|two|three|four|five|six|seven|eight)\s+hours?/gi,
        ],
      ],
      [
        EffortEstimate.HIGH,
        [
          /\b(complex|challenging|difficult|involved)\b/gi,
          /\b([1-2][0-9]|one|two|ten|fifteen|twenty)\s+hours?/gi,
        ],
      ],
      [
        EffortEstimate.VERY_HIGH,
        [
          /\b(very complex|extremely|highly|advanced|major|significant)\b/gi,
          /\b(([3-9][0-9])|(\d{3,}))\s+hours?/gi,
        ],
      ],
    ]);
  }

  /**
   * Helper methods
   */
  private addVote<T>(votes: Map<T, number>, key: T, weight: number): void {
    votes.set(key, (votes.get(key) || 0) + weight);
  }

  private getHighestVote<T>(votes: Map<T, number>): T {
    let highest: T | null = null;
    let highestScore = 0;

    for (const [key, score] of votes) {
      if (score > highestScore) {
        highest = key;
        highestScore = score;
      }
    }

    return highest as T;
  }

  private mapToTaskCategory(category: string): TaskCategory {
    const categoryMap: Record<string, TaskCategory> = {
      feature_development: TaskCategory.FEATURE_DEVELOPMENT,
      bug_fix: TaskCategory.BUG_FIX,
      refactoring: TaskCategory.REFACTORING,
      documentation: TaskCategory.DOCUMENTATION,
      testing: TaskCategory.TESTING,
      maintenance: TaskCategory.MAINTENANCE,
      research: TaskCategory.RESEARCH,
      performance: TaskCategory.PERFORMANCE,
      security: TaskCategory.SECURITY,
      integration: TaskCategory.INTEGRATION,
    };

    return categoryMap[category] || TaskCategory.FEATURE_DEVELOPMENT;
  }

  private mapToComplexityLevel(complexity: string): ComplexityLevel {
    const complexityMap: Record<string, ComplexityLevel> = {
      simple: ComplexityLevel.SIMPLE,
      moderate: ComplexityLevel.MODERATE,
      complex: ComplexityLevel.COMPLEX,
      very_complex: ComplexityLevel.VERY_COMPLEX,
    };

    return complexityMap[complexity] || ComplexityLevel.MODERATE;
  }

  private mapToEffortEstimate(effort: string): EffortEstimate {
    const effortMap: Record<string, EffortEstimate> = {
      very_low: EffortEstimate.VERY_LOW,
      low: EffortEstimate.LOW,
      medium: EffortEstimate.MEDIUM,
      high: EffortEstimate.HIGH,
      very_high: EffortEstimate.VERY_HIGH,
    };

    return effortMap[effort] || EffortEstimate.MEDIUM;
  }

  private extractTags(textFeatures: TaskFeatures["textFeatures"]): string[] {
    const tags: string[] = [];

    if (textFeatures.urgencyKeywords > 0) {
      tags.push("urgent");
    }

    if (textFeatures.technicalTerms > 10) {
      tags.push("technical");
    }

    if (textFeatures.sentiment < -0.3) {
      tags.push("negative_sentiment");
    }

    return tags;
  }

  private estimateHours(
    effort: EffortEstimate,
    complexity: ComplexityLevel,
  ): number {
    const effortHours: Record<EffortEstimate, number> = {
      very_low: 2,
      low: 6,
      medium: 12,
      high: 24,
      very_high: 40,
    };

    const complexityMultiplier: Record<ComplexityLevel, number> = {
      simple: 0.8,
      moderate: 1.0,
      complex: 1.3,
      very_complex: 1.6,
    };

    return Math.round(effortHours[effort] * complexityMultiplier[complexity]);
  }

  private assessRiskLevel(
    features: TaskFeatures,
  ): "low" | "medium" | "high" | "critical" {
    if (features.textFeatures.urgencyKeywords > 3) return "critical";
    if (features.textFeatures.urgencyKeywords > 1) return "high";
    if (features.contextualFeatures.resourcePressure > 7) return "high";
    if (features.contextualFeatures.deadlinePressure > 6) return "medium";
    return "low";
  }

  private assessSkillMatch(
    classification: TaskClassification,
    context: AnalysisContext,
  ): number {
    // Simple skill match assessment
    // In a real system, this would be more sophisticated
    const requiredSkills = this.getRequiredSkillsForCategory(
      classification.category,
    );
    const availableSkills = context.team.skills.map((s) => s.skill);

    const matches = requiredSkills.filter((skill) =>
      availableSkills.includes(skill),
    );
    return matches.length / Math.max(requiredSkills.length, 1);
  }

  private getRequiredSkillsForCategory(category: TaskCategory): string[] {
    const skillMap: Record<TaskCategory, string[]> = {
      [TaskCategory.FEATURE_DEVELOPMENT]: ["frontend", "backend", "database"],
      [TaskCategory.BUG_FIX]: ["frontend", "backend", "debugging"],
      [TaskCategory.REFACTORING]: ["frontend", "backend", "architecture"],
      [TaskCategory.DOCUMENTATION]: ["technical_writing", "documentation"],
      [TaskCategory.TESTING]: ["testing", "automation", "quality_assurance"],
      [TaskCategory.MAINTENANCE]: ["devops", "monitoring", "support"],
      [TaskCategory.RESEARCH]: ["research", "analysis", "investigation"],
      [TaskCategory.PERFORMANCE]: ["performance", "optimization", "monitoring"],
      [TaskCategory.SECURITY]: ["security", "authentication", "authorization"],
      [TaskCategory.INTEGRATION]: ["api", "integration", "backend"],
    };

    return skillMap[category] || [];
  }

  private generateProjectTags(
    task: TaskInput,
    context: AnalysisContext,
  ): string[] {
    const tags: string[] = [];

    // Add technology tags
    for (const tech of context.project.technology) {
      if (
        task.title.toLowerCase().includes(tech.toLowerCase()) ||
        task.description.toLowerCase().includes(tech.toLowerCase())
      ) {
        tags.push(tech.toLowerCase());
      }
    }

    // Add milestone-based tags
    if (context.constraints.time.milestones.length > 0) {
      tags.push("milestone");
    }

    return tags;
  }

  private getFallbackClassification(
    task: TaskInput,
    features: TaskFeatures,
  ): TaskClassification {
    return {
      category: TaskCategory.FEATURE_DEVELOPMENT,
      confidence: 0.5,
      tags: ["fallback"],
      complexity: ComplexityLevel.MODERATE,
      effort: EffortEstimate.MEDIUM,
      estimatedHours: 8,
      riskLevel: "medium",
      reasoning: "Fallback classification due to analysis failure",
      features,
    };
  }

  private updateStats(classification: TaskClassification): void {
    this.stats.averageConfidence =
      (this.stats.averageConfidence * (this.stats.totalClassifications - 1) +
        classification.confidence) /
      this.stats.totalClassifications;
  }

  /**
   * Get classifier statistics
   */
  getStats(): ClassificationStats {
    return { ...this.stats };
  }

  /**
   * Clear cache and reset stats
   */
  async clearCache(): Promise<void> {
    // Reset stats
    this.stats = {
      totalClassifications: 0,
      accurateClassifications: 0,
      averageConfidence: 0,
      modelUsage: new Map(),
    };
  }

  /**
   * Destroy the classifier
   */
  destroy(): void {
    // Cleanup resources
    this.categoryKeywords.clear();
    this.complexityIndicators.clear();
    this.effortPatterns.clear();
  }
}

/**
 * Interfaces
 */
interface ClassificationStats {
  totalClassifications: number;
  accurateClassifications: number;
  averageConfidence: number;
  modelUsage: Map<string, number>;
}

interface PartialTaskClassification {
  category: TaskCategory;
  complexity?: ComplexityLevel;
  effort?: EffortEstimate;
  riskLevel?: "low" | "medium" | "high" | "critical";
  confidence: number;
  reasoning?: string;
  approach: string;
}
