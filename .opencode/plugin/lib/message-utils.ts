/**
 * Shared message sending utilities for Telegram plugin
 * Reduces code duplication and provides consistent message handling
 */

import { 
  NotificationError, 
  ErrorHandler,
  BasePluginError 
} from './errors.js';
import { SecurityAuditLogger } from './security-utils.js';
import { messageConfig } from './config.js';
import SimpleTelegramBot from './SimpleTelegramBot.js';

/**
 * Message formatting utilities
 */
export class MessageFormatter {
  private static readonly MAX_PREVIEW_LENGTH = messageConfig.MAX_PREVIEW_LENGTH;
  private static readonly MAX_MESSAGE_LENGTH = messageConfig.MAX_MESSAGE_LENGTH;

  /**
   * Format a message with consistent structure and styling
   */
  static formatMessage(
    title: string,
    content: string,
    options: {
      includeTimestamp?: boolean;
      useHtml?: boolean;
      emoji?: string;
    } = {}
  ): string {
    const { includeTimestamp = false, useHtml = true, emoji = '' } = options;
    
    let message = '';
    
    // Add emoji and title
    if (emoji) message += emoji + ' ';
    message += title;
    
    // Add timestamp if requested
    if (includeTimestamp) {
      message += ` (${this.formatTimestamp(new Date())})`;
    }
    
    // Add content with proper spacing
    if (content) {
      message += '\\n\\n' + content;
    }
    
    return message;
  }

  /**
   * Generate a preview of message content
   */
  static generatePreview(content: string, maxLength: number = this.MAX_PREVIEW_LENGTH): string {
    if (!content) return '';
    
    const preview = content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
    
    return preview;
  }

  /**
   * Get content statistics for logging
   */
  static getContentStats(content: string): {
    length: number;
    words: number;
    lines: number;
    hasHtml: boolean;
  } {
    return {
      length: content.length,
      words: content.split(/\\s+/).filter(word => word.length > 0).length,
      lines: content.split('\\n').length,
      hasHtml: /<[^>]*>/.test(content)
    };
  }

  /**
   * Escape HTML characters for security
   */
  static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * Format timestamp consistently
   */
  static formatTimestamp(date: Date): string {
    return date.toISOString();
  }
}

/**
 * Message validation utilities
 */
export class MessageValidator {
  /**
   * Validate message content for Telegram requirements
   */
  static validateMessage(content: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check content type
    if (typeof content !== 'string') {
      errors.push('Content must be a string');
    }

    // Check length
    if (content.length > MessageFormatter['MAX_MESSAGE_LENGTH']) {
      errors.push(`Content too long: ${content.length} > ${MessageFormatter['MAX_MESSAGE_LENGTH']}`);
    }

    // Check for control characters
    if (content.includes('\\0') || /[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/.test(content)) {
      errors.push('Content contains invalid control characters');
    }

    // Check for extremely long lines
    const lines = content.split('\n');
    const maxLineLength = messageConfig.MAX_LINE_LENGTH;
    if (lines.some(line => line.length > maxLineLength)) {
      errors.push(`Line too long: max ${maxLineLength} characters`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize message content for security
   */
  static sanitizeMessage(content: string): string {
    // Basic sanitization - remove potentially dangerous content
    return content
      .replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, '') // Remove control chars
      .trim();
  }
}

/**
 * Telegram message sender with consistent error handling
 */
export class TelegramSender {
  private bot: SimpleTelegramBot;
  private testMode: boolean;

  constructor(bot: SimpleTelegramBot, testMode: boolean = false) {
    this.bot = bot;
    this.testMode = testMode;
  }

  /**
   * Send a message with comprehensive error handling
   */
  async sendMessage(
    content: string,
    options: {
      operation?: string;
      disablePreview?: boolean;
      parseMode?: 'HTML' | 'Markdown';
    } = {}
  ): Promise<boolean> {
    const { operation = 'send_message', disablePreview = false, parseMode = 'HTML' } = options;

    try {
      // Validate content
      const validation = MessageValidator.validateMessage(content);
      if (!validation.isValid) {
        throw new NotificationError(
          `Message validation failed: ${validation.errors.join(', ')}`,
          operation,
          false,
          { content: content.substring(0, messageConfig.CONTENT_PREVIEW_LENGTH), errors: validation.errors }
        );
      }

      // Sanitize content
      const sanitizedContent = MessageValidator.sanitizeMessage(content);

      // Log attempt
      const stats = MessageFormatter.getContentStats(sanitizedContent);
      const context = ErrorHandler.createErrorContext(operation, {
        messageLength: stats.length,
        hasHtml: stats.hasHtml,
        testMode: this.testMode
      });

      SecurityAuditLogger.info('telegram_send_attempt', context);

      // Send message
      const success = await this.bot.sendMessage(sanitizedContent);

      if (success) {
        SecurityAuditLogger.info('telegram_send_success', context);
        return true;
      } else {
        throw new NotificationError(
          'Failed to send Telegram message',
          operation,
          true,
          context
        );
      }

    } catch (error) {
      const sendError = error instanceof BasePluginError
        ? error
        : new NotificationError(
            `Unexpected error sending message: ${error instanceof Error ? error.message : String(error)}`,
            operation,
            ErrorHandler.isRetryableError(error),
            ErrorHandler.createErrorContext(operation, { 
              contentLength: content.length,
              testMode: this.testMode 
            })
          );

      const errorContext = ErrorHandler.sanitizeErrorForLogging(sendError);
      SecurityAuditLogger.error('telegram_send_failed', errorContext);

      // Don't re-throw in test mode to avoid breaking tests
      if (this.testMode) {
        return false;
      }
      
      throw sendError;
    }
  }

  /**
   * Send a preview of content
   */
  async sendPreview(
    content: string,
    title: string = '📱 Preview',
    operation: string = 'send_preview'
  ): Promise<boolean> {
    const preview = MessageFormatter.generatePreview(content);
    const message = MessageFormatter.formatMessage(title, preview);
    
    return this.sendMessage(message, { operation });
  }
}

/**
 * Message templates for common notification types
 */
export class MessageTemplates {
  /**
   * Template for session idle notifications
   */
  static sessionIdle(lastMessage?: string): string {
    const title = '🟡 Session idle!';
    const content = lastMessage 
      ? `Here's your last message:\\n\\n${lastMessage}`
      : "Hey! Your OpenCode session is idle - time to check your work!";
    
    return MessageFormatter.formatMessage(title, content);
  }

  /**
   * Template for message update notifications
   */
  static messageUpdated(content: string, includePreview: boolean = false): string {
    const title = '💬 Message captured';
    const messageContent = includePreview 
      ? MessageFormatter.generatePreview(content)
      : content;
    
    return MessageFormatter.formatMessage(title, messageContent, {
      includeTimestamp: true
    });
  }

  /**
   * Template for message part update notifications
   */
  static messagePartUpdated(content: string): string {
    const title = '💬 Message part captured';
    const messageContent = MessageFormatter.generatePreview(content);
    
    return MessageFormatter.formatMessage(title, messageContent, {
      includeTimestamp: true
    });
  }

  /**
   * Template for command responses
   */
  static commandResponse(
    command: string,
    response: string,
    success: boolean = true
  ): string {
    const emoji = success ? '✅' : '❌';
    const title = `${emoji} ${command}`;
    
    return MessageFormatter.formatMessage(title, response);
  }

  /**
   * Template for error notifications
   */
  static errorNotification(error: BasePluginError): string {
    const title = '🚨 Plugin Error';
    const content = `Operation: ${error.code}\\nMessage: ${error.getSafeMessage()}`;
    
    return MessageFormatter.formatMessage(title, content, {
      includeTimestamp: true
    });
  }
}

/**
 * Command processor for handling user commands
 */
export class CommandProcessor {
  private handlers = new Map<string, (content: string, lastMessage: string) => Promise<boolean>>();

  /**
   * Register a command handler
   */
  registerHandler(command: string, handler: (content: string, lastMessage: string) => Promise<boolean>): void {
    this.handlers.set(command.toLowerCase(), handler);
  }

  /**
   * Process a command if it matches registered handlers
   */
  async processCommand(content: string, lastMessage: string): Promise<boolean> {
    const trimmedContent = content.trim();
    
    for (const [command, handler] of this.handlers) {
      if (trimmedContent.includes(command)) {
        try {
          return await handler(trimmedContent, lastMessage);
        } catch (error) {
          const commandError = error instanceof BasePluginError
            ? error
            : new NotificationError(
                `Command '${command}' failed: ${error instanceof Error ? error.message : String(error)}`,
                'command_processing',
                false,
                { command, content: content.substring(0, messageConfig.CONTENT_PREVIEW_LENGTH) }
              );
          
          const errorContext = ErrorHandler.sanitizeErrorForLogging(commandError);
          SecurityAuditLogger.error('telegram_command_failed', errorContext);
          
          return false;
        }
      }
    }
    
    return false; // No command matched
  }

  /**
   * Get list of registered commands
   */
  getRegisteredCommands(): string[] {
    return Array.from(this.handlers.keys());
  }
}