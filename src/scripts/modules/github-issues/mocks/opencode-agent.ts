/**
 * OpenCode Agent Mocks for E2E Testing
 *
 * Comprehensive mocks for OpenCode agent interactions used in the workflow.
 */

import { vi } from 'vitest';
import { DEFAULT_TEST_CONFIG } from '../test-config';

// Mock OpenCode Agent Response Types
export interface OpenCodeAnalysis {
  category: 'bug' | 'feature' | 'documentation' | 'question' | 'enhancement' | 'unknown';
  complexity: 'low' | 'medium' | 'high' | 'critical';
  requirements: string[];
  acceptanceCriteria: string[];
  feasible: boolean;
  confidence: number;
  reasoning: string;
}

export interface OpenCodeCodeChange {
  file: string;
  line: number;
  oldCode: string;
  newCode: string;
}

export interface OpenCodeSolution {
  changes: OpenCodeCodeChange[];
  explanation: string;
  testCases?: string[];
  documentation?: string;
}

export interface OpenCodeReviewResult {
  approved: boolean;
  score: number;
  comments: string[];
  securityIssues: string[];
  qualityScore: number;
  performanceScore: number;
  maintainabilityScore: number;
  testCoverageScore: number;
  recommendations: string[];
}

// Mock Factory Functions
export function createMockAnalysis(overrides: Partial<OpenCodeAnalysis> = {}): OpenCodeAnalysis {
  const baseAnalysis: OpenCodeAnalysis = {
    category: 'bug',
    complexity: 'low',
    requirements: ['Fix the bug'],
    acceptanceCriteria: ['Bug is resolved'],
    feasible: true,
    confidence: 0.8,
    reasoning: 'Simple bug that can be fixed autonomously',
  };

  return { ...baseAnalysis, ...overrides };
}

export function createMockSolution(overrides: Partial<OpenCodeSolution> = {}): OpenCodeSolution {
  const baseSolution: OpenCodeSolution = {
    changes: [
      {
        file: 'src/bug.js',
        line: 10,
        oldCode: 'console.log("bug");',
        newCode: 'console.log("fixed");',
      },
    ],
    explanation: 'Fixed the bug by changing the log message',
    testCases: ['Test that the log message is correct'],
    documentation: 'Updated the code to fix the bug',
  };

  return { ...baseSolution, ...overrides };
}

export function createMockReviewResult(
  overrides: Partial<OpenCodeReviewResult> = {}
): OpenCodeReviewResult {
  const baseReview: OpenCodeReviewResult = {
    approved: true,
    score: 0.85,
    comments: ['Good fix', 'Code looks clean'],
    securityIssues: [],
    qualityScore: 0.9,
    performanceScore: 0.8,
    maintainabilityScore: 0.95,
    testCoverageScore: 0.7,
    recommendations: ['Add more tests'],
  };

  return { ...baseReview, ...overrides };
}

// OpenCode Agent Mock Implementation
export class OpenCodeAgentMock {
  private config = DEFAULT_TEST_CONFIG.mocks.openCode;
  private analysisHistory: OpenCodeAnalysis[] = [];
  private solutionHistory: OpenCodeSolution[] = [];
  private reviewHistory: OpenCodeReviewResult[] = [];

  constructor() {
    this.initializeMockResponses();
  }

  private initializeMockResponses() {
    // Initialize with some default responses for common scenarios
  }

  private async simulateLatency(): Promise<void> {
    const latency = this.config.analysisLatency + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, latency));
  }

  private shouldFail(): boolean {
    return Math.random() < this.config.failureRate;
  }

  private getComplexityBasedResponse(complexity: string): OpenCodeAnalysis {
    switch (complexity) {
      case 'low':
        return createMockAnalysis({
          complexity: 'low',
          feasible: true,
          confidence: 0.9,
        });
      case 'medium':
        return createMockAnalysis({
          complexity: 'medium',
          feasible: true,
          confidence: 0.7,
        });
      case 'high':
        return createMockAnalysis({
          complexity: 'high',
          feasible: false,
          confidence: 0.5,
        });
      case 'critical':
        return createMockAnalysis({
          complexity: 'critical',
          feasible: false,
          confidence: 0.3,
        });
      default:
        return createMockAnalysis();
    }
  }

  // Mock Agent Methods
  analyze = vi.fn().mockImplementation(async (issue: any): Promise<OpenCodeAnalysis> => {
    await this.simulateLatency();

    if (this.shouldFail()) {
      throw new Error('OpenCode analysis service unavailable');
    }

    // Determine complexity based on issue content or use default
    const complexity =
      issue.body?.toLowerCase().includes('complex') ||
      issue.labels?.some((l: any) => l.name.includes('high'))
        ? 'high'
        : issue.body?.toLowerCase().includes('critical')
          ? 'critical'
          : 'low';

    const analysis = this.getComplexityBasedResponse(complexity);
    this.analysisHistory.push(analysis);

    return analysis;
  });

  generateCode = vi
    .fn()
    .mockImplementation(async (analysis: OpenCodeAnalysis): Promise<OpenCodeSolution> => {
      await this.simulateLatency();

      if (this.shouldFail()) {
        throw new Error('Code generation failed');
      }

      if (!analysis.feasible) {
        throw new Error('Cannot generate code for infeasible analysis');
      }

      const solution = createMockSolution({
        changes: analysis.requirements.map((req, index) => ({
          file: `src/fix${index + 1}.js`,
          line: 1,
          oldCode: `// ${req} - BROKEN`,
          newCode: `// ${req} - FIXED`,
        })),
        explanation: `Generated solution for: ${analysis.requirements.join(', ')}`,
      });

      this.solutionHistory.push(solution);
      return solution;
    });

  reviewCode = vi
    .fn()
    .mockImplementation(async (solution: OpenCodeSolution): Promise<OpenCodeReviewResult> => {
      await this.simulateLatency();

      if (this.shouldFail()) {
        throw new Error('Code review service unavailable');
      }

      // Generate quality score based on solution quality
      const qualityScore = Math.random() * 0.3 + 0.7; // 0.7-1.0 range
      const approved = qualityScore > 0.75;

      const review = createMockReviewResult({
        approved,
        score: qualityScore,
        qualityScore,
        comments: approved
          ? ['Code looks good', 'Follows best practices']
          : ['Needs improvement', 'Consider refactoring'],
        securityIssues: qualityScore > 0.9 ? [] : ['Potential security concern'],
      });

      this.reviewHistory.push(review);
      return review;
    });

  // Utility methods for test control
  getAnalysisHistory(): OpenCodeAnalysis[] {
    return [...this.analysisHistory];
  }

  getSolutionHistory(): OpenCodeSolution[] {
    return [...this.solutionHistory];
  }

  getReviewHistory(): OpenCodeReviewResult[] {
    return [...this.reviewHistory];
  }

  reset(): void {
    this.analysisHistory = [];
    this.solutionHistory = [];
    this.reviewHistory = [];
  }

  setFailureRate(rate: number): void {
    this.config.failureRate = rate;
  }

  setLatency(type: 'analysis' | 'generation' | 'review', latency: number): void {
    switch (type) {
      case 'analysis':
        this.config.analysisLatency = latency;
        break;
      case 'generation':
        this.config.generationLatency = latency;
        break;
      case 'review':
        this.config.reviewLatency = latency;
        break;
    }
  }

  setQualityScoreRange(min: number, max: number): void {
    this.config.qualityScoreRange = [min, max];
  }
}

// Factory function for creating configured mock instances
export function createOpenCodeAgentMock(
  config?: Partial<typeof DEFAULT_TEST_CONFIG.mocks.openCode>
): OpenCodeAgentMock {
  const mock = new OpenCodeAgentMock();
  if (config) {
    if (config.failureRate !== undefined) mock.setFailureRate(config.failureRate);
    if (config.analysisLatency !== undefined) mock.setLatency('analysis', config.analysisLatency);
    if (config.generationLatency !== undefined)
      mock.setLatency('generation', config.generationLatency);
    if (config.reviewLatency !== undefined) mock.setLatency('review', config.reviewLatency);
    if (config.qualityScoreRange)
      mock.setQualityScoreRange(config.qualityScoreRange[0], config.qualityScoreRange[1]);
  }
  return mock;
}

// Default mock instance for convenience
export const mockOpenCodeAgent = createOpenCodeAgentMock();
