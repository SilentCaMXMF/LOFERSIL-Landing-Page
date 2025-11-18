/**
 * GitHub Issues Reviewer Configuration System
 *
 * Centralized configuration management for all AI-powered GitHub issues reviewer components.
 * Provides validation, environment variable loading, and type-safe configuration access.
 */

import { envLoader } from './EnvironmentLoader';
import type { ErrorHandler } from './ErrorHandler';

/**
 * GitHub API configuration
 */
export interface GitHubConfig {
  token: string;
  repository: string; // owner/repo format
  apiUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * OpenAI API configuration
 */
export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

/**
 * Worktree management configuration
 */
export interface WorktreeConfig {
  rootDir: string;
  autoCleanup: boolean;
  defaultSyncStrategy: 'merge' | 'rebase';
  mainBranch: string;
  copyFiles: string[];
  cleanupAgeHours: number;
}

/**
 * Issue analysis configuration
 */
export interface IssueAnalysisConfig {
  complexityThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  categories: {
    enabled: string[];
    priority: Record<string, number>;
  };
  feasibility: {
    requireCodeExamples: boolean;
    requireFileReferences: boolean;
    maxComplexityForAuto: 'low' | 'medium' | 'high';
  };
}

/**
 * Code generation configuration
 */
export interface CodeGenerationConfig {
  maxIterations: number;
  costLimit: number;
  tools: string[];
  validation: {
    requireTests: boolean;
    requireTypeCheck: boolean;
    requireLinting: boolean;
  };
  patterns: {
    modularArchitecture: boolean;
    strictTypescript: boolean;
    testingFramework: string;
  };
}

/**
 * Code review configuration
 */
export interface CodeReviewConfig {
  strictMode: boolean;
  securityChecks: boolean;
  performanceChecks: boolean;
  styleChecks: boolean;
  thresholds: {
    maxIssuesForApproval: number;
    minConfidenceForApproval: number;
    criticalIssuesBlock: boolean;
  };
  rules: {
    maxLineLength: number;
    requireJSDoc: boolean;
    banConsoleLogs: boolean;
  };
}

/**
 * Workflow orchestration configuration
 */
export interface WorkflowConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  enableMetrics: boolean;
  autoCleanup: boolean;
  statePersistence: boolean;
}

/**
 * Monitoring and metrics configuration
 */
export interface MonitoringConfig {
  enableMetrics: boolean;
  metricsRetentionDays: number;
  alertThresholds: {
    failureRate: number;
    averageDuration: number;
    costLimit: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    includeTimestamps: boolean;
    logToFile: boolean;
  };
}

/**
 * Main configuration interface
 */
export interface GitHubIssuesReviewerConfig {
  github: GitHubConfig;
  openai: OpenAIConfig;
  worktrees: WorktreeConfig;
  issueAnalysis: IssueAnalysisConfig;
  codeGeneration: CodeGenerationConfig;
  codeReview: CodeReviewConfig;
  workflow: WorkflowConfig;
  monitoring: MonitoringConfig;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * GitHub Issues Reviewer Configuration Manager
 */
export class GitHubIssuesReviewerConfigManager {
  private config: GitHubIssuesReviewerConfig;
  private errorHandler?: ErrorHandler;

  constructor(config?: Partial<GitHubIssuesReviewerConfig>, errorHandler?: ErrorHandler) {
    this.errorHandler = errorHandler;
    this.config = this.loadDefaultConfig();

    if (config) {
      this.config = this.mergeConfigs(this.config, config);
      // Don't load from environment if custom config is provided (for testing)
    } else {
      this.loadFromEnvironment();
    }
  }

  /**
   * Load default configuration
   */
  private loadDefaultConfig(): GitHubIssuesReviewerConfig {
    return {
      github: {
        token: '',
        repository: '',
        apiUrl: 'https://api.github.com',
        timeout: 30000,
        maxRetries: 3,
      },
      openai: {
        apiKey: '',
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 4000,
        timeout: 60000,
      },
      worktrees: {
        rootDir: '.git/ai-worktrees',
        autoCleanup: true,
        defaultSyncStrategy: 'merge',
        mainBranch: 'main',
        copyFiles: ['.env.example', '.env.local', 'package-lock.json', 'yarn.lock'],
        cleanupAgeHours: 1,
      },
      issueAnalysis: {
        complexityThresholds: {
          low: 50,
          medium: 200,
          high: 500,
        },
        categories: {
          enabled: ['bug', 'feature', 'enhancement', 'documentation'],
          priority: {
            bug: 1,
            feature: 2,
            enhancement: 3,
            documentation: 4,
          },
        },
        feasibility: {
          requireCodeExamples: false,
          requireFileReferences: false,
          maxComplexityForAuto: 'medium',
        },
      },
      codeGeneration: {
        maxIterations: 10,
        costLimit: 5.0,
        tools: ['edit', 'bash', 'grep', 'read', 'test-runner'],
        validation: {
          requireTests: true,
          requireTypeCheck: true,
          requireLinting: true,
        },
        patterns: {
          modularArchitecture: true,
          strictTypescript: true,
          testingFramework: 'vitest',
        },
      },
      codeReview: {
        strictMode: true,
        securityChecks: true,
        performanceChecks: true,
        styleChecks: true,
        thresholds: {
          maxIssuesForApproval: 5,
          minConfidenceForApproval: 0.7,
          criticalIssuesBlock: true,
        },
        rules: {
          maxLineLength: 100,
          requireJSDoc: false,
          banConsoleLogs: true,
        },
      },
      workflow: {
        maxRetries: 3,
        retryDelay: 5000,
        timeout: 1800000, // 30 minutes
        enableMetrics: true,
        autoCleanup: true,
        statePersistence: false,
      },
      monitoring: {
        enableMetrics: true,
        metricsRetentionDays: 30,
        alertThresholds: {
          failureRate: 0.5,
          averageDuration: 3600000, // 1 hour
          costLimit: 10.0,
        },
        logging: {
          level: 'info',
          includeTimestamps: true,
          logToFile: false,
        },
      },
    };
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): void {
    // GitHub configuration
    this.config.github.token = envLoader.getRequired('GITHUB_TOKEN');
    this.config.github.repository = envLoader.getRequired('GITHUB_REPOSITORY');

    // OpenAI configuration
    this.config.openai.apiKey = envLoader.getRequired('OPENAI_API_KEY');

    // Optional overrides
    if (envLoader.get('GITHUB_API_URL')) {
      this.config.github.apiUrl = envLoader.get('GITHUB_API_URL');
    }

    if (envLoader.get('OPENAI_MODEL')) {
      this.config.openai.model = envLoader.get('OPENAI_MODEL');
    }

    if (envLoader.get('WORKTREE_ROOT_DIR')) {
      this.config.worktrees.rootDir = envLoader.get('WORKTREE_ROOT_DIR')!;
    }

    if (envLoader.get('MAIN_BRANCH')) {
      this.config.worktrees.mainBranch = envLoader.get('MAIN_BRANCH')!;
    }
  }

  /**
   * Merge configuration objects
   */
  private mergeConfigs(
    base: GitHubIssuesReviewerConfig,
    override: Partial<GitHubIssuesReviewerConfig>
  ): GitHubIssuesReviewerConfig {
    return {
      github: { ...base.github, ...override.github },
      openai: { ...base.openai, ...override.openai },
      worktrees: { ...base.worktrees, ...override.worktrees },
      issueAnalysis: { ...base.issueAnalysis, ...override.issueAnalysis },
      codeGeneration: { ...base.codeGeneration, ...override.codeGeneration },
      codeReview: { ...base.codeReview, ...override.codeReview },
      workflow: { ...base.workflow, ...override.workflow },
      monitoring: { ...base.monitoring, ...override.monitoring },
    };
  }

  /**
   * Validate configuration
   */
  validate(): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!this.config.github.token) {
      errors.push('GitHub token is required');
    }

    if (!this.config.github.repository) {
      errors.push('GitHub repository is required');
    }

    if (!this.config.openai.apiKey) {
      errors.push('OpenAI API key is required');
    }

    // Repository format validation
    if (this.config.github.repository && !this.config.github.repository.includes('/')) {
      errors.push('GitHub repository must be in owner/repo format');
    }

    // Threshold validations
    if (
      this.config.codeReview.thresholds.minConfidenceForApproval < 0 ||
      this.config.codeReview.thresholds.minConfidenceForApproval > 1
    ) {
      errors.push('Confidence threshold must be between 0 and 1');
    }

    if (
      this.config.monitoring.alertThresholds.failureRate < 0 ||
      this.config.monitoring.alertThresholds.failureRate > 1
    ) {
      errors.push('Failure rate threshold must be between 0 and 1');
    }

    // Warning validations
    if (this.config.workflow.timeout < 60000) {
      warnings.push('Workflow timeout is very low (< 1 minute)');
    }

    if (this.config.codeGeneration.costLimit < 1.0) {
      warnings.push('Cost limit is very low, may limit functionality');
    }

    if (!this.config.monitoring.enableMetrics) {
      warnings.push('Metrics are disabled, monitoring will be limited');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get the complete configuration
   */
  getConfig(): GitHubIssuesReviewerConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Get specific configuration section
   */
  getGitHubConfig(): GitHubConfig {
    return { ...this.config.github };
  }

  getOpenAIConfig(): OpenAIConfig {
    return { ...this.config.openai };
  }

  getWorktreeConfig(): WorktreeConfig {
    return { ...this.config.worktrees };
  }

  getIssueAnalysisConfig(): IssueAnalysisConfig {
    return { ...this.config.issueAnalysis };
  }

  getCodeGenerationConfig(): CodeGenerationConfig {
    return { ...this.config.codeGeneration };
  }

  getCodeReviewConfig(): CodeReviewConfig {
    return { ...this.config.codeReview };
  }

  getWorkflowConfig(): WorkflowConfig {
    return { ...this.config.workflow };
  }

  getMonitoringConfig(): MonitoringConfig {
    return { ...this.config.monitoring };
  }

  /**
   * Update configuration (creates a new instance)
   */
  updateConfig(updates: Partial<GitHubIssuesReviewerConfig>): GitHubIssuesReviewerConfigManager {
    const newConfig = this.mergeConfigs(this.config, updates);
    return new GitHubIssuesReviewerConfigManager(newConfig, this.errorHandler);
  }

  /**
   * Export configuration as JSON
   */
  toJSON(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Load configuration from JSON
   */
  static fromJSON(json: string, errorHandler?: ErrorHandler): GitHubIssuesReviewerConfigManager {
    try {
      const config = JSON.parse(json);
      return new GitHubIssuesReviewerConfigManager(config, errorHandler);
    } catch (error) {
      throw new Error(`Failed to parse configuration JSON: ${(error as Error).message}`);
    }
  }

  /**
   * Create configuration from environment variables only
   */
  static fromEnvironment(errorHandler?: ErrorHandler): GitHubIssuesReviewerConfigManager {
    const manager = new GitHubIssuesReviewerConfigManager(undefined, errorHandler);
    manager.loadFromEnvironment();
    return manager;
  }

  /**
   * Get configuration schema for validation/documentation
   */
  static getSchema(): any {
    return {
      type: 'object',
      properties: {
        github: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            repository: { type: 'string', pattern: '.+/.+' },
            apiUrl: { type: 'string', format: 'uri' },
            timeout: { type: 'number', minimum: 1000 },
            maxRetries: { type: 'number', minimum: 0 },
          },
          required: ['token', 'repository'],
        },
        openai: {
          type: 'object',
          properties: {
            apiKey: { type: 'string' },
            model: { type: 'string' },
            temperature: { type: 'number', minimum: 0, maximum: 2 },
            maxTokens: { type: 'number', minimum: 1 },
            timeout: { type: 'number', minimum: 1000 },
          },
          required: ['apiKey'],
        },
        // ... other sections would be defined here
      },
    };
  }
}
