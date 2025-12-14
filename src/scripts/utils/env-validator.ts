/**
 * LOFERSIL Landing Page - Environment Variable Validator
 * Comprehensive environment variable validation for email configuration
 */

import type { SMTPConfig, ValidationResult } from "./email-config.js";
import { envLoader } from "../modules/EnvironmentLoader.js";
import { ErrorManager } from "../modules/ErrorManager.js";

/**
 * Environment validation result interface
 */
export interface EnvironmentValidationResult extends ValidationResult {
  missingVariables: string[];
  invalidVariables: string[];
  warnings: string[];
  environment: string;
  smtpConfig?: SMTPConfig;
}

/**
 * Email environment configuration interface
 */
export interface EmailEnvironmentConfig {
  from?: string;
  to?: string[];
  replyTo?: string;
  subjectPrefix?: string;
  timeout?: number;
  retryAttempts?: number;
  testMode?: boolean;
  logLevel?: "debug" | "info" | "warn" | "error";
}

/**
 * Default values for optional email environment variables
 */
const DEFAULT_EMAIL_VALUES: EmailEnvironmentConfig = {
  timeout: 30000,
  retryAttempts: 3,
  testMode: false,
  logLevel: "info",
  subjectPrefix: "[LOFERSIL]",
};

/**
 * Required SMTP environment variables
 */
const REQUIRED_SMTP_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
] as const;

/**
 * Optional but recommended email environment variables
 */
const OPTIONAL_EMAIL_VARS = [
  "FROM_EMAIL",
  "TO_EMAIL",
  "EMAIL_REPLY_TO",
  "EMAIL_SUBJECT_PREFIX",
  "SMTP_TIMEOUT",
  "SMTP_RETRY_ATTEMPTS",
  "EMAIL_TEST_MODE",
  "EMAIL_LOG_LEVEL",
] as const;

/**
 * Environment variable validation patterns
 */
const VALIDATION_PATTERNS = {
  email:
    /^[a-zA-Z0-9](?!.*\.\.)[a-zA-Z0-9._%+-]{0,63}[a-zA-Z0-9]@[a-zA-Z0-9](?!.*\.\.)[a-zA-Z0-9.-]{0,251}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
  port: /^\d+$/,
  timeout: /^\d+$/,
  retryAttempts: /^\d+$/,
  boolean: /^(true|false)$/i,
  logLevel: /^(debug|info|warn|error)$/i,
} as const;

/**
 * Environment Variable Validator class
 */
export class EnvironmentValidator {
  private errorManager: ErrorManager;
  private validationCache: Map<string, EnvironmentValidationResult> = new Map();

  constructor(errorManager?: ErrorManager) {
    this.errorManager =
      errorManager ||
      new ErrorManager({
        logToConsole: true,
        showUserMessages: false,
      });
  }

  /**
   * Validate email environment variables
   */
  public validateEmailEnvironment(): EnvironmentValidationResult {
    const cacheKey = this.generateCacheKey();

    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    // Cache all environment variables to avoid redundant calls
    const envVars = this.cacheEnvironmentVariables();
    const environment = envVars.NODE_ENV || "development";
    const result: EnvironmentValidationResult = {
      isValid: true,
      missingVariables: [],
      invalidVariables: [],
      warnings: [],
      environment,
    };

    try {
      // Check required SMTP variables
      this.validateRequiredVariablesWithCache(result, envVars);

      // Check optional variables and apply defaults
      this.validateOptionalVariablesWithCache(result, envVars);

      // Validate variable formats
      this.validateVariableFormatsWithCache(result, envVars);

      // Create SMTP configuration if all required variables are present
      if (result.missingVariables.length === 0) {
        result.smtpConfig = this.createSmtpConfigWithCache(envVars);
      }

      // Environment-specific validations
      this.validateEnvironmentSpecificWithCache(result, environment, envVars);

      // Set overall validity
      result.isValid =
        result.missingVariables.length === 0 &&
        result.invalidVariables.length === 0;

      // Log validation results
      this.logValidationResults(result);
    } catch (error) {
      this.errorManager.handleError(error, "Environment validation failed", {
        component: "EnvironmentValidator",
        operation: "validateEmailEnvironment",
        timestamp: new Date(),
      });

      result.isValid = false;
      result.error =
        error instanceof Error ? error.message : "Unknown validation error";
    }

    this.validationCache.set(cacheKey, result);
    return result;
  }

  /**
   * Get SMTP configuration from environment variables
   */
  public getSmtpConfig(): SMTPConfig | null {
    const validation = this.validateEmailEnvironment();

    if (!validation.isValid || !validation.smtpConfig) {
      return null;
    }

    return validation.smtpConfig;
  }

  /**
   * Check if email test mode is enabled
   */
  public isEmailTestMode(): boolean {
    const testMode = envLoader.get("EMAIL_TEST_MODE");
    return testMode?.toLowerCase() === "true" || DEFAULT_EMAIL_VALUES.testMode!;
  }

  /**
   * Validate email format
   */
  public validateEmailFormat(email: string): boolean {
    if (!email || typeof email !== "string") {
      return false;
    }

    return VALIDATION_PATTERNS.email.test(email.trim());
  }

  /**
   * Check for required environment variables and return missing ones
   */
  public checkRequiredEmailVars(): string[] {
    const missing: string[] = [];

    for (const varName of REQUIRED_SMTP_VARS) {
      const value = envLoader.get(varName);
      if (!value || value.trim() === "") {
        missing.push(varName);
      }
    }

    return missing;
  }

  /**
   * Get email environment configuration
   */
  public getEmailEnvironmentConfig(): EmailEnvironmentConfig {
    return {
      from: envLoader.get("FROM_EMAIL"),
      to: envLoader.get("TO_EMAIL") ? [envLoader.get("TO_EMAIL")!] : undefined,
      replyTo: envLoader.get("EMAIL_REPLY_TO"),
      subjectPrefix: envLoader.getWithFallback(
        "EMAIL_SUBJECT_PREFIX",
        DEFAULT_EMAIL_VALUES.subjectPrefix!,
      ),
      timeout: this.parseNumericVar(
        "SMTP_TIMEOUT",
        DEFAULT_EMAIL_VALUES.timeout!,
      ),
      retryAttempts: this.parseNumericVar(
        "SMTP_RETRY_ATTEMPTS",
        DEFAULT_EMAIL_VALUES.retryAttempts!,
      ),
      testMode: this.isEmailTestMode(),
      logLevel:
        this.parseLogLevel(envLoader.get("EMAIL_LOG_LEVEL")) ||
        DEFAULT_EMAIL_VALUES.logLevel!,
    };
  }

  /**
   * Clear validation cache
   */
  public clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Cache all relevant environment variables to avoid redundant calls
   */
  private cacheEnvironmentVariables(): Record<string, string | undefined> {
    const allVars = [
      "NODE_ENV",
      ...REQUIRED_SMTP_VARS,
      ...OPTIONAL_EMAIL_VARS,
      "SMTP_SECURE",
    ];

    const cached: Record<string, string | undefined> = {};
    for (const varName of allVars) {
      cached[varName] = envLoader.get(varName);
    }
    return cached;
  }

  /**
   * Validate required SMTP variables using cached values
   */
  private validateRequiredVariablesWithCache(
    result: EnvironmentValidationResult,
    envVars: Record<string, string | undefined>,
  ): void {
    for (const varName of REQUIRED_SMTP_VARS) {
      const value = envVars[varName];
      if (!value || value.trim() === "") {
        result.missingVariables.push(varName);
      }
    }

    if (result.missingVariables.length > 0) {
      result.warnings.push(
        `Missing required SMTP variables: ${result.missingVariables.join(", ")}`,
      );
    }
  }

  /**
   * Validate optional variables using cached values
   */
  private validateOptionalVariablesWithCache(
    result: EnvironmentValidationResult,
    envVars: Record<string, string | undefined>,
  ): void {
    for (const varName of OPTIONAL_EMAIL_VARS) {
      const value = envVars[varName];

      if (!value || value.trim() === "") {
        // Variable is missing but optional, just log a warning
        if (varName === "FROM_EMAIL") {
          result.warnings.push(
            `FROM_EMAIL not set, will use SMTP_USER as fallback`,
          );
        } else if (varName === "TO_EMAIL") {
          result.warnings.push(
            `TO_EMAIL not set, will use FROM_EMAIL as fallback`,
          );
        }
      } else {
        // Variable exists, validate its format
        if (!this.validateVariableFormat(varName, value)) {
          result.invalidVariables.push(varName);
        }
      }
    }
  }

  /**
   * Validate variable formats using cached values
   */
  private validateVariableFormatsWithCache(
    result: EnvironmentValidationResult,
    envVars: Record<string, string | undefined>,
  ): void {
    // Validate email formats
    const emailVars = ["SMTP_USER", "FROM_EMAIL", "TO_EMAIL", "EMAIL_REPLY_TO"];
    for (const varName of emailVars) {
      const value = envVars[varName];
      if (value && !this.validateEmailFormat(value)) {
        result.invalidVariables.push(varName);
        result.warnings.push(`Invalid email format for ${varName}: ${value}`);
      }
    }

    // Validate numeric formats
    const numericVars = ["SMTP_PORT", "SMTP_TIMEOUT", "SMTP_RETRY_ATTEMPTS"];
    for (const varName of numericVars) {
      const value = envVars[varName];
      if (value && !VALIDATION_PATTERNS.timeout.test(value)) {
        result.invalidVariables.push(varName);
        result.warnings.push(`Invalid numeric format for ${varName}: ${value}`);
      }
    }

    // Validate boolean formats
    const booleanVars = ["EMAIL_TEST_MODE"];
    for (const varName of booleanVars) {
      const value = envVars[varName];
      if (value && !VALIDATION_PATTERNS.boolean.test(value)) {
        result.invalidVariables.push(varName);
        result.warnings.push(`Invalid boolean format for ${varName}: ${value}`);
      }
    }
  }

  /**
   * Create SMTP configuration using cached values
   */
  private createSmtpConfigWithCache(
    envVars: Record<string, string | undefined>,
  ): SMTPConfig {
    const host = envVars.SMTP_HOST;
    const port = envVars.SMTP_PORT;
    const user = envVars.SMTP_USER;
    const pass = envVars.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      throw new Error("Missing required SMTP configuration variables");
    }

    return {
      host,
      port: parseInt(port),
      secure: (envVars.SMTP_SECURE || "false") === "true",
      auth: {
        user,
        pass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14,
      timeout: this.parseNumericVarWithCache(
        "SMTP_TIMEOUT",
        DEFAULT_EMAIL_VALUES.timeout!,
        envVars,
      ),
    };
  }

  /**
   * Validate environment-specific configurations using cached values
   */
  private validateEnvironmentSpecificWithCache(
    result: EnvironmentValidationResult,
    environment: string,
    envVars: Record<string, string | undefined>,
  ): void {
    if (environment === "production") {
      // Production-specific validations
      const smtpHost = envVars.SMTP_HOST;
      if (
        smtpHost &&
        (smtpHost.includes("localhost") || smtpHost.includes("127.0.0.1"))
      ) {
        result.warnings.push("Using localhost SMTP in production environment");
      }

      const smtpPort = envVars.SMTP_PORT;
      if (smtpPort === "25" || smtpPort === "587") {
        result.warnings.push(
          "Using unencrypted SMTP in production environment",
        );
      }
    } else if (environment === "development") {
      // Development-specific validations
      const testMode = envVars.EMAIL_TEST_MODE;
      if (!testMode || testMode.toLowerCase() !== "true") {
        result.warnings.push("EMAIL_TEST_MODE is not enabled in development");
      }
    }
  }

  /**
   * Parse numeric environment variable with fallback using cached values
   */
  private parseNumericVarWithCache(
    varName: string,
    fallback: number,
    envVars: Record<string, string | undefined>,
  ): number {
    const value = envVars[varName];
    if (!value) return fallback;

    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Validate required SMTP variables
   */
  private validateRequiredVariables(result: EnvironmentValidationResult): void {
    const missing = this.checkRequiredEmailVars();
    result.missingVariables.push(...missing);

    if (missing.length > 0) {
      result.warnings.push(
        `Missing required SMTP variables: ${missing.join(", ")}`,
      );
    }
  }

  /**
   * Validate optional variables and apply defaults
   */
  private validateOptionalVariables(result: EnvironmentValidationResult): void {
    for (const varName of OPTIONAL_EMAIL_VARS) {
      const value = envLoader.get(varName);

      if (!value || value.trim() === "") {
        // Variable is missing but optional, just log a warning
        if (varName === "FROM_EMAIL") {
          result.warnings.push(
            `FROM_EMAIL not set, will use SMTP_USER as fallback`,
          );
        } else if (varName === "TO_EMAIL") {
          result.warnings.push(
            `TO_EMAIL not set, will use FROM_EMAIL as fallback`,
          );
        }
      } else {
        // Variable exists, validate its format
        if (!this.validateVariableFormat(varName, value)) {
          result.invalidVariables.push(varName);
        }
      }
    }
  }

  /**
   * Validate variable formats
   */
  private validateVariableFormats(result: EnvironmentValidationResult): void {
    // Validate email formats
    const emailVars = ["SMTP_USER", "FROM_EMAIL", "TO_EMAIL", "EMAIL_REPLY_TO"];
    for (const varName of emailVars) {
      const value = envLoader.get(varName);
      if (value && !this.validateEmailFormat(value)) {
        result.invalidVariables.push(varName);
        result.warnings.push(`Invalid email format for ${varName}: ${value}`);
      }
    }

    // Validate numeric formats
    const numericVars = ["SMTP_PORT", "SMTP_TIMEOUT", "SMTP_RETRY_ATTEMPTS"];
    for (const varName of numericVars) {
      const value = envLoader.get(varName);
      if (value && !VALIDATION_PATTERNS.timeout.test(value)) {
        result.invalidVariables.push(varName);
        result.warnings.push(`Invalid numeric format for ${varName}: ${value}`);
      }
    }

    // Validate boolean formats
    const booleanVars = ["EMAIL_TEST_MODE"];
    for (const varName of booleanVars) {
      const value = envLoader.get(varName);
      if (value && !VALIDATION_PATTERNS.boolean.test(value)) {
        result.invalidVariables.push(varName);
        result.warnings.push(`Invalid boolean format for ${varName}: ${value}`);
      }
    }
  }

  /**
   * Validate environment-specific configurations
   */
  private validateEnvironmentSpecific(
    result: EnvironmentValidationResult,
    environment: string,
  ): void {
    if (environment === "production") {
      // Production-specific validations
      const smtpHost = envLoader.get("SMTP_HOST");
      if (
        smtpHost &&
        (smtpHost.includes("localhost") || smtpHost.includes("127.0.0.1"))
      ) {
        result.warnings.push("Using localhost SMTP in production environment");
      }

      const smtpPort = envLoader.get("SMTP_PORT");
      if (smtpPort === "25" || smtpPort === "587") {
        result.warnings.push(
          "Using unencrypted SMTP in production environment",
        );
      }
    } else if (environment === "development") {
      // Development-specific validations
      if (!this.isEmailTestMode()) {
        result.warnings.push("EMAIL_TEST_MODE is not enabled in development");
      }
    }
  }

  /**
   * Create SMTP configuration from environment variables
   */
  private createSmtpConfig(): SMTPConfig {
    const host = envLoader.get("SMTP_HOST");
    const port = envLoader.get("SMTP_PORT");
    const user = envLoader.get("SMTP_USER");
    const pass = envLoader.get("SMTP_PASS");

    if (!host || !port || !user || !pass) {
      throw new Error("Missing required SMTP configuration variables");
    }

    return {
      host,
      port: parseInt(port),
      secure: envLoader.getWithFallback("SMTP_SECURE", "false") === "true",
      auth: {
        user,
        pass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 14,
      timeout: this.parseNumericVar(
        "SMTP_TIMEOUT",
        DEFAULT_EMAIL_VALUES.timeout!,
      ),
    };
  }

  /**
   * Validate individual variable format
   */
  private validateVariableFormat(varName: string, value: string): boolean {
    switch (varName) {
      case "SMTP_USER":
      case "FROM_EMAIL":
      case "TO_EMAIL":
      case "EMAIL_REPLY_TO":
        return this.validateEmailFormat(value);

      case "SMTP_PORT":
      case "SMTP_TIMEOUT":
      case "SMTP_RETRY_ATTEMPTS":
        return VALIDATION_PATTERNS.timeout.test(value);

      case "EMAIL_TEST_MODE":
        return VALIDATION_PATTERNS.boolean.test(value);

      case "EMAIL_LOG_LEVEL":
        return VALIDATION_PATTERNS.logLevel.test(value);

      default:
        return true; // Unknown variables are considered valid
    }
  }

  /**
   * Parse numeric environment variable with fallback
   */
  private parseNumericVar(varName: string, fallback: number): number {
    const value = envLoader.get(varName);
    if (!value) return fallback;

    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Parse log level environment variable
   */
  private parseLogLevel(
    value: string | undefined,
  ): "debug" | "info" | "warn" | "error" | null {
    if (!value) return null;

    const normalized = value.toLowerCase();
    switch (normalized) {
      case "debug":
        return "debug";
      case "info":
        return "info";
      case "warn":
        return "warn";
      case "error":
        return "error";
      default:
        return null;
    }
  }

  /**
   * Log validation results
   */
  private logValidationResults(result: EnvironmentValidationResult): void {
    if (result.isValid) {
      console.log("✅ Environment validation passed");

      if (result.warnings.length > 0) {
        console.warn("⚠️  Environment validation warnings:");
        result.warnings.forEach((warning) => console.warn(`   - ${warning}`));
      }
    } else {
      console.error("❌ Environment validation failed");

      if (result.missingVariables.length > 0) {
        console.error("Missing variables:");
        result.missingVariables.forEach((variable) =>
          console.error(`   - ${variable}`),
        );
      }

      if (result.invalidVariables.length > 0) {
        console.error("Invalid variables:");
        result.invalidVariables.forEach((variable) =>
          console.error(`   - ${variable}`),
        );
      }

      if (result.error) {
        console.error(`Validation error: ${result.error}`);
      }
    }
  }

  /**
   * Generate cache key based on current environment
   */
  private generateCacheKey(): string {
    const smtpHost = envLoader.get("SMTP_HOST") || "";
    const smtpPort = envLoader.get("SMTP_PORT") || "";
    const smtpUser = envLoader.get("SMTP_USER") || "";
    const environment = envLoader.get("NODE_ENV") || "development";

    return `${environment}:${smtpHost}:${smtpPort}:${smtpUser}`;
  }
}

// Export singleton instance
export const envValidator = new EnvironmentValidator();

// Export utility functions for convenience
export const validateEmailEnvironment = () =>
  envValidator.validateEmailEnvironment();
export const getSmtpConfig = () => envValidator.getSmtpConfig();
export const getEmailEnvironmentConfig = () =>
  envValidator.getEmailEnvironmentConfig();
export const isEmailTestMode = () => envValidator.isEmailTestMode();
export const validateEmailFormat = (email: string) =>
  envValidator.validateEmailFormat(email);
export const checkRequiredEmailVars = () =>
  envValidator.checkRequiredEmailVars();
