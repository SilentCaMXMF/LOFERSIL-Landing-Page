/**
 * Issue Intake & Analysis Component
 *
 * Analyzes incoming GitHub issues and determines if they're suitable for autonomous resolution.
 * Uses AI agents to categorize issues, assess complexity, and extract requirements.
 */

import { OpenCodeAgent } from '../OpenCodeAgent';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  labels: Array<{ name: string }>;
  user: { login: string };
  created_at: string;
  updated_at: string;
  state: 'open' | 'closed';
  html_url: string;
}

export interface IssueAnalysis {
  category: 'bug' | 'feature' | 'documentation' | 'enhancement' | 'question' | 'unknown';
  complexity: 'low' | 'medium' | 'high' | 'critical';
  requirements: string[];
  acceptanceCriteria: string[];
  feasible: boolean;
  confidence: number; // 0-1 scale
  reasoning: string;
}

export interface IssueAnalyzerConfig {
  openCodeAgent: OpenCodeAgent;
  complexityThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  maxAnalysisTime: number; // milliseconds
  supportedLabels: string[];
}

export class IssueAnalyzer {
  private config: IssueAnalyzerConfig;
  private readonly window: any;
  private readonly domPurify: any;

  constructor(config: IssueAnalyzerConfig) {
    this.config = config;

    // Initialize DOMPurify for HTML sanitization
    const { window } = new JSDOM('');
    this.window = window;
    this.domPurify = DOMPurify(this.window);
  }

  /**
   * Analyze a GitHub issue and determine if it's suitable for autonomous resolution
   */
  async analyzeIssue(issue: GitHubIssue): Promise<IssueAnalysis> {
    const startTime = Date.now();

    try {
      // Extract and sanitize content
      const content = this.extractContent(issue);

      // Categorize the issue
      const category = await this.categorizeIssue(content, issue);

      // Assess complexity
      const complexity = this.assessComplexity(issue, content);

      // Extract requirements and acceptance criteria
      const { requirements, acceptanceCriteria } = await this.extractRequirements(
        content,
        category
      );

      // Determine feasibility for autonomous resolution
      const feasible = this.isAutonomousFeasible(complexity, category, requirements);

      // Calculate confidence score
      const confidence = this.calculateConfidence(category, complexity, requirements);

      // Generate reasoning
      const reasoning = this.generateReasoning(category, complexity, feasible, confidence);

      // Check for timeout
      if (Date.now() - startTime > this.config.maxAnalysisTime) {
        throw new Error('Analysis timeout exceeded');
      }

      return {
        category,
        complexity,
        requirements,
        acceptanceCriteria,
        feasible,
        confidence,
        reasoning,
      };
    } catch (error) {
      console.error(`Failed to analyze issue #${issue.number}:`, error);
      return this.createFallbackAnalysis(issue, error);
    }
  }

  /**
   * Categorize the issue using AI analysis
   */
  private async categorizeIssue(
    content: string,
    issue: GitHubIssue
  ): Promise<IssueAnalysis['category']> {
    // Use AI for content-based categorization first
    const prompt = `Categorize this GitHub issue into one of: bug, feature, documentation, enhancement, question, unknown.

Issue Title: ${issue.title}
Issue Body: ${content.substring(0, 2000)}...

Respond with only the category name in lowercase.`;

    try {
      const response = await this.config.openCodeAgent.query(prompt, {
        maxTokens: 50,
        temperature: 0.1,
      });

      const category = response.trim().toLowerCase() as IssueAnalysis['category'];

      // Validate the response
      const validCategories: IssueAnalysis['category'][] = [
        'bug',
        'feature',
        'documentation',
        'enhancement',
        'question',
        'unknown',
      ];
      if (validCategories.includes(category)) {
        return category;
      }
    } catch (error) {
      console.warn('AI categorization failed, falling back to label-based categorization');
    }

    // Fallback to label-based categorization
    const labelCategories = this.categorizeByLabels(issue.labels);
    return labelCategories[0] || 'unknown';
  }

  /**
   * Categorize based on GitHub labels
   */
  private categorizeByLabels(labels: Array<{ name: string }>): IssueAnalysis['category'][] {
    const categories: IssueAnalysis['category'][] = [];

    for (const label of labels) {
      const name = label.name.toLowerCase();

      if (name.includes('bug') || name.includes('fix') || name.includes('error')) {
        categories.push('bug');
      } else if (name.includes('feature')) {
        categories.push('feature');
      } else if (name.includes('docs') || name.includes('documentation')) {
        categories.push('documentation');
      } else if (name.includes('enhancement') || name.includes('improvement')) {
        categories.push('enhancement');
      } else if (name.includes('question') || name.includes('help')) {
        categories.push('question');
      }
    }

    return categories.length > 0 ? categories : ['unknown'];
  }

  /**
   * Assess the complexity of the issue
   */
  private assessComplexity(issue: GitHubIssue, content: string): IssueAnalysis['complexity'] {
    let score = 0;

    // Length-based scoring
    const contentLength = content.length;
    if (contentLength > 2000) score += 4;
    else if (contentLength > 500) score += 1;

    // Label-based scoring
    const hasComplexityLabels = issue.labels.some(label => {
      const name = label.name.toLowerCase();
      return name.includes('complex') || name.includes('major') || name.includes('breaking');
    });
    if (hasComplexityLabels) score += 2;

    // Code block detection (indicates technical complexity)
    const codeBlockCount = (content.match(/```/g) || []).length;
    score += Math.min(codeBlockCount, 2);

    // File path references (indicates specific file changes)
    const filePathCount = (content.match(/(?:^|\s)(?:src|lib|test|docs)\/[^\s]+/g) || []).length;
    score += Math.min(filePathCount, 1);

    // Determine complexity level
    if (score >= 7) return 'critical';
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Extract requirements and acceptance criteria using AI
   */
  private async extractRequirements(
    content: string,
    category: IssueAnalysis['category']
  ): Promise<{ requirements: string[]; acceptanceCriteria: string[] }> {
    const prompt = `Extract the key requirements and acceptance criteria from this ${category} issue.

Issue Content: ${content.substring(0, 3000)}...

Format your response as JSON:
{
  "requirements": ["requirement 1", "requirement 2", ...],
  "acceptanceCriteria": ["criteria 1", "criteria 2", ...]
}

Requirements should be the main deliverables or changes needed.
Acceptance criteria should be the conditions that must be met for the issue to be considered resolved.`;

    try {
      const response = await this.config.openCodeAgent.query(prompt, {
        maxTokens: 1000,
        temperature: 0.2,
      });

      // Parse JSON response
      const parsed = JSON.parse(response);
      return {
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
        acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria)
          ? parsed.acceptanceCriteria
          : [],
      };
    } catch (error) {
      console.warn('AI requirements extraction failed, using fallback');
      return this.extractRequirementsFallback(content);
    }
  }

  /**
   * Fallback requirements extraction using pattern matching
   */
  private extractRequirementsFallback(content: string): {
    requirements: string[];
    acceptanceCriteria: string[];
  } {
    const requirements: string[] = [];
    const acceptanceCriteria: string[] = [];

    // Look for sections and bullet points
    const lines = content.split('\n');
    let currentSection = '';
    for (const line of lines) {
      const trimmed = line.trim();

      // Check for section headers
      if (trimmed.startsWith('## ')) {
        currentSection = trimmed.substring(3).toLowerCase();
        continue;
      }

      // Look for bullet points or numbered lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\./.test(trimmed)) {
        const itemContent = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '').trim();

        // Check if the item is an acceptance criterion
        if (
          itemContent.toLowerCase().startsWith('acceptance:') ||
          itemContent.toLowerCase().includes('acceptance criteria')
        ) {
          acceptanceCriteria.push(itemContent.replace(/^acceptance:\s*/i, '').trim());
        } else if (currentSection.includes('acceptance') && currentSection.includes('criteria')) {
          acceptanceCriteria.push(itemContent);
        } else if (currentSection.includes('requirement')) {
          requirements.push(itemContent);
        } else {
          // Default to requirements if no clear section
          requirements.push(itemContent);
        }
      }
    }

    return { requirements, acceptanceCriteria };
  }

  /**
   * Determine if the issue is feasible for autonomous resolution
   */
  private isAutonomousFeasible(
    complexity: IssueAnalysis['complexity'],
    category: IssueAnalysis['category'],
    requirements: string[]
  ): boolean {
    // Critical complexity issues require human review
    if (complexity === 'critical') return false;

    // High complexity issues require human review
    if (complexity === 'high') return false;

    // Certain categories are better handled by humans
    if (category === 'question' || category === 'unknown') return false;

    // Issues with too many requirements might be too complex
    if (requirements.length > 10) return false;

    return true;
  }

  /**
   * Calculate confidence score for the analysis
   */
  private calculateConfidence(
    category: IssueAnalysis['category'],
    complexity: IssueAnalysis['complexity'],
    requirements: string[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for clear categories
    if (category !== 'unknown') confidence += 0.2;

    // Lower confidence for high complexity
    if (complexity === 'high' || complexity === 'critical') confidence -= 0.2;

    // Higher confidence with extracted requirements
    if (requirements.length > 0) confidence += 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate reasoning for the analysis
   */
  private generateReasoning(
    category: IssueAnalysis['category'],
    complexity: IssueAnalysis['complexity'],
    feasible: boolean,
    confidence: number
  ): string {
    const reasons = [];

    reasons.push(`Categorized as ${category}`);
    reasons.push(`Complexity assessed as ${complexity}`);
    reasons.push(`Autonomous resolution ${feasible ? 'feasible' : 'not feasible'}`);
    reasons.push(`Analysis confidence: ${Math.round(confidence * 100)}%`);

    if (!feasible) {
      if (complexity === 'critical') reasons.push('Critical complexity requires human review');
      if (category === 'question') reasons.push('Questions need human clarification');
      if (category === 'unknown') reasons.push('Unable to determine issue type');
    }

    return reasons.join('. ');
  }

  /**
   * Create fallback analysis when main analysis fails
   */
  private createFallbackAnalysis(issue: GitHubIssue, error: any): IssueAnalysis {
    return {
      category: 'unknown',
      complexity: 'high',
      requirements: [],
      acceptanceCriteria: [],
      feasible: false,
      confidence: 0.1,
      reasoning: `Analysis failed: ${error.message}. Issue requires human review.`,
    };
  }

  /**
   * Check if the issue type is supported
   */
  isSupportedIssue(issue: GitHubIssue): boolean {
    // Check for supported labels
    const hasSupportedLabel = issue.labels.some(label =>
      this.config.supportedLabels.some(supported =>
        label.name.toLowerCase().includes(supported.toLowerCase())
      )
    );

    // Check issue state
    if (issue.state !== 'open') return false;

    return hasSupportedLabel || true; // Allow all open issues if no specific labels required
  }

  /**
   * Extract and sanitize content from issue
   */
  private extractContent(issue: GitHubIssue): string {
    // Sanitize title and body to prevent XSS
    const sanitizedTitle = this.domPurify.sanitize(issue.title, { ALLOWED_TAGS: [] });
    const sanitizedBody = this.domPurify.sanitize(issue.body || '', { ALLOWED_TAGS: [] });

    return `${sanitizedTitle}\n\n${sanitizedBody}`;
  }
}
