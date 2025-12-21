/**
 * Requirement Analyzer
 * Extracts and analyzes requirements from tasks using AI and pattern matching
 */

import { GeminiService } from "../../gemini/GeminiService";
import type {
  TaskInput,
  TaskFeatures,
  AnalysisContext,
  RequirementAnalysis,
  Requirement,
} from "./types";
import { RequirementCategory, EffortEstimate, ComplexityLevel } from "./types";

/**
 * Requirement Analyzer Class
 */
export class RequirementAnalyzer {
  private geminiService: GeminiService;
  private requirementPatterns: Map<RequirementCategory, RegExp[]>;
  private stats: RequirementStats;

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
    this.stats = {
      totalAnalyses: 0,
      averageAnalysisTime: 0,
      requirementsFound: 0,
      gapsIdentified: 0,
    };
    this.initializeRequirementPatterns();
  }

  /**
   * Analyze requirements for a task
   */
  async analyzeRequirements(
    task: TaskInput,
    features: TaskFeatures,
    context: AnalysisContext,
  ): Promise<RequirementAnalysis> {
    const startTime = Date.now();

    try {
      console.log(`Analyzing requirements for task: ${task.id}`);

      // Extract requirements using multiple approaches
      const [functional, nonFunctional, technical, business, gaps] =
        await Promise.all([
          this.extractFunctionalRequirements(task, context),
          this.extractNonFunctionalRequirements(task, context),
          this.extractTechnicalRequirements(task, context),
          this.extractBusinessRequirements(task, context),
          this.identifyRequirementGaps(task, context),
        ]);

      const analysis: RequirementAnalysis = {
        functional,
        nonFunctional,
        technical,
        business,
        gaps,
      };

      // Update stats
      const analysisTime = Date.now() - startTime;
      this.updateStats(analysisTime, analysis);

      console.log(`Requirement analysis completed in ${analysisTime}ms`);
      return analysis;
    } catch (error) {
      console.error("Requirement analysis failed:", error);
      throw new Error(
        `Requirement analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Extract functional requirements
   */
  private async extractFunctionalRequirements(
    task: TaskInput,
    context: AnalysisContext,
  ): Promise<Requirement[]> {
    const requirements: Requirement[] = [];

    try {
      const prompt = `
Task Title: ${task.title}
Task Description: ${task.description}
Priority: ${task.priority}
Labels: ${task.labels.join(", ")}

Extract all functional requirements from this task. Functional requirements define WHAT the system should do.

Respond with JSON array of requirements in this format:
[
  {
    "id": "FR-001",
    "description": "Clear description of what the system should do",
    "priority": "high",
    "acceptanceCriteria": ["Criteria 1", "Criteria 2"],
    "effort": "medium",
    "complexity": "moderate"
  }
]

Focus on:
- User actions and behaviors
- System responses and outputs
- Data processing requirements
- Business rules and logic
- User interface requirements
      `;

      const response = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.3,
      });

      const parsedRequirements = JSON.parse(response);

      for (let i = 0; i < parsedRequirements.length; i++) {
        const req = parsedRequirements[i];
        requirements.push({
          id: req.id || `FR-${String(i + 1).padStart(3, "0")}`,
          description: req.description || "Functional requirement",
          priority: this.mapPriority(req.priority),
          category: RequirementCategory.FUNCTIONAL,
          source: "ai-analysis",
          acceptanceCriteria: req.acceptanceCriteria || [],
          effort: this.mapEffort(req.effort),
          complexity: this.mapComplexity(req.complexity),
        });
      }
    } catch (error) {
      console.error("Functional requirements extraction failed:", error);
    }

    // Fallback to pattern-based extraction
    if (requirements.length === 0) {
      requirements.push(
        ...this.extractRequirementsByPattern(
          task,
          RequirementCategory.FUNCTIONAL,
          context,
        ),
      );
    }

    return requirements;
  }

  /**
   * Extract non-functional requirements
   */
  private async extractNonFunctionalRequirements(
    task: TaskInput,
    context: AnalysisContext,
  ): Promise<Requirement[]> {
    const requirements: Requirement[] = [];

    try {
      const prompt = `
Task Title: ${task.title}
Task Description: ${task.description}
Priority: ${task.priority}
Labels: ${task.labels.join(", ")}

Extract all non-functional requirements from this task. Non-functional requirements define HOW the system should perform.

Focus on:
- Performance (speed, response time, throughput)
- Security (authentication, authorization, data protection)
- Reliability (availability, error handling, recovery)
- Usability (user experience, accessibility)
- Scalability (handling load, growth capacity)
- Maintainability (code quality, documentation)

Respond with JSON array in the same format as functional requirements.
      `;

      const response = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.3,
      });

      const parsedRequirements = JSON.parse(response);

      for (let i = 0; i < parsedRequirements.length; i++) {
        const req = parsedRequirements[i];
        requirements.push({
          id: req.id || `NFR-${String(i + 1).padStart(3, "0")}`,
          description: req.description || "Non-functional requirement",
          priority: this.mapPriority(req.priority),
          category: RequirementCategory.NON_FUNCTIONAL,
          source: "ai-analysis",
          acceptanceCriteria: req.acceptanceCriteria || [],
          effort: this.mapEffort(req.effort),
          complexity: this.mapComplexity(req.complexity),
        });
      }
    } catch (error) {
      console.error("Non-functional requirements extraction failed:", error);
    }

    // Fallback to pattern-based extraction
    if (requirements.length === 0) {
      requirements.push(
        ...this.extractRequirementsByPattern(
          task,
          RequirementCategory.NON_FUNCTIONAL,
          context,
        ),
      );
    }

    return requirements;
  }

  /**
   * Extract technical requirements
   */
  private async extractTechnicalRequirements(
    task: TaskInput,
    context: AnalysisContext,
  ): Promise<Requirement[]> {
    const requirements: Requirement[] = [];

    try {
      const prompt = `
Task Title: ${task.title}
Task Description: ${task.description}
Priority: ${task.priority}
Labels: ${task.labels.join(", ")}

Extract all technical requirements from this task. Technical requirements define technical specifications and constraints.

Focus on:
- Technology stack requirements
- Database requirements
- API requirements
- Integration requirements
- Infrastructure requirements
- Code quality and standards
- Testing requirements

Respond with JSON array in the same format as functional requirements.
      `;

      const response = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.3,
      });

      const parsedRequirements = JSON.parse(response);

      for (let i = 0; i < parsedRequirements.length; i++) {
        const req = parsedRequirements[i];
        requirements.push({
          id: req.id || `TR-${String(i + 1).padStart(3, "0")}`,
          description: req.description || "Technical requirement",
          priority: this.mapPriority(req.priority),
          category: RequirementCategory.TECHNICAL,
          source: "ai-analysis",
          acceptanceCriteria: req.acceptanceCriteria || [],
          effort: this.mapEffort(req.effort),
          complexity: this.mapComplexity(req.complexity),
        });
      }
    } catch (error) {
      console.error("Technical requirements extraction failed:", error);
    }

    // Fallback to pattern-based extraction
    if (requirements.length === 0) {
      requirements.push(
        ...this.extractRequirementsByPattern(
          task,
          RequirementCategory.TECHNICAL,
          context,
        ),
      );
    }

    return requirements;
  }

  /**
   * Extract business requirements
   */
  private async extractBusinessRequirements(
    task: TaskInput,
    context: AnalysisContext,
  ): Promise<Requirement[]> {
    const requirements: Requirement[] = [];

    try {
      const prompt = `
Task Title: ${task.title}
Task Description: ${task.description}
Priority: ${task.priority}
Labels: ${task.labels.join(", ")}

Extract all business requirements from this task. Business requirements define business objectives and constraints.

Focus on:
- Business goals and objectives
- Stakeholder requirements
- Compliance and regulatory requirements
- Cost and budget considerations
- Timeline constraints
- Business processes and workflows

Respond with JSON array in the same format as functional requirements.
      `;

      const response = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.3,
      });

      const parsedRequirements = JSON.parse(response);

      for (let i = 0; i < parsedRequirements.length; i++) {
        const req = parsedRequirements[i];
        requirements.push({
          id: req.id || `BR-${String(i + 1).padStart(3, "0")}`,
          description: req.description || "Business requirement",
          priority: this.mapPriority(req.priority),
          category: RequirementCategory.BUSINESS,
          source: "ai-analysis",
          acceptanceCriteria: req.acceptanceCriteria || [],
          effort: this.mapEffort(req.effort),
          complexity: this.mapComplexity(req.complexity),
        });
      }
    } catch (error) {
      console.error("Business requirements extraction failed:", error);
    }

    // Fallback to pattern-based extraction
    if (requirements.length === 0) {
      requirements.push(
        ...this.extractRequirementsByPattern(
          task,
          RequirementCategory.BUSINESS,
          context,
        ),
      );
    }

    return requirements;
  }

  /**
   * Identify requirement gaps
   */
  private async identifyRequirementGaps(
    task: TaskInput,
    context: AnalysisContext,
  ): Promise<Requirement[]> {
    const gaps: Requirement[] = [];

    try {
      const prompt = `
Task Title: ${task.title}
Task Description: ${task.description}
Priority: ${task.priority}
Labels: ${task.labels.join(", ")}

Analyze this task and identify potential requirement gaps or missing information that could lead to issues during implementation.

Look for:
- Ambiguous or unclear requirements
- Missing acceptance criteria
- Unclear user scenarios
- Missing edge cases
- Unclear success metrics
- Missing dependencies
- Unclear constraints or assumptions

Respond with JSON array of gap requirements in this format:
[
  {
    "id": "GAP-001",
    "description": "Description of what's missing or unclear",
    "priority": "medium",
    "acceptanceCriteria": ["What needs to be clarified"],
    "effort": "low",
    "complexity": "simple"
  }
]
      `;

      const response = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.3,
      });

      const parsedGaps = JSON.parse(response);

      for (let i = 0; i < parsedGaps.length; i++) {
        const gap = parsedGaps[i];
        gaps.push({
          id: gap.id || `GAP-${String(i + 1).padStart(3, "0")}`,
          description: gap.description || "Requirement gap identified",
          priority: this.mapPriority(gap.priority),
          category: RequirementCategory.FUNCTIONAL, // Gaps are usually functional
          source: "gap-analysis",
          acceptanceCriteria: gap.acceptanceCriteria || [],
          effort: this.mapEffort(gap.effort),
          complexity: this.mapComplexity(gap.complexity),
        });
      }
    } catch (error) {
      console.error("Requirement gaps analysis failed:", error);
    }

    // Fallback gap detection
    if (gaps.length === 0) {
      gaps.push(...this.detectSimpleGaps(task, context));
    }

    return gaps;
  }

  /**
   * Extract requirements using pattern matching (fallback method)
   */
  private extractRequirementsByPattern(
    task: TaskInput,
    category: RequirementCategory,
    context: AnalysisContext,
  ): Requirement[] {
    const requirements: Requirement[] = [];
    const text = (task.title + " " + task.description).toLowerCase();
    const patterns = this.requirementPatterns.get(category) || [];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const matches = text.match(pattern);

      if (matches) {
        for (let j = 0; j < matches.length; j++) {
          const match = matches[j];

          requirements.push({
            id: `${this.getCategoryPrefix(category)}-${String(requirements.length + 1).padStart(3, "0")}`,
            description: `Requirement identified: ${match}`,
            priority: this.assessRequirementPriority(match, task.priority),
            category,
            source: "pattern-matching",
            acceptanceCriteria: this.generateAcceptanceCriteria(
              match,
              category,
            ),
            effort: this.assessRequirementEffort(match, category),
            complexity: this.assessRequirementComplexity(match, category),
          });
        }
      }
    }

    return requirements;
  }

  /**
   * Initialize requirement patterns for different categories
   */
  private initializeRequirementPatterns(): void {
    this.requirementPatterns = new Map([
      [
        RequirementCategory.FUNCTIONAL,
        [
          /\b(shall|must|will|should)\s+\w+/gi,
          /\b(user|system|application)\s+(shall|must|will|should)/gi,
          /\b(when|if)\s+\w+\s+(then|the system)/gi,
          /\b(allow|enable|provide|support)\s+\w+/gi,
          /\b(create|update|delete|read|list)\s+\w+/gi,
        ],
      ],
      [
        RequirementCategory.NON_FUNCTIONAL,
        [
          /\b(performance|speed|response time|latency)/gi,
          /\b(security|authentication|authorization|encrypt)/gi,
          /\b(availability|reliability|uptime)/gi,
          /\b(usability|accessibility|user experience)/gi,
          /\b(scalable|scale|throughput|capacity)/gi,
        ],
      ],
      [
        RequirementCategory.TECHNICAL,
        [
          /\b(api|endpoint|interface|integration)/gi,
          /\b(database|data|storage|persistence)/gi,
          /\b(framework|library|technology|stack)/gi,
          /\b(test|testing|unit|integration|e2e)/gi,
          /\b(infrastructure|deployment|devops|ci\/cd)/gi,
        ],
      ],
      [
        RequirementCategory.BUSINESS,
        [
          /\b(business|stakeholder|customer|client)/gi,
          /\b(compliance|regulation|legal|audit)/gi,
          /\b(budget|cost|expense|investment)/gi,
          /\b(timeline|deadline|schedule|milestone)/gi,
          /\b(process|workflow|procedure|policy)/gi,
        ],
      ],
    ]);
  }

  /**
   * Helper methods
   */
  private mapPriority(priority?: string): Requirement["priority"] {
    const priorityMap: Record<string, Requirement["priority"]> = {
      low: "low",
      medium: "medium",
      high: "high",
      critical: "critical",
    };

    return priorityMap[priority || ""] || "medium";
  }

  private mapEffort(effort?: string): EffortEstimate {
    const effortMap: Record<string, EffortEstimate> = {
      very_low: EffortEstimate.VERY_LOW,
      low: EffortEstimate.LOW,
      medium: EffortEstimate.MEDIUM,
      high: EffortEstimate.HIGH,
      very_high: EffortEstimate.VERY_HIGH,
    };

    return effortMap[effort || ""] || EffortEstimate.MEDIUM;
  }

  private mapComplexity(complexity?: string): ComplexityLevel {
    const complexityMap: Record<string, ComplexityLevel> = {
      simple: ComplexityLevel.SIMPLE,
      moderate: ComplexityLevel.MODERATE,
      complex: ComplexityLevel.COMPLEX,
      very_complex: ComplexityLevel.VERY_COMPLEX,
    };

    return complexityMap[complexity || ""] || ComplexityLevel.MODERATE;
  }

  private getCategoryPrefix(category: RequirementCategory): string {
    const prefixes: Record<RequirementCategory, string> = {
      [RequirementCategory.FUNCTIONAL]: "FR",
      [RequirementCategory.NON_FUNCTIONAL]: "NFR",
      [RequirementCategory.TECHNICAL]: "TR",
      [RequirementCategory.BUSINESS]: "BR",
      [RequirementCategory.USER_EXPERIENCE]: "UXR",
    };

    return prefixes[category] || "REQ";
  }

  private assessRequirementPriority(
    requirementText: string,
    taskPriority: string,
  ): Requirement["priority"] {
    // Base priority from task
    let priority = this.mapPriority(taskPriority);

    // Adjust based on requirement content
    if (/critical|essential|mandatory|required/gi.test(requirementText)) {
      priority = "critical";
    } else if (/important|significant|valuable/gi.test(requirementText)) {
      priority = "high";
    } else if (/nice to have|optional|could/gi.test(requirementText)) {
      priority = "low";
    }

    return priority;
  }

  private assessRequirementEffort(
    requirementText: string,
    category: RequirementCategory,
  ): EffortEstimate {
    // Base effort by category
    const categoryEffort: Record<RequirementCategory, EffortEstimate> = {
      [RequirementCategory.FUNCTIONAL]: EffortEstimate.MEDIUM,
      [RequirementCategory.NON_FUNCTIONAL]: EffortEstimate.HIGH,
      [RequirementCategory.TECHNICAL]: EffortEstimate.HIGH,
      [RequirementCategory.BUSINESS]: EffortEstimate.LOW,
      [RequirementCategory.USER_EXPERIENCE]: EffortEstimate.MEDIUM,
    };

    let effort = categoryEffort[category];

    // Adjust based on requirement complexity
    if (/complex|challenging|difficult/gi.test(requirementText)) {
      const efforts = [EffortEstimate.HIGH, EffortEstimate.VERY_HIGH];
      effort = efforts[Math.floor(Math.random() * efforts.length)];
    } else if (/simple|basic|straightforward/gi.test(requirementText)) {
      const efforts = [EffortEstimate.VERY_LOW, EffortEstimate.LOW];
      effort = efforts[Math.floor(Math.random() * efforts.length)];
    }

    return effort;
  }

  private assessRequirementComplexity(
    requirementText: string,
    category: RequirementCategory,
  ): ComplexityLevel {
    // Base complexity by category
    const categoryComplexity: Record<RequirementCategory, ComplexityLevel> = {
      [RequirementCategory.FUNCTIONAL]: ComplexityLevel.MODERATE,
      [RequirementCategory.NON_FUNCTIONAL]: ComplexityLevel.COMPLEX,
      [RequirementCategory.TECHNICAL]: ComplexityLevel.COMPLEX,
      [RequirementCategory.BUSINESS]: ComplexityLevel.SIMPLE,
      [RequirementCategory.USER_EXPERIENCE]: ComplexityLevel.MODERATE,
    };

    let complexity = categoryComplexity[category];

    // Adjust based on requirement content
    if (/complex|challenging|difficult|intricate/gi.test(requirementText)) {
      complexity = ComplexityLevel.VERY_COMPLEX;
    } else if (/simple|basic|straightforward|easy/gi.test(requirementText)) {
      complexity = ComplexityLevel.SIMPLE;
    }

    return complexity;
  }

  private generateAcceptanceCriteria(
    requirementText: string,
    category: RequirementCategory,
  ): string[] {
    // Generate basic acceptance criteria based on requirement type
    const criteria: string[] = [];

    // Always include basic verification
    criteria.push("Requirement is implemented as specified");
    criteria.push("Solution meets the described needs");

    // Category-specific criteria
    switch (category) {
      case RequirementCategory.FUNCTIONAL:
        criteria.push("User can perform the described action");
        criteria.push("System produces expected output");
        break;
      case RequirementCategory.NON_FUNCTIONAL:
        criteria.push("Performance metrics meet specified thresholds");
        criteria.push("Security controls are properly implemented");
        break;
      case RequirementCategory.TECHNICAL:
        criteria.push("Technical specifications are met");
        criteria.push("Integration works as expected");
        break;
      case RequirementCategory.BUSINESS:
        criteria.push("Business objectives are achieved");
        criteria.push("Stakeholder requirements are satisfied");
        break;
    }

    return criteria;
  }

  private detectSimpleGaps(
    task: TaskInput,
    context: AnalysisContext,
  ): Requirement[] {
    const gaps: Requirement[] = [];
    const text = (task.title + " " + task.description).toLowerCase();

    // Check for ambiguous requirements
    if (/maybe|perhaps|possibly|probably|might/gi.test(text)) {
      gaps.push({
        id: "GAP-001",
        description:
          "Ambiguous language detected - requirements need clarification",
        priority: "medium",
        category: RequirementCategory.FUNCTIONAL,
        source: "gap-detection",
        acceptanceCriteria: [
          "Remove ambiguous terms",
          "Define clear requirements",
        ],
        effort: EffortEstimate.LOW,
        complexity: ComplexityLevel.SIMPLE,
      });
    }

    // Check for missing acceptance criteria
    if (!/acceptance|criteria|given when then|test case/gi.test(text)) {
      gaps.push({
        id: "GAP-002",
        description:
          "Missing acceptance criteria - need to define success criteria",
        priority: "high",
        category: RequirementCategory.FUNCTIONAL,
        source: "gap-detection",
        acceptanceCriteria: [
          "Define clear acceptance criteria",
          "Create test cases",
        ],
        effort: EffortEstimate.MEDIUM,
        complexity: ComplexityLevel.SIMPLE,
      });
    }

    // Check for unclear user scenarios
    if (!/user|customer|client|persona/gi.test(text)) {
      gaps.push({
        id: "GAP-003",
        description: "Missing user context - need to define user scenarios",
        priority: "medium",
        category: RequirementCategory.USER_EXPERIENCE,
        source: "gap-detection",
        acceptanceCriteria: ["Define user personas", "Describe user scenarios"],
        effort: EffortEstimate.MEDIUM,
        complexity: ComplexityLevel.SIMPLE,
      });
    }

    return gaps;
  }

  private updateStats(
    analysisTime: number,
    analysis: RequirementAnalysis,
  ): void {
    this.stats.totalAnalyses++;
    this.stats.averageAnalysisTime =
      (this.stats.averageAnalysisTime * (this.stats.totalAnalyses - 1) +
        analysisTime) /
      this.stats.totalAnalyses;

    const totalRequirements =
      analysis.functional.length +
      analysis.nonFunctional.length +
      analysis.technical.length +
      analysis.business.length;

    this.stats.requirementsFound += totalRequirements;
    this.stats.gapsIdentified += analysis.gaps.length;
  }

  /**
   * Get analyzer statistics
   */
  getStats(): RequirementStats {
    return { ...this.stats };
  }

  /**
   * Clear cache and reset stats
   */
  clearCache(): void {
    this.stats = {
      totalAnalyses: 0,
      averageAnalysisTime: 0,
      requirementsFound: 0,
      gapsIdentified: 0,
    };
  }

  /**
   * Destroy analyzer
   */
  destroy(): void {
    this.clearCache();
    this.requirementPatterns.clear();
  }
}

/**
 * Statistics interface
 */
interface RequirementStats {
  totalAnalyses: number;
  averageAnalysisTime: number;
  requirementsFound: number;
  gapsIdentified: number;
}
