import { Logger } from './Logger';

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
  private lastActivityTime: number = Date.now();
  private checkIntervalId?: NodeJS.Timeout;
  private isIdle: boolean = false;

  constructor(logger: Logger) {
    this.logger = logger;
    this.config = this.loadConfig();
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
    if (this.config.testMode) {
      this.logger.info('SimpleTelegramBot: Test mode - would send idle message');
      return;
    }

    const message = `
🤖 <b>LOFERSIL System Status</b>

📊 <i>Idle State Detected</i>
⏰ Timestamp: ${new Date().toISOString()}
🏢 System: LOFERSIL Landing Page
📍 Status: Idle (No active operations)

System is running normally and monitoring for activity.
    `.trim();

    try {
      const chatId = this.config.testChatId || this.config.chatId;
      await this.sendTelegramMessage(message, chatId);
      this.logger.info('Idle message sent to Telegram');
    } catch (error) {
      this.logger.error(
        'Failed to send idle message',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async sendTelegramMessage(message: string, chatId: string): Promise<void> {
    // Construct URL securely - token is embedded as per Telegram API spec
    // Note: This follows the official Telegram Bot API format
    const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        // Don't log the URL to avoid token exposure in logs
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }
    } catch (error) {
      // Log error without exposing the URL/token
      this.logger.error(
        'Failed to send Telegram message',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  public destroy(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }
    this.logger.info('SimpleTelegramBot destroyed');
  }
}
