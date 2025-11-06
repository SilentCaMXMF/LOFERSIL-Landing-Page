import { EventManager } from './EventManager.js';
import { Logger } from './Logger.js';
import { ErrorHandler } from './ErrorHandler.js';
import { TelegramSender, MessageTemplates } from './TelegramNotify.js';
import { SessionIdleEvent, MessageUpdatedEvent, MessagePartUpdatedEvent } from '../types.js';

interface TelegramPluginConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  testMode: boolean;
  testChatId?: string;
}

export class TelegramPlugin {
  private config: TelegramPluginConfig;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private eventManager: EventManager;
  private telegramSender: TelegramSender;

  constructor(eventManager: EventManager, logger: Logger, errorHandler: ErrorHandler) {
    this.eventManager = eventManager;
    this.logger = logger;
    this.errorHandler = errorHandler;
    this.config = this.loadConfig();
    this.telegramSender = new TelegramSender(
      {
        botToken: this.config.botToken,
        chatId: this.config.chatId,
        testMode: this.config.testMode,
        testChatId: this.config.testChatId,
      },
      this.logger,
      this.errorHandler
    );
    this.initialize();
  }

  private loadConfig(): TelegramPluginConfig {
    const config = {
      botToken: this.getEnvVar('TELEGRAM_BOT_TOKEN', ''),
      chatId: this.getEnvVar('TELEGRAM_CHAT_ID', ''),
      enabled: this.getEnvVar('TELEGRAM_PLUGIN_ENABLED', 'true') === 'true',
      testMode: this.getEnvVar('TELEGRAM_TEST_MODE', 'false') === 'true',
      testChatId: this.getEnvVar('TELEGRAM_TEST_CHAT_ID', ''),
    };

    if (!config.botToken || !config.chatId) {
      this.logger.info('TelegramPlugin: Configuration incomplete - bot token or chat ID missing');
      config.enabled = false;
    }

    return config;
  }

  private getEnvVar(key: string, defaultValue: string): string {
    // In browser environment, check for data attributes or global config
    const script = document.querySelector('script[data-env]');
    if (script) {
      const env = JSON.parse(script.getAttribute('data-env') || '{}');
      return env[key] || defaultValue;
    }
    return defaultValue;
  }

  private initialize(): void {
    if (!this.config.enabled) {
      this.logger.info('TelegramPlugin is disabled');
      return;
    }

    // Register event handlers
    this.eventManager.on('session.idle', this.handleSessionIdle.bind(this));
    this.eventManager.on('message.updated', this.handleMessageUpdated.bind(this));
    this.eventManager.on('message.part.updated', this.handleMessagePartUpdated.bind(this));

    this.logger.info('TelegramPlugin initialized successfully', {
      testMode: this.config.testMode,
      registeredEvents: ['session.idle', 'message.updated', 'message.part.updated'],
    });
  }

  private async handleSessionIdle(event: SessionIdleEvent): Promise<void> {
    try {
      const message = MessageTemplates.sessionIdle({
        sessionId: event.sessionId,
        userId: event.userId,
        idleDuration: event.idleDuration,
        sessionStart: new Date(event.sessionStart),
        lastActivity: new Date(event.lastActivity),
        pageUrl: event.pageUrl,
        referrer: event.referrer,
        userAgent: event.userAgent,
      });
      await this.telegramSender.sendMessage(message);
      this.logger.info('Session idle notification sent', { sessionId: event.sessionId });
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to send session idle notification', {
        component: 'TelegramPlugin',
        action: 'handleSessionIdle',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async handleMessageUpdated(event: MessageUpdatedEvent): Promise<void> {
    try {
      const message = MessageTemplates.messageUpdated({
        messageId: event.messageId,
        content: event.content,
        timestamp: new Date(event.timestamp),
        userId: event.userId,
        source: event.source,
      });
      await this.telegramSender.sendMessage(message);
      this.logger.info('Message updated notification sent', {
        messageId: event.messageId,
        contentLength: event.content.length,
      });
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to send message updated notification', {
        component: 'TelegramPlugin',
        action: 'handleMessageUpdated',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async handleMessagePartUpdated(event: MessagePartUpdatedEvent): Promise<void> {
    try {
      const message = MessageTemplates.messagePartUpdated({
        messageId: event.messageId,
        partId: event.partId,
        partIndex: event.partIndex,
        totalParts: event.totalParts,
        content: event.content,
        timestamp: new Date(event.timestamp),
        userId: event.userId,
        source: event.source,
      });
      await this.telegramSender.sendMessage(message);
      this.logger.info('Message part updated notification sent', {
        messageId: event.messageId,
        partId: event.partId,
        partIndex: event.partIndex,
        totalParts: event.totalParts,
      });
    } catch (error) {
      this.errorHandler.handleError(error, 'Failed to send message part updated notification', {
        component: 'TelegramPlugin',
        action: 'handleMessagePartUpdated',
        timestamp: new Date().toISOString(),
      });
    }
  }











  public destroy(): void {
    // Remove event listeners
    this.eventManager.off('session.idle', this.handleSessionIdle.bind(this));
    this.eventManager.off('message.updated', this.handleMessageUpdated.bind(this));
    this.eventManager.off('message.part.updated', this.handleMessagePartUpdated.bind(this));
    this.logger.info('TelegramPlugin destroyed');
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public getRegisteredEvents(): string[] {
    return ['session.idle', 'message.updated', 'message.part.updated'];
  }
}
