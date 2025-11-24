/**
 * EnvironmentLoader - Secure environment variable loading
 * Handles loading and validation of environment variables for the application
 */

/**
 * Environment configuration interface
 */
interface EnvironmentConfig {
  NODE_ENV?: string;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  GOOGLE_ANALYTICS_ID?: string;
  MCP_API_KEY?: string;
  MCP_SERVER_URL?: string;
  ENABLE_MCP_INTEGRATION?: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  EMAILJS_SERVICE_ID?: string;
  EMAILJS_TEMPLATE_ID?: string;
  EMAILJS_PUBLIC_KEY?: string;
  CONTACT_API_ENDPOINT?: string;
  [key: string]: string | undefined;
}

/**
 * Required environment variables
 * Note: API keys are optional for basic site functionality
 */
const REQUIRED_ENV_VARS: readonly string[] = [];

/**
 * Default environment values
 */
const DEFAULT_ENV_VALUES: Partial<EnvironmentConfig> = {
  NODE_ENV: 'development',
  ENABLE_MCP_INTEGRATION: 'false',
  MCP_SERVER_URL: 'ws://localhost:3000',
};

/**
 * EnvironmentLoader class for managing environment variables
 */
export class EnvironmentLoader {
  private config: EnvironmentConfig;
  private loaded = false;

  constructor() {
    this.config = this.loadEnvironmentVariables();
    this.validateRequiredAndThrow();
    this.loaded = true;
  }

  /**
   * Load environment variables from various sources
   */
  private loadEnvironmentVariables(): EnvironmentConfig {
    const config: EnvironmentConfig = { ...DEFAULT_ENV_VALUES };

    // In browser environment, try to load from global window object
    // This assumes env vars are injected at build time or loaded via script
    if (typeof window !== 'undefined' && (window as any).ENV) {
      Object.assign(config, (window as any).ENV);
    }

    // For Node.js environment (build time)
    if (typeof process !== 'undefined' && process.env) {
      Object.assign(config, process.env as Partial<EnvironmentConfig>);
    }

    return config;
  }

  /**
   * Get environment variable value
   */
  get(key: keyof EnvironmentConfig): string | undefined {
    return this.config[key];
  }

  /**
   * Get environment variable with fallback
   */
  getWithFallback(key: keyof EnvironmentConfig, fallback: string): string {
    return this.config[key] || fallback;
  }

  /**
   * Get required environment variable (throws if missing)
   */
  getRequired(key: keyof EnvironmentConfig): string {
    const value = this.config[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this.config.NODE_ENV !== 'production';
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  /**
   * Validate required environment variables
   */
  validateRequired(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const varName of REQUIRED_ENV_VARS) {
      if (!this.config[varName]) {
        missing.push(varName);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Validate required environment variables and throw if any are missing
   */
  private validateRequiredAndThrow(): void {
    const validation = this.validateRequired();
    if (!validation.valid) {
      const errorMessage = `Missing required environment variables: ${validation.missing.join(', ')}

To fix this issue:

1. Create a .env file in your project root with the following variables:
${validation.missing.map(v => `${v}=your_${v.toLowerCase()}_here`).join('\n')}

2. Or set them in your environment:
${validation.missing.map(v => `export ${v}=your_value_here`).join('\n')}

3. Or configure them in your deployment platform

Current environment: ${this.config.NODE_ENV || 'unknown'}
Available variables: ${
        Object.keys(this.config)
          .filter(k => REQUIRED_ENV_VARS.includes(k as any))
          .join(', ') || 'none'
      }`;

      throw new Error(errorMessage);
    }
  }

  /**
   * Get all configuration
   */
  getAll(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Check if optional API keys are available
   */
  hasApiKeys(): { openai: boolean; gemini: boolean } {
    return {
      openai: !!this.config.OPENAI_API_KEY,
      gemini: !!this.config.GEMINI_API_KEY,
    };
  }

  /**
   * Check if environment is loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }
}

// Global instance
export const envLoader = new EnvironmentLoader();
