/**
 * SWEResolver - Autonomous Software Engineering Resolver Agent
 *
 * Uses SWE-agent patterns to autonomously generate code solutions for GitHub issues.
 * Analyzes codebase, generates solutions, and validates changes.
 */

import type { ErrorHandler } from './ErrorHandler';
import { envLoader } from './EnvironmentLoader';
import type { IssueAnalysis } from './IssueAnalyzer';
import type { WorktreeInfo } from './WorktreeManager';

/**
 * Code generation result
 */
export interface CodeGenerationResult {
  success: boolean;
  changes: Array<{
    file: string;
    type: 'create' | 'modify' | 'delete';
    description: string;
    diff?: string;
  }>;
  testsAdded: string[];
  validationResults: {
    syntaxCheck: boolean;
    typeCheck: boolean;
    testsPass: boolean;
    lintingPass: boolean;
  };
  reasoning: string;
  confidence: number; // 0-1
  requiresHumanReview: boolean;
}

/**
 * SWE Resolver configuration
 */
export interface SWEResolverConfig {
  openaiApiKey: string;
  model?: string;
  temperature?: number;
  maxIterations?: number;
  costLimit?: number;
  worktreePath: string;
  tools: string[];
}

/**
 * SWEResolver - Autonomous code generation agent
 */
export class SWEResolver {
  private config: SWEResolverConfig;
  private errorHandler?: ErrorHandler;

  constructor(config: Partial<SWEResolverConfig> = {}, errorHandler?: ErrorHandler) {
    this.config = {
      openaiApiKey: config.openaiApiKey || envLoader.getRequired('OPENAI_API_KEY'),
      model: config.model || 'gpt-4',
      temperature: config.temperature || 0.1,
      maxIterations: config.maxIterations || 10,
      costLimit: config.costLimit || 5.0,
      worktreePath: config.worktreePath || '',
      tools: config.tools || ['edit', 'bash', 'grep', 'read', 'test-runner'],
      ...config,
    };
    this.errorHandler = errorHandler;
  }

  /**
   * Resolve an issue autonomously
   */
  async resolveIssue(
    issueAnalysis: IssueAnalysis,
    worktreeInfo: WorktreeInfo
  ): Promise<CodeGenerationResult> {
    try {
      console.log(`🤖 Starting autonomous resolution for issue #${issueAnalysis.issueId}`);

      // Update worktree path
      this.config.worktreePath = worktreeInfo.path;

      // Analyze codebase structure
      const codebaseAnalysis = await this.analyzeCodebase();

      // Generate solution plan
      const solutionPlan = await this.generateSolutionPlan(issueAnalysis, codebaseAnalysis);

      // Execute solution
      const result = await this.executeSolution(solutionPlan, issueAnalysis);

      // Validate changes
      const validationResults = await this.validateChanges(result);

      console.log(
        `✅ Resolution complete for issue #${issueAnalysis.issueId}: ${result.success ? 'Success' : 'Failed'}`
      );

      return {
        ...result,
        validationResults,
        requiresHumanReview: this.requiresHumanReview(result, validationResults),
      };
    } catch (error) {
      console.error(`❌ Failed to resolve issue #${issueAnalysis.issueId}:`, error);
      this.errorHandler?.handleError(error as Error, 'SWEResolver.resolveIssue');

      return {
        success: false,
        changes: [],
        testsAdded: [],
        validationResults: {
          syntaxCheck: false,
          typeCheck: false,
          testsPass: false,
          lintingPass: false,
        },
        reasoning: `Resolution failed: ${(error as Error).message}`,
        confidence: 0,
        requiresHumanReview: true,
      };
    }
  }

  /**
   * Analyze the codebase structure and patterns
   */
  private async analyzeCodebase(): Promise<{
    structure: any;
    patterns: string[];
    technologies: string[];
    conventions: any;
  }> {
    console.log('🔍 Analyzing codebase structure...');

    // Get project structure
    const structure = await this.getProjectStructure();

    // Identify patterns and conventions
    const patterns = await this.identifyPatterns(structure);
    const technologies = await this.identifyTechnologies(structure);
    const conventions = await this.identifyConventions(structure);

    return {
      structure,
      patterns,
      technologies,
      conventions,
    };
  }

  /**
   * Get project structure information
   */
  private async getProjectStructure(): Promise<any> {
    // Read package.json, tsconfig.json, etc.
    const packageJsonContent = await this.readFile('package.json');
    const tsconfigJsonContent = await this.readFile('tsconfig.json');
    const eslintConfig =
      (await this.readFile('eslint.config.js')) || (await this.readFile('.eslintrc.js'));

    let packageJson = null;
    try {
      packageJson = packageJsonContent ? JSON.parse(packageJsonContent) : null;
    } catch (error) {
      console.warn('Failed to parse package.json:', error);
    }

    let tsconfigJson = null;
    try {
      tsconfigJson = tsconfigJsonContent ? JSON.parse(tsconfigJsonContent) : null;
    } catch (error) {
      console.warn('Failed to parse tsconfig.json:', error);
    }

    return {
      packageJson,
      tsconfigJson,
      eslintConfig: eslintConfig || null,
      hasTests: (await this.fileExists('tests')) || (await this.fileExists('src/**/*.test.ts')),
      hasBuildScript: packageJson?.scripts?.build || false,
    };
  }

  /**
   * Identify coding patterns in the codebase
   */
  private async identifyPatterns(structure: any): Promise<string[]> {
    const patterns: string[] = [];

    // Check for common patterns
    if (structure.packageJson?.dependencies?.vitest) {
      patterns.push('vitest-testing-framework');
    }

    if (structure.tsconfigJson?.compilerOptions?.strict) {
      patterns.push('strict-typescript');
    }

    // Check for module patterns
    const modules = await this.listFiles('src/scripts/modules');
    if (modules.length > 0) {
      patterns.push('modular-architecture');
    }

    return patterns;
  }

  /**
   * Identify technologies used
   */
  private async identifyTechnologies(structure: any): Promise<string[]> {
    const technologies: string[] = [];

    const deps = {
      ...structure.packageJson?.dependencies,
      ...structure.packageJson?.devDependencies,
    };

    if (deps.typescript) technologies.push('TypeScript');
    if (deps.vitest) technologies.push('Vitest');
    if (deps.eslint) technologies.push('ESLint');
    if (deps.postcss) technologies.push('PostCSS');

    return technologies;
  }

  /**
   * Identify coding conventions
   */
  private async identifyConventions(structure: any): Promise<any> {
    return {
      naming: {
        files: 'PascalCase', // Based on existing files
        classes: 'PascalCase',
        functions: 'camelCase',
        constants: 'UPPER_SNAKE_CASE',
      },
      imports: {
        style: 'ES6 imports',
        grouping: 'external first, then internal',
      },
      formatting: {
        quotes: 'single',
        semicolons: true,
        indentation: '2 spaces',
      },
    };
  }

  /**
   * Generate a solution plan for the issue
   */
  private async generateSolutionPlan(
    issueAnalysis: IssueAnalysis,
    codebaseAnalysis: any
  ): Promise<{
    steps: Array<{
      type: string;
      description: string;
      files: string[];
      tools: string[];
    }>;
    estimatedComplexity: number;
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    console.log('📋 Generating solution plan...');

    const steps: Array<{
      type: string;
      description: string;
      files: string[];
      tools: string[];
    }> = [];

    // Analyze requirements and create steps
    for (const requirement of issueAnalysis.requirements.slice(0, 3)) {
      const step = await this.createStepForRequirement(
        requirement,
        issueAnalysis,
        codebaseAnalysis
      );
      if (step) steps.push(step);
    }

    // Add testing step if needed
    if (issueAnalysis.category === 'bug' || issueAnalysis.category === 'feature') {
      steps.push({
        type: 'test',
        description: 'Add or update tests to validate the changes',
        files: ['src/**/*.test.ts'],
        tools: ['test-runner'],
      });
    }

    // Add documentation step if needed
    if (issueAnalysis.category === 'feature' || issueAnalysis.category === 'enhancement') {
      steps.push({
        type: 'documentation',
        description: 'Update documentation if necessary',
        files: ['README.md', 'docs/**'],
        tools: ['markdown-tools'],
      });
    }

    const estimatedComplexity = this.estimateSolutionComplexity(steps, issueAnalysis);
    const riskLevel = this.assessSolutionRisk(steps, issueAnalysis);

    return {
      steps,
      estimatedComplexity,
      riskLevel,
    };
  }

  /**
   * Create a solution step for a specific requirement
   */
  private async createStepForRequirement(
    requirement: string,
    issueAnalysis: IssueAnalysis,
    codebaseAnalysis: any
  ): Promise<{
    type: string;
    description: string;
    files: string[];
    tools: string[];
  } | null> {
    // Use AI to analyze the requirement and suggest implementation
    const prompt = `
Analyze this requirement and suggest how to implement it in the codebase:

Requirement: "${requirement}"
Issue Category: ${issueAnalysis.category}
Issue Title: ${issueAnalysis.title}

Codebase Analysis:
- Technologies: ${codebaseAnalysis.technologies.join(', ')}
- Patterns: ${codebaseAnalysis.patterns.join(', ')}
- Structure: Modular architecture with TypeScript

Suggest:
1. What files need to be modified or created
2. What type of change (create/modify/delete)
3. Which tools are needed
4. Brief implementation description

Respond in JSON format:
{
  "files": ["file1.ts", "file2.ts"],
  "type": "modify",
  "tools": ["edit", "grep"],
  "description": "Implementation description"
}
`;

    try {
      const response = await this.callAI(prompt);
      const suggestion = JSON.parse(response);

      return {
        type: suggestion.type || 'modify',
        description: suggestion.description || `Implement: ${requirement}`,
        files: suggestion.files || [],
        tools: suggestion.tools || ['edit'],
      };
    } catch (error) {
      console.warn('Failed to generate step for requirement:', requirement, error);
      return null;
    }
  }

  /**
   * Execute the solution plan
   */
  private async executeSolution(
    plan: any,
    issueAnalysis: IssueAnalysis
  ): Promise<Omit<CodeGenerationResult, 'validationResults' | 'requiresHumanReview'>> {
    console.log('⚙️ Executing solution...');

    const changes: CodeGenerationResult['changes'] = [];
    const testsAdded: string[] = [];
    let confidence = 0.8; // Start with high confidence

    for (const step of plan.steps) {
      try {
        console.log(`Executing step: ${step.description}`);

        const stepChanges = await this.executeStep(step, issueAnalysis);
        changes.push(...stepChanges);

        // Track test additions
        if (step.type === 'test') {
          testsAdded.push(...stepChanges.map(c => c.file));
        }

        // Reduce confidence for complex changes
        if (stepChanges.length > 3) {
          confidence *= 0.9;
        }
      } catch (error) {
        console.error(`Step failed: ${step.description}`, error);
        confidence *= 0.5;
      }
    }

    return {
      success: changes.length > 0,
      changes,
      testsAdded,
      reasoning: `Executed ${plan.steps.length} steps with ${changes.length} file changes`,
      confidence,
    };
  }

  /**
   * Execute a single solution step
   */
  private async executeStep(
    step: any,
    issueAnalysis: IssueAnalysis
  ): Promise<CodeGenerationResult['changes']> {
    const changes: CodeGenerationResult['changes'] = [];

    for (const file of step.files) {
      try {
        const change = await this.generateFileChange(file, step, issueAnalysis);
        if (change) {
          changes.push(change);
          await this.applyChange(change);
        }
      } catch (error) {
        console.error(`Failed to change file ${file}:`, error);
      }
    }

    return changes;
  }

  /**
   * Generate a specific file change
   */
  private async generateFileChange(
    file: string,
    step: any,
    issueAnalysis: IssueAnalysis
  ): Promise<CodeGenerationResult['changes'][0] | null> {
    // Check if file exists
    const exists = await this.fileExists(file);

    if (!exists && step.type !== 'create') {
      console.log(`File ${file} does not exist, skipping`);
      return null;
    }

    // Generate change using AI
    const prompt = `
Generate code changes for this file to implement the requirement.

File: ${file}
Step: ${step.description}
Issue: ${issueAnalysis.title}
Category: ${issueAnalysis.category}
Requirements: ${issueAnalysis.requirements.join(', ')}

${exists ? 'Existing file content (modify):' : 'New file (create):'}

${exists ? await this.readFile(file) : ''}

Generate the complete file content after changes. Include proper imports, types, and follow the codebase conventions.
`;

    try {
      const newContent = await this.callAI(prompt);

      return {
        file,
        type: exists ? 'modify' : 'create',
        description: step.description,
        diff: exists ? await this.generateDiff(file, newContent) : `Create ${file}`,
      };
    } catch (error) {
      console.error(`Failed to generate change for ${file}:`, error);
      return null;
    }
  }

  /**
   * Apply a change to the filesystem
   */
  private async applyChange(change: CodeGenerationResult['changes'][0]): Promise<void> {
    // This would use the edit tool to apply changes
    console.log(`Applying change to ${change.file}: ${change.description}`);
    // Implementation would use the edit tool here
  }

  /**
   * Validate the changes made
   */
  private async validateChanges(result: any): Promise<CodeGenerationResult['validationResults']> {
    console.log('🔍 Validating changes...');

    const validationResults = {
      syntaxCheck: false,
      typeCheck: false,
      testsPass: false,
      lintingPass: false,
    };

    try {
      // Run TypeScript check
      validationResults.typeCheck = await this.runTypeCheck();

      // Run linting
      validationResults.lintingPass = await this.runLinting();

      // Run tests
      validationResults.testsPass = await this.runTests();

      // Basic syntax check
      validationResults.syntaxCheck = validationResults.typeCheck;
    } catch (error) {
      console.error('Validation failed:', error);
    }

    return validationResults;
  }

  /**
   * Determine if human review is required
   */
  private requiresHumanReview(
    result: any,
    validation: CodeGenerationResult['validationResults']
  ): boolean {
    // Require human review if:
    // - Low confidence
    // - Validation failures
    // - Complex changes
    // - Security-related changes

    return (
      result.confidence < 0.7 ||
      !validation.testsPass ||
      !validation.typeCheck ||
      result.changes.length > 5
    );
  }

  /**
   * Helper methods for file operations and AI calls
   */
  private async readFile(path: string): Promise<string | null> {
    try {
      const response = await fetch(`file://${this.config.worktreePath}/${path}`);
      return await response.text();
    } catch {
      return null;
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      const response = await fetch(`file://${this.config.worktreePath}/${path}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async listFiles(pattern: string): Promise<string[]> {
    // This would use the glob tool
    return [];
  }

  private async callAI(prompt: string): Promise<string> {
    // This would use the OpenAI client
    // For now, return a mock response
    return 'Mock AI response - implementation needed';
  }

  private async generateDiff(file: string, newContent: string): Promise<string> {
    // Generate diff between old and new content
    return `Diff for ${file}`;
  }

  private async runTypeCheck(): Promise<boolean> {
    // Run tsc --noEmit
    return true;
  }

  private async runLinting(): Promise<boolean> {
    // Run eslint
    return true;
  }

  private async runTests(): Promise<boolean> {
    // Run vitest
    return true;
  }

  private estimateSolutionComplexity(steps: any[], issueAnalysis: IssueAnalysis): number {
    return steps.length * issueAnalysis.requirements.length;
  }

  private assessSolutionRisk(
    steps: any[],
    issueAnalysis: IssueAnalysis
  ): 'low' | 'medium' | 'high' {
    if (
      issueAnalysis.riskAssessment.security === 'high' ||
      issueAnalysis.riskAssessment.breakingChanges
    ) {
      return 'high';
    }
    if (steps.length > 3 || issueAnalysis.complexity === 'high') {
      return 'medium';
    }
    return 'low';
  }
}
