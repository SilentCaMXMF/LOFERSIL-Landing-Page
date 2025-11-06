import { Logger } from './Logger';
import { ErrorHandler } from './ErrorHandler';
import { TelegramSender, MessageFormatter } from './TelegramNotify';

interface TelegramConfig {
  botToken: string;
  chatId: string;
  idleTimeout: number;
  checkInterval: number;
  enabled: boolean;
  testMode: boolean;
  testChatId?: string;
}

export class SimpleTelegramBot {
  private config: TelegramConfig;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private telegramSender: TelegramSender;
  private lastActivityTime: number = Date.now();
  private checkIntervalId?: NodeJS.Timeout;
  private isIdle: boolean = false;

  constructor(logger: Logger, errorHandler?: ErrorHandler) {
    this.logger = logger;
    this.errorHandler = errorHandler || new ErrorHandler();
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

  private loadConfig(): TelegramConfig {
    const config = {
      botToken: this.getEnvVar('TELEGRAM_BOT_TOKEN', ''),
      chatId: this.getEnvVar('TELEGRAM_CHAT_ID', ''),
      idleTimeout: parseInt(this.getEnvVar('TELEGRAM_IDLE_TIMEOUT', '300000')),
      checkInterval: parseInt(this.getEnvVar('TELEGRAM_CHECK_INTERVAL', '30000')),
      enabled: this.getEnvVar('TELEGRAM_ENABLED', 'true') === 'true',
      testMode: this.getEnvVar('TELEGRAM_TEST_MODE', 'false') === 'true',
      testChatId: this.getEnvVar('TELEGRAM_TEST_CHAT_ID', ''),
    };

    // Log configuration status without security audit errors
    if (!config.botToken || !config.chatId) {
      this.logger.info(
        'SimpleTelegramBot: Configuration incomplete - bot token or chat ID missing'
      );
      config.enabled = false; // Disable if required config is missing
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
      this.logger.info('SimpleTelegramBot is disabled');
      return;
    }

    if (!this.config.botToken || !this.config.chatId) {
      this.logger.warn(
        'SimpleTelegramBot: Missing required configuration (bot token or chat ID) - bot will remain inactive'
      );
      return;
    }

    this.setupActivityTracking();
    this.startIdleMonitoring();
    this.logger.info('SimpleTelegramBot initialized successfully', {
      idleTimeout: this.config.idleTimeout,
      checkInterval: this.config.checkInterval,
      testMode: this.config.testMode,
    });
  }

  private setupActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const updateActivity = () => {
      this.lastActivityTime = Date.now();
      if (this.isIdle) {
        this.isIdle = false;
        this.logger.debug('Activity detected, no longer idle');
      }
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Also track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        updateActivity();
      }
    });
  }

  private startIdleMonitoring(): void {
    this.checkIntervalId = setInterval(() => {
      this.checkIdleState();
    }, this.config.checkInterval);
  }

  private checkIdleState(): void {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivityTime;

    if (timeSinceActivity >= this.config.idleTimeout && !this.isIdle) {
      this.isIdle = true;
      this.sendIdleMessage();
    }
  }

  private async sendIdleMessage(): Promise<void> {
    const message = MessageFormatter.formatMessage(
      'LOFERSIL System Status',
      [
        { label: 'Idle State Detected', value: 'System is running normally and monitoring for activity.', emoji: '📊' },
        { label: 'Timestamp', value: new Date().toISOString(), emoji: '⏰' },
        { label: 'Status', value: 'Idle (No active operations)', emoji: '📍' },
      ]
    );

    try {
      await this.telegramSender.sendMessage(message);
      this.logger.info('Idle message sent to Telegram');
    } catch (error) {
      // Error already handled by TelegramSender
    }
  }



  public destroy(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }
    this.logger.info('SimpleTelegramBot destroyed');
  }
}
