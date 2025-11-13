/**
 * IssueAnalyzer - GitHub Issues Analysis Agent
 *
 * Analyzes GitHub issues to determine feasibility for autonomous resolution.
 * Categorizes issues, assesses complexity, and extracts requirements.
 */

import type { ErrorHandler } from './ErrorHandler';
import { envLoader } from './EnvironmentLoader';

/**
 * GitHub Issue data structure
 */
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: Array<{
    name: string;
    color: string;
  }>;
  user: {
    login: string;
    id: number;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
  repository_url: string;
}

/**
 * Issue analysis result
 */
export interface IssueAnalysis {
  issueId: number;
  title: string;
  category: 'bug' | 'feature' | 'enhancement' | 'documentation' | 'question' | 'other';
  complexity: 'low' | 'medium' | 'high';
  feasibility: 'high' | 'medium' | 'low' | 'not-suitable';
  requirements: string[];
  acceptanceCriteria: string[];
  requiredTools: string[];
  riskAssessment: {
    security: 'low' | 'medium' | 'high';
    performance: 'low' | 'medium' | 'high';
    breakingChanges: boolean;
    humanReviewRequired: boolean;
  };
  solutionApproach: string;
  estimatedEffort: '1-2 hours' | '2-4 hours' | '4-8 hours' | '1-2 days' | 'complex';
  reasoning: string;
}

/**
 * IssueAnalyzer configuration
 */
export interface IssueAnalyzerConfig {
  githubToken: string;
  repository: string; // owner/repo format
  timeout?: number;
  maxRetries?: number;
  complexityThresholds?: {
    low: number; // max lines of code
    medium: number;
    high: number;
  };
}

/**
 * IssueAnalyzer - Analyzes GitHub issues for autonomous resolution
 */
export class IssueAnalyzer {
  private config: IssueAnalyzerConfig;
  private errorHandler?: ErrorHandler;

  constructor(config: Partial<IssueAnalyzerConfig> = {}, errorHandler?: ErrorHandler) {
    this.config = {
      githubToken: config.githubToken || envLoader.getRequired('GITHUB_TOKEN'),
      repository: config.repository || envLoader.getRequired('GITHUB_REPOSITORY'),
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      complexityThresholds: config.complexityThresholds || {
        low: 50,
        medium: 200,
        high: 500,
      },
      ...config,
    };
    this.errorHandler = errorHandler;
  }

  /**
   * Analyze a GitHub issue
   */
  async analyzeIssue(issueNumber: number): Promise<IssueAnalysis> {
    try {
      console.log(`🔍 Analyzing issue #${issueNumber}`);

      // Fetch issue data from GitHub API
      const issue = await this.fetchIssue(issueNumber);

      // Analyze the issue content
      const analysis = await this.performAnalysis(issue);

      console.log(
        `✅ Analysis complete for issue #${issueNumber}: ${analysis.category} (${analysis.complexity})`
      );

      return analysis;
    } catch (error) {
      console.error(`❌ Failed to analyze issue #${issueNumber}:`, error);
      this.errorHandler?.handleError(error as Error, 'IssueAnalyzer.analyzeIssue');

      // Return a not-suitable analysis on error
      return {
        issueId: issueNumber,
        title: 'Analysis Failed',
        category: 'other',
        complexity: 'high',
        feasibility: 'not-suitable',
        requirements: [],
        acceptanceCriteria: [],
        requiredTools: [],
        riskAssessment: {
          security: 'high',
          performance: 'high',
          breakingChanges: true,
          humanReviewRequired: true,
        },
        solutionApproach: 'Manual review required due to analysis failure',
        estimatedEffort: 'complex',
        reasoning: `Analysis failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Fetch issue data from GitHub API
   */
  private async fetchIssue(issueNumber: number): Promise<GitHubIssue> {
    const url = `https://api.github.com/repos/${this.config.repository}/issues/${issueNumber}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'LOFERSIL-GitHub-Issue-Analyzer/1.0',
      },
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as GitHubIssue;
  }

  /**
   * Perform detailed analysis of the issue
   */
  private async performAnalysis(issue: GitHubIssue): Promise<IssueAnalysis> {
    const category = this.categorizeIssue(issue);
    const complexity = this.assessComplexity(issue);
    const feasibility = this.assessFeasibility(issue, category, complexity);
    const requirements = this.extractRequirements(issue);
    const acceptanceCriteria = this.extractAcceptanceCriteria(issue);
    const requiredTools = this.determineRequiredTools(issue, category);
    const riskAssessment = this.assessRisks(issue, category, complexity);
    const solutionApproach = this.determineSolutionApproach(issue, category);
    const estimatedEffort = this.estimateEffort(complexity, requirements.length);

    const reasoning = this.generateReasoning(issue, category, complexity, feasibility);

    return {
      issueId: issue.number,
      title: issue.title,
      category,
      complexity,
      feasibility,
      requirements,
      acceptanceCriteria,
      requiredTools,
      riskAssessment,
      solutionApproach,
      estimatedEffort,
      reasoning,
    };
  }

  /**
   * Categorize the issue based on labels and content
   */
  private categorizeIssue(issue: GitHubIssue): IssueAnalysis['category'] {
    // Check labels first
    const labelNames = issue.labels.map(label => label.name.toLowerCase());

    if (labelNames.includes('bug') || labelNames.includes('fix')) {
      return 'bug';
    }
    if (labelNames.includes('feature') || labelNames.includes('enhancement')) {
      return 'enhancement';
    }
    if (labelNames.includes('documentation') || labelNames.includes('docs')) {
      return 'documentation';
    }
    if (labelNames.includes('question') || labelNames.includes('help wanted')) {
      return 'question';
    }

    // Analyze content
    const content = `${issue.title} ${issue.body}`.toLowerCase();

    if (content.includes('fix') || content.includes('bug') || content.includes('error')) {
      return 'bug';
    }
    if (content.includes('add') || content.includes('implement') || content.includes('create')) {
      return 'feature';
    }
    if (
      content.includes('improve') ||
      content.includes('enhance') ||
      content.includes('optimize')
    ) {
      return 'enhancement';
    }
    if (content.includes('document') || content.includes('readme') || content.includes('guide')) {
      return 'documentation';
    }

    return 'other';
  }

  /**
   * Assess technical complexity
   */
  private assessComplexity(issue: GitHubIssue): IssueAnalysis['complexity'] {
    const content = `${issue.title} ${issue.body}`;
    const linesOfCode = content.split('\n').length;
    const hasMultipleRequirements = (content.match(/- |\d+\./g) || []).length > 2;
    const hasComplexFeatures =
      content.includes('Add ') || content.includes('Implement ') || content.includes('Create ');

    // Simple heuristics for complexity assessment
    if (
      linesOfCode <= this.config.complexityThresholds!.low &&
      !hasMultipleRequirements &&
      !hasComplexFeatures
    ) {
      return 'low';
    }
    if (
      linesOfCode <= this.config.complexityThresholds!.medium ||
      hasMultipleRequirements ||
      hasComplexFeatures
    ) {
      return 'medium';
    }
    return 'high';
  }

  /**
   * Assess feasibility for autonomous resolution
   */
  private assessFeasibility(
    issue: GitHubIssue,
    category: IssueAnalysis['category'],
    complexity: IssueAnalysis['complexity']
  ): IssueAnalysis['feasibility'] {
    // Not suitable categories
    if (category === 'question' || category === 'other') {
      return 'not-suitable';
    }

    // High complexity issues need human review
    if (complexity === 'high') {
      return 'low';
    }

    // Check for specific file references or code examples
    const content = `${issue.title} ${issue.body}`;
    const hasCodeExamples =
      content.includes('```') || content.includes('function') || content.includes('class');
    const hasFileReferences =
      content.includes('.ts') || content.includes('.js') || content.includes('.md');
    const hasClearRequirements =
      content.includes('should') || content.includes('must') || content.includes('steps');

    // High feasibility: clear requirements + some technical details or labels
    if (hasClearRequirements || issue.labels.length > 0) {
      return 'high';
    }

    // Medium feasibility: basic requirements or low complexity
    if (complexity === 'low' || hasClearRequirements) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Extract requirements from issue content
   */
  private extractRequirements(issue: GitHubIssue): string[] {
    const content = issue.body;
    const requirements: string[] = [];

    // Look for bullet points, numbered lists, or specific keywords
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('- ') ||
        trimmed.startsWith('* ') ||
        /^\d+\./.test(trimmed) ||
        trimmed.toLowerCase().includes('should') ||
        trimmed.toLowerCase().includes('must') ||
        trimmed.toLowerCase().includes('need')
      ) {
        requirements.push(trimmed);
      }
    }

    return requirements.slice(0, 10); // Limit to 10 requirements
  }

  /**
   * Extract acceptance criteria
   */
  private extractAcceptanceCriteria(issue: GitHubIssue): string[] {
    const content = issue.body;
    const criteria: string[] = [];

    // Look for acceptance criteria patterns
    const lines = content.split('\n');
    let inCriteriaSection = false;

    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();

      // Start criteria section
      if (lowerLine.includes('acceptance criteria') || lowerLine.includes('ac:')) {
        inCriteriaSection = true;
        continue;
      }

      // Extract Gherkin-style criteria
      if (
        lowerLine.startsWith('given ') ||
        lowerLine.startsWith('when ') ||
        lowerLine.startsWith('then ')
      ) {
        criteria.push(line.trim());
        inCriteriaSection = true;
      }
      // Extract bullet points in criteria section
      else if (inCriteriaSection && (lowerLine.startsWith('- ') || lowerLine.startsWith('* '))) {
        criteria.push(line.trim());
      }
      // Stop at empty line after finding criteria
      else if (inCriteriaSection && lowerLine === '' && criteria.length > 0) {
        break;
      }
    }

    return criteria;
  }

  /**
   * Determine required tools for resolution
   */
  private determineRequiredTools(
    issue: GitHubIssue,
    category: IssueAnalysis['category']
  ): string[] {
    const tools: string[] = ['edit', 'grep', 'read'];

    const content = `${issue.title} ${issue.body}`.toLowerCase();

    if (content.includes('test') || content.includes('spec')) {
      tools.push('test-runner');
    }

    if (content.includes('build') || content.includes('compile')) {
      tools.push('build-tools');
    }

    if (category === 'documentation') {
      tools.push('markdown-tools');
    }

    return tools;
  }

  /**
   * Assess risks associated with autonomous resolution
   */
  private assessRisks(
    issue: GitHubIssue,
    category: IssueAnalysis['category'],
    complexity: IssueAnalysis['complexity']
  ): IssueAnalysis['riskAssessment'] {
    const content = `${issue.title} ${issue.body}`.toLowerCase();

    let security: 'low' | 'medium' | 'high' = 'low';
    let performance: 'low' | 'medium' | 'high' = 'low';
    let breakingChanges = false;
    let humanReviewRequired = false;

    // Security assessment
    if (
      content.includes('security') ||
      content.includes('auth') ||
      content.includes('password') ||
      content.includes('token') ||
      content.includes('vulnerability')
    ) {
      security = 'high';
      humanReviewRequired = true;
    } else if (
      content.includes('api') ||
      content.includes('database') ||
      content.includes('network')
    ) {
      security = 'medium';
    }

    // Performance assessment
    if (
      content.includes('performance') ||
      content.includes('optimization') ||
      content.includes('speed')
    ) {
      performance = 'high';
    } else if (
      content.includes('render') ||
      content.includes('load') ||
      content.includes('memory')
    ) {
      performance = 'medium';
    }

    // Breaking changes assessment
    if (
      content.includes('breaking') ||
      content.includes('major') ||
      content.includes('api change') ||
      content.includes('interface change')
    ) {
      breakingChanges = true;
      humanReviewRequired = true;
    }

    // Complexity-based human review
    if (complexity === 'high' || category === 'feature') {
      humanReviewRequired = true;
    }

    return {
      security,
      performance,
      breakingChanges,
      humanReviewRequired,
    };
  }

  /**
   * Determine solution approach
   */
  private determineSolutionApproach(
    issue: GitHubIssue,
    category: IssueAnalysis['category']
  ): string {
    switch (category) {
      case 'bug':
        return 'Identify root cause, implement fix, add tests if needed';
      case 'feature':
        return 'Design implementation, create new code, add tests, update documentation';
      case 'enhancement':
        return 'Analyze existing code, implement improvements, maintain backward compatibility';
      case 'documentation':
        return 'Update relevant documentation files, ensure accuracy and completeness';
      default:
        return 'Manual analysis required for appropriate solution approach';
    }
  }

  /**
   * Estimate effort based on complexity and requirements
   */
  private estimateEffort(
    complexity: IssueAnalysis['complexity'],
    requirementCount: number
  ): IssueAnalysis['estimatedEffort'] {
    if (complexity === 'low' && requirementCount <= 3) {
      return '1-2 hours';
    }
    if (complexity === 'medium' || requirementCount <= 5) {
      return '2-4 hours';
    }
    if (complexity === 'high' || requirementCount > 5) {
      return '4-8 hours';
    }
    return '1-2 days';
  }

  /**
   * Generate reasoning for the analysis
   */
  private generateReasoning(
    issue: GitHubIssue,
    category: IssueAnalysis['category'],
    complexity: IssueAnalysis['complexity'],
    feasibility: IssueAnalysis['feasibility']
  ): string {
    const reasons: string[] = [];

    reasons.push(`Issue categorized as ${category} with ${complexity} complexity`);

    if (feasibility === 'high') {
      reasons.push('High feasibility due to clear requirements and technical details');
    } else if (feasibility === 'medium') {
      reasons.push('Medium feasibility - suitable for autonomous resolution with some guidance');
    } else if (feasibility === 'low') {
      reasons.push('Low feasibility due to complexity or unclear requirements');
    } else {
      reasons.push('Not suitable for autonomous resolution');
    }

    if (issue.labels.length > 0) {
      reasons.push(`Labels: ${issue.labels.map(l => l.name).join(', ')}`);
    }

    return reasons.join('. ');
  }

  /**
   * Check if an issue is suitable for autonomous resolution
   */
  isSuitableForAutonomousResolution(analysis: IssueAnalysis): boolean {
    return analysis.feasibility === 'high' || analysis.feasibility === 'medium';
  }
}
