/**
 * Enhanced CodeReviewer with AI Integration
 * Transforms the existing CodeReviewer into an AI-powered comprehensive code review system
 */

import { OpenCodeAgent } from "../OpenCodeAgent";
import { GeminiService, type GeminiConfig } from "../ai";
import type { CodeChanges } from "./AutonomousResolver";
import { ErrorManager } from "../ErrorManager";

// Import existing types and enhance them
import type {
  ReviewResult,
  ReviewIssue,
  CodeReviewerConfig,
} from "./CodeReviewer";

// Enhanced interface with AI integration
export interface EnhancedCodeReviewerConfig extends CodeReviewerConfig {
  aiConfig?: GeminiConfig;
  enableAIAnalysis?: boolean;
  aiAnalysisTimeout?: number;
  customAIPrompts?: {
    security?: string;
    performance?: string;
    quality?: string;
  };
}

// Enhanced ReviewResult with AI insights
export interface EnhancedReviewResult extends ReviewResult {
  aiInsights?: AIInsight[];
  securityVulnerabilities?: SecurityVulnerability[];
  performanceOptimizations?: PerformanceOptimization[];
  codeQualityMetrics?: CodeQualityMetrics;
  testCoverageGaps?: TestCoverageGap[];
  implementationSuggestions?: ImplementationSuggestion[];
}

export interface AIInsight {
  type:
    | "security"
    | "performance"
    | "quality"
    | "architecture"
    | "best_practice";
  title: string;
  description: string;
  confidence: number; // 0-100
  severity: "low" | "medium" | "high" | "critical";
  recommendation?: string;
  codeExample?: string;
}

export interface SecurityVulnerability {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location: {
    filePath: string;
    startLine?: number;
    endLine?: number;
  };
  recommendation: string;
  cweId?: string;
  cvssScore?: number;
}

export interface PerformanceOptimization {
  id: string;
  type: "algorithm" | "memory" | "dom" | "network" | "rendering";
  description: string;
  location: {
    filePath: string;
    startLine?: number;
    endLine?: number;
  };
  impact: {
    performanceGain?: number; // percentage
    memoryReduction?: number; // percentage
    complexityReduction?: number; // percentage
  };
  implementation: {
    before: string;
    after: string;
    explanation: string;
  };
  effort: "low" | "medium" | "high";
}

export interface CodeQualityMetrics {
  maintainabilityIndex: number;
  technicalDebtHours: number;
  complexityScore: {
    cyclomatic: number;
    cognitive: number;
    maintainability: number;
  };
  duplicationScore: {
    percentage: number;
    duplicatedLines: number;
    totalLines: number;
  };
}

export interface TestCoverageGap {
  type: "missing_tests" | "insufficient_coverage" | "edge_cases";
  description: string;
  location: {
    filePath: string;
    functionName?: string;
    startLine?: number;
    endLine?: number;
  };
  recommendation: string;
  priority: "low" | "medium" | "high";
}

export interface ImplementationSuggestion {
  id: string;
  type: "refactoring" | "pattern" | "architecture" | "security" | "performance";
  title: string;
  description: string;
  location: {
    filePath: string;
    startLine?: number;
    endLine?: number;
  };
  codeExample: {
    before: string;
    after: string;
    explanation: string;
  };
  effort: "low" | "medium" | "high";
  benefits: string[];
}

/**
 * Enhanced CodeReviewer with AI Integration
 *
 * This class enhances the existing CodeReviewer with AI-powered analysis capabilities
 * while maintaining backward compatibility with the original interface.
 */
export class EnhancedCodeReviewer {
  private config: EnhancedCodeReviewerConfig;
  private aiService?: GeminiService;
  private errorManager: ErrorManager;

  constructor(config: EnhancedCodeReviewerConfig) {
    this.config = config;
    this.errorManager = new ErrorManager();

    // Initialize AI service if enabled
    if (config.enableAIAnalysis && config.aiConfig) {
      this.aiService = new GeminiService(config.aiConfig);
    }
  }

  /**
   * Enhanced review with AI integration
   */
  async reviewChanges(
    changes: CodeChanges,
    originalIssue: { number: number; title: string; body: string },
  ): Promise<EnhancedReviewResult> {
    try {
      const startTime = Date.now();

      // First, run the existing analysis for backward compatibility
      const baseResult = await this.performBaseAnalysis(changes, originalIssue);

      // Then enhance with AI analysis if enabled
      let aiInsights: AIInsight[] = [];
      let securityVulnerabilities: SecurityVulnerability[] = [];
      let performanceOptimizations: PerformanceOptimization[] = [];
      let codeQualityMetrics: CodeQualityMetrics | undefined;
      let testCoverageGaps: TestCoverageGap[] = [];
      let implementationSuggestions: ImplementationSuggestion[] = [];

      if (this.config.enableAIAnalysis && this.aiService) {
        const aiResults = await this.performAIAnalysis(changes, originalIssue);
        aiInsights = aiResults.insights;
        securityVulnerabilities = aiResults.vulnerabilities;
        performanceOptimizations = aiResults.optimizations;
        codeQualityMetrics = aiResults.qualityMetrics;
        testCoverageGaps = aiResults.coverageGaps;
        implementationSuggestions = aiResults.suggestions;
      }

      const processingTime = Date.now() - startTime;

      return {
        ...baseResult,
        aiInsights,
        securityVulnerabilities,
        performanceOptimizations,
        codeQualityMetrics,
        testCoverageGaps,
        implementationSuggestions,
      };
    } catch (error) {
      this.errorManager.handleError(
        error as Error,
        "EnhancedCodeReviewer.reviewChanges",
        {
          component: "EnhancedCodeReviewer",
          operation: "reviewChanges",
          metadata: {
            changes: changes.files.length,
            issueNumber: originalIssue.number,
          },
          timestamp: new Date(),
        },
      );

      return {
        approved: false,
        score: 0,
        issues: [
          {
            type: "error",
            category: "syntax",
            severity: "critical",
            message: `Enhanced review failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            suggestion: "Please try again or contact support if issue persists",
          },
        ],
        recommendations: ["Review failed - please retry"],
        reasoning: "Enhanced code review encountered an error",
        metadata: {
          staticAnalysisScore: 0,
          securityScore: 0,
          qualityScore: 0,
          testCoverageScore: 0,
          performanceScore: 0,
          documentationScore: 0,
        },
      };
    }
  }

  /**
   * Perform base analysis using existing CodeReviewer logic
   */
  private async performBaseAnalysis(
    changes: CodeChanges,
    originalIssue: { number: number; title: string; body: string },
  ): Promise<ReviewResult> {
    // Import the original CodeReviewer dynamically to avoid circular dependencies
    const { CodeReviewer } = await import("./CodeReviewer");

    const codeReviewer = new CodeReviewer(this.config);
    return codeReviewer.reviewChanges(changes, originalIssue);
  }

  /**
   * Perform AI-powered analysis
   */
  private async performAIAnalysis(
    changes: CodeChanges,
    originalIssue: { number: number; title: string; body: string },
  ): Promise<{
    insights: AIInsight[];
    vulnerabilities: SecurityVulnerability[];
    optimizations: PerformanceOptimization[];
    qualityMetrics: CodeQualityMetrics;
    coverageGaps: TestCoverageGap[];
    suggestions: ImplementationSuggestion[];
  }> {
    const allInsights: AIInsight[] = [];
    const allVulnerabilities: SecurityVulnerability[] = [];
    const allOptimizations: PerformanceOptimization[] = [];
    const allCoverageGaps: TestCoverageGap[] = [];
    const allSuggestions: ImplementationSuggestion[] = [];

    // Analyze each file
    for (const file of changes.files) {
      for (const change of file.changes) {
        const content = change.content;
        const filePath = file.path;

        // AI Security Analysis
        const securityResults = await this.performAISecurityAnalysis(
          content,
          filePath,
        );
        allVulnerabilities.push(...securityResults);

        // AI Performance Analysis
        const performanceResults = await this.performAIPerformanceAnalysis(
          content,
          filePath,
        );
        allOptimizations.push(...performanceResults);

        // AI Quality Analysis
        const qualityResults = await this.performAIQualityAnalysis(
          content,
          filePath,
        );
        allInsights.push(...qualityResults);

        // AI Test Coverage Analysis
        const coverageResults = await this.performAITestCoverageAnalysis(
          content,
          filePath,
        );
        allCoverageGaps.push(...coverageResults);

        // AI Implementation Suggestions
        const suggestionResults = await this.performAIImplementationSuggestions(
          content,
          filePath,
          originalIssue,
        );
        allSuggestions.push(...suggestionResults);
      }
    }

    // Calculate comprehensive quality metrics
    const qualityMetrics = this.calculateCodeQualityMetrics(
      changes,
      allInsights,
      allVulnerabilities,
    );

    return {
      insights: allInsights,
      vulnerabilities: allVulnerabilities,
      optimizations: allOptimizations,
      qualityMetrics,
      coverageGaps: allCoverageGaps,
      suggestions: allSuggestions,
    };
  }

  /**
   * AI-powered security vulnerability detection
   */
  private async performAISecurityAnalysis(
    code: string,
    filePath: string,
  ): Promise<SecurityVulnerability[]> {
    if (!this.aiService) return [];

    try {
      const analysis = await this.aiService.analyzeCode({
        code,
        language: this.detectLanguage(filePath),
        filePath,
        analysisType: "security",
      });

      const vulnerabilities: SecurityVulnerability[] = [];

      // Convert AI security assessment to vulnerabilities
      if (analysis.securityAssessment?.issues) {
        for (const issue of analysis.securityAssessment.issues) {
          vulnerabilities.push({
            id: `ai-security-${Date.now()}-${Math.random()}`,
            type: issue.type || "unknown",
            severity: issue.severity || "medium",
            description: issue.description,
            location: {
              filePath,
              startLine: issue.line,
            },
            recommendation:
              issue.fix || "Review and address this security issue",
            cweId: this.mapToCWE(issue.type),
          });
        }
      }

      // Convert AI vulnerabilities
      if (analysis.securityAssessment?.vulnerabilities) {
        for (const vuln of analysis.securityAssessment.vulnerabilities) {
          vulnerabilities.push({
            id: `ai-vuln-${Date.now()}-${Math.random()}`,
            type: vuln.component || "unknown",
            severity: vuln.severity || "medium",
            description: vuln.description,
            location: { filePath },
            recommendation:
              "Address this vulnerability according to security guidelines",
          });
        }
      }

      return vulnerabilities;
    } catch (error) {
      this.errorManager.handleError(
        error as Error,
        "EnhancedCodeReviewer.performAISecurityAnalysis",
        {
          component: "EnhancedCodeReviewer",
          operation: "performAISecurityAnalysis",
          metadata: { filePath },
          timestamp: new Date(),
        },
      );
      return [];
    }
  }

  /**
   * AI-powered performance optimization analysis
   */
  private async performAIPerformanceAnalysis(
    code: string,
    filePath: string,
  ): Promise<PerformanceOptimization[]> {
    if (!this.aiService) return [];

    try {
      const analysis = await this.aiService.analyzeCode({
        code,
        language: this.detectLanguage(filePath),
        filePath,
        analysisType: "performance",
      });

      const optimizations: PerformanceOptimization[] = [];

      // Convert AI performance analysis to optimizations
      if (analysis.performanceAnalysis?.optimizations) {
        for (
          let i = 0;
          i < analysis.performanceAnalysis.optimizations.length;
          i++
        ) {
          const opt = analysis.performanceAnalysis.optimizations[i];
          optimizations.push({
            id: `ai-perf-${Date.now()}-${i}`,
            type: "algorithm", // Default type
            description: opt,
            location: { filePath },
            impact: {
              performanceGain: 20, // Default estimate
              memoryReduction: 10,
              complexityReduction: 15,
            },
            implementation: {
              before: "// Current implementation",
              after: `// Optimized: ${opt}`,
              explanation: opt,
            },
            effort: "medium",
          });
        }
      }

      // Analyze specific patterns for more detailed optimizations
      optimizations.push(...this.analyzePerformancePatterns(code, filePath));

      return optimizations;
    } catch (error) {
      this.errorManager.handleError(
        error as Error,
        "EnhancedCodeReviewer.performAIPerformanceAnalysis",
        {
          component: "EnhancedCodeReviewer",
          operation: "performAIPerformanceAnalysis",
          metadata: { filePath },
          timestamp: new Date(),
        },
      );
      return [];
    }
  }

  /**
   * AI-powered code quality analysis
   */
  private async performAIQualityAnalysis(
    code: string,
    filePath: string,
  ): Promise<AIInsight[]> {
    if (!this.aiService) return [];

    try {
      const analysis = await this.aiService.analyzeCode({
        code,
        language: this.detectLanguage(filePath),
        filePath,
        analysisType: "style",
      });

      const insights: AIInsight[] = [];

      // Convert AI style issues to insights
      if (analysis.styleIssues) {
        for (const issue of analysis.styleIssues) {
          insights.push({
            type: "quality",
            title: `Code Quality: ${issue.type}`,
            description: issue.description,
            confidence: 85,
            severity: "medium" as const, // Style issues don't have severity, default to medium
            recommendation: issue.rule || "Follow coding standards",
            codeExample: issue.rule,
          });
        }
      }

      // Add recommendations as insights
      if (analysis.recommendations) {
        for (const rec of analysis.recommendations) {
          if (rec.type === "style" || rec.type === "architecture") {
            insights.push({
              type: "best_practice",
              title: rec.title,
              description: rec.description,
              confidence: 80,
              severity: rec.priority === "high" ? "high" : "medium",
              recommendation: rec.description,
              codeExample: rec.example,
            });
          }
        }
      }

      return insights;
    } catch (error) {
      this.errorManager.handleError(
        error as Error,
        "EnhancedCodeReviewer.performAIQualityAnalysis",
        {
          component: "EnhancedCodeReviewer",
          operation: "performAIQualityAnalysis",
          metadata: { filePath },
          timestamp: new Date(),
        },
      );
      return [];
    }
  }

  /**
   * AI-powered test coverage analysis
   */
  private async performAITestCoverageAnalysis(
    code: string,
    filePath: string,
  ): Promise<TestCoverageGap[]> {
    const gaps: TestCoverageGap[] = [];

    try {
      // Check for functions without tests
      const functionMatches = code.match(
        /(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:function|\([^)]*\)\s*=>))/g,
      );
      const testFileExists =
        filePath.includes(".test.") ||
        filePath.includes(".spec.") ||
        filePath.includes("/test/") ||
        filePath.includes("/tests/");

      if (functionMatches && !testFileExists) {
        for (let i = 0; i < functionMatches.length; i++) {
          const match = functionMatches[i];
          const functionName =
            match.match(/function\s+(\w+)|(\w+)\s*[:=]/)?.[1] ||
            match.match(/(\w+)\s*[:=]/)?.[1] ||
            "unknown";

          gaps.push({
            type: "missing_tests",
            description: `Function '${functionName}' lacks test coverage`,
            location: {
              filePath,
              functionName,
            },
            recommendation: `Write unit tests for function '${functionName}'`,
            priority: "medium",
          });
        }
      }

      // Check for complex branches that need testing
      const complexConditions = code.match(
        /(?:if\s*\([^)]+\)\s*{[^}]*}?\s*else\s*{[^}]*})/g,
      );
      if (complexConditions && complexConditions.length > 3) {
        gaps.push({
          type: "edge_cases",
          description:
            "Complex conditional logic detected - ensure edge cases are tested",
          location: { filePath },
          recommendation:
            "Add tests for all conditional branches and edge cases",
          priority: "high",
        });
      }

      // Check for async operations that need testing
      const asyncOperations = code.match(/(?:fetch\(|await|async)/g);
      if (asyncOperations && asyncOperations.length > 0 && !testFileExists) {
        gaps.push({
          type: "insufficient_coverage",
          description:
            "Async operations detected - ensure proper test coverage",
          location: { filePath },
          recommendation: "Write async tests for async operations",
          priority: "medium",
        });
      }
    } catch (error) {
      this.errorManager.handleError(
        error as Error,
        "EnhancedCodeReviewer.performAITestCoverageAnalysis",
        {
          component: "EnhancedCodeReviewer",
          operation: "performAITestCoverageAnalysis",
          metadata: { filePath },
          timestamp: new Date(),
        },
      );
    }

    return gaps;
  }

  /**
   * AI-powered implementation suggestions
   */
  private async performAIImplementationSuggestions(
    code: string,
    filePath: string,
    originalIssue: { number: number; title: string; body: string },
  ): Promise<ImplementationSuggestion[]> {
    const suggestions: ImplementationSuggestion[] = [];

    try {
      // Analyze code for improvement opportunities
      suggestions.push(...this.suggestRefactoring(code, filePath));
      suggestions.push(
        ...this.suggestArchitecturalImprovements(code, filePath),
      );
      suggestions.push(...this.suggestSecurityImprovements(code, filePath));
      suggestions.push(...this.suggestPerformanceImprovements(code, filePath));
    } catch (error) {
      this.errorManager.handleError(
        error as Error,
        "EnhancedCodeReviewer.performAIImplementationSuggestions",
        {
          component: "EnhancedCodeReviewer",
          operation: "performAIImplementationSuggestions",
          metadata: { filePath, issueNumber: originalIssue.number },
          timestamp: new Date(),
        },
      );
    }

    return suggestions;
  }

  /**
   * Analyze performance patterns
   */
  private analyzePerformancePatterns(
    code: string,
    filePath: string,
  ): PerformanceOptimization[] {
    const optimizations: PerformanceOptimization[] = [];

    // Check for array operations in loops
    if (code.includes("forEach") && code.includes("push")) {
      optimizations.push({
        id: `perf-array-foreach-${Date.now()}`,
        type: "algorithm",
        description: "Inefficient array operation detected: forEach with push",
        location: { filePath },
        impact: {
          performanceGain: 30,
          memoryReduction: 20,
          complexityReduction: 25,
        },
        implementation: {
          before: "results.forEach(item => array.push(transform(item)));",
          after: "const results = array.map(transform);",
          explanation:
            "Use map() instead of forEach with push() for better performance",
        },
        effort: "low",
      });
    }

    // Check for DOM queries in loops
    if (code.includes("querySelector") && code.includes("for")) {
      optimizations.push({
        id: `perf-dom-query-${Date.now()}`,
        type: "dom",
        description: "DOM queries inside loop detected",
        location: { filePath },
        impact: {
          performanceGain: 50,
          memoryReduction: 10,
          complexityReduction: 20,
        },
        implementation: {
          before:
            "for (let i = 0; i < items.length; i++) {\n  const element = document.querySelector(items[i]);\n  element.style.color = 'red';\n}",
          after:
            "const elements = items.map(item => document.querySelector(item));\nelements.forEach(el => el.style.color = 'red');",
          explanation:
            "Cache DOM elements outside the loop to avoid repeated queries",
        },
        effort: "medium",
      });
    }

    // Check for synchronous operations
    if (code.includes("readFileSync") || code.includes("writeFileSync")) {
      optimizations.push({
        id: `perf-sync-ops-${Date.now()}`,
        type: "memory",
        description: "Synchronous file operations detected",
        location: { filePath },
        impact: {
          performanceGain: 40,
          memoryReduction: 0,
          complexityReduction: 15,
        },
        implementation: {
          before: "const data = fs.readFileSync('file.txt');",
          after: "const data = await fs.promises.readFile('file.txt');",
          explanation:
            "Use asynchronous operations to avoid blocking the event loop",
        },
        effort: "medium",
      });
    }

    return optimizations;
  }

  /**
   * Suggest refactoring improvements
   */
  private suggestRefactoring(
    code: string,
    filePath: string,
  ): ImplementationSuggestion[] {
    const suggestions: ImplementationSuggestion[] = [];

    // Check for long functions
    const functionMatches = code.match(
      /function\s+\w+\s*\([^)]*\)\s*{([^}]*)}/g,
    );
    if (functionMatches) {
      for (let i = 0; i < functionMatches.length; i++) {
        const funcBody = functionMatches[i];
        if (funcBody.length > 500) {
          // Long function
          suggestions.push({
            id: `refactor-long-func-${i}`,
            type: "refactoring",
            title: "Consider breaking down long function",
            description: `Function is ${funcBody.length} characters long, consider breaking it into smaller functions`,
            location: { filePath },
            codeExample: {
              before: "function longFunction() { /* lots of code */ }",
              after:
                "function longFunction() {\n  helperFunction1();\n  helperFunction2();\n  helperFunction3();\n}",
              explanation:
                "Break down long functions into smaller, more focused functions",
            },
            effort: "medium",
            benefits: [
              "Improved readability",
              "Better testability",
              "Reduced complexity",
            ],
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Suggest architectural improvements
   */
  private suggestArchitecturalImprovements(
    code: string,
    filePath: string,
  ): ImplementationSuggestion[] {
    const suggestions: ImplementationSuggestion[] = [];

    // Check for hardcoded values
    if (code.includes('"http://') || code.includes("'http://")) {
      suggestions.push({
        id: `arch-hardcoded-url-${Date.now()}`,
        type: "architecture",
        title: "Hardcoded URLs detected",
        description: "Hardcoded URLs found, consider using configuration",
        location: { filePath },
        codeExample: {
          before: "const apiUrl = 'https://api.example.com';",
          after:
            "const apiUrl = process.env.API_URL || 'https://api.example.com';",
          explanation: "Use environment variables for configuration",
        },
        effort: "low",
        benefits: [
          "Improved flexibility",
          "Better security",
          "Easier deployment",
        ],
      });
    }

    return suggestions;
  }

  /**
   * Suggest security improvements
   */
  private suggestSecurityImprovements(
    code: string,
    filePath: string,
  ): ImplementationSuggestion[] {
    const suggestions: ImplementationSuggestion[] = [];

    // Check for eval usage
    if (code.includes("eval(")) {
      suggestions.push({
        id: `sec-eval-${Date.now()}`,
        type: "security",
        title: "Replace eval() usage",
        description: "eval() usage detected, which is a security risk",
        location: { filePath },
        codeExample: {
          before: "const result = eval(userInput);",
          after:
            "const result = JSON.parse(userInput); // or use safer alternatives",
          explanation:
            "eval() can execute arbitrary code and should be avoided",
        },
        effort: "high",
        benefits: [
          "Improved security",
          "Better performance",
          "Reduced attack surface",
        ],
      });
    }

    return suggestions;
  }

  /**
   * Suggest performance improvements
   */
  private suggestPerformanceImprovements(
    code: string,
    filePath: string,
  ): ImplementationSuggestion[] {
    const suggestions: ImplementationSuggestion[] = [];

    // Check for array.length in loops
    if (code.match(/for\s*\([^)]*\.length[^)]*\)/)) {
      suggestions.push({
        id: `perf-array-length-${Date.now()}`,
        type: "performance",
        title: "Cache array.length in loops",
        description: "Accessing array.length in loop condition is inefficient",
        location: { filePath },
        codeExample: {
          before: "for (let i = 0; i < array.length; i++) { /* ... */ }",
          after:
            "const length = array.length;\nfor (let i = 0; i < length; i++) { /* ... */ }",
          explanation: "Cache array.length to avoid repeated property access",
        },
        effort: "low",
        benefits: [
          "Improved performance",
          "Reduced property access",
          "Better optimization",
        ],
      });
    }

    return suggestions;
  }

  /**
   * Calculate comprehensive code quality metrics
   */
  private calculateCodeQualityMetrics(
    changes: CodeChanges,
    insights: AIInsight[],
    vulnerabilities: SecurityVulnerability[],
  ): CodeQualityMetrics {
    // Calculate complexity scores
    const totalComplexity = this.calculateComplexity(changes);

    // Calculate technical debt (simplified)
    const criticalIssues = vulnerabilities.filter(
      (v) => v.severity === "critical",
    ).length;
    const highIssues = vulnerabilities.filter(
      (v) => v.severity === "high",
    ).length;
    const technicalDebtHours = criticalIssues * 8 + highIssues * 4; // Simplified calculation

    return {
      maintainabilityIndex: Math.max(0, 100 - totalComplexity * 2),
      technicalDebtHours,
      complexityScore: {
        cyclomatic: totalComplexity,
        cognitive: Math.round(totalComplexity * 1.5),
        maintainability: Math.max(0, 100 - totalComplexity * 3),
      },
      duplicationScore: {
        percentage: 5, // Placeholder - would need actual duplication analysis
        duplicatedLines: 0,
        totalLines: this.getTotalLines(changes),
      },
    };
  }

  /**
   * Calculate complexity from code changes
   */
  private calculateComplexity(changes: CodeChanges): number {
    let totalComplexity = 0;

    for (const file of changes.files) {
      for (const change of file.changes) {
        const code = change.content;

        // Simple complexity calculation
        const patterns = [
          /\bif\b/g,
          /\belse\b/g,
          /\bfor\b/g,
          /\bwhile\b/g,
          /\bswitch\b/g,
          /\bcase\b/g,
          /\bcatch\b/g,
          /\btry\b/g,
          /\?/g,
          /&&/g,
          /\|\|/g,
        ];

        let complexity = 1; // Base complexity
        for (const pattern of patterns) {
          const matches = code.match(pattern);
          if (matches) {
            complexity += matches.length;
          }
        }

        totalComplexity += complexity;
      }
    }

    return totalComplexity;
  }

  /**
   * Get total lines of code from changes
   */
  private getTotalLines(changes: CodeChanges): number {
    return changes.files.reduce((total, file) => {
      return (
        total +
        file.changes.reduce((fileTotal, change) => {
          return fileTotal + change.content.split("\n").length;
        }, 0)
      );
    }, 0);
  }

  /**
   * Map AI severity to standard severity
   */
  private mapSeverity(
    severity?: string,
  ): "low" | "medium" | "high" | "critical" {
    const mapping: Record<string, "low" | "medium" | "high" | "critical"> = {
      low: "low",
      medium: "medium",
      high: "high",
      critical: "critical",
      error: "critical",
      warning: "medium",
      info: "low",
    };

    return mapping[severity || "medium"] || "medium";
  }

  /**
   * Map vulnerability type to CWE
   */
  private mapToCWE(vulnType?: string): string | undefined {
    const mapping: Record<string, string> = {
      xss: "CWE-79",
      sql_injection: "CWE-89",
      path_traversal: "CWE-22",
      code_injection: "CWE-94",
      hardcoded_secrets: "CWE-798",
      insecure_crypto: "CWE-327",
      buffer_overflow: "CWE-120",
      command_injection: "CWE-78",
    };

    return mapping[vulnType || ""];
  }

  /**
   * Detect programming language from file path
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();

    const languageMap: Record<string, string> = {
      ts: "typescript",
      js: "javascript",
      tsx: "typescript",
      jsx: "javascript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      rs: "rust",
      php: "php",
      rb: "ruby",
    };

    return languageMap[ext || ""] || "unknown";
  }
}
