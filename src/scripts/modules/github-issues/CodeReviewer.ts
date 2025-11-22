/**
 * Code Reviewer Component
 *
 * Validates generated solutions and ensures code quality standards are met.
 * Performs static analysis, security scanning, and quality assessments.
 */

import { OpenCodeAgent } from '../OpenCodeAgent';
import { CodeChanges } from './AutonomousResolver';

export interface ReviewResult {
  approved: boolean;
  score: number; // 0-1 scale
  issues: ReviewIssue[];
  recommendations: string[];
  reasoning: string;
  metadata: {
    staticAnalysisScore: number;
    securityScore: number;
    qualityScore: number;
    testCoverageScore: number;
    performanceScore: number;
    documentationScore: number;
  };
}

export interface ReviewIssue {
  type: 'error' | 'warning' | 'info';
  category:
    | 'syntax'
    | 'logic'
    | 'security'
    | 'quality'
    | 'performance'
    | 'testing'
    | 'documentation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface CodeReviewerConfig {
  openCodeAgent: OpenCodeAgent;
  minApprovalScore: number;
  strictMode: boolean;
  securityScanEnabled: boolean;
  performanceAnalysisEnabled: boolean;
  documentationRequired: boolean;
  maxReviewTime: number; // milliseconds
  customRules?: ReviewRule[];
}

export interface ReviewRule {
  name: string;
  pattern: RegExp;
  message: string;
  severity: ReviewIssue['severity'];
  category: ReviewIssue['category'];
  suggestion?: string;
}

export class CodeReviewer {
  private config: CodeReviewerConfig;
  private readonly defaultRules: ReviewRule[] = [
    {
      name: 'no-console-log',
      pattern: /console\.log\(/g,
      message: 'Avoid using console.log in production code',
      severity: 'low',
      category: 'quality',
      suggestion: 'Use a proper logging library instead',
    },
    {
      name: 'no-eval',
      pattern: /\beval\s*\(/g,
      message: 'Use of eval() is dangerous and should be avoided',
      severity: 'critical',
      category: 'security',
      suggestion: 'Use safer alternatives like JSON.parse() or Function constructor',
    },
    {
      name: 'no-innerHTML',
      pattern: /\.innerHTML\s*=/g,
      message: 'Direct assignment to innerHTML can lead to XSS vulnerabilities',
      severity: 'high',
      category: 'security',
      suggestion: 'Use textContent or createElement with proper sanitization',
    },
    {
      name: 'todo-comments',
      pattern: /\/\/\s*TODO|\/\*\s*TODO/g,
      message: 'TODO comments indicate incomplete implementation',
      severity: 'medium',
      category: 'quality',
      suggestion: 'Complete the implementation or create a proper issue',
    },
    {
      name: 'long-functions',
      pattern: /function\s+\w+\s*\([^)]*\)\s*{[^}]{1000,}}/g,
      message: 'Function is too long and should be broken down',
      severity: 'medium',
      category: 'quality',
      suggestion: 'Extract smaller functions or use early returns',
    },
  ];

  constructor(config: CodeReviewerConfig) {
    this.config = config;
  }

  /**
   * Review code changes and provide comprehensive feedback
   */
  async reviewChanges(
    changes: CodeChanges,
    originalIssue: { number: number; title: string; body: string }
  ): Promise<ReviewResult> {
    const startTime = Date.now();
    const issues: ReviewIssue[] = [];
    const recommendations: string[] = [];

    try {
      // Perform static analysis
      const staticAnalysis = await this.performStaticAnalysis(changes);
      issues.push(...staticAnalysis.issues);

      // Security scanning
      if (this.config.securityScanEnabled) {
        const securityScan = await this.performSecurityScan(changes);
        issues.push(...securityScan.issues);
      }

      // Code quality assessment
      const qualityAssessment = await this.assessCodeQuality(changes);
      issues.push(...qualityAssessment.issues);

      // Test coverage analysis
      const testAnalysis = await this.analyzeTestCoverage(changes);
      issues.push(...testAnalysis.issues);

      // Performance impact analysis
      if (this.config.performanceAnalysisEnabled) {
        const performanceAnalysis = await this.analyzePerformanceImpact(changes);
        issues.push(...performanceAnalysis.issues);
      }

      // Documentation review
      if (this.config.documentationRequired) {
        const documentationReview = await this.reviewDocumentation(changes, originalIssue);
        issues.push(...documentationReview.issues);
      }

      // Apply custom rules
      if (this.config.customRules) {
        const customRuleResults = this.applyCustomRules(changes, this.config.customRules);
        issues.push(...customRuleResults);
      }

      // Calculate overall score
      const score = this.calculateOverallScore(issues);

      // Generate recommendations
      recommendations.push(...this.generateRecommendations(issues, score));

      // Determine approval
      const approved = this.determineApproval(score, issues);

      // Check timeout
      if (Date.now() - startTime > this.config.maxReviewTime) {
        issues.push({
          type: 'warning',
          category: 'performance',
          severity: 'medium',
          message: 'Review timed out - some checks may be incomplete',
        });
      }

      // Calculate metadata scores
      const metadata = this.calculateMetadataScores(issues);

      return {
        approved,
        score,
        issues,
        recommendations,
        reasoning: this.generateReasoning(approved, score, issues),
        metadata,
      };
    } catch (error) {
      console.error('Code review failed:', error);
      return this.createErrorResult(error);
    }
  }

  /**
   * Perform static analysis on code changes
   */
  private async performStaticAnalysis(changes: CodeChanges): Promise<{ issues: ReviewIssue[] }> {
    const issues: ReviewIssue[] = [];

    for (const file of changes.files) {
      for (const change of file.changes) {
        // Basic syntax checking
        const syntaxIssues = this.checkSyntax(change.content);
        issues.push(...syntaxIssues.map(issue => ({ ...issue, file: file.path })));

        // Type checking (basic)
        const typeIssues = this.checkTypes(change.content);
        issues.push(...typeIssues.map(issue => ({ ...issue, file: file.path })));

        // Logic analysis
        const logicIssues = this.analyzeLogic(change.content);
        issues.push(...logicIssues.map(issue => ({ ...issue, file: file.path })));
      }
    }

    return { issues };
  }

  /**
   * Perform security scanning
   */
  private async performSecurityScan(changes: CodeChanges): Promise<{ issues: ReviewIssue[] }> {
    const issues: ReviewIssue[] = [];

    for (const file of changes.files) {
      for (const change of file.changes) {
        // Check for common security vulnerabilities
        const vulnerabilities = this.scanForVulnerabilities(change.content);
        issues.push(...vulnerabilities.map(issue => ({ ...issue, file: file.path })));

        // Check for insecure patterns
        const insecurePatterns = this.checkInsecurePatterns(change.content);
        issues.push(...insecurePatterns.map(issue => ({ ...issue, file: file.path })));
      }
    }

    return { issues };
  }

  /**
   * Assess code quality
   */
  private async assessCodeQuality(changes: CodeChanges): Promise<{ issues: ReviewIssue[] }> {
    const issues: ReviewIssue[] = [];

    for (const file of changes.files) {
      for (const change of file.changes) {
        // Code style and conventions
        const styleIssues = this.checkCodeStyle(change.content);
        issues.push(...styleIssues.map(issue => ({ ...issue, file: file.path })));

        // Complexity analysis
        const complexityIssues = this.analyzeComplexity(change.content);
        issues.push(...complexityIssues.map(issue => ({ ...issue, file: file.path })));

        // Maintainability checks
        const maintainabilityIssues = this.checkMaintainability(change.content);
        issues.push(...maintainabilityIssues.map(issue => ({ ...issue, file: file.path })));
      }
    }

    return { issues };
  }

  /**
   * Analyze test coverage and quality
   */
  private async analyzeTestCoverage(changes: CodeChanges): Promise<{ issues: ReviewIssue[] }> {
    const issues: ReviewIssue[] = [];

    // Check if tests are included in changes
    const hasTests = changes.files.some(
      file =>
        file.path.includes('.test.') ||
        file.path.includes('.spec.') ||
        file.path.includes('/tests/') ||
        file.path.includes('/test/')
    );

    if (!hasTests) {
      issues.push({
        type: 'warning',
        category: 'testing',
        severity: 'medium',
        message: 'No test files found in changes',
        suggestion: 'Consider adding unit tests for the new functionality',
      });
    }

    // Analyze test quality if tests are present
    for (const file of changes.files) {
      if (file.path.includes('.test.') || file.path.includes('.spec.')) {
        for (const change of file.changes) {
          const testQualityIssues = this.assessTestQuality(change.content);
          issues.push(...testQualityIssues.map(issue => ({ ...issue, file: file.path })));
        }
      }
    }

    return { issues };
  }

  /**
   * Check for syntax errors in code
   */
  private checkSyntax(content: string): Omit<ReviewIssue, 'file'>[] {
    const issues: Omit<ReviewIssue, 'file'>[] = [];

    // Basic syntax checks
    try {
      // Check for unmatched brackets
      const openBrackets = (content.match(/[\[\({]/g) || []).length;
      const closeBrackets = (content.match(/[\]\)}]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        issues.push({
          type: 'error',
          category: 'syntax',
          severity: 'high',
          message: 'Unmatched brackets detected',
          suggestion: 'Check for missing or extra brackets',
        });
      }

      // Check for common syntax errors
      if (content.includes(';;') || content.includes(',,')) {
        issues.push({
          type: 'warning',
          category: 'syntax',
          severity: 'low',
          message: 'Double semicolons or commas detected',
          suggestion: 'Remove duplicate punctuation',
        });
      }
    } catch (error) {
      issues.push({
        type: 'error',
        category: 'syntax',
        severity: 'critical',
        message: 'Syntax analysis failed',
        suggestion: 'Review code for basic syntax errors',
      });
    }

    return issues;
  }

  /**
   * Check for type-related issues
   */
  private checkTypes(content: string): Omit<ReviewIssue, 'file'>[] {
    const issues: Omit<ReviewIssue, 'file'>[] = [];

    // Basic type checking for TypeScript
    if (content.includes(': any')) {
      issues.push({
        type: 'warning',
        category: 'logic',
        severity: 'medium',
        message: 'Use of "any" type reduces type safety',
        suggestion: 'Use specific types instead of any',
      });
    }

    return issues;
  }

  /**
   * Analyze code logic for potential issues
   */
  private analyzeLogic(content: string): Omit<ReviewIssue, 'file'>[] {
    const issues: Omit<ReviewIssue, 'file'>[] = [];

    // Check for potential logic errors
    if (content.includes('if (false)') || content.includes('if (true)')) {
      issues.push({
        type: 'warning',
        category: 'logic',
        severity: 'medium',
        message: 'Constant condition in if statement',
        suggestion: 'Review the condition logic',
      });
    }

    return issues;
  }

  /**
   * Scan for security vulnerabilities
   */
  private scanForVulnerabilities(content: string): Omit<ReviewIssue, 'file'>[] {
    const issues: Omit<ReviewIssue, 'file'>[] = [];

    // Check for SQL injection patterns
    if (content.includes('query(') && content.includes('+')) {
      issues.push({
        type: 'error',
        category: 'security',
        severity: 'critical',
        message: 'Potential SQL injection vulnerability',
        suggestion: 'Use parameterized queries instead of string concatenation',
      });
    }

    return issues;
  }

  /**
   * Check for insecure patterns
   */
  private checkInsecurePatterns(content: string): Omit<ReviewIssue, 'file'>[] {
    const issues: Omit<ReviewIssue, 'file'>[] = [];

    // Check for dangerous patterns
    if (content.includes('document.cookie')) {
      issues.push({
        type: 'warning',
        category: 'security',
        severity: 'high',
        message: 'Direct cookie manipulation detected',
        suggestion: 'Use secure cookie libraries',
      });
    }

    return issues;
  }

  /**
   * Check code style and formatting
   */
  private checkCodeStyle(content: string): Omit<ReviewIssue, 'file'>[] {
    const issues: Omit<ReviewIssue, 'file'>[] = [];

    // Check line length
    const longLines = content.split('\n').filter(line => line.length > 100);
    if (longLines.length > 0) {
      issues.push({
        type: 'info',
        category: 'quality',
        severity: 'low',
        message: `${longLines.length} lines exceed 100 characters`,
        suggestion: 'Break long lines for better readability',
      });
    }

    return issues;
  }

  /**
   * Analyze code complexity
   */
  private analyzeComplexity(content: string): Omit<ReviewIssue, 'file'>[] {
    const issues: Omit<ReviewIssue, 'file'>[] = [];

    // Simple complexity metrics
    const functionCount = (content.match(/function\s+/g) || []).length;
    const ifCount = (content.match(/\bif\s*\(/g) || []).length;
    const loopCount = (content.match(/\b(for|while)\s*\(/g) || []).length;

    const complexityScore = functionCount + ifCount * 0.5 + loopCount * 0.3;

    if (complexityScore > 5) {
      issues.push({
        type: 'warning',
        category: 'quality',
        severity: 'medium',
        message: `High cyclomatic complexity (score: ${complexityScore.toFixed(1)})`,
        suggestion: 'Consider breaking down into smaller functions',
      });
    }

    return issues;
  }

  /**
   * Check code maintainability
   */
  private checkMaintainability(content: string): Omit<ReviewIssue, 'file'>[] {
    const issues: Omit<ReviewIssue, 'file'>[] = [];

    // Check for magic numbers
    const magicNumbers = content.match(/\b\d{2,}\b/g);
    if (magicNumbers && magicNumbers.length > 3) {
      issues.push({
        type: 'info',
        category: 'quality',
        severity: 'low',
        message: 'Multiple magic numbers detected',
        suggestion: 'Replace magic numbers with named constants',
      });
    }

    return issues;
  }

  /**
   * Assess test quality
   */
  private assessTestQuality(content: string): Omit<ReviewIssue, 'file'>[] {
    const issues: Omit<ReviewIssue, 'file'>[] = [];

    // Check for basic test structure
    if (!content.includes('describe(') && !content.includes('it(')) {
      issues.push({
        type: 'warning',
        category: 'testing',
        severity: 'medium',
        message: 'Test file lacks proper test structure',
        suggestion: 'Use describe() and it() blocks for proper test organization',
      });
    }

    return issues;
  }

  /**
   * Check for performance issues
   */
  private checkPerformanceIssues(content: string): Omit<ReviewIssue, 'file'>[] {
    const issues: Omit<ReviewIssue, 'file'>[] = [];

    // Check for performance anti-patterns
    if (content.includes('.forEach(') && content.includes('.push(')) {
      issues.push({
        type: 'info',
        category: 'performance',
        severity: 'low',
        message: 'forEach with push could be optimized',
        suggestion: 'Consider using map() or more efficient alternatives',
      });
    }

    return issues;
  }

  /**
   * Estimate complexity impact
   */
  private estimateComplexityImpact(content: string): number {
    // Simple complexity estimation
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+/g) || []).length;
    const conditionals = (content.match(/\b(if|else|switch|case)\b/g) || []).length;

    return Math.min(1, (lines / 100 + functions / 5 + conditionals / 10) / 3);
  }

  /**
   * Check documentation completeness
   */
  private checkDocumentation(content: string, filePath: string): Omit<ReviewIssue, 'file'>[] {
    const issues: Omit<ReviewIssue, 'file'>[] = [];

    // Check for JSDoc comments
    const functionCount = (content.match(/function\s+/g) || []).length;
    const jsdocCount = (content.match(/\/\*\*/g) || []).length;

    if (functionCount > 0 && jsdocCount === 0) {
      issues.push({
        type: 'info',
        category: 'documentation',
        severity: 'low',
        message: 'Functions lack JSDoc documentation',
        suggestion: 'Add JSDoc comments to exported functions',
      });
    }

    return issues;
  }

  /**
   * Calculate overall score from issues
   */
  private calculateOverallScore(issues: ReviewIssue[]): number {
    if (issues.length === 0) return 1.0;

    // Weight issues by severity
    const weights = {
      critical: 1.0,
      high: 0.7,
      medium: 0.4,
      low: 0.1,
    };

    const totalWeight = issues.reduce((sum, issue) => sum + weights[issue.severity], 0);
    const maxPossibleWeight = issues.length * 1.0; // Assuming all could be critical

    return Math.max(0, Math.min(1, 1 - totalWeight / maxPossibleWeight));
  }

  /**
   * Calculate metadata scores by category
   */
  private calculateMetadataScores(issues: ReviewIssue[]): ReviewResult['metadata'] {
    const categoryCounts = {
      syntax: 0,
      logic: 0,
      security: 0,
      quality: 0,
      performance: 0,
      testing: 0,
      documentation: 0,
    };

    // Count issues by category
    issues.forEach(issue => {
      if (categoryCounts.hasOwnProperty(issue.category)) {
        categoryCounts[issue.category]++;
      }
    });

    const totalIssues = issues.length || 1; // Avoid division by zero

    return {
      staticAnalysisScore: 1 - (categoryCounts.syntax + categoryCounts.logic) / totalIssues,
      securityScore: 1 - categoryCounts.security / totalIssues,
      qualityScore: 1 - categoryCounts.quality / totalIssues,
      testCoverageScore: 1 - categoryCounts.testing / totalIssues,
      performanceScore: 1 - categoryCounts.performance / totalIssues,
      documentationScore: 1 - categoryCounts.documentation / totalIssues,
    };
  }

  /**
   * Determine if changes should be approved
   */
  private determineApproval(score: number, issues: ReviewIssue[]): boolean {
    // Check for blocking issues
    const hasBlockingIssues = issues.some(
      issue =>
        issue.severity === 'critical' || (this.config.strictMode && issue.severity === 'high')
    );

    return !hasBlockingIssues && score >= this.config.minApprovalScore;
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: ReviewIssue[], score: number): string[] {
    const recommendations: string[] = [];

    if (score < 0.7) {
      recommendations.push('Address high-severity issues before approval');
    }

    if (issues.some(i => i.category === 'security')) {
      recommendations.push('Security issues must be resolved before deployment');
    }

    if (issues.some(i => i.category === 'testing')) {
      recommendations.push('Add comprehensive tests to ensure code reliability');
    }

    if (issues.some(i => i.category === 'documentation')) {
      recommendations.push('Improve documentation for better maintainability');
    }

    return recommendations;
  }

  /**
   * Generate reasoning for the review result
   */
  private generateReasoning(approved: boolean, score: number, issues: ReviewIssue[]): string {
    const parts = [
      `Review ${approved ? 'approved' : 'rejected'} with score ${(score * 100).toFixed(1)}%`,
      `${issues.length} issues found`,
      `${issues.filter(i => i.severity === 'critical').length} critical issues`,
      `${issues.filter(i => i.severity === 'high').length} high-severity issues`,
    ];

    return parts.join('. ');
  }

  /**
   * Create error result when review fails
   */
  private createErrorResult(error: any): ReviewResult {
    return {
      approved: false,
      score: 0,
      issues: [
        {
          type: 'error',
          category: 'syntax',
          severity: 'critical',
          message: `Review failed: ${error.message}`,
          suggestion: 'Manual review required',
        },
      ],
      recommendations: ['Manual code review required due to analysis failure'],
      reasoning: 'Code review analysis failed',
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
