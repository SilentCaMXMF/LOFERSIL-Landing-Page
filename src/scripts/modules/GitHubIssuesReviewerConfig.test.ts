/**
 * GitHubIssuesReviewerConfig Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubIssuesReviewerConfigManager } from './GitHubIssuesReviewerConfig';

// Mock environment loader
vi.mock('./EnvironmentLoader', () => ({
  envLoader: {
    getRequired: vi.fn((key: string) => {
      const mockValues: Record<string, string> = {
        GITHUB_TOKEN: 'mock-github-token',
        GITHUB_REPOSITORY: 'owner/repo',
        OPENAI_API_KEY: 'mock-openai-key',
      };
      return mockValues[key] || '';
    }),
    get: vi.fn((key: string) => {
      const mockValues: Record<string, string> = {
        GITHUB_API_URL: 'https://api.github.com',
        OPENAI_MODEL: 'gpt-4',
        WORKTREE_ROOT_DIR: '.git/ai-worktrees',
        MAIN_BRANCH: 'main',
      };
      return mockValues[key] || null;
    }),
  },
}));

describe('GitHubIssuesReviewerConfigManager', () => {
  let configManager: GitHubIssuesReviewerConfigManager;

  beforeEach(() => {
    vi.clearAllMocks();
    configManager = new GitHubIssuesReviewerConfigManager();
  });

  describe('initialization', () => {
    it('should load default configuration', () => {
      const config = configManager.getConfig();

      expect(config.github.timeout).toBe(30000);
      expect(config.openai.model).toBe('gpt-4');
      expect(config.worktrees.autoCleanup).toBe(true);
      expect(config.workflow.enableMetrics).toBe(true);
    });

    it('should load configuration from environment', () => {
      const config = configManager.getConfig();

      expect(config.github.token).toBe('mock-github-token');
      expect(config.github.repository).toBe('owner/repo');
      expect(config.openai.apiKey).toBe('mock-openai-key');
    });

    it('should merge custom configuration', () => {
      const customConfig = {
        github: {
          token: 'custom-token',
          repository: 'custom/repo',
          timeout: 60000,
        },
        workflow: {
          maxRetries: 5,
          retryDelay: 5000,
          timeout: 1800000,
          enableMetrics: true,
          autoCleanup: true,
          statePersistence: false,
        },
      };

      const manager = new GitHubIssuesReviewerConfigManager(customConfig);
      const config = manager.getConfig();

      expect(config.github.timeout).toBe(60000);
      expect(config.workflow.maxRetries).toBe(5);
      expect(config.github.token).toBe('custom-token'); // Overridden by custom config
    });
  });

  describe('validation', () => {
    it('should validate correct configuration', () => {
      const result = configManager.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      // Create config with missing required fields
      const invalidManager = new GitHubIssuesReviewerConfigManager({
        github: {
          token: '',
          repository: '',
          apiUrl: 'https://api.github.com',
          timeout: 30000,
          maxRetries: 3,
        },
        openai: { apiKey: '', model: 'gpt-4', temperature: 0.2, maxTokens: 4000, timeout: 60000 },
        worktrees: {
          rootDir: '.git/ai-worktrees',
          autoCleanup: true,
          defaultSyncStrategy: 'merge' as const,
          mainBranch: 'main',
          copyFiles: [],
          cleanupAgeHours: 1,
        },
        issueAnalysis: {
          complexityThresholds: { low: 50, medium: 200, high: 500 },
          categories: { enabled: [], priority: {} },
          feasibility: {
            requireCodeExamples: false,
            requireFileReferences: false,
            maxComplexityForAuto: 'medium' as const,
          },
        },
        codeGeneration: {
          maxIterations: 10,
          costLimit: 5.0,
          tools: [],
          validation: { requireTests: true, requireTypeCheck: true, requireLinting: true },
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
          rules: { maxLineLength: 100, requireJSDoc: false, banConsoleLogs: true },
        },
        workflow: {
          maxRetries: 3,
          retryDelay: 5000,
          timeout: 1800000,
          enableMetrics: true,
          autoCleanup: true,
          statePersistence: false,
        },
        monitoring: {
          enableMetrics: true,
          metricsRetentionDays: 30,
          alertThresholds: { failureRate: 0.5, averageDuration: 3600000, costLimit: 10.0 },
          logging: { level: 'info' as const, includeTimestamps: true, logToFile: false },
        },
      });

      const result = invalidManager.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('GitHub token is required');
      expect(result.errors).toContain('GitHub repository is required');
      expect(result.errors).toContain('OpenAI API key is required');
    });

    it('should validate repository format', () => {
      const invalidManager = new GitHubIssuesReviewerConfigManager({
        github: {
          token: 'token',
          repository: 'invalid-repo-format',
          apiUrl: 'https://api.github.com',
          timeout: 30000,
          maxRetries: 3,
        },
        openai: {
          apiKey: 'key',
          model: 'gpt-4',
          temperature: 0.2,
          maxTokens: 4000,
          timeout: 60000,
        },
        worktrees: {
          rootDir: '.git/ai-worktrees',
          autoCleanup: true,
          defaultSyncStrategy: 'merge' as const,
          mainBranch: 'main',
          copyFiles: [],
          cleanupAgeHours: 1,
        },
        issueAnalysis: {
          complexityThresholds: { low: 50, medium: 200, high: 500 },
          categories: { enabled: [], priority: {} },
          feasibility: {
            requireCodeExamples: false,
            requireFileReferences: false,
            maxComplexityForAuto: 'medium' as const,
          },
        },
        codeGeneration: {
          maxIterations: 10,
          costLimit: 5.0,
          tools: [],
          validation: { requireTests: true, requireTypeCheck: true, requireLinting: true },
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
          rules: { maxLineLength: 100, requireJSDoc: false, banConsoleLogs: true },
        },
        workflow: {
          maxRetries: 3,
          retryDelay: 5000,
          timeout: 1800000,
          enableMetrics: true,
          autoCleanup: true,
          statePersistence: false,
        },
        monitoring: {
          enableMetrics: true,
          metricsRetentionDays: 30,
          alertThresholds: { failureRate: 0.5, averageDuration: 3600000, costLimit: 10.0 },
          logging: { level: 'info' as const, includeTimestamps: true, logToFile: false },
        },
      });

      const result = invalidManager.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('GitHub repository must be in owner/repo format');
    });

    it('should provide warnings for edge cases', () => {
      const manager = new GitHubIssuesReviewerConfigManager({
        github: {
          token: 'token',
          repository: 'owner/repo',
          apiUrl: 'https://api.github.com',
          timeout: 30000,
          maxRetries: 3,
        },
        openai: {
          apiKey: 'key',
          model: 'gpt-4',
          temperature: 0.2,
          maxTokens: 4000,
          timeout: 60000,
        },
        worktrees: {
          rootDir: '.git/ai-worktrees',
          autoCleanup: true,
          defaultSyncStrategy: 'merge' as const,
          mainBranch: 'main',
          copyFiles: [],
          cleanupAgeHours: 1,
        },
        issueAnalysis: {
          complexityThresholds: { low: 50, medium: 200, high: 500 },
          categories: { enabled: [], priority: {} },
          feasibility: {
            requireCodeExamples: false,
            requireFileReferences: false,
            maxComplexityForAuto: 'medium' as const,
          },
        },
        codeGeneration: {
          maxIterations: 10,
          costLimit: 0.1, // Very low cost limit
          tools: [],
          validation: { requireTests: true, requireTypeCheck: true, requireLinting: true },
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
          rules: { maxLineLength: 100, requireJSDoc: false, banConsoleLogs: true },
        },
        workflow: {
          maxRetries: 3,
          retryDelay: 5000,
          timeout: 1000, // Very low timeout
          enableMetrics: true,
          autoCleanup: true,
          statePersistence: false,
        },
        monitoring: {
          enableMetrics: false, // Disabled metrics
          metricsRetentionDays: 30,
          alertThresholds: { failureRate: 0.5, averageDuration: 3600000, costLimit: 10.0 },
          logging: { level: 'info' as const, includeTimestamps: true, logToFile: false },
        },
      });

      const result = manager.validate();

      expect(result.warnings).toContain('Workflow timeout is very low (< 1 minute)');
      expect(result.warnings).toContain('Cost limit is very low, may limit functionality');
      expect(result.warnings).toContain('Metrics are disabled, monitoring will be limited');
    });
  });

  describe('configuration access', () => {
    it('should provide access to configuration sections', () => {
      expect(configManager.getGitHubConfig()).toHaveProperty('token');
      expect(configManager.getOpenAIConfig()).toHaveProperty('apiKey');
      expect(configManager.getWorktreeConfig()).toHaveProperty('rootDir');
      expect(configManager.getIssueAnalysisConfig()).toHaveProperty('complexityThresholds');
      expect(configManager.getCodeGenerationConfig()).toHaveProperty('maxIterations');
      expect(configManager.getCodeReviewConfig()).toHaveProperty('strictMode');
      expect(configManager.getWorkflowConfig()).toHaveProperty('maxRetries');
      expect(configManager.getMonitoringConfig()).toHaveProperty('enableMetrics');
    });

    it('should return copies to prevent mutation', () => {
      const config1 = configManager.getConfig();
      const config2 = configManager.getConfig();

      expect(config1).not.toBe(config2); // Different objects
      expect(config1.github).not.toBe(config2.github); // Different nested objects
    });
  });

  describe('configuration updates', () => {
    it('should create new instance when updating config', () => {
      const updatedManager = configManager.updateConfig({
        github: {
          token: 'updated-token',
          repository: 'updated/repo',
          timeout: 60000,
          apiUrl: 'https://api.github.com',
          maxRetries: 3,
        },
      });

      expect(updatedManager).not.toBe(configManager);
      expect(updatedManager.getGitHubConfig().timeout).toBe(60000);
      expect(configManager.getGitHubConfig().timeout).toBe(30000);
    });
  });

  describe('serialization', () => {
    it('should export configuration as JSON', () => {
      const json = configManager.toJSON();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should load configuration from JSON', () => {
      const json = configManager.toJSON();
      const loadedManager = GitHubIssuesReviewerConfigManager.fromJSON(json);

      expect(loadedManager.getConfig()).toEqual(configManager.getConfig());
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        GitHubIssuesReviewerConfigManager.fromJSON('invalid json');
      }).toThrow('Failed to parse configuration JSON');
    });
  });

  describe('static methods', () => {
    it('should create config from environment only', () => {
      const envManager = GitHubIssuesReviewerConfigManager.fromEnvironment();

      expect(envManager.getGitHubConfig().token).toBe('mock-github-token');
      expect(envManager.getOpenAIConfig().apiKey).toBe('mock-openai-key');
    });

    it('should provide configuration schema', () => {
      const schema = GitHubIssuesReviewerConfigManager.getSchema();

      expect(schema.type).toBe('object');
      expect(schema.properties).toHaveProperty('github');
      expect(schema.properties).toHaveProperty('openai');
    });
  });
});
