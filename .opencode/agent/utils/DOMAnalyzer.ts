/**
 * DOMAnalyzer - Analyzes DOM structure for performance, accessibility, and optimization opportunities
 */

import { DOMAnalysis, DOMIssue, Recommendation, ErrorContext } from '../types/agent.types.js';
import { ErrorHandler } from '../ErrorHandler.js';
import { Logger } from '../Logger.js';

export class DOMAnalyzer {
  private errorHandler: ErrorHandler;
  private logger: Logger;

  constructor(errorHandler: ErrorHandler) {
    this.errorHandler = errorHandler;
    this.logger = Logger.getInstance();
  }

  /**
   * Perform comprehensive DOM analysis
   */
  async analyze(): Promise<DOMAnalysis> {
    try {
      this.logger.info('Starting DOM analysis');

      const totalElements = document.getElementsByTagName('*').length;
      const semanticElements = this.countSemanticElements();
      const accessibilityScore = await this.calculateAccessibilityScore();
      const performanceScore = this.calculatePerformanceScore();
      const issues = await this.identifyIssues();
      const recommendations = this.generateRecommendations(issues);

      const analysis: DOMAnalysis = {
        totalElements,
        semanticElements,
        accessibilityScore,
        performanceScore,
        issues,
        recommendations,
      };

      this.logger.info('DOM analysis completed', { analysis });
      return analysis;
    } catch (error) {
      this.errorHandler.handleError(error, 'DOM analysis failed', {
        component: 'DOMAnalyzer',
        action: 'analyze',
        timestamp: new Date().toISOString(),
      });
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Count semantic HTML elements
   */
  private countSemanticElements(): number {
    const semanticTags = [
      'header', 'nav', 'main', 'section', 'article', 'aside',
      'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'figure', 'figcaption', 'time', 'mark'
    ];

    let count = 0;
    semanticTags.forEach(tag => {
      count += document.getElementsByTagName(tag).length;
    });

    return count;
  }

  /**
   * Calculate accessibility score (0-100)
   */
  private async calculateAccessibilityScore(): Promise<number> {
    let score = 100;
    const penalties = {
      missingAlt: 5,
      invalidAria: 3,
      poorContrast: 4,
      missingLabels: 5,
      keyboardNavigation: 3,
    };

    // Check images without alt text
    const images = document.querySelectorAll('img:not([alt])');
    score -= Math.min(images.length * penalties.missingAlt, 20);

    // Check for invalid ARIA attributes
    const ariaElements = document.querySelectorAll('[aria-*]');
    ariaElements.forEach(element => {
      const ariaAttrs = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('aria-'));

      ariaAttrs.forEach(attr => {
        if (!this.isValidAriaAttribute(attr.name, attr.value)) {
          score -= penalties.invalidAria;
        }
      });
    });

    // Check form elements without labels
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
      const input = element as HTMLInputElement;
      if (!input.labels || input.labels.length === 0) {
        score -= penalties.missingLabels;
      }
    });

    return Math.max(0, score);
  }

  /**
   * Calculate performance score based on DOM size and structure
   */
  private calculatePerformanceScore(): number {
    let score = 100;

    const totalElements = document.getElementsByTagName('*').length;

    // Penalize for large DOM
    if (totalElements > 1500) {
      score -= Math.min((totalElements - 1500) / 10, 30);
    }

    // Check for render-blocking resources
    const renderBlocking = document.querySelectorAll('link[rel="stylesheet"]:not([media="print"])');
    score -= Math.min(renderBlocking.length * 2, 15);

    // Check for excessive inline styles
    const elementsWithInlineStyles = document.querySelectorAll('[style]');
    if (elementsWithInlineStyles.length > 50) {
      score -= Math.min((elementsWithInlineStyles.length - 50) / 2, 10);
    }

    return Math.max(0, score);
  }

  /**
   * Identify specific DOM issues
   */
  private async identifyIssues(): Promise<DOMIssue[]> {
    const issues: DOMIssue[] = [];

    // Check for images without alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    imagesWithoutAlt.forEach(img => {
      issues.push({
        type: 'missing-alt',
        severity: 'error',
        element: img as HTMLElement,
        description: 'Image missing alt attribute',
        suggestion: 'Add descriptive alt text for screen readers',
      });
    });

    // Check for invalid ARIA usage
    const ariaElements = document.querySelectorAll('[aria-*]');
    ariaElements.forEach(element => {
      const ariaAttrs = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('aria-'));

      ariaAttrs.forEach(attr => {
        if (!this.isValidAriaAttribute(attr.name, attr.value)) {
          issues.push({
            type: 'invalid-aria',
            severity: 'warning',
            element: element as HTMLElement,
            description: `Invalid ARIA attribute: ${attr.name}="${attr.value}"`,
            suggestion: 'Use valid ARIA attributes according to WAI-ARIA specification',
          });
        }
      });
    });

    // Check for large DOM
    const totalElements = document.getElementsByTagName('*').length;
    if (totalElements > 1500) {
      issues.push({
        type: 'large-dom',
        severity: 'warning',
        element: document.body,
        description: `DOM has ${totalElements} elements, which may impact performance`,
        suggestion: 'Consider reducing DOM size or implementing virtualization for large lists',
      });
    }

    return issues;
  }

  /**
   * Generate recommendations based on identified issues
   */
  private generateRecommendations(issues: DOMIssue[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    const issueCounts = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Missing alt text recommendation
    if (issueCounts['missing-alt'] > 0) {
      recommendations.push({
        id: 'add-alt-text',
        type: 'accessibility',
        priority: 'high',
        title: 'Add alt text to images',
        description: `${issueCounts['missing-alt']} images are missing alt text, affecting screen reader users`,
        impact: 8,
        effort: 3,
        autoFixable: false,
        code: 'Add alt="descriptive text" to all img elements',
      });
    }

    // Large DOM recommendation
    if (issueCounts['large-dom'] > 0) {
      recommendations.push({
        id: 'optimize-dom-size',
        type: 'performance',
        priority: 'medium',
        title: 'Optimize DOM size',
        description: 'Large DOM can impact rendering performance and user experience',
        impact: 6,
        effort: 5,
        autoFixable: false,
        code: 'Consider pagination, virtualization, or removing unnecessary elements',
      });
    }

    // ARIA improvements
    if (issueCounts['invalid-aria'] > 0) {
      recommendations.push({
        id: 'fix-aria-attributes',
        type: 'accessibility',
        priority: 'medium',
        title: 'Fix ARIA attributes',
        description: `${issueCounts['invalid-aria']} invalid ARIA attributes found`,
        impact: 7,
        effort: 4,
        autoFixable: true,
      });
    }

    return recommendations;
  }

  /**
   * Validate ARIA attribute
   */
  private isValidAriaAttribute(name: string, value: string): boolean {
    const validAriaAttributes = [
      'aria-activedescendant', 'aria-atomic', 'aria-autocomplete', 'aria-busy',
      'aria-checked', 'aria-colcount', 'aria-colindex', 'aria-colspan',
      'aria-controls', 'aria-current', 'aria-describedby', 'aria-details',
      'aria-disabled', 'aria-dropeffect', 'aria-errormessage', 'aria-expanded',
      'aria-flowto', 'aria-grabbed', 'aria-haspopup', 'aria-hidden',
      'aria-invalid', 'aria-keyshortcuts', 'aria-label', 'aria-labelledby',
      'aria-level', 'aria-live', 'aria-modal', 'aria-multiline',
      'aria-multiselectable', 'aria-orientation', 'aria-owns', 'aria-placeholder',
      'aria-posinset', 'aria-pressed', 'aria-readonly', 'aria-relevant',
      'aria-required', 'aria-roledescription', 'aria-rowcount', 'aria-rowindex',
      'aria-rowspan', 'aria-selected', 'aria-setsize', 'aria-sort',
      'aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext'
    ];

    if (!validAriaAttributes.includes(name)) {
      return false;
    }

    // Basic value validation for boolean attributes
    if (['aria-busy', 'aria-checked', 'aria-disabled', 'aria-expanded',
         'aria-grabbed', 'aria-hidden', 'aria-invalid', 'aria-modal',
         'aria-multiline', 'aria-multiselectable', 'aria-pressed',
         'aria-readonly', 'aria-required', 'aria-selected'].includes(name)) {
      return ['true', 'false', ''].includes(value);
    }

    return true;
  }

  /**
   * Get fallback analysis in case of errors
   */
  private getFallbackAnalysis(): DOMAnalysis {
    return {
      totalElements: 0,
      semanticElements: 0,
      accessibilityScore: 0,
      performanceScore: 0,
      issues: [],
      recommendations: [],
    };
  }

  /**
   * Analyze specific element for accessibility and performance
   */
  async analyzeElement(element: HTMLElement): Promise<DOMIssue[]> {
    const issues: DOMIssue[] = [];

    // Check for accessibility issues on this element
    if (element.tagName === 'IMG' && !element.hasAttribute('alt')) {
      issues.push({
        type: 'missing-alt',
        severity: 'error',
        element,
        description: 'Image missing alt attribute',
        suggestion: 'Add descriptive alt text',
      });
    }

    // Check for performance issues
    if (element.hasAttribute('style') && element.getAttribute('style')!.length > 100) {
      issues.push({
        type: 'unused-css',
        severity: 'info',
        element,
        description: 'Element has extensive inline styles',
        suggestion: 'Consider moving styles to CSS classes',
      });
    }

    return issues;
  }
}