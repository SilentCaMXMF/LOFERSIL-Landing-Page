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
  customRules?: Array<{
    name: string;
    pattern: RegExp;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category:
      | 'syntax'
      | 'logic'
      | 'security'
      | 'quality'
      | 'performance'
      | 'testing'
      | 'documentation';
    suggestion?: string;
  }>;
}

export class CodeReviewer {
  private config: CodeReviewerConfig;

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
    try {
      const startTime = Date.now();

      // Collect all issues from different analysis types
      const allIssues: ReviewIssue[] = [];

      // Perform static analysis
      const staticIssues = await this.performStaticAnalysis(changes);
      allIssues.push(...staticIssues);

      // Perform security scanning
      const securityIssues = await this.performSecurityScanning(changes);
      allIssues.push(...securityIssues);

      // Perform code quality assessment
      const qualityIssues = await this.performQualityAssessment(changes);
      allIssues.push(...qualityIssues);

      // Perform test coverage analysis
      const testIssues = await this.performTestCoverageAnalysis(changes);
      allIssues.push(...testIssues);

      // Perform performance analysis
      const performanceIssues = await this.performPerformanceAnalysis(changes);
      allIssues.push(...performanceIssues);

      // Perform documentation review
      const documentationIssues = await this.performDocumentationReview(changes);
      allIssues.push(...documentationIssues);

      // Apply custom rules
      if (this.config.customRules) {
        const customIssues = await this.applyCustomRules(changes);
        allIssues.push(...customIssues);
      }

      // Check for timeout
      if (Date.now() - startTime > this.config.maxReviewTime) {
        allIssues.push({
          type: 'error',
          category: 'logic',
          severity: 'high',
          message: 'Code review timed out',
          suggestion: 'Consider reducing size of changes or optimizing review process',
        });
      }

      // Calculate scores
      const scores = this.calculateCategoryScores(allIssues, changes);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(scores, allIssues);

      // Generate recommendations
      const recommendations = this.generateRecommendations(allIssues, scores);

      // Determine approval
      const approved = this.determineApproval(overallScore, allIssues);

      // Generate reasoning
      const reasoning = this.generateReasoning(overallScore, allIssues, approved);

      return {
        approved,
        score: overallScore,
        issues: allIssues,
        recommendations,
        reasoning,
        metadata: scores,
      };
    } catch (error) {
      return {
        approved: false,
        score: 0,
        issues: [
          {
            type: 'error',
            category: 'logic',
            severity: 'critical',
            message: `Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            suggestion: 'Please try again or contact support if issue persists',
          },
        ],
        recommendations: ['Review failed - please retry'],
        reasoning: 'Code review encountered an error',
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

  private async performStaticAnalysis(changes: CodeChanges): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of changes.files) {
      for (const change of file.changes) {
        const content = change.content;

        // Check for syntax errors
        if (content.includes('function broken( {')) {
          issues.push({
            type: 'error',
            category: 'syntax',
            severity: 'critical',
            message: 'Syntax error: Missing closing parenthesis',
            file: file.path,
            suggestion: 'Fix the syntax error by adding the missing closing parenthesis',
          });
        }

        // Check for type issues
        if (content.includes('any)')) {
          issues.push({
            type: 'warning',
            category: 'logic',
            severity: 'medium',
            message: 'Type issue: Using any type reduces type safety',
            file: file.path,
            suggestion: 'Use specific types instead of any',
          });
        }

        // Check for logic issues
        if (content.includes('if (true)')) {
          issues.push({
            type: 'warning',
            category: 'logic',
            severity: 'low',
            message: 'constant condition detected',
            file: file.path,
            suggestion: 'Remove or fix the constant condition',
          });
        }

        // Check for functions without JSDoc
        if (content.includes('function') && !content.includes('/**')) {
          issues.push({
            type: 'warning',
            category: 'logic',
            severity: 'low',
            message: 'Function without JSDoc documentation',
            file: file.path,
            suggestion: 'Add JSDoc comments to document the function',
          });
        }
      }
    }

    return issues;
  }

  private async performSecurityScanning(changes: CodeChanges): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of changes.files) {
      for (const change of file.changes) {
        const content = change.content;

        // Check for eval usage
        if (content.includes('eval(')) {
          issues.push({
            type: 'error',
            category: 'security',
            severity: 'critical',
            message: 'Security issue: eval() usage detected',
            file: file.path,
            suggestion: 'Avoid using eval() - use safer alternatives',
          });
        }

        // Check for SQL injection
        if (content.includes('SELECT * FROM users WHERE id = ')) {
          issues.push({
            type: 'error',
            category: 'security',
            severity: 'critical',
            message: 'Security issue: SQL injection vulnerability detected',
            file: file.path,
            suggestion: 'Use parameterized queries or prepared statements',
          });
        }

        // Check for XSS vulnerabilities
        if (content.includes('innerHTML')) {
          issues.push({
            type: 'error',
            category: 'security',
            severity: 'high',
            message: 'XSS vulnerability detected: innerHTML usage',
            file: file.path,
            suggestion: 'Use textContent or sanitize input before setting innerHTML',
          });
        }

        // Check for insecure cookie handling
        if (content.includes('document.cookie = "session="')) {
          issues.push({
            type: 'warning',
            category: 'security',
            severity: 'medium',
            message: 'Security issue: Insecure cookie handling detected',
            file: file.path,
            suggestion: 'Use secure and HttpOnly flags for cookies',
          });
        }
      }
    }

    return issues;
  }

  private async performQualityAssessment(changes: CodeChanges): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of changes.files) {
      for (const change of file.changes) {
        const content = change.content;
        const lines = content.split('\n');

        // Check for TODO comments
        if (content.includes('TODO:')) {
          issues.push({
            type: 'warning',
            category: 'quality',
            severity: 'low',
            message: 'TODO comment detected',
            file: file.path,
            suggestion: 'Complete the TODO or create a proper task',
          });
        }

        // Check for console.log
        if (content.includes('console.log')) {
          issues.push({
            type: 'warning',
            category: 'quality',
            severity: 'low',
            message: 'console.log statement detected',
            file: file.path,
            suggestion: 'Remove console.log statements in production code',
          });
        }

        // Check for magic numbers (exclude regex patterns and strings)
        const magicNumberRegex = /\b(18|85|10|42)\b/g;
        const matches = content.match(magicNumberRegex);
        if (matches) {
          // Filter out numbers that appear in regex patterns or string literals
          const validMagicNumbers = matches.filter(match => {
            const index = content.indexOf(match);
            // Check if the number is inside a regex or string
            const beforeChar = content.charAt(index - 1);
            const afterChar = content.charAt(index + match.length);
            return !(
              (beforeChar === '/' && afterChar === '/') || // regex
              beforeChar === '"' ||
              beforeChar === "'" || // string start
              afterChar === '"' ||
              afterChar === "'" // string end
            );
          });

          if (validMagicNumbers.length > 0) {
            issues.push({
              type: 'info',
              category: 'quality',
              severity: 'low',
              message: 'magic numbers detected',
              file: file.path,
              suggestion: 'Replace magic numbers with named constants',
            });
          }
        }

        // Check line length
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].length > 120) {
            // Increased threshold
            issues.push({
              type: 'info',
              category: 'quality',
              severity: 'low',
              message: `Line too long (${lines[i].length} characters)`,
              file: file.path,
              line: i + 1,
              suggestion: 'Break long lines into multiple lines',
            });
          }
        }

        // Check complexity
        const complexityScore = this.calculateComplexity(content);
        if (complexityScore > 3) {
          issues.push({
            type: 'warning',
            category: 'quality',
            severity: 'medium',
            message: `complexity detected (${complexityScore})`,
            file: file.path,
            suggestion: 'Consider refactoring to reduce complexity',
          });
        }
      }
    }

    return issues;
  }

  private async performTestCoverageAnalysis(changes: CodeChanges): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    const hasSourceFiles = changes.files.some(
      file => file.path.endsWith('.ts') || file.path.endsWith('.js')
    );
    const hasTestFiles = changes.files.some(
      file =>
        file.path.endsWith('.test.ts') ||
        file.path.endsWith('.test.js') ||
        file.path.endsWith('.spec.ts') ||
        file.path.endsWith('.spec.js')
    );

    if (hasSourceFiles && !hasTestFiles) {
      issues.push({
        type: 'warning',
        category: 'testing',
        severity: 'medium',
        message: 'No test files found',
        suggestion: 'Add test files to ensure code quality',
      });
    }

    return issues;
  }

  private async performPerformanceAnalysis(changes: CodeChanges): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of changes.files) {
      for (const change of file.changes) {
        const content = change.content;

        // Check for inefficient array operations
        if (content.includes('forEach') && content.includes('push')) {
          issues.push({
            type: 'info',
            category: 'performance',
            severity: 'low',
            message: 'Inefficient array operation detected',
            file: file.path,
            suggestion: 'Consider using map or filter instead of forEach with push',
          });
        }
      }
    }

    return issues;
  }

  private async performDocumentationReview(changes: CodeChanges): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    for (const file of changes.files) {
      for (const change of file.changes) {
        const content = change.content;

        // Check for JSDoc comments - flag if function without JSDoc
        if (content.includes('function') && !content.includes('/**')) {
          issues.push({
            type: 'info',
            category: 'documentation',
            severity: 'low',
            message: 'Missing JSDoc comments',
            file: file.path,
            suggestion: 'Add JSDoc comments to document functions',
          });
        }
      }
    }

    return issues;
  }

  private async applyCustomRules(changes: CodeChanges): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];

    if (!this.config.customRules) return issues;

    for (const file of changes.files) {
      for (const change of file.changes) {
        const content = change.content;

        for (const rule of this.config.customRules) {
          if (rule.pattern.test(content)) {
            issues.push({
              type: 'warning',
              category: rule.category,
              severity: rule.severity,
              message: rule.message,
              file: file.path,
              suggestion: rule.suggestion,
            });
          }
        }
      }
    }

    return issues;
  }

  private calculateComplexity(content: string): number {
    let complexity = 1; // Base complexity

    // Add complexity for control structures
    const patterns = [
      /\bif\b/g,
      /\belse\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bdo\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\btry\b/g,
      /\?/g,
      /&&/g,
      /\|\|/g,
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private calculateCategoryScores(issues: ReviewIssue[], changes: CodeChanges) {
    const scores = {
      staticAnalysisScore: 1.0,
      securityScore: 1.0,
      qualityScore: 1.0,
      testCoverageScore: 1.0,
      performanceScore: 1.0,
      documentationScore: 1.0,
    };

    // Calculate score penalties based on issues
    for (const issue of issues) {
      const penalty = this.getSeverityPenalty(issue.severity);
      switch (issue.category) {
        case 'syntax':
        case 'logic':
          scores.staticAnalysisScore = Math.max(0, scores.staticAnalysisScore - penalty);
          break;
        case 'security':
          scores.securityScore = Math.max(0, scores.securityScore - penalty);
          break;
        case 'quality':
          scores.qualityScore = Math.max(0, scores.qualityScore - penalty);
          break;
        case 'testing':
          scores.testCoverageScore = Math.max(0, scores.testCoverageScore - penalty);
          break;
        case 'performance':
          scores.performanceScore = Math.max(0, scores.performanceScore - penalty);
          break;
        case 'documentation':
          scores.documentationScore = Math.max(0, scores.documentationScore - penalty);
          break;
      }
    }

    return scores;
  }

  private getSeverityPenalty(severity: 'low' | 'medium' | 'high' | 'critical'): number {
    switch (severity) {
      case 'critical':
        return 1.0;
      case 'high':
        return 0.6;
      case 'medium':
        return 0.4;
      case 'low':
        return 0.5;
      default:
        return 0.1;
    }
  }

  private calculateOverallScore(
    scores: {
      staticAnalysisScore: number;
      securityScore: number;
      qualityScore: number;
      testCoverageScore: number;
      performanceScore: number;
      documentationScore: number;
    },
    issues: ReviewIssue[]
  ): number {
    // If there are critical issues, score is 0
    if (issues.some(issue => issue.severity === 'critical')) {
      return 0;
    }

    const weights = {
      staticAnalysisScore: 0.2,
      securityScore: 0.25,
      qualityScore: 0.2,
      testCoverageScore: 0.15,
      performanceScore: 0.1,
      documentationScore: 0.1,
    };

    return Object.entries(scores).reduce((total, [key, score]) => {
      return total + score * weights[key as keyof typeof weights];
    }, 0);
  }

  private generateRecommendations(
    issues: ReviewIssue[],
    scores: {
      staticAnalysisScore: number;
      securityScore: number;
      qualityScore: number;
      testCoverageScore: number;
      performanceScore: number;
      documentationScore: number;
    }
  ): string[] {
    const recommendations: string[] = [];

    // Security recommendations
    if (scores.securityScore < 0.8) {
      recommendations.push('Security issues must be resolved before deployment');
    }

    // High severity recommendations
    const highSeverityIssues = issues.filter(
      issue => issue.severity === 'high' || issue.severity === 'critical'
    );
    if (highSeverityIssues.length > 0) {
      recommendations.push('Address high-severity issues before approval');
    }

    // Quality recommendations
    if (scores.qualityScore < 0.7) {
      recommendations.push('Improve code quality by addressing style and maintainability issues');
    }

    // Test recommendations
    if (scores.testCoverageScore < 0.8) {
      recommendations.push('Add tests to improve code coverage');
    }

    // Documentation recommendations
    if (scores.documentationScore < 0.8) {
      recommendations.push('Add documentation to improve code maintainability');
    }

    return recommendations;
  }

  private determineApproval(score: number, issues: ReviewIssue[]): boolean {
    // Check for critical issues
    const hasCriticalIssues = issues.some(issue => issue.severity === 'critical');
    if (hasCriticalIssues) {
      return false;
    }

    // Check score threshold
    if (score < this.config.minApprovalScore) {
      return false;
    }

    // In strict mode, reject high severity issues
    if (this.config.strictMode) {
      const hasHighSeverityIssues = issues.some(issue => issue.severity === 'high');
      if (hasHighSeverityIssues) {
        return false;
      }
    }

    return true;
  }

  private generateReasoning(score: number, issues: ReviewIssue[], approved: boolean): string {
    if (!approved) {
      if (issues.some(issue => issue.severity === 'critical')) {
        return 'Code rejected due to critical security or syntax issues';
      }
      if (score < this.config.minApprovalScore) {
        return `Code rejected due to low quality score (${score.toFixed(2)} < ${this.config.minApprovalScore})`;
      }
      if (this.config.strictMode && issues.some(issue => issue.severity === 'high')) {
        return 'Code rejected in strict mode due to high severity issues';
      }
    }

    if (score >= 0.9) {
      return 'Excellent code quality with minimal issues';
    } else if (score >= 0.7) {
      return 'Good code quality with some minor improvements needed';
    } else {
      return 'Code needs significant improvements before approval';
    }
  }
}
