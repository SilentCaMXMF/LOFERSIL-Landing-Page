import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { promises as fs } from 'fs';
import { config } from 'dotenv';
import { SecurityAuditLogger } from './security-utils.js';
import { 
  TelegramError, 
  TelegramValidationError, 
  TelegramRateLimitError, 
  TelegramApiError,
  ErrorHandler 
} from './errors.js';
import { messageConfig, rateLimitConfig, timeoutConfig, validationConfig } from './config.js';
import { MessageValidator } from './message-utils.js';

// Load environment variables from project root (absolute path for security)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../../');
config({ path: join(projectRoot, '.env') });

// TelegramError is now imported from './errors.js'

/**
 * Secure configuration interface for Telegram bot
 */
interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  idleTimeout: number;
  checkInterval: number;
  maxMessages: number;
  maxRetries: number;
  rateLimitMs: number;
  notificationDelayMs: number;
}

/**
 * JSON configuration file structure as documented in README
 */
interface TelegramJsonConfig {
  telegramIdle?: {
    enabled?: boolean;
    botToken?: string;
    chatId?: string;
    idleTimeout?: number;
    checkInterval?: number;
    maxMessages?: number;
    maxRetries?: number;
    rateLimitMs?: number;
    notificationDelayMs?: number;
  };
}

/**
 * Secure configuration manager for Telegram bot settings
 */
export class TelegramConfigManager {
  private static config: TelegramConfig | null = null;

  /**
   * Load and validate configuration from JSON file or environment variables
   */
  static async load(): Promise<TelegramConfig | null> {
    // Return cached config if already loaded
    if (this.config) {
      return this.config;
    }

    try {
      // Try to load from JSON file first
      let config = await this.loadFromJsonFile();
      let configSource = 'json';

      // Fall back to environment variables if JSON loading failed
      if (!config) {
        config = this.loadFromEnvironment();
        configSource = 'environment';
      }

      if (!config) {
        return null;
      }

      // Validate the loaded configuration
      if (!this.validateConfig(config)) {
        return null;
      }

      this.config = config;
      SecurityAuditLogger.info('telegram_config_loaded', {
        source: configSource,
        enabled: config.enabled,
        idleTimeout: config.idleTimeout,
        checkInterval: config.checkInterval,
      });
      return config;
    } catch (error) {
      SecurityAuditLogger.error('telegram_config_load_failed', { error: String(error) });
      return null;
    }
  }

  /**
   * Substitute environment variables in configuration values
   * Supports ${VAR_NAME} syntax
   */
  private static substituteEnvVars(value: string): string {
    return value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const envValue = process.env[varName];
      if (envValue === undefined) {
        SecurityAuditLogger.warn('telegram_config_env_var_missing', { 
          variable: varName,
          placeholder: match 
        });
        throw new Error(`Environment variable ${varName} is required but not set`);
      }
      return envValue;
    });
  }

  /**
   * Validate config file path to prevent directory traversal
   */
  private static validateConfigPath(configPath: string): string {
    // Normalize the path and resolve against the plugin directory
    const resolvedPath = join(__dirname, '..', configPath);
    
    // Ensure the resolved path is still within the plugin directory
    if (!resolvedPath.startsWith(join(__dirname, '..'))) {
      SecurityAuditLogger.error('telegram_config_path_traversal_attempt', { 
        requestedPath: configPath,
        resolvedPath 
      });
      throw new Error('Invalid configuration file path: directory traversal detected');
    }
    
    return resolvedPath;
  }

  /**
   * Load configuration from JSON file with environment variable substitution
   */
  private static async loadFromJsonFile(): Promise<TelegramConfig | null> {
    try {
      const configPath = this.validateConfigPath('telegram-config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const jsonConfig: TelegramJsonConfig = JSON.parse(configContent);

      if (!jsonConfig.telegramIdle) {
        SecurityAuditLogger.warn('telegram_json_config_missing_telegramIdle');
        return null;
      }

      const idleConfig = jsonConfig.telegramIdle;
      const config: TelegramConfig = {
        botToken: idleConfig.botToken ? this.substituteEnvVars(idleConfig.botToken) : '',
        chatId: idleConfig.chatId ? this.substituteEnvVars(idleConfig.chatId) : '',
        enabled: idleConfig.enabled ?? true,
        idleTimeout: idleConfig.idleTimeout ?? timeoutConfig.DEFAULT_IDLE_TIMEOUT,
        checkInterval: idleConfig.checkInterval ?? timeoutConfig.DEFAULT_CHECK_INTERVAL,
        maxMessages: idleConfig.maxMessages ?? timeoutConfig.DEFAULT_MAX_MESSAGES,
        maxRetries: idleConfig.maxRetries ?? timeoutConfig.DEFAULT_MAX_RETRIES,
        rateLimitMs: idleConfig.rateLimitMs ?? rateLimitConfig.DEFAULT_RATE_LIMIT_MS,
        notificationDelayMs: idleConfig.notificationDelayMs ?? timeoutConfig.DEFAULT_NOTIFICATION_DELAY
      };

      return config;
    } catch (error) {
      SecurityAuditLogger.warn('telegram_json_config_load_failed', { error: String(error) });
      return null;
    }
  }

  /**
   * Load configuration from environment variables (original implementation)
   */
  private static loadFromEnvironment(): TelegramConfig | null {
    try {
      const config: TelegramConfig = {
        botToken: this.getEnvVar('TELEGRAM_BOT_TOKEN', '', true),
        chatId: this.getEnvVar('TELEGRAM_CHAT_ID', '', true),
        enabled: this.getEnvVar('TELEGRAM_ENABLED', true),
        idleTimeout: this.getEnvVar('TELEGRAM_IDLE_TIMEOUT', timeoutConfig.DEFAULT_IDLE_TIMEOUT),
        checkInterval: this.getEnvVar('TELEGRAM_CHECK_INTERVAL', timeoutConfig.DEFAULT_CHECK_INTERVAL),
        maxMessages: this.getEnvVar('TELEGRAM_MAX_MESSAGES', timeoutConfig.DEFAULT_MAX_MESSAGES),
        maxRetries: this.getEnvVar('TELEGRAM_MAX_RETRIES', timeoutConfig.DEFAULT_MAX_RETRIES),
        rateLimitMs: this.getEnvVar('TELEGRAM_RATE_LIMIT_MS', rateLimitConfig.DEFAULT_RATE_LIMIT_MS),
        notificationDelayMs: this.getEnvVar('TELEGRAM_NOTIFICATION_DELAY_MS', timeoutConfig.DEFAULT_NOTIFICATION_DELAY),
      };
      return config;
    } catch (error) {
      SecurityAuditLogger.error('telegram_env_config_load_failed', { error: String(error) });
      return null;
    }
  }

  /**
   * Get environment variable with type validation
   */
  private static getEnvVar<T>(name: string, defaultValue: T, required: boolean = false): T {
    const value = process.env[name];
    
    if (value === undefined) {
      if (required) {
        throw new Error(`Required environment variable ${name} is missing`);
      }
      return defaultValue;
    }

    // Type conversion based on default value type
    if (typeof defaultValue === 'boolean') {
      return (value.toLowerCase() === 'true') as T;
    }
    
    if (typeof defaultValue === 'number') {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        if (process.env.TELEGRAM_DEBUG === 'true') {
          console.warn(`Invalid number value for ${name}, using default: ${defaultValue}`);
        }
        return defaultValue;
      }
      return parsed as T;
    }
    
    return value.trim() as T;
  }

  /**
   * Validate configuration values
   */
  private static validateConfig(config: TelegramConfig): boolean {
    // Validate bot token format using centralized validator
    if (!MessageValidator.validateBotToken(config.botToken)) {
      throw new TelegramValidationError('Invalid bot token format', 'botToken', config.botToken);
    }

    // Validate chat ID using centralized validator
    if (!MessageValidator.validateChatId(config.chatId)) {
      throw new TelegramValidationError('Invalid chat ID format', 'chatId', config.chatId);
    }

    // Validate timeouts
    if (config.idleTimeout < validationConfig.MIN_IDLE_TIMEOUT || config.idleTimeout > validationConfig.MAX_IDLE_TIMEOUT) {
      if (process.env.TELEGRAM_DEBUG === 'true') {
        console.warn(`⚠️ Idle timeout outside recommended range (${validationConfig.MIN_IDLE_TIMEOUT}-${validationConfig.MAX_IDLE_TIMEOUT}ms), using default: ${timeoutConfig.DEFAULT_IDLE_TIMEOUT}ms`);
      }
      config.idleTimeout = timeoutConfig.DEFAULT_IDLE_TIMEOUT;
    }

    if (config.checkInterval < validationConfig.MIN_CHECK_INTERVAL || config.checkInterval > validationConfig.MAX_CHECK_INTERVAL) {
      if (process.env.TELEGRAM_DEBUG === 'true') {
        console.warn(`⚠️ Check interval outside recommended range (${validationConfig.MIN_CHECK_INTERVAL}-${validationConfig.MAX_CHECK_INTERVAL}ms), using default: ${timeoutConfig.DEFAULT_CHECK_INTERVAL}ms`);
      }
      config.checkInterval = timeoutConfig.DEFAULT_CHECK_INTERVAL;
    }

    if (config.rateLimitMs < validationConfig.MIN_RATE_LIMIT || config.rateLimitMs > validationConfig.MAX_RATE_LIMIT) {
      if (process.env.TELEGRAM_DEBUG === 'true') {
        console.warn(`⚠️ Rate limit outside recommended range (${validationConfig.MIN_RATE_LIMIT}-${validationConfig.MAX_RATE_LIMIT}ms), using default: ${rateLimitConfig.DEFAULT_RATE_LIMIT_MS}ms`);
      }
      config.rateLimitMs = rateLimitConfig.DEFAULT_RATE_LIMIT_MS;
    }

    return true;
  }

  /**
   * Clear cached configuration (useful for testing)
   */
  static clearCache(): void {
    this.config = null;
  }
}

export default class SimpleTelegramBot {
  private static instance: SimpleTelegramBot | null = null;
  private chatId: string;
  private token: string;
  private domPurify: any;

  // Rate limiting properties
  private lastMessageTime: number = 0;
  private messageCount: number = 0;
  private readonly rateLimitWindow: number = rateLimitConfig.RATE_LIMIT_WINDOW;
  private readonly maxMessagesPerWindow: number = rateLimitConfig.MAX_MESSAGES_PER_WINDOW;
  private readonly minIntervalMs: number = rateLimitConfig.MIN_INTERVAL_MS;

  private constructor(token: string, chatId: string) {
    this.token = token;
    this.chatId = chatId;

    // Initialize DOMPurify for server-side usage
    try {
      // Server-side: create JSDOM instance for DOMPurify
      const window = new JSDOM('').window;
      this.domPurify = (DOMPurify as any)(window);
    } catch (error) {
      if (process.env.TELEGRAM_DEBUG === 'true') {
        console.warn('DOMPurify initialization failed, falling back to basic sanitization');
      }
      this.domPurify = null;
    }

    SecurityAuditLogger.info('telegram_bot_initialized');
  }

  static async create() {
    // Return existing instance if already created
    if (this.instance) {
      return this.instance;
    }

    // Load configuration securely
    const config = await TelegramConfigManager.load();
    if (!config || !config.enabled) {
      SecurityAuditLogger.warn('telegram_bot_creation_skipped', {
        reason: 'disabled_or_invalid_config',
      });
      return null;
    }

    // Create new instance with validated configuration
    this.instance = new SimpleTelegramBot(config.botToken, config.chatId);
    return this.instance;
  }

  async sendMessage(text: string): Promise<boolean> {
    // Use centralized validation
    const validation = MessageValidator.validateMessage(text);
    if (!validation.isValid) {
      const errorContext = ErrorHandler.createErrorContext('message_validation', { 
        errors: validation.errors 
      });
      SecurityAuditLogger.warn('telegram_message_validation_failed', errorContext);
      throw new TelegramValidationError(
        `Message validation failed: ${validation.errors.join(', ')}`,
        'content',
        validation.errors
      );
    }

    // Apply rate limiting
    const now = Date.now();
    if (now - this.lastMessageTime < this.minIntervalMs) {
      const errorContext = ErrorHandler.createErrorContext('rate_limit', { 
        reason: 'min_interval',
        timeSinceLastMessage: now - this.lastMessageTime,
        minInterval: this.minIntervalMs
      });
      SecurityAuditLogger.warn('telegram_rate_limit_exceeded', errorContext);
      throw new TelegramRateLimitError();
    }

    // Reset counter if window has passed
    if (now - this.lastMessageTime > this.rateLimitWindow) {
      this.messageCount = 0;
    }

    // Check message count limit
    if (this.messageCount >= this.maxMessagesPerWindow) {
      const errorContext = ErrorHandler.createErrorContext('rate_limit', { 
        reason: 'max_messages_per_window',
        currentCount: this.messageCount,
        maxMessages: this.maxMessagesPerWindow
      });
      SecurityAuditLogger.warn('telegram_rate_limit_exceeded', errorContext);
      throw new TelegramRateLimitError();
    }

    // Sanitize message content using centralized validator
    const sanitizedText = MessageValidator.sanitizeMessage(text);
    const url = `https://api.telegram.org/bot${this.token}/sendMessage`;

    try {
      SecurityAuditLogger.info('telegram_message_send_attempt', {
        messageLength: sanitizedText.length,
        hasHtml: sanitizedText.includes('<'),
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: sanitizedText,
          parse_mode: 'HTML', // Enable HTML parsing for better formatting
        }),
        signal: AbortSignal.timeout(timeoutConfig.HTTP_TIMEOUT),
      });

      if (!response.ok) {
        // Extract error details without exposing sensitive information
        const isRetryable = response.status >= 500 || response.status === 429;
        const errorContext = ErrorHandler.createErrorContext('api_call', {
          statusCode: response.status,
          statusText: response.statusText,
          isRetryable
        });
        SecurityAuditLogger.error('telegram_api_error', errorContext);
        throw new TelegramApiError(
          'Message delivery failed: service temporarily unavailable',
          response.status,
          isRetryable,
          errorContext
        );
      }

      // Update rate limiting counters on success
      this.lastMessageTime = now;
      this.messageCount++;

      SecurityAuditLogger.info('telegram_message_sent_successfully');
      return true;
    } catch (error) {
      if (error instanceof TelegramError) {
        const errorContext = ErrorHandler.sanitizeErrorForLogging(error);
        SecurityAuditLogger.error('telegram_operation_failed', errorContext);
        // Re-throw for upstream handling
        throw error;
      } else {
        const unexpectedError = new TelegramError(
          'Unexpected telegram operation failure',
          'UNEXPECTED_ERROR',
          false,
          ErrorHandler.createErrorContext('unexpected_error', {
            originalError: error instanceof Error ? error.message : String(error),
            errorType: error instanceof Error ? error.constructor.name : typeof error
          })
        );
        const errorContext = ErrorHandler.sanitizeErrorForLogging(unexpectedError);
        SecurityAuditLogger.error('telegram_unexpected_error', errorContext);
        throw unexpectedError;
      }
    }
  }



  async init(): Promise<void> {
    // Initialize the bot (currently no-op, but can be extended for future features)
    SecurityAuditLogger.info('telegram_bot_init_called');
  }

  cleanup(): void {
    // Clear the singleton instance and any resources
    SimpleTelegramBot.instance = null;
    SecurityAuditLogger.info('telegram_bot_cleanup_called');
  }

  resetActivity() {
    // Reset rate limiting counters when user activity is detected
    SecurityAuditLogger.info('telegram_activity_reset');
  }

  getNotificationDelay(): number {
    // Access the cached config to get the notification delay
    const config = TelegramConfigManager['config'];
    return config?.notificationDelayMs ?? timeoutConfig.DEFAULT_NOTIFICATION_DELAY;
  }
}
