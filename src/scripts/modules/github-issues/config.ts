/**
 * Configuration Utilities for GitHub Issues Reviewer
 * Provides helpers for setting up and validating configurations
 */

import {
  GitHubConfig,
  AIConfig,
  AnalysisConfig,
  RateLimitConfig,
} from "./types";

export class ConfigurationValidator {
  /**
   * Validate GitHub configuration
   */
  static validateGitHubConfig(config: GitHubConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.token || config.token.trim() === "") {
      errors.push("GitHub token is required");
    }

    if (!config.owner || config.owner.trim() === "") {
      errors.push("Repository owner is required");
    }

    if (!config.repo || config.repo.trim() === "") {
      errors.push("Repository name is required");
    }

    if (!config.apiEndpoint || !config.apiEndpoint.startsWith("https://")) {
      errors.push("API endpoint must be a valid HTTPS URL");
    }

    if (config.rateLimit.maxRequests <= 0) {
      errors.push("Rate limit max requests must be greater than 0");
    }

    if (config.rateLimit.resetInterval <= 0) {
      errors.push("Rate limit reset interval must be greater than 0");
    }

    if (config.rateLimit.backoffMultiplier <= 1) {
      errors.push("Backoff multiplier must be greater than 1");
    }

    if (config.rateLimit.maxBackoffTime <= 0) {
      errors.push("Max backoff time must be greater than 0");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate AI configuration
   */
  static validateAIConfig(config: AIConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.apiKey || config.apiKey.trim() === "") {
      errors.push("AI API key is required");
    }

    if (!config.model || config.model.trim() === "") {
      errors.push("AI model name is required");
    }

    if (!["gemini", "openai"].includes(config.provider)) {
      errors.push("AI provider must be 'gemini' or 'openai'");
    }

    if (config.maxTokens <= 0) {
      errors.push("Max tokens must be greater than 0");
    }

    if (config.temperature < 0 || config.temperature > 2) {
      errors.push("Temperature must be between 0 and 2");
    }

    if (config.topP <= 0 || config.topP > 1) {
      errors.push("TopP must be between 0 and 1");
    }

    if (config.topK <= 0) {
      errors.push("TopK must be greater than 0");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate analysis configuration
   */
  static validateAnalysisConfig(config: AnalysisConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (config.complexityThresholds.low < 0) {
      errors.push("Low complexity threshold must be non-negative");
    }

    if (config.complexityThresholds.medium <= config.complexityThresholds.low) {
      errors.push(
        "Medium complexity threshold must be greater than low threshold",
      );
    }

    if (
      config.complexityThresholds.high <= config.complexityThresholds.medium
    ) {
      errors.push(
        "High complexity threshold must be greater than medium threshold",
      );
    }

    if (config.maxAnalysisTime <= 0) {
      errors.push("Max analysis time must be greater than 0");
    }

    // Validate AI config
    const aiValidation = this.validateAIConfig(config.aiConfig);
    if (!aiValidation.valid) {
      errors.push(...aiValidation.errors.map((err) => `AI Config: ${err}`));
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export class ConfigurationManager {
  /**
   * Create default GitHub configuration
   */
  static createDefaultGitHubConfig(
    overrides: Partial<GitHubConfig> = {},
  ): GitHubConfig {
    return {
      token: process.env.GITHUB_TOKEN || "",
      owner: process.env.GITHUB_OWNER || "",
      repo: process.env.GITHUB_REPO || "",
      apiEndpoint: "https://api.github.com",
      rateLimit: {
        maxRequests: 5000,
        resetInterval: 3600000, // 1 hour
        backoffMultiplier: 2,
        maxBackoffTime: 60000, // 1 minute
      },
      ...overrides,
    };
  }

  /**
   * Create default AI configuration
   */
  static createDefaultAIConfig(overrides: Partial<AIConfig> = {}): AIConfig {
    return {
      provider: "gemini",
      model: "gemini-pro",
      apiKey: process.env.GEMINI_API_KEY || "",
      maxTokens: 2048,
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
      ...overrides,
    };
  }

  /**
   * Create default analysis configuration
   */
  static createDefaultAnalysisConfig(
    overrides: Partial<AnalysisConfig> = {},
  ): AnalysisConfig {
    const aiConfig = this.createDefaultAIConfig();

    return {
      complexityThresholds: {
        low: 2,
        medium: 4,
        high: 7,
      },
      maxAnalysisTime: 30000, // 30 seconds
      supportedLabels: [
        "bug",
        "feature",
        "enhancement",
        "documentation",
        "question",
        "maintenance",
        "critical",
        "high",
        "medium",
        "low",
      ],
      aiConfig,
      ...overrides,
    };
  }

  /**
   * Load configuration from environment variables
   */
  static loadFromEnvironment(): {
    github: GitHubConfig;
    ai: AIConfig;
    analysis: AnalysisConfig;
  } {
    const github = this.createDefaultGitHubConfig({
      token: process.env.GITHUB_TOKEN || "",
      owner: process.env.GITHUB_OWNER || "",
      repo: process.env.GITHUB_REPO || "",
      apiEndpoint: process.env.GITHUB_API_ENDPOINT || "https://api.github.com",
    });

    const ai = this.createDefaultAIConfig({
      provider: (process.env.AI_PROVIDER as any) || "gemini",
      model: process.env.AI_MODEL || "gemini-pro",
      apiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "",
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || "2048"),
      temperature: parseFloat(process.env.AI_TEMPERATURE || "0.3"),
      topP: parseFloat(process.env.AI_TOP_P || "0.8"),
      topK: parseInt(process.env.AI_TOP_K || "40"),
    });

    const analysis = this.createDefaultAnalysisConfig({
      complexityThresholds: {
        low: parseInt(process.env.COMPLEXITY_THRESHOLD_LOW || "2"),
        medium: parseInt(process.env.COMPLEXITY_THRESHOLD_MEDIUM || "4"),
        high: parseInt(process.env.COMPLEXITY_THRESHOLD_HIGH || "7"),
      },
      maxAnalysisTime: parseInt(process.env.MAX_ANALYSIS_TIME || "30000"),
      supportedLabels: process.env.SUPPORTED_LABELS?.split(",") || [
        "bug",
        "feature",
        "enhancement",
        "documentation",
        "question",
        "maintenance",
      ],
      aiConfig: ai,
    });

    return { github, ai, analysis };
  }

  /**
   * Create configuration for development/testing
   */
  static createDevelopmentConfig(): {
    github: GitHubConfig;
    ai: AIConfig;
    analysis: AnalysisConfig;
  } {
    return {
      github: this.createDefaultGitHubConfig({
        rateLimit: {
          maxRequests: 100, // Lower for development
          resetInterval: 60000, // 1 minute for faster testing
          backoffMultiplier: 2,
          maxBackoffTime: 10000, // 10 seconds
        },
      }),
      ai: this.createDefaultAIConfig({
        maxTokens: 1024, // Smaller for development
        temperature: 0.1, // More deterministic for testing
      }),
      analysis: this.createDefaultAnalysisConfig({
        maxAnalysisTime: 10000, // 10 seconds for development
      }),
    };
  }

  /**
   * Create configuration for production
   */
  static createProductionConfig(): {
    github: GitHubConfig;
    ai: AIConfig;
    analysis: AnalysisConfig;
  } {
    return {
      github: this.createDefaultGitHubConfig({
        rateLimit: {
          maxRequests: 5000, // GitHub default
          resetInterval: 3600000, // 1 hour
          backoffMultiplier: 2,
          maxBackoffTime: 300000, // 5 minutes
        },
      }),
      ai: this.createDefaultAIConfig({
        maxTokens: 4096, // Larger for production
        temperature: 0.3, // Balanced creativity
      }),
      analysis: this.createDefaultAnalysisConfig({
        maxAnalysisTime: 60000, // 1 minute timeout
      }),
    };
  }

  /**
   * Validate complete configuration
   */
  static validateCompleteConfig(
    github: GitHubConfig,
    ai: AIConfig,
    analysis: AnalysisConfig,
  ): { valid: boolean; errors: string[] } {
    const allErrors: string[] = [];

    const githubValidation =
      ConfigurationValidator.validateGitHubConfig(github);
    if (!githubValidation.valid) {
      allErrors.push(...githubValidation.errors.map((err) => `GitHub: ${err}`));
    }

    const aiValidation = ConfigurationValidator.validateAIConfig(ai);
    if (!aiValidation.valid) {
      allErrors.push(...aiValidation.errors.map((err) => `AI: ${err}`));
    }

    const analysisValidation =
      ConfigurationValidator.validateAnalysisConfig(analysis);
    if (!analysisValidation.valid) {
      allErrors.push(
        ...analysisValidation.errors.map((err) => `Analysis: ${err}`),
      );
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

/**
 * Example usage and configuration templates
 */
export const ConfigurationTemplates = {
  /**
   * Example GitHub configuration
   */
  githubExample: {
    token: "ghp_xxxxxxxxxxxxxxxxxxxx", // Your GitHub personal access token
    owner: "your-org",
    repo: "your-repo",
    apiEndpoint: "https://api.github.com",
    rateLimit: {
      maxRequests: 5000,
      resetInterval: 3600000,
      backoffMultiplier: 2,
      maxBackoffTime: 60000,
    },
  } as GitHubConfig,

  /**
   * Example AI configuration for Gemini
   */
  geminiExample: {
    provider: "gemini" as const,
    model: "gemini-pro",
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Your Gemini API key
    maxTokens: 2048,
    temperature: 0.3,
    topP: 0.8,
    topK: 40,
  } as AIConfig,

  /**
   * Example AI configuration for OpenAI
   */
  openaiExample: {
    provider: "openai" as const,
    model: "gpt-4",
    apiKey: "sk-XXXXXXXXXXXXXXXXXXXXXXXX", // Your OpenAI API key
    maxTokens: 2048,
    temperature: 0.3,
    topP: 0.8,
    topK: 40,
  } as AIConfig,

  /**
   * Example analysis configuration
   */
  analysisExample: {
    complexityThresholds: {
      low: 2,
      medium: 4,
      high: 7,
    },
    maxAnalysisTime: 30000,
    supportedLabels: [
      "bug",
      "feature",
      "enhancement",
      "documentation",
      "question",
      "maintenance",
      "critical",
      "high",
      "medium",
      "low",
      "ui",
      "backend",
      "api",
      "performance",
      "security",
    ],
    aiConfig: {} as AIConfig, // Would be populated with actual AI config
  } as AnalysisConfig,
};

/**
 * Environment variable documentation
 */
export const EnvironmentVariables = {
  GITHUB_TOKEN: {
    description: "GitHub personal access token with repo permissions",
    required: true,
    example: "ghp_xxxxxxxxxxxxxxxxxxxx",
  },
  GITHUB_OWNER: {
    description: "GitHub repository owner (organization or username)",
    required: true,
    example: "my-org",
  },
  GITHUB_REPO: {
    description: "GitHub repository name",
    required: true,
    example: "my-repo",
  },
  GITHUB_API_ENDPOINT: {
    description: "GitHub API endpoint URL",
    required: false,
    default: "https://api.github.com",
    example: "https://api.github.com",
  },
  GEMINI_API_KEY: {
    description: "Google Gemini API key for AI analysis",
    required: true,
    example: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
  OPENAI_API_KEY: {
    description: "OpenAI API key (alternative to Gemini)",
    required: false,
    example: "sk-XXXXXXXXXXXXXXXXXXXXXXXX",
  },
  AI_PROVIDER: {
    description: "AI provider to use",
    required: false,
    default: "gemini",
    options: ["gemini", "openai"],
  },
  AI_MODEL: {
    description: "AI model name",
    required: false,
    default: "gemini-pro",
    example: "gemini-pro",
  },
  AI_MAX_TOKENS: {
    description: "Maximum tokens for AI responses",
    required: false,
    default: "2048",
    example: "2048",
  },
  AI_TEMPERATURE: {
    description: "AI temperature (0-2, lower = more deterministic)",
    required: false,
    default: "0.3",
    example: "0.3",
  },
  AI_TOP_P: {
    description: "AI topP parameter (0-1)",
    required: false,
    default: "0.8",
    example: "0.8",
  },
  AI_TOP_K: {
    description: "AI topK parameter",
    required: false,
    default: "40",
    example: "40",
  },
  COMPLEXITY_THRESHOLD_LOW: {
    description: "Low complexity threshold",
    required: false,
    default: "2",
    example: "2",
  },
  COMPLEXITY_THRESHOLD_MEDIUM: {
    description: "Medium complexity threshold",
    required: false,
    default: "4",
    example: "4",
  },
  COMPLEXITY_THRESHOLD_HIGH: {
    description: "High complexity threshold",
    required: false,
    default: "7",
    example: "7",
  },
  MAX_ANALYSIS_TIME: {
    description: "Maximum analysis time in milliseconds",
    required: false,
    default: "30000",
    example: "30000",
  },
  SUPPORTED_LABELS: {
    description: "Comma-separated list of supported labels",
    required: false,
    default: "bug,feature,enhancement,documentation,question,maintenance",
    example:
      "bug,feature,enhancement,documentation,question,maintenance,ui,backend,api",
  },
};
