/**
 * EnvironmentLoader - Simple configuration loader
 * Handles loading configuration for the application
 */

/**
 * Environment configuration interface
 */
interface EnvironmentConfig {
  [key: string]: string | undefined;
}

/**
 * EnvironmentLoader class for managing configuration
 */
export class EnvironmentLoader {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Load configuration from window.ENV if available
   */
  private loadConfiguration(): EnvironmentConfig {
    const config: EnvironmentConfig = {};

    if (typeof window !== "undefined" && (window as any).ENV) {
      Object.assign(config, (window as any).ENV);
    }

    return config;
  }

  /**
   * Get configuration value
   */
  get(key: string): string | undefined {
    return this.config[key];
  }

  /**
   * Get configuration value with fallback
   */
  getWithFallback(key: string, fallback: string): string {
    return this.config[key] ?? fallback;
  }

  /**
   * Get all configuration
   */
  getAll(): EnvironmentConfig {
    return { ...this.config };
  }
}

// Global instance
export const envLoader = new EnvironmentLoader();
