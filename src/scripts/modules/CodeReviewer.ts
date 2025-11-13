/**
 * CodeReviewer - AI-Generated Code Validation Agent
 *
 * Reviews and validates AI-generated code changes for correctness, security,
 * and adherence to best practices.
 */

import type { ErrorHandler } from './ErrorHandler';
import { envLoader } from './EnvironmentLoader';
import type { IssueAnalysis } from './IssueAnalyzer';
import type { CodeGenerationResult } from './SWEResolver';

/**
 * Code review result
 */
export interface CodeReviewResult {
  overallAssessment: 'approve' | 'reject' | 'requires-changes';
  issues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'correctness' | 'security' | 'performance' | 'maintainability' | 'style' | 'testing';
    description: string;
    file?: string;
    line?: number;
    suggestion?: string;
  }>;
  strengths: string[];
  recommendations: string[];
  confidence: number; // 0-1, how confident the reviewer is in the assessment
  requiresHumanReview: boolean;
  reasoning: string;
}

/**
 * CodeReviewer configuration
 */
export interface CodeReviewerConfig {
  openaiApiKey: string;
  model?: string;
  temperature?: number;
  strictMode?: boolean;
  securityChecks?: boolean;
  performanceChecks?: boolean;
  styleChecks?: boolean;
}

/**
 * CodeReviewer - Validates AI-generated code
 */
export class CodeReviewer {
  private config: CodeReviewerConfig;
  private errorHandler?: ErrorHandler;

  constructor(config: Partial<CodeReviewerConfig> = {}, errorHandler?: ErrorHandler) {
    this.config = {
      openaiApiKey: config.openaiApiKey || envLoader.getRequired('OPENAI_API_KEY'),
      model: config.model || 'gpt-4',
      temperature: config.temperature || 0.2,
      strictMode: config.strictMode || true,
      securityChecks: config.securityChecks || true,
      performanceChecks: config.performanceChecks || true,
      styleChecks: config.styleChecks || true,
      ...config,
    };
    this.errorHandler = errorHandler;
  }

  /**
   * Review AI-generated code changes
   */
  async reviewCode(
    issueAnalysis: IssueAnalysis,
    codeResult: CodeGenerationResult,
    worktreePath: string
  ): Promise<CodeReviewResult> {
    try {
      console.log(`🔍 Reviewing code changes for issue #${issueAnalysis.issueId}`);

      // Perform comprehensive code review
      const issues = await this.performCodeReview(issueAnalysis, codeResult, worktreePath);
      const strengths = await this.identifyStrengths(codeResult);
      const recommendations = await this.generateRecommendations(issues, codeResult);

      // Determine overall assessment
      const overallAssessment = this.determineOverallAssessment(issues);
      const confidence = this.calculateConfidence(issues, codeResult);
      const requiresHumanReview = this.requiresHumanReview(issues, overallAssessment);

      const reasoning = this.generateReasoning(issues, strengths, overallAssessment);

      console.log(`✅ Code review complete: ${overallAssessment} (${issues.length} issues found)`);

      return {
        overallAssessment,
        issues,
        strengths,
        recommendations,
        confidence,
        requiresHumanReview,
        reasoning,
      };
    } catch (error) {
      console.error(`❌ Code review failed for issue #${issueAnalysis.issueId}:`, error);
      this.errorHandler?.handleError(error as Error, 'CodeReviewer.reviewCode');

      return {
        overallAssessment: 'requires-changes',
        issues: [
          {
            severity: 'high',
            category: 'correctness',
            description: `Code review failed: ${(error as Error).message}`,
          },
        ],
        strengths: [],
        recommendations: ['Manual code review required due to automated review failure'],
        confidence: 0,
        requiresHumanReview: true,
        reasoning: 'Automated code review encountered an error and requires manual review',
      };
    }
  }

  /**
   * Perform comprehensive code review
   */
  private async performCodeReview(
    issueAnalysis: IssueAnalysis,
    codeResult: CodeGenerationResult,
    worktreePath: string
  ): Promise<CodeReviewResult['issues']> {
    const issues: CodeReviewResult['issues'] = [];

    // Check each changed file
    for (const change of codeResult.changes) {
      const fileIssues = await this.reviewFile(change, issueAnalysis, worktreePath);
      issues.push(...fileIssues);
    }

    // Cross-file analysis
    const crossFileIssues = await this.reviewCrossFileConsistency(codeResult, issueAnalysis);
    issues.push(...crossFileIssues);

    // Requirement fulfillment check
    const requirementIssues = await this.checkRequirementFulfillment(codeResult, issueAnalysis);
    issues.push(...requirementIssues);

    return issues;
  }

  /**
   * Review a specific file change
   */
  private async reviewFile(
    change: CodeGenerationResult['changes'][0],
    issueAnalysis: IssueAnalysis,
    worktreePath: string
  ): Promise<CodeReviewResult['issues']> {
    const issues: CodeReviewResult['issues'] = [];

    try {
      // Read the file content
      const content = await this.readFile(`${worktreePath}/${change.file}`);
      if (!content) {
        issues.push({
          severity: 'high',
          category: 'correctness',
          description: `File ${change.file} could not be read for review`,
          file: change.file,
        });
        return issues;
      }

      // Syntax and structure checks
      const syntaxIssues = this.checkSyntaxAndStructure(content, change.file);
      issues.push(...syntaxIssues);

      // Security checks
      if (this.config.securityChecks) {
        const securityIssues = this.checkSecurity(content, change.file);
        issues.push(...securityIssues);
      }

      // Performance checks
      if (this.config.performanceChecks) {
        const performanceIssues = this.checkPerformance(content, change.file);
        issues.push(...performanceIssues);
      }

      // Style and convention checks
      if (this.config.styleChecks) {
        const styleIssues = this.checkStyleAndConventions(content, change.file);
        issues.push(...styleIssues);
      }

      // Type safety checks (for TypeScript)
      if (change.file.endsWith('.ts')) {
        const typeIssues = this.checkTypeSafety(content, change.file);
        issues.push(...typeIssues);
      }
    } catch (error) {
      issues.push({
        severity: 'high',
        category: 'correctness',
        description: `Failed to review file ${change.file}: ${(error as Error).message}`,
        file: change.file,
      });
    }

    return issues;
  }

  /**
   * Check syntax and basic structure
   */
  private checkSyntaxAndStructure(content: string, file: string): CodeReviewResult['issues'] {
    const issues: CodeReviewResult['issues'] = [];

    // Check for basic syntax issues
    if (
      content.includes('undefined') &&
      !content.includes('typeof') &&
      !content.includes('!== undefined')
    ) {
      issues.push({
        severity: 'medium',
        category: 'correctness',
        description: 'Potential undefined access without proper checking',
        file,
        suggestion: 'Add proper undefined/null checks',
      });
    }

    // Check for console.log statements (should be removed in production)
    const consoleMatches = content.match(/console\.(log|error|warn)/g);
    if (consoleMatches && consoleMatches.length > 0) {
      issues.push({
        severity: 'low',
        category: 'style',
        description: `${consoleMatches.length} console statements found`,
        file,
        suggestion: 'Remove console statements or replace with proper logging',
      });
    }

    // Check for TODO comments
    if (content.includes('TODO') || content.includes('FIXME')) {
      issues.push({
        severity: 'low',
        category: 'maintainability',
        description: 'TODO/FIXME comments found',
        file,
        suggestion: 'Address TODO items or convert to proper issues',
      });
    }

    return issues;
  }

  /**
   * Check for security vulnerabilities
   */
  private checkSecurity(content: string, file: string): CodeReviewResult['issues'] {
    const issues: CodeReviewResult['issues'] = [];

    // Check for dangerous patterns
    if (content.includes('eval(') || content.includes('Function(')) {
      issues.push({
        severity: 'critical',
        category: 'security',
        description: 'Use of eval() or Function() constructor detected',
        file,
        suggestion: 'Avoid eval() and Function() constructors for security reasons',
      });
    }

    // Check for innerHTML usage
    if (content.includes('innerHTML') && !content.includes('DOMPurify')) {
      issues.push({
        severity: 'high',
        category: 'security',
        description: 'innerHTML used without sanitization',
        file,
        suggestion: 'Use DOMPurify or textContent instead of innerHTML',
      });
    }

    // Check for hardcoded secrets
    const secretPatterns = [
      /password\s*[:=]\s*['"][^'"]*['"]/i,
      /secret\s*[:=]\s*['"][^'"]*['"]/i,
      /token\s*[:=]\s*['"][^'"]*['"]/i,
      /api[_-]?key\s*[:=]\s*['"][^'"]*['"]/i,
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        issues.push({
          severity: 'critical',
          category: 'security',
          description: 'Potential hardcoded secret detected',
          file,
          suggestion: 'Use environment variables or secure credential storage',
        });
        break;
      }
    }

    // Check for SQL injection patterns (basic)
    if (content.includes('query(') || content.includes('execute(')) {
      if (content.includes('${') && !content.includes('sql`')) {
        issues.push({
          severity: 'high',
          category: 'security',
          description: 'Potential SQL injection vulnerability',
          file,
          suggestion: 'Use parameterized queries or prepared statements',
        });
      }
    }

    return issues;
  }

  /**
   * Check for performance issues
   */
  private checkPerformance(content: string, file: string): CodeReviewResult['issues'] {
    const issues: CodeReviewResult['issues'] = [];

    // Check for inefficient patterns
    if (content.includes('.forEach(') && content.includes('.push(')) {
      issues.push({
        severity: 'medium',
        category: 'performance',
        description: 'Using forEach with push - consider using map() instead',
        file,
        suggestion: 'Use map() for transforming arrays',
      });
    }

    // Check for large objects in memory
    const largeObjectMatches = content.match(/new Array\(\d+\)/g);
    if (largeObjectMatches) {
      for (const match of largeObjectMatches) {
        const size = parseInt(match.match(/\d+/)?.[0] || '0');
        if (size > 1000) {
          issues.push({
            severity: 'medium',
            category: 'performance',
            description: `Large array allocation: ${size} elements`,
            file,
            suggestion: 'Consider lazy loading or pagination for large datasets',
          });
        }
      }
    }

    // Check for synchronous operations that could be async
    if (content.includes('readFileSync') || content.includes('writeFileSync')) {
      issues.push({
        severity: 'medium',
        category: 'performance',
        description: 'Synchronous file operations detected',
        file,
        suggestion: 'Use asynchronous file operations',
      });
    }

    return issues;
  }

  /**
   * Check style and coding conventions
   */
  private checkStyleAndConventions(content: string, file: string): CodeReviewResult['issues'] {
    const issues: CodeReviewResult['issues'] = [];

    // Check line length (basic)
    const lines = content.split('\n');
    const longLines = lines.filter(line => line.length > 100);
    if (longLines.length > 0) {
      issues.push({
        severity: 'low',
        category: 'style',
        description: `${longLines.length} lines exceed 100 characters`,
        file,
        suggestion: 'Break long lines for better readability',
      });
    }

    // Check for magic numbers
    const magicNumberMatches = content.match(/\b\d{2,}\b/g);
    if (magicNumberMatches && magicNumberMatches.length > 3) {
      issues.push({
        severity: 'low',
        category: 'maintainability',
        description: 'Magic numbers detected',
        file,
        suggestion: 'Extract magic numbers into named constants',
      });
    }

    // Check for proper error handling
    const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g);
    const tryCatchMatches = content.match(/try\s*{/g);
    if (
      functionMatches &&
      (!tryCatchMatches || functionMatches.length > tryCatchMatches.length * 2)
    ) {
      issues.push({
        severity: 'medium',
        category: 'correctness',
        description: 'Limited error handling detected',
        file,
        suggestion: 'Add proper try-catch blocks for error-prone operations',
      });
    }

    return issues;
  }

  /**
   * Check TypeScript type safety
   */
  private checkTypeSafety(content: string, file: string): CodeReviewResult['issues'] {
    const issues: CodeReviewResult['issues'] = [];

    // Check for any types
    const anyMatches = content.match(/:\s*any\b/g);
    if (anyMatches && anyMatches.length > 0) {
      issues.push({
        severity: 'medium',
        category: 'maintainability',
        description: `${anyMatches.length} 'any' types found`,
        file,
        suggestion: 'Use specific types instead of any for better type safety',
      });
    }

    // Check for missing return types on functions
    const functionMatches = content.match(/function\s+\w+\s*\([^)]*\)\s*{/g);
    if (functionMatches) {
      for (const match of functionMatches) {
        if (!match.includes('):') && !match.includes('void')) {
          issues.push({
            severity: 'low',
            category: 'maintainability',
            description: 'Function missing explicit return type',
            file,
            suggestion: 'Add explicit return type annotations',
          });
          break; // Only report once per file
        }
      }
    }

    // Check for non-null assertions
    const nonNullMatches = content.match(/!\./g);
    if (nonNullMatches && nonNullMatches.length > 2) {
      issues.push({
        severity: 'medium',
        category: 'correctness',
        description: 'Excessive use of non-null assertions',
        file,
        suggestion: 'Use proper null checks instead of non-null assertions',
      });
    }

    return issues;
  }

  /**
   * Review cross-file consistency
   */
  private async reviewCrossFileConsistency(
    codeResult: CodeGenerationResult,
    issueAnalysis: IssueAnalysis
  ): Promise<CodeReviewResult['issues']> {
    const issues: CodeReviewResult['issues'] = [];

    // Check for consistent naming patterns
    const files = codeResult.changes.map(c => c.file);
    const hasInconsistentNaming =
      files.some(f => f.includes('_')) && files.some(f => f.includes('-'));

    if (hasInconsistentNaming) {
      issues.push({
        severity: 'low',
        category: 'style',
        description: 'Inconsistent file naming conventions (mix of snake_case and kebab-case)',
        suggestion: 'Use consistent naming conventions across files',
      });
    }

    // Check for missing imports/exports consistency
    const newFiles = codeResult.changes.filter(c => c.type === 'create').map(c => c.file);
    if (newFiles.length > 1) {
      issues.push({
        severity: 'low',
        category: 'maintainability',
        description: 'Multiple new files created - check for proper module organization',
        suggestion: 'Ensure new modules are properly exported and imported',
      });
    }

    return issues;
  }

  /**
   * Check if requirements are properly fulfilled
   */
  private async checkRequirementFulfillment(
    codeResult: CodeGenerationResult,
    issueAnalysis: IssueAnalysis
  ): Promise<CodeReviewResult['issues']> {
    const issues: CodeReviewResult['issues'] = [];

    // Basic check - ensure some code was generated
    if (codeResult.changes.length === 0) {
      issues.push({
        severity: 'high',
        category: 'correctness',
        description: 'No code changes generated',
        suggestion: 'Ensure the solution addresses the issue requirements',
      });
      return issues;
    }

    // Check if tests were added for bug fixes or features
    if (
      (issueAnalysis.category === 'bug' || issueAnalysis.category === 'feature') &&
      codeResult.testsAdded.length === 0
    ) {
      issues.push({
        severity: 'medium',
        category: 'testing',
        description: 'No tests added for new functionality or bug fix',
        suggestion: 'Add unit tests to verify the changes work correctly',
      });
    }

    // Check if the solution approach matches the analysis
    const hasMatchingImplementation = codeResult.changes.some(change =>
      change.description
        .toLowerCase()
        .includes(issueAnalysis.solutionApproach.toLowerCase().split(' ')[0])
    );

    if (!hasMatchingImplementation && issueAnalysis.requirements.length > 0) {
      issues.push({
        severity: 'medium',
        category: 'correctness',
        description: 'Implementation may not match the planned solution approach',
        suggestion: 'Verify that the code changes align with the solution approach',
      });
    }

    return issues;
  }

  /**
   * Identify strengths in the code
   */
  private async identifyStrengths(codeResult: CodeGenerationResult): Promise<string[]> {
    const strengths: string[] = [];

    if (codeResult.validationResults.syntaxCheck) {
      strengths.push('Code passes syntax validation');
    }

    if (codeResult.validationResults.typeCheck) {
      strengths.push('TypeScript compilation successful');
    }

    if (codeResult.validationResults.testsPass) {
      strengths.push('All tests passing');
    }

    if (codeResult.confidence > 0.8) {
      strengths.push('High confidence in solution quality');
    }

    if (codeResult.changes.length > 0) {
      strengths.push(`${codeResult.changes.length} targeted code changes made`);
    }

    return strengths;
  }

  /**
   * Generate recommendations for improvement
   */
  private async generateRecommendations(
    issues: CodeReviewResult['issues'],
    codeResult: CodeGenerationResult
  ): Promise<string[]> {
    const recommendations: string[] = [];

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');

    if (criticalIssues.length > 0) {
      recommendations.push('Address all critical issues before proceeding');
    }

    if (highIssues.length > 0) {
      recommendations.push('Fix high-severity issues to improve code quality');
    }

    if (!codeResult.validationResults.testsPass) {
      recommendations.push('Ensure all tests pass before deployment');
    }

    if (codeResult.confidence < 0.7) {
      recommendations.push('Consider manual review due to low confidence score');
    }

    if (issues.length === 0) {
      recommendations.push('Code appears to meet quality standards');
    }

    return recommendations;
  }

  /**
   * Determine overall assessment
   */
  private determineOverallAssessment(
    issues: CodeReviewResult['issues']
  ): CodeReviewResult['overallAssessment'] {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');

    if (criticalIssues.length > 0) {
      return 'reject';
    }

    if (highIssues.length > 2) {
      return 'reject';
    }

    if (highIssues.length > 0 || issues.filter(i => i.severity === 'medium').length > 3) {
      return 'requires-changes';
    }

    return 'approve';
  }

  /**
   * Calculate confidence in the review
   */
  private calculateConfidence(
    issues: CodeReviewResult['issues'],
    codeResult: CodeGenerationResult
  ): number {
    let confidence = 0.9; // Start high

    // Reduce confidence based on issues
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;

    confidence -= criticalIssues * 0.3;
    confidence -= highIssues * 0.15;
    confidence -= mediumIssues * 0.05;

    // Reduce confidence if validation failed
    if (!codeResult.validationResults.syntaxCheck) confidence -= 0.2;
    if (!codeResult.validationResults.typeCheck) confidence -= 0.2;
    if (!codeResult.validationResults.testsPass) confidence -= 0.15;
    if (!codeResult.validationResults.lintingPass) confidence -= 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Determine if human review is required
   */
  private requiresHumanReview(
    issues: CodeReviewResult['issues'],
    assessment: CodeReviewResult['overallAssessment']
  ): boolean {
    // Always require human review for rejections
    if (assessment === 'reject') {
      return true;
    }

    // Require review for significant issues
    const significantIssues = issues.filter(
      i => i.severity === 'high' || i.severity === 'critical'
    );
    if (significantIssues.length > 1) {
      return true;
    }

    // Require review for security issues
    const securityIssues = issues.filter(i => i.category === 'security');
    if (securityIssues.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Generate reasoning for the review
   */
  private generateReasoning(
    issues: CodeReviewResult['issues'],
    strengths: string[],
    assessment: CodeReviewResult['overallAssessment']
  ): string {
    const reasons: string[] = [];

    reasons.push(`Found ${issues.length} issues during code review`);

    if (issues.length > 0) {
      const bySeverity = {
        critical: issues.filter(i => i.severity === 'critical').length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'low').length,
      };

      const severitySummary = Object.entries(bySeverity)
        .filter(([, count]) => count > 0)
        .map(([severity, count]) => `${count} ${severity}`)
        .join(', ');

      reasons.push(`Issues by severity: ${severitySummary}`);
    }

    if (strengths.length > 0) {
      reasons.push(`Strengths: ${strengths.slice(0, 2).join(', ')}`);
    }

    reasons.push(`Overall assessment: ${assessment}`);

    return reasons.join('. ');
  }

  /**
   * Helper method to read files
   */
  private async readFile(path: string): Promise<string | null> {
    try {
      const response = await fetch(`file://${path}`);
      if (response.ok) {
        return await response.text();
      }
      return null;
    } catch {
      return null;
    }
  }
}
