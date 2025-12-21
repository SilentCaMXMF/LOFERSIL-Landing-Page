/**
 * Risk Analyzer
 * Identifies and analyzes risks associated with tasks using AI and historical data
 */

import { GeminiService } from "../../gemini/GeminiService";
import type {
  TaskInput,
  TaskClassification,
  DependencyAnalysis,
  AnalysisContext,
  RiskAnalysis,
  Risk,
  MitigationStrategy,
} from "./types";
import { RiskCategory } from "./types";

/**
 * Risk Analyzer Class
 */
export class RiskAnalyzer {
  private geminiService: GeminiService;
  private riskPatterns: Map<RiskCategory, RegExp[]>;
  private mitigationStrategies: Map<RiskCategory, string[]>;
  private stats: RiskStats;

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
    this.stats = {
      totalAnalyses: 0,
      averageAnalysisTime: 0,
      risksIdentified: 0,
      mitigationsGenerated: 0,
    };
    this.initializeRiskPatterns();
  }

  /**
   * Analyze risks for a task
   */
  async analyzeRisks(
    task: TaskInput,
    classification: TaskClassification,
    dependencies: DependencyAnalysis,
    context: AnalysisContext,
  ): Promise<RiskAnalysis> {
    const startTime = Date.now();

    try {
      console.log(`Analyzing risks for task: ${task.id}`);

      // Extract risks from different categories
      const [technical, project, resource, external] = await Promise.all([
        this.analyzeTechnicalRisks(task, classification, dependencies, context),
        this.analyzeProjectRisks(task, classification, dependencies, context),
        this.analyzeResourceRisks(task, classification, dependencies, context),
        this.analyzeExternalRisks(task, classification, dependencies, context),
      ]);

      // Generate mitigation strategies
      const mitigation = await this.generateMitigationStrategies(
        [...technical, ...project, ...resource, ...external],
        context,
      );

      // Calculate overall risk score
      const overallRisk = this.calculateOverallRisk(
        technical,
        project,
        resource,
        external,
      );

      const analysis: RiskAnalysis = {
        technical,
        project,
        resource,
        external,
        overallRisk,
        mitigation,
      };

      // Update stats
      const analysisTime = Date.now() - startTime;
      this.updateStats(analysisTime, analysis);

      console.log(`Risk analysis completed in ${analysisTime}ms`);
      return analysis;
    } catch (error) {
      console.error("Risk analysis failed:", error);
      throw new Error(
        `Risk analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Analyze technical risks
   */
  private async analyzeTechnicalRisks(
    task: TaskInput,
    classification: TaskClassification,
    dependencies: DependencyAnalysis,
    context: AnalysisContext,
  ): Promise<Risk[]> {
    const risks: Risk[] = [];

    try {
      const prompt = `
Task Title: ${task.title}
Task Description: ${task.description}
Classification: ${JSON.stringify(classification)}
Dependencies: ${JSON.stringify(dependencies)}

Analyze technical risks for this task. Focus on:
- Implementation complexity
- Technology challenges
- Integration difficulties
- Performance concerns
- Security vulnerabilities
- Scalability issues
- Code quality risks
- Testing challenges

Respond with JSON array in this format:
[
  {
    "id": "TECH-001",
    "description": "Clear description of technical risk",
    "category": "technical",
    "probability": 0.6,
    "impact": 70,
    "mitigation": ["Strategy 1", "Strategy 2"],
    "owner": "suggested owner"
  }
]

Probability: 0.0-1.0, Impact: 0-100
      `;

      const response = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.3,
      });

      const parsedRisks = JSON.parse(response);

      for (const risk of parsedRisks) {
        risks.push({
          id: risk.id || `TECH-${String(risks.length + 1).padStart(3, "0")}`,
          description: risk.description || "Technical risk identified",
          category: RiskCategory.TECHNICAL,
          probability: Math.max(0, Math.min(1, risk.probability || 0.5)),
          impact: Math.max(0, Math.min(100, risk.impact || 50)),
          score: 0, // Will be calculated below
          mitigation: risk.mitigation || [],
          owner: risk.owner,
        });
      }

      // Calculate risk scores
      risks.forEach((risk) => {
        risk.score = risk.probability * risk.impact;
      });
    } catch (error) {
      console.error("Technical risk analysis failed:", error);
    }

    // Fallback to pattern-based detection
    if (risks.length === 0) {
      risks.push(
        ...this.detectRisksByPattern(
          task,
          RiskCategory.TECHNICAL,
          classification,
          dependencies,
        ),
      );
    }

    return risks;
  }

  /**
   * Analyze project risks
   */
  private async analyzeProjectRisks(
    task: TaskInput,
    classification: TaskClassification,
    dependencies: DependencyAnalysis,
    context: AnalysisContext,
  ): Promise<Risk[]> {
    const risks: Risk[] = [];

    try {
      const prompt = `
Task Title: ${task.title}
Task Description: ${task.description}
Classification: ${JSON.stringify(classification)}
Dependencies: ${JSON.stringify(dependencies)}
Project Context: ${JSON.stringify(context.project)}

Analyze project risks for this task. Focus on:
- Timeline delays
- Budget overruns
- Scope creep
- Stakeholder conflicts
- Requirement changes
- Communication issues
- Quality concerns
- Milestone dependencies

Respond with JSON array in the same format as technical risks.
      `;

      const response = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.3,
      });

      const parsedRisks = JSON.parse(response);

      for (const risk of parsedRisks) {
        risks.push({
          id: risk.id || `PROJ-${String(risks.length + 1).padStart(3, "0")}`,
          description: risk.description || "Project risk identified",
          category: RiskCategory.PROJECT,
          probability: Math.max(0, Math.min(1, risk.probability || 0.5)),
          impact: Math.max(0, Math.min(100, risk.impact || 50)),
          score: 0,
          mitigation: risk.mitigation || [],
          owner: risk.owner,
        });
      }

      // Calculate risk scores
      risks.forEach((risk) => {
        risk.score = risk.probability * risk.impact;
      });
    } catch (error) {
      console.error("Project risk analysis failed:", error);
    }

    // Fallback to pattern-based detection
    if (risks.length === 0) {
      risks.push(
        ...this.detectRisksByPattern(
          task,
          RiskCategory.PROJECT,
          classification,
          dependencies,
        ),
      );
    }

    return risks;
  }

  /**
   * Analyze resource risks
   */
  private async analyzeResourceRisks(
    task: TaskInput,
    classification: TaskClassification,
    dependencies: DependencyAnalysis,
    context: AnalysisContext,
  ): Promise<Risk[]> {
    const risks: Risk[] = [];

    try {
      const prompt = `
Task Title: ${task.title}
Task Description: ${task.description}
Classification: ${JSON.stringify(classification)}
Dependencies: ${JSON.stringify(dependencies)}
Team Context: ${JSON.stringify(context.team)}

Analyze resource risks for this task. Focus on:
- Skill gaps
- Staff availability
- Team workload
- Knowledge transfer
- Training needs
- Resource conflicts
- Turnover risks
- Expertise limitations

Respond with JSON array in the same format as technical risks.
      `;

      const response = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.3,
      });

      const parsedRisks = JSON.parse(response);

      for (const risk of parsedRisks) {
        risks.push({
          id: risk.id || `RES-${String(risks.length + 1).padStart(3, "0")}`,
          description: risk.description || "Resource risk identified",
          category: RiskCategory.RESOURCE,
          probability: Math.max(0, Math.min(1, risk.probability || 0.5)),
          impact: Math.max(0, Math.min(100, risk.impact || 50)),
          score: 0,
          mitigation: risk.mitigation || [],
          owner: risk.owner,
        });
      }

      // Calculate risk scores
      risks.forEach((risk) => {
        risk.score = risk.probability * risk.impact;
      });
    } catch (error) {
      console.error("Resource risk analysis failed:", error);
    }

    // Fallback to pattern-based detection
    if (risks.length === 0) {
      risks.push(
        ...this.detectRisksByPattern(
          task,
          RiskCategory.RESOURCE,
          classification,
          dependencies,
        ),
      );
    }

    return risks;
  }

  /**
   * Analyze external risks
   */
  private async analyzeExternalRisks(
    task: TaskInput,
    classification: TaskClassification,
    dependencies: DependencyAnalysis,
    context: AnalysisContext,
  ): Promise<Risk[]> {
    const risks: Risk[] = [];

    try {
      const prompt = `
Task Title: ${task.title}
Task Description: ${task.description}
Classification: ${JSON.stringify(classification)}
Dependencies: ${JSON.stringify(dependencies)}

Analyze external risks for this task. Focus on:
- Third-party dependencies
- Vendor issues
- API changes
- Regulatory compliance
- Market changes
- Customer requirements
- Competitive landscape
- Economic factors

Respond with JSON array in the same format as technical risks.
      `;

      const response = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.3,
      });

      const parsedRisks = JSON.parse(response);

      for (const risk of parsedRisks) {
        risks.push({
          id: risk.id || `EXT-${String(risks.length + 1).padStart(3, "0")}`,
          description: risk.description || "External risk identified",
          category: RiskCategory.EXTERNAL,
          probability: Math.max(0, Math.min(1, risk.probability || 0.5)),
          impact: Math.max(0, Math.min(100, risk.impact || 50)),
          score: 0,
          mitigation: risk.mitigation || [],
          owner: risk.owner,
        });
      }

      // Calculate risk scores
      risks.forEach((risk) => {
        risk.score = risk.probability * risk.impact;
      });
    } catch (error) {
      console.error("External risk analysis failed:", error);
    }

    // Fallback to pattern-based detection
    if (risks.length === 0) {
      risks.push(
        ...this.detectRisksByPattern(
          task,
          RiskCategory.EXTERNAL,
          classification,
          dependencies,
        ),
      );
    }

    return risks;
  }

  /**
   * Generate mitigation strategies
   */
  private async generateMitigationStrategies(
    risks: Risk[],
    context: AnalysisContext,
  ): Promise<MitigationStrategy[]> {
    const mitigations: MitigationStrategy[] = [];

    try {
      const risksText = risks
        .map(
          (risk) =>
            `${risk.id}: ${risk.description} (Category: ${risk.category}, Probability: ${risk.probability}, Impact: ${risk.impact})`,
        )
        .join("\n");

      const prompt = `
Risks Identified:
${risksText}

For each risk, generate effective mitigation strategies. For each strategy:
- Make it specific and actionable
- Consider effectiveness vs cost
- Assign realistic timeline
- Consider resource requirements

Respond with JSON array in this format:
[
  {
    "riskId": "RISK-001",
    "strategy": "Specific mitigation strategy description",
    "effectiveness": 0.8,
    "cost": 5,
    "owner": "suggested owner",
    "timeline": "2-4 weeks"
  }
]

Effectiveness: 0.0-1.0, Cost: 1-10 (1=low, 10=high)
      `;

      const response = await this.geminiService.generateText(prompt, {
        cache: true,
        temperature: 0.3,
      });

      const parsedMitigations = JSON.parse(response);

      for (const mitigation of parsedMitigations) {
        mitigations.push({
          riskId: mitigation.riskId || "UNKNOWN",
          strategy: mitigation.strategy || "Mitigation strategy",
          effectiveness: Math.max(
            0,
            Math.min(1, mitigation.effectiveness || 0.7),
          ),
          cost: Math.max(1, Math.min(10, mitigation.cost || 5)),
          owner: mitigation.owner,
          timeline: mitigation.timeline || "TBD",
        });
      }
    } catch (error) {
      console.error("Mitigation strategy generation failed:", error);
    }

    // Fallback to default strategies
    if (mitigations.length === 0) {
      mitigations.push(...this.generateDefaultMitigations(risks));
    }

    return mitigations;
  }

  /**
   * Detect risks using pattern matching (fallback method)
   */
  private detectRisksByPattern(
    task: TaskInput,
    category: RiskCategory,
    classification: TaskClassification,
    dependencies: DependencyAnalysis,
  ): Risk[] {
    const risks: Risk[] = [];
    const text = (task.title + " " + task.description).toLowerCase();
    const patterns = this.riskPatterns.get(category) || [];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const matches = text.match(pattern);

      if (matches) {
        for (let j = 0; j < matches.length; j++) {
          const match = matches[j];

          const risk: Risk = {
            id: `${this.getCategoryPrefix(category)}-${String(risks.length + 1).padStart(3, "0")}`,
            description: `Risk pattern detected: ${match}`,
            category,
            probability: this.assessRiskProbability(match, category),
            impact: this.assessRiskImpact(match, category, task.priority),
            score: 0, // Will be calculated below
            mitigation: this.getDefaultMitigations(category),
            owner: this.suggestOwner(category, {} as AnalysisContext),
          };

          risk.score = risk.probability * risk.impact;
          risks.push(risk);
        }
      }
    }

    // Add complexity-based risks
    if (classification.complexity === "very_complex") {
      risks.push({
        id: `${this.getCategoryPrefix(category)}-${String(risks.length + 1).padStart(3, "0")}`,
        description: "High complexity increases implementation risk",
        category,
        probability: 0.7,
        impact: 60,
        score: 42,
        mitigation: [
          "Break down into smaller tasks",
          "Allocate experienced resources",
          "Increase testing",
        ],
        owner: "Project Manager",
      });
    }

    // Add dependency-based risks
    if (dependencies.impactScore > 0.8) {
      risks.push({
        id: `${this.getCategoryPrefix(category)}-${String(risks.length + 1).padStart(3, "0")}`,
        description: "High dependency impact increases risk",
        category,
        probability: 0.6,
        impact: 70,
        score: 42,
        mitigation: [
          "Resolve dependencies early",
          "Create dependency buffer",
          "Monitor dependency status",
        ],
        owner: "Project Manager",
      });
    }

    return risks;
  }

  /**
   * Initialize risk patterns for different categories
   */
  private initializeRiskPatterns(): void {
    this.riskPatterns = new Map([
      [
        RiskCategory.TECHNICAL,
        [
          /\b(complex|complicated|difficult|challenging)/gi,
          /\b(new|unfamiliar|unknown|experimental)/gi,
          /\b(integration|interface|api|webhook)/gi,
          /\b(performance|scalability|speed|latency)/gi,
          /\b(security|authentication|authorization|vulnerability)/gi,
          /\b(legacy|outdated|deprecated)/gi,
          /\b(migration|upgrade|transition)/gi,
        ],
      ],
      [
        RiskCategory.PROJECT,
        [
          /\b(deadline|timeline|schedule)/gi,
          /\b(budget|cost|expense)/gi,
          /\b(stakeholder|customer|client)/gi,
          /\b(requirement|scope|change)/gi,
          /\b(milestone|deliverable)/gi,
          /\b(communication|coordination|collaboration)/gi,
        ],
      ],
      [
        RiskCategory.RESOURCE,
        [
          /\b(skill|expertise|experience|knowledge)/gi,
          /\b(team|staff|personnel|resource)/gi,
          /\b(workload|capacity|availability)/gi,
          /\b(training|learning|onboarding)/gi,
          /\b(turnover|vacation|absence)/gi,
        ],
      ],
      [
        RiskCategory.EXTERNAL,
        [
          /\b(third.?party|vendor|supplier)/gi,
          /\b(api|service|interface)/gi,
          /\b(compliance|regulation|legal)/gi,
          /\b(market|customer|user)/gi,
          /\b(competition|competitive)/gi,
        ],
      ],
    ]);
  }

  /**
   * Helper methods
   */
  private calculateOverallRisk(
    technical: Risk[],
    project: Risk[],
    resource: Risk[],
    external: Risk[],
  ): number {
    const allRisks = [...technical, ...project, ...resource, ...external];

    if (allRisks.length === 0) return 0;

    // Weight risks by category
    const categoryWeights: Record<RiskCategory, number> = {
      [RiskCategory.TECHNICAL]: 0.3,
      [RiskCategory.PROJECT]: 0.25,
      [RiskCategory.RESOURCE]: 0.25,
      [RiskCategory.EXTERNAL]: 0.15,
      [RiskCategory.SECURITY]: 0.05,
    };

    let weightedScore = 0;
    let totalWeight = 0;

    for (const category of Object.values(RiskCategory)) {
      const categoryRisks = allRisks.filter(
        (risk) => risk.category === category,
      );

      if (categoryRisks.length > 0) {
        const avgScore =
          categoryRisks.reduce((sum, risk) => sum + risk.score, 0) /
          categoryRisks.length;
        weightedScore += avgScore * categoryWeights[category];
        totalWeight += categoryWeights[category];
      }
    }

    return Math.round(totalWeight > 0 ? weightedScore / totalWeight : 0);
  }

  private getCategoryPrefix(category: RiskCategory): string {
    const prefixes: Record<RiskCategory, string> = {
      [RiskCategory.TECHNICAL]: "TECH",
      [RiskCategory.PROJECT]: "PROJ",
      [RiskCategory.RESOURCE]: "RES",
      [RiskCategory.EXTERNAL]: "EXT",
      [RiskCategory.SECURITY]: "SEC",
    };

    return prefixes[category] || "RISK";
  }

  private assessRiskProbability(match: string, category: RiskCategory): number {
    // Base probability by category
    const baseProbability: Record<RiskCategory, number> = {
      [RiskCategory.TECHNICAL]: 0.4,
      [RiskCategory.PROJECT]: 0.3,
      [RiskCategory.RESOURCE]: 0.3,
      [RiskCategory.EXTERNAL]: 0.5,
      [RiskCategory.SECURITY]: 0.2,
    };

    let probability = baseProbability[category];

    // Adjust based on risk indicators
    if (/critical|urgent|immediate/gi.test(match)) {
      probability += 0.3;
    } else if (/possible|potential|might|could/gi.test(match)) {
      probability -= 0.2;
    } else if (/complex|difficult|challenging/gi.test(match)) {
      probability += 0.2;
    }

    return Math.max(0, Math.min(1, probability));
  }

  private assessRiskImpact(
    match: string,
    category: RiskCategory,
    taskPriority: string,
  ): number {
    // Base impact by category
    const baseImpact: Record<RiskCategory, number> = {
      [RiskCategory.TECHNICAL]: 60,
      [RiskCategory.PROJECT]: 70,
      [RiskCategory.RESOURCE]: 50,
      [RiskCategory.EXTERNAL]: 65,
      [RiskCategory.SECURITY]: 80,
    };

    let impact = baseImpact[category];

    // Adjust based on risk indicators
    if (/critical|major|significant/gi.test(match)) {
      impact += 20;
    } else if (/minor|small|limited/gi.test(match)) {
      impact -= 20;
    }

    // Adjust based on task priority
    const priorityMultiplier: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.3,
      critical: 1.6,
    };

    impact *= priorityMultiplier[taskPriority] || 1.0;

    return Math.max(0, Math.min(100, impact));
  }

  private getDefaultMitigations(category: RiskCategory): string[] {
    const strategies = this.mitigationStrategies.get(category) || [];
    return strategies.slice(0, 2); // Return top 2 strategies
  }

  private suggestOwner(
    category: RiskCategory,
    context: AnalysisContext,
  ): string {
    const owners: Record<RiskCategory, string> = {
      [RiskCategory.TECHNICAL]: "Technical Lead",
      [RiskCategory.PROJECT]: "Project Manager",
      [RiskCategory.RESOURCE]: "Team Lead",
      [RiskCategory.EXTERNAL]: "Product Manager",
      [RiskCategory.SECURITY]: "Security Officer",
    };

    return owners[category] || "Team Lead";
  }

  private generateDefaultMitigations(risks: Risk[]): MitigationStrategy[] {
    const mitigations: MitigationStrategy[] = [];

    for (const risk of risks) {
      const defaultStrategy = this.getDefaultMitigation(risk.category);

      mitigations.push({
        riskId: risk.id,
        strategy: defaultStrategy.strategy,
        effectiveness: defaultStrategy.effectiveness,
        cost: defaultStrategy.cost,
        owner:
          risk.owner || this.suggestOwner(risk.category, {} as AnalysisContext),
        timeline: "2-4 weeks",
      });
    }

    return mitigations;
  }

  private getDefaultMitigation(category: RiskCategory): {
    strategy: string;
    effectiveness: number;
    cost: number;
  } {
    const defaults: Record<
      RiskCategory,
      { strategy: string; effectiveness: number; cost: number }
    > = {
      [RiskCategory.TECHNICAL]: {
        strategy: "Conduct technical spike and proof of concept",
        effectiveness: 0.7,
        cost: 4,
      },
      [RiskCategory.PROJECT]: {
        strategy:
          "Implement regular progress monitoring and stakeholder communication",
        effectiveness: 0.6,
        cost: 3,
      },
      [RiskCategory.RESOURCE]: {
        strategy: "Provide training and knowledge sharing sessions",
        effectiveness: 0.8,
        cost: 5,
      },
      [RiskCategory.EXTERNAL]: {
        strategy: "Establish backup plans and alternative vendors",
        effectiveness: 0.7,
        cost: 6,
      },
      [RiskCategory.SECURITY]: {
        strategy:
          "Conduct security audit and implement security best practices",
        effectiveness: 0.8,
        cost: 5,
      },
    };

    return defaults[category] || defaults[RiskCategory.TECHNICAL];
  }

  private updateStats(analysisTime: number, analysis: RiskAnalysis): void {
    this.stats.totalAnalyses++;
    this.stats.averageAnalysisTime =
      (this.stats.averageAnalysisTime * (this.stats.totalAnalyses - 1) +
        analysisTime) /
      this.stats.totalAnalyses;

    const totalRisks =
      analysis.technical.length +
      analysis.project.length +
      analysis.resource.length +
      analysis.external.length;

    this.stats.risksIdentified += totalRisks;
    this.stats.mitigationsGenerated += analysis.mitigation.length;
  }

  /**
   * Get analyzer statistics
   */
  getStats(): RiskStats {
    return { ...this.stats };
  }

  /**
   * Clear cache and reset stats
   */
  clearCache(): void {
    this.stats = {
      totalAnalyses: 0,
      averageAnalysisTime: 0,
      risksIdentified: 0,
      mitigationsGenerated: 0,
    };
  }

  /**
   * Destroy analyzer
   */
  destroy(): void {
    this.clearCache();
    this.riskPatterns.clear();
    this.mitigationStrategies.clear();
  }
}

/**
 * Statistics interface
 */
interface RiskStats {
  totalAnalyses: number;
  averageAnalysisTime: number;
  risksIdentified: number;
  mitigationsGenerated: number;
}
