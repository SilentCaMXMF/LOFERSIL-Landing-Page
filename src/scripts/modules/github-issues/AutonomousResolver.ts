/**
 * Autonomous Resolver Component
 *
 * Generates code solutions using SWE-agent inspired patterns.
 * Analyzes codebase, generates solutions, and validates changes.
 */

import { OpenCodeAgent } from '../OpenCodeAgent';
import { WorktreeManager, WorktreeInfo } from './WorktreeManager';
import { IssueAnalysis } from './IssueAnalyzer';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

export interface CodeChanges {
  files: Array<{
    path: string;
    changes: Array<{
      type: 'add' | 'modify' | 'delete';
      content: string;
      lineNumber?: number;
    }>;
  }>;
}

export interface ResolutionResult {
  success: boolean;
  solution: CodeChanges;
  worktree: WorktreeInfo;
  testsPassed?: boolean;
  iterations: number;
  reasoning: string;
  errors?: string[];
}

export interface AutonomousResolverConfig {
  openCodeAgent: OpenCodeAgent;
  worktreeManager: WorktreeManager;
  maxIterations: number;
  maxExecutionTime: number; // milliseconds
  testCommand: string;
  allowedFileExtensions: string[];
  safetyChecks: {
    maxFilesModified: number;
    maxLinesChanged: number;
    requireTests: boolean;
  };
}

export class AutonomousResolver {
  private config: AutonomousResolverConfig;

  constructor(config: AutonomousResolverConfig) {
    this.config = config;
  }

  /**
   * Resolve an issue by generating and implementing code changes
   */
  async resolveIssue(
    analysis: IssueAnalysis,
    issue: { number: number; title: string; body: string }
  ): Promise<ResolutionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let iterations = 0;

    try {
      // Create isolated worktree for this issue
      const worktree = await this.config.worktreeManager.createWorktree(issue.number, issue.title);

      // Analyze codebase structure
      const codebaseAnalysis = await this.analyzeCodebase(worktree.path);

      // Generate initial solution
      let solution = await this.generateSolution(analysis, codebaseAnalysis, issue);

      // Iterative refinement loop
      while (iterations < this.config.maxIterations) {
        iterations++;

        try {
          // Apply changes to worktree
          await this.applyChanges(solution, worktree.path);

          // Run safety checks
          try {
            await this.runSafetyChecks(solution, worktree.path);
          } catch (safetyError) {
            errors.push(
              `Safety check failed: ${safetyError instanceof Error ? safetyError.message : String(safetyError)}`
            );
            continue; // Try next iteration
          }

          // Run tests if required
          const testsPassed =
            analysis.category === 'bug' || this.config.safetyChecks.requireTests
              ? await this.runTests(worktree.path)
              : true;

          // Validate solution
          const validation = await this.validateSolution(solution, worktree.path, analysis);

          if (validation.isValid && testsPassed) {
            return {
              success: true,
              solution,
              worktree,
              testsPassed,
              iterations,
              reasoning: `Solution generated successfully in ${iterations} iterations. ${validation.reasoning}`,
            };
          }

          // Generate improved solution based on validation feedback
          solution = await this.improveSolution(solution, validation, codebaseAnalysis, issue);
        } catch (error) {
          errors.push(
            `Iteration ${iterations} failed: ${error instanceof Error ? error.message : String(error)}`
          );
          console.warn(`Iteration ${iterations} failed:`, error);

          // Generate fallback solution
          solution = await this.generateFallbackSolution(analysis, codebaseAnalysis, issue, error);
        }

        // Check timeout
        if (Date.now() - startTime > this.config.maxExecutionTime) {
          throw new Error(`Resolution timeout after ${iterations} iterations`);
        }
      }

      // Max iterations reached
      return {
        success: false,
        solution,
        worktree,
        iterations,
        reasoning: `Failed to find valid solution after ${iterations} iterations`,
        errors,
      };
    } catch (error) {
      console.error('Resolution failed:', error);
      throw error;
    }
  }

  /**
   * Analyze the codebase structure and patterns
   */
  private async analyzeCodebase(worktreePath: string): Promise<CodebaseAnalysis> {
    const analysis: CodebaseAnalysis = {
      structure: {},
      patterns: {},
      dependencies: {},
      testFiles: [],
      entryPoints: [],
    };

    try {
      // Analyze project structure
      analysis.structure = await this.analyzeProjectStructure(worktreePath);

      // Find test files
      analysis.testFiles = await this.findTestFiles(worktreePath);

      // Analyze code patterns
      analysis.patterns = await this.analyzeCodePatterns(worktreePath);

      // Find entry points
      analysis.entryPoints = await this.findEntryPoints(worktreePath);

      // Analyze dependencies
      analysis.dependencies = await this.analyzeDependencies(worktreePath);
    } catch (error) {
      console.warn('Codebase analysis failed, using minimal analysis:', error);
      // Provide minimal analysis as fallback
      analysis.structure = { root: worktreePath };
      analysis.testFiles = [];
    }

    return analysis;
  }

  /**
   * Generate initial solution using AI
   */
  private async generateSolution(
    analysis: IssueAnalysis,
    codebase: CodebaseAnalysis,
    issue: { number: number; title: string; body: string }
  ): Promise<CodeChanges> {
    const prompt = `Generate a code solution for this ${analysis.category} issue.

Issue Title: ${issue.title}
Issue Description: ${issue.body}

Requirements: ${analysis.requirements.join(', ')}
Acceptance Criteria: ${analysis.acceptanceCriteria.join(', ')}

Codebase Analysis:
- Structure: ${JSON.stringify(codebase.structure, null, 2)}
- Entry Points: ${codebase.entryPoints.join(', ')}
- Test Files: ${codebase.testFiles.slice(0, 5).join(', ')}
- Patterns: ${JSON.stringify(codebase.patterns, null, 2)}

Generate a solution that:
1. Addresses all requirements
2. Follows the existing code patterns
3. Includes appropriate tests
4. Is production-ready

Format your response as JSON:
{
  "files": [
    {
      "path": "relative/path/to/file.ext",
      "changes": [
        {
          "type": "add|modify|delete",
          "content": "the code content",
          "lineNumber": 42
        }
      ]
    }
  ],
  "reasoning": "Explanation of the solution"
}`;

    try {
      const response = await this.config.openCodeAgent.query(prompt, {
        maxTokens: 2000,
        temperature: 0.3,
      });

      const parsed = JSON.parse(response);
      return {
        files: parsed.files || [],
      };
    } catch (error) {
      console.warn('AI solution generation failed, using template-based approach');
      return this.generateFallbackSolution(analysis, codebase, issue);
    }
  }

  /**
   * Apply changes to the worktree
   */
  private async applyChanges(changes: CodeChanges, worktreePath: string): Promise<void> {
    for (const file of changes.files) {
      const filePath = join(worktreePath, file.path);

      // Ensure directory exists
      await this.ensureDirectoryExists(filePath);

      // Read existing content if file exists
      let existingContent = '';
      if (existsSync(filePath)) {
        existingContent = readFileSync(filePath, 'utf8');
      }

      // Apply changes
      let newContent = existingContent;
      for (const change of file.changes) {
        newContent = this.applyChange(newContent, change);
      }

      // Write back to file
      await this.writeFile(filePath, newContent);
    }
  }

  /**
   * Run safety checks on the changes
   */
  private async runSafetyChecks(changes: CodeChanges, worktreePath: string): Promise<void> {
    // Check file count limit
    if (changes.files.length > this.config.safetyChecks.maxFilesModified) {
      throw new Error(
        `Too many files modified: ${changes.files.length} > ${this.config.safetyChecks.maxFilesModified}`
      );
    }

    // Check total lines changed
    let totalLinesChanged = 0;
    for (const file of changes.files) {
      for (const change of file.changes) {
        const lines = change.content.split('\n').length;
        totalLinesChanged += lines;
      }
    }

    if (totalLinesChanged > this.config.safetyChecks.maxLinesChanged) {
      throw new Error(
        `Too many lines changed: ${totalLinesChanged} > ${this.config.safetyChecks.maxLinesChanged}`
      );
    }

    // Check file extensions
    for (const file of changes.files) {
      const ext = file.path.split('.').pop();
      if (!ext || !this.config.allowedFileExtensions.includes(ext)) {
        throw new Error(`Unsupported file extension: ${ext || 'none'}`);
      }
    }

    // Check for dangerous patterns
    for (const file of changes.files) {
      for (const change of file.changes) {
        if (this.containsDangerousPatterns(change.content)) {
          throw new Error(`Dangerous code pattern detected in ${file.path}`);
        }
      }
    }
  }

  /**
   * Run tests in the worktree
   */
  private async runTests(worktreePath: string): Promise<boolean> {
    try {
      const originalCwd = process.cwd();
      process.chdir(worktreePath);

      execSync(this.config.testCommand, {
        timeout: 60000, // 1 minute timeout
        stdio: 'pipe',
      });

      process.chdir(originalCwd);
      return true;
    } catch (error) {
      console.warn('Tests failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Validate the solution
   */
  private async validateSolution(
    solution: CodeChanges,
    worktreePath: string,
    analysis: IssueAnalysis
  ): Promise<{ isValid: boolean; reasoning: string }> {
    // Check if all requirements are addressed
    const requirementsMet = await this.checkRequirementsMet(
      solution,
      analysis.requirements,
      worktreePath
    );

    // Check code quality
    const codeQuality = await this.checkCodeQuality(solution, worktreePath);

    // Check if solution follows patterns
    const followsPatterns = await this.checkFollowsPatterns(solution, worktreePath);

    const isValid = requirementsMet && codeQuality.score > 0.7 && followsPatterns;

    return {
      isValid,
      reasoning: `Requirements met: ${requirementsMet}, Code quality: ${codeQuality.score.toFixed(2)}, Follows patterns: ${followsPatterns}`,
    };
  }

  /**
   * Improve solution based on validation feedback
   */
  private async improveSolution(
    currentSolution: CodeChanges,
    validation: { isValid: boolean; reasoning: string },
    codebase: CodebaseAnalysis,
    issue: { number: number; title: string; body: string }
  ): Promise<CodeChanges> {
    const prompt = `The current solution has issues. Please improve it.

Validation Results: ${validation.reasoning}

Current Solution: ${JSON.stringify(currentSolution, null, 2)}

Please provide an improved solution that addresses the validation issues.`;

    try {
      const response = await this.config.openCodeAgent.query(prompt, {
        maxTokens: 1500,
        temperature: 0.4,
      });

      const parsed = JSON.parse(response);
      return {
        files: parsed.files || currentSolution.files,
      };
    } catch (error) {
      console.warn('Solution improvement failed, returning current solution');
      return currentSolution;
    }
  }

  /**
   * Generate fallback solution when AI fails
   */
  private async generateFallbackSolution(
    analysis: IssueAnalysis,
    codebase: CodebaseAnalysis,
    issue: { number: number; title: string; body: string },
    error?: any
  ): Promise<CodeChanges> {
    // Generate minimal solution based on issue type
    const solution: CodeChanges = { files: [] };

    if (analysis.category === 'bug' && analysis.requirements.length > 0) {
      // For bugs, create a simple fix
      solution.files.push({
        path: 'src/fixes/bug-fix-' + issue.number + '.ts',
        changes: [
          {
            type: 'add',
            content: `// Bug fix for issue #${issue.number}: ${issue.title}
// Requirements: ${analysis.requirements.join(', ')}
// TODO: Implement actual fix based on requirements`,
          },
        ],
      });
    }

    return solution;
  }

  // Helper methods
  private async analyzeProjectStructure(worktreePath: string): Promise<any> {
    // Basic project structure analysis
    return {
      hasPackageJson: existsSync(join(worktreePath, 'package.json')),
      hasSrc: existsSync(join(worktreePath, 'src')),
      hasTests: existsSync(join(worktreePath, 'tests')) || existsSync(join(worktreePath, 'test')),
      languages: ['typescript', 'javascript'], // Assume TypeScript project
    };
  }

  private async findTestFiles(worktreePath: string): Promise<string[]> {
    // Simple test file discovery
    const testPatterns = ['*.test.ts', '*.test.js', '*.spec.ts', '*.spec.js'];
    // This would need a more sophisticated file search in real implementation
    return [];
  }

  private async analyzeCodePatterns(worktreePath: string): Promise<any> {
    // Basic pattern analysis
    return {
      usesAsyncAwait: true,
      usesTypeScript: true,
      usesClasses: true,
      usesArrowFunctions: true,
    };
  }

  private async findEntryPoints(worktreePath: string): Promise<string[]> {
    const entryPoints = [];
    if (existsSync(join(worktreePath, 'index.ts'))) entryPoints.push('index.ts');
    if (existsSync(join(worktreePath, 'main.ts'))) entryPoints.push('main.ts');
    if (existsSync(join(worktreePath, 'src/index.ts'))) entryPoints.push('src/index.ts');
    return entryPoints;
  }

  private async analyzeDependencies(worktreePath: string): Promise<any> {
    try {
      const packageJson = JSON.parse(readFileSync(join(worktreePath, 'package.json'), 'utf8'));
      return {
        dependencies: Object.keys(packageJson.dependencies || {}),
        devDependencies: Object.keys(packageJson.devDependencies || {}),
      };
    } catch {
      return { dependencies: [], devDependencies: [] };
    }
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    // Basic directory creation - would need proper implementation
    // For now, assume directories exist
  }

  private applyChange(content: string, change: any): string {
    // Basic change application - would need proper diff/patch logic
    if (change.type === 'add') {
      return content + '\n' + change.content;
    }
    return content;
  }

  private async writeFile(filePath: string, content: string): Promise<void> {
    // Basic file writing - would need proper async implementation
    require('fs').writeFileSync(filePath, content);
  }

  private containsDangerousPatterns(content: string): boolean {
    const dangerousPatterns = [
      /eval\(/,
      /Function\(/,
      /setTimeout.*eval/,
      /setInterval.*eval/,
      /document\.write/,
      /innerHTML.*=/,
    ];

    return dangerousPatterns.some(pattern => pattern.test(content));
  }

  private async checkRequirementsMet(
    solution: CodeChanges,
    requirements: string[],
    worktreePath: string
  ): Promise<boolean> {
    // Basic requirements checking - would need more sophisticated analysis
    return requirements.length > 0 && solution.files.length > 0;
  }

  private async checkCodeQuality(
    solution: CodeChanges,
    worktreePath: string
  ): Promise<{ score: number }> {
    // Basic code quality check
    let score = 0.8; // Default good score

    for (const file of solution.files) {
      for (const change of file.changes) {
        // Check for basic code quality indicators
        if (change.content.includes('// TODO')) score -= 0.1;
        if (change.content.includes('console.log')) score -= 0.05;
        if (change.content.length < 10) score -= 0.1;
      }
    }

    return { score: Math.max(0, Math.min(1, score)) };
  }

  private async checkFollowsPatterns(
    solution: CodeChanges,
    worktreePath: string
  ): Promise<boolean> {
    // Basic pattern checking
    return true; // Assume patterns are followed for now
  }
}

interface CodebaseAnalysis {
  structure: any;
  patterns: any;
  dependencies: any;
  testFiles: string[];
  entryPoints: string[];
}
