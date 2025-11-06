import { Logger } from './Logger.js';
import { ErrorHandler } from './ErrorHandler.js';

interface TelegramConfig {
  botToken: string;
  chatId: string;
  testMode: boolean;
  testChatId?: string;
}

interface MessageOptions {
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disablePreview?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class MessageFormatter {
  /**
   * Formats a message with common structure and HTML escaping
   */
  static formatMessage(
    title: string,
    sections: Array<{ label: string; value: string; emoji?: string }>,
    systemName: string = 'LOFERSIL Landing Page'
  ): string {
    const formattedSections = sections
      .map(({ label, value, emoji = '' }) => {
        const escapedValue = this.escapeHtml(value);
        return emoji ? `${emoji} <b>${label}:</b> ${escapedValue}` : `<b>${label}:</b> ${escapedValue}`;
      })
      .join('\n');

    return `
🤖 <b>${title}</b>

${formattedSections}

🏢 <b>System:</b> ${systemName}
    `.trim();
  }

  /**
   * Generates a content preview with length limit
   */
  static generatePreview(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Calculates basic content statistics
   */
  static getContentStats(content: string): { length: number; words: number; lines: number } {
    return {
      length: content.length,
      words: content.split(/\s+/).filter(word => word.length > 0).length,
      lines: content.split('\n').length,
    };
  }

  /**
   * Escapes HTML characters for Telegram HTML parse mode
   */
  static escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
  }

  /**
   * Formats timestamp in Portuguese locale
   */
  static formatTimestamp(timestamp: Date | string | number): string {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-PT');
  }
}

export class MessageValidator {
  /**
   * Validates message content for Telegram API constraints
   */
  static validateMessage(message: string): ValidationResult {
    const errors: string[] = [];

    if (!message || message.trim().length === 0) {
      errors.push('Message cannot be empty');
    }

    if (message.length > 4096) {
      errors.push('Message exceeds maximum length of 4096 characters');
    }

    // Check for invalid HTML if using HTML parse mode
    const htmlRegex = /<\/?[a-zA-Z][^>]*>/g;
    if (htmlRegex.test(message)) {
      // Basic HTML validation - ensure tags are properly closed
      const openTags = message.match(/<[^\/][^>]*>/g) || [];
      const closeTags = message.match(/<\/[^>]+>/g) || [];
      if (openTags.length !== closeTags.length) {
        errors.push('HTML tags are not properly balanced');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitizes message content
   */
  static sanitizeMessage(message: string): string {
    // Remove or escape potentially dangerous content
    return message
      .replace(/<script[^>]*>.*?<\/script>/gi, '[SCRIPT REMOVED]')
      .replace(/javascript:/gi, '[JAVASCRIPT REMOVED]');
  }
}

export class TelegramSender {
  private config: TelegramConfig;
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor(config: TelegramConfig, logger: Logger, errorHandler: ErrorHandler) {
    this.config = config;
    this.logger = logger;
    this.errorHandler = errorHandler;
  }

  /**
   * Sends a message to Telegram with consistent error handling
   */
  async sendMessage(
    message: string,
    options: MessageOptions = {},
    customChatId?: string
  ): Promise<void> {
    // Validate message first
    const validation = MessageValidator.validateMessage(message);
    if (!validation.isValid) {
      throw new Error(`Message validation failed: ${validation.errors.join(', ')}`);
    }

    if (this.config.testMode) {
      this.logger.info('TelegramSender: Test mode - would send message', {
        messageLength: message.length,
        messagePreview: MessageFormatter.generatePreview(message, 100),
        parseMode: options.parseMode || 'HTML',
      });
      return;
    }

    const chatId = customChatId || this.config.testChatId || this.config.chatId;

    try {
      await this.sendTelegramMessage(message, chatId, options);
      this.logger.info('Message sent successfully to Telegram', {
        chatId,
        messageLength: message.length,
      });
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to send Telegram message', {
        component: 'TelegramSender',
        action: 'sendMessage',
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Core Telegram API call
   */
  private async sendTelegramMessage(
    message: string,
    chatId: string,
    options: MessageOptions
  ): Promise<void> {
    const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: options.disablePreview || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
  }
}

export interface CommandHandler {
  command: string;
  description: string;
  execute(args: string[], sender: TelegramSender): Promise<void>;
}

export class CommandProcessor {
  private handlers: Map<string, CommandHandler> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Registers a command handler
   */
  registerHandler(handler: CommandHandler): void {
    this.handlers.set(handler.command, handler);
    this.logger.info(`Command handler registered: ${handler.command}`);
  }

  /**
   * Processes a command message
   */
  async processCommand(message: string, sender: TelegramSender): Promise<boolean> {
    if (!message.startsWith('/')) {
      return false; // Not a command
    }

    const parts = message.trim().split(/\s+/);
    const command = parts[0].substring(1); // Remove the '/'
    const args = parts.slice(1);

    const handler = this.handlers.get(command);
    if (!handler) {
      this.logger.warn(`Unknown command: ${command}`);
      return false;
    }

    try {
      await handler.execute(args, sender);
      this.logger.info(`Command executed successfully: ${command}`);
      return true;
    } catch (error) {
      this.logger.error(`Command execution failed: ${command}`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Gets list of available commands
   */
  getAvailableCommands(): Array<{ command: string; description: string }> {
    return Array.from(this.handlers.values()).map(({ command, description }) => ({
      command,
      description,
    }));
  }
}

// Utility functions for common message types
export const MessageTemplates = {
  /**
   * Creates a session idle notification message
   */
  sessionIdle: (data: {
    sessionId?: string;
    userId?: string;
    idleDuration: number;
    sessionStart: Date;
    lastActivity: Date;
    pageUrl?: string;
    referrer?: string;
    userAgent?: string;
  }): string => {
    const idleMinutes = Math.round(data.idleDuration / 60000);
    const sessionDuration = Date.now() - data.sessionStart.getTime();
    const sessionMinutes = Math.round(sessionDuration / 60000);

    return MessageFormatter.formatMessage('OpenCode Session Idle', [
      { label: 'Timestamp', value: MessageFormatter.formatTimestamp(new Date()), emoji: '⏰' },
      { label: 'Session ID', value: data.sessionId || 'N/A', emoji: '🆔' },
      { label: 'User ID', value: data.userId || 'Anonymous', emoji: '👤' },
      { label: 'Idle Duration', value: `${idleMinutes} minutes`, emoji: '📊' },
      { label: 'Total Session Time', value: `${sessionMinutes} minutes`, emoji: '📈' },
      { label: 'Last Activity', value: MessageFormatter.formatTimestamp(data.lastActivity), emoji: '📅' },
      { label: 'Page', value: data.pageUrl || 'Unknown', emoji: '🌐' },
      { label: 'Referrer', value: data.referrer || 'Direct', emoji: '🔗' },
      { label: 'User Agent', value: data.userAgent ? data.userAgent.substring(0, 50) + '...' : 'Unknown', emoji: '💻' },
    ]);
  },

  /**
   * Creates a message updated notification
   */
  messageUpdated: (data: {
    messageId: string;
    content: string;
    timestamp: Date;
    userId?: string;
    source?: string;
  }): string => {
    const preview = MessageFormatter.generatePreview(data.content);
    const stats = MessageFormatter.getContentStats(data.content);

    return MessageFormatter.formatMessage('OpenCode Message Updated', [
      { label: 'Message ID', value: data.messageId, emoji: '🆔' },
      { label: 'Timestamp', value: MessageFormatter.formatTimestamp(data.timestamp), emoji: '⏰' },
      { label: 'User ID', value: data.userId || 'Anonymous', emoji: '👤' },
      { label: 'Source', value: data.source || 'Unknown', emoji: '🔍' },
      { label: 'Content Preview', value: preview, emoji: '📄' },
      { label: 'Length', value: `${stats.length} characters`, emoji: '📊' },
      { label: 'Words', value: `${stats.words}`, emoji: '📝' },
      { label: 'Lines', value: `${stats.lines}`, emoji: '📋' },
    ]);
  },

  /**
   * Creates a message part updated notification
   */
  messagePartUpdated: (data: {
    messageId: string;
    partId: string;
    partIndex: number;
    totalParts: number;
    content: string;
    timestamp: Date;
    userId?: string;
    source?: string;
  }): string => {
    const preview = MessageFormatter.generatePreview(data.content, 150);
    const progress = Math.round(((data.partIndex + 1) / data.totalParts) * 100);

    return MessageFormatter.formatMessage('OpenCode Message Part Updated', [
      { label: 'Message ID', value: data.messageId, emoji: '🆔' },
      { label: 'Part ID', value: data.partId, emoji: '🔢' },
      { label: 'Part', value: `${data.partIndex + 1}/${data.totalParts}`, emoji: '📍' },
      { label: 'Timestamp', value: MessageFormatter.formatTimestamp(data.timestamp), emoji: '⏰' },
      { label: 'User ID', value: data.userId || 'Anonymous', emoji: '👤' },
      { label: 'Source', value: data.source || 'Unknown', emoji: '🔍' },
      { label: 'Part Content', value: preview, emoji: '📄' },
      { label: 'Length', value: `${data.content.length} characters`, emoji: '📊' },
      { label: 'Progress', value: `${progress}%`, emoji: '📈' },
    ]);
  },
};