import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { SecurityAuditLogger } from './security-utils.js';
/**
 * Custom error class for Telegram bot operations
 * Provides security-conscious error messages that don't leak sensitive information
 */
export class TelegramError extends Error {
    code;
    isRetryable;
    constructor(message, code, isRetryable = false) {
        super(message);
        this.code = code;
        this.isRetryable = isRetryable;
        this.name = 'TelegramError';
    }
}
/**
 * Secure configuration manager for Telegram bot settings
 */
export class TelegramConfigManager {
    static config = null;
    /**
     * Load and validate configuration from environment variables
     */
    static load() {
        // Return cached config if already loaded
        if (this.config) {
            return this.config;
        }
        try {
            const config = {
                botToken: this.getRequiredEnvVar('TELEGRAM_BOT_TOKEN'),
                chatId: this.getRequiredEnvVar('TELEGRAM_CHAT_ID'),
                enabled: this.getBooleanEnvVar('TELEGRAM_ENABLED', true),
                idleTimeout: this.getNumberEnvVar('TELEGRAM_IDLE_TIMEOUT', 300000), // 5 minutes
                checkInterval: this.getNumberEnvVar('TELEGRAM_CHECK_INTERVAL', 30000), // 30 seconds
                maxRetries: this.getNumberEnvVar('TELEGRAM_MAX_RETRIES', 3),
                rateLimitMs: this.getNumberEnvVar('TELEGRAM_RATE_LIMIT_MS', 1000), // 1 second
            };
            // Validate the loaded configuration
            if (!this.validateConfig(config)) {
                return null;
            }
            this.config = config;
            SecurityAuditLogger.info('telegram_config_loaded', {
                enabled: config.enabled,
                idleTimeout: config.idleTimeout,
                checkInterval: config.checkInterval,
            });
            return config;
        }
        catch (error) {
            SecurityAuditLogger.error('telegram_config_load_failed', { error: String(error) });
            return null;
        }
    }
    /**
     * Get required environment variable with validation
     */
    static getRequiredEnvVar(name) {
        const value = process.env[name];
        if (!value || typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`Required environment variable ${name} is missing or empty`);
        }
        return value.trim();
    }
    /**
     * Get optional boolean environment variable
     */
    static getBooleanEnvVar(name, defaultValue) {
        const value = process.env[name];
        if (value === undefined)
            return defaultValue;
        return value.toLowerCase() === 'true';
    }
    /**
     * Get optional number environment variable
     */
    static getNumberEnvVar(name, defaultValue) {
        const value = process.env[name];
        if (value === undefined)
            return defaultValue;
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
            console.warn(`Invalid number value for ${name}, using default: ${defaultValue}`);
            return defaultValue;
        }
        return parsed;
    }
    /**
     * Validate configuration values
     */
    static validateConfig(config) {
        // Validate bot token format
        if (!config.botToken.match(/^\d+:[a-zA-Z0-9_-]{35}$/)) {
            SecurityAuditLogger.error('telegram_config_validation_failed', {
                reason: 'invalid_token_format',
            });
            return false;
        }
        // Validate chat ID format
        if (!config.chatId.match(/^-?\d+$/) || config.chatId.length < 5 || config.chatId.length > 15) {
            SecurityAuditLogger.error('telegram_config_validation_failed', { reason: 'invalid_chat_id' });
            return false;
        }
        // Validate numeric constraints
        if (config.idleTimeout < 60000 || config.idleTimeout > 3600000) {
            console.warn('⚠️ Idle timeout outside recommended range (1-60 minutes), using default');
            config.idleTimeout = 300000;
        }
        if (config.checkInterval < 5000 || config.checkInterval > 300000) {
            console.warn('⚠️ Check interval outside recommended range (5s-5min), using default');
            config.checkInterval = 30000;
        }
        if (config.rateLimitMs < 500 || config.rateLimitMs > 10000) {
            console.warn('⚠️ Rate limit outside recommended range (0.5-10s), using default');
            config.rateLimitMs = 1000;
        }
        return true;
    }
    /**
     * Clear cached configuration (useful for testing)
     */
    static clearCache() {
        this.config = null;
    }
}
export default class SimpleTelegramBot {
    static instance = null;
    chatId;
    token;
    domPurify;
    // Rate limiting properties
    lastMessageTime = 0;
    messageCount = 0;
    rateLimitWindow = 60000; // 1 minute
    maxMessagesPerWindow = 20; // Conservative limit
    minIntervalMs = 1000; // Minimum 1 second between messages
    constructor(token, chatId) {
        this.token = token;
        this.chatId = chatId;
        // Initialize DOMPurify for server-side usage
        try {
            // Server-side: create JSDOM instance for DOMPurify
            const window = new JSDOM('').window;
            this.domPurify = DOMPurify(window);
        }
        catch (error) {
            console.warn('DOMPurify initialization failed, falling back to basic sanitization');
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
        const config = TelegramConfigManager.load();
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
    async sendMessage(text) {
        // Comprehensive input validation with security-conscious error messages
        if (!text || typeof text !== 'string') {
            SecurityAuditLogger.warn('telegram_message_validation_failed', {
                reason: 'invalid_content_type',
            });
            throw new TelegramError('Message validation failed: invalid content type', 'VALIDATION_ERROR');
        }
        // Check for null bytes and control characters (except newlines and tabs)
        if (text.includes('\0') || /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text)) {
            SecurityAuditLogger.warn('telegram_message_validation_failed', {
                reason: 'control_characters',
            });
            throw new TelegramError('Message validation failed: contains invalid characters', 'VALIDATION_ERROR');
        }
        // Check message length (Telegram limit is 4096 characters)
        if (text.length > 4096) {
            SecurityAuditLogger.warn('telegram_message_validation_failed', {
                reason: 'too_long',
                length: text.length,
            });
            throw new TelegramError('Message validation failed: content too long', 'VALIDATION_ERROR');
        }
        // Check for extremely long lines that might indicate abuse
        const lines = text.split('\n');
        const maxLineLength = 200;
        if (lines.some(line => line.length > maxLineLength)) {
            SecurityAuditLogger.warn('telegram_message_validation_failed', { reason: 'line_too_long' });
            throw new TelegramError('Message validation failed: line too long', 'VALIDATION_ERROR');
        }
        // Apply rate limiting
        const now = Date.now();
        if (now - this.lastMessageTime < this.minIntervalMs) {
            SecurityAuditLogger.warn('telegram_rate_limit_exceeded', { reason: 'min_interval' });
            throw new TelegramError('Rate limit exceeded: too many requests', 'RATE_LIMIT_ERROR');
        }
        // Reset counter if window has passed
        if (now - this.lastMessageTime > this.rateLimitWindow) {
            this.messageCount = 0;
        }
        // Check message count limit
        if (this.messageCount >= this.maxMessagesPerWindow) {
            SecurityAuditLogger.warn('telegram_rate_limit_exceeded', {
                reason: 'max_messages_per_window',
            });
            throw new TelegramError('Rate limit exceeded: too many messages', 'RATE_LIMIT_ERROR');
        }
        // Sanitize message content
        const sanitizedText = this.sanitizeMessage(text);
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
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });
            if (!response.ok) {
                // Extract error details without exposing sensitive information
                const isRetryable = response.status >= 500 || response.status === 429;
                SecurityAuditLogger.error('telegram_api_error', {
                    status: response.status,
                    retryable: isRetryable,
                });
                throw new TelegramError(`Message delivery failed: service temporarily unavailable`, `API_ERROR_${response.status}`, isRetryable);
            }
            // Update rate limiting counters on success
            this.lastMessageTime = now;
            this.messageCount++;
            SecurityAuditLogger.info('telegram_message_sent_successfully');
            return true;
        }
        catch (error) {
            if (error instanceof TelegramError) {
                SecurityAuditLogger.error('telegram_operation_failed', {
                    code: error.code,
                    retryable: error.isRetryable,
                });
            }
            else {
                SecurityAuditLogger.error('telegram_unexpected_error', { error: String(error) });
            }
            return false;
        }
    }
    sanitizeMessage(text) {
        // Use DOMPurify if available, otherwise fall back to basic sanitization
        if (this.domPurify) {
            // Telegram supports: <b>, <i>, <u>, <s>, <code>, <pre>
            // We allow only safe formatting tags for security
            return this.domPurify
                .sanitize(text, {
                ALLOWED_TAGS: ['b', 'i', 'u', 's', 'code', 'pre'],
                ALLOWED_ATTR: [],
                ALLOW_DATA_ATTR: false,
            })
                .trim();
        }
        else {
            // Fallback: basic HTML escaping (less secure but better than nothing)
            return text
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .trim();
        }
    }
    async init() {
        // Initialize the bot (currently no-op, but can be extended for future features)
        SecurityAuditLogger.info('telegram_bot_init_called');
        console.log('📲 Telegram bot initialized');
    }
    cleanup() {
        // Clear the singleton instance and any resources
        SimpleTelegramBot.instance = null;
        SecurityAuditLogger.info('telegram_bot_cleanup_called');
        console.log('📲 Telegram bot cleaned up');
    }
    resetActivity() {
        // Reset rate limiting counters when user activity is detected
        SecurityAuditLogger.info('telegram_activity_reset');
    }
}
