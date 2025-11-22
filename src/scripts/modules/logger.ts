/**
 * Production Logging Configuration
 * Structured logging for the AI-powered GitHub Issues Reviewer System
 */

import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  [key: string]: any;
}

class Logger {
  private logLevel: string;
  private service: string;
  private version: string;

  constructor() {
    this.logLevel =
      process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    this.service = 'ai-github-issues-reviewer';
    this.version = process.env.npm_package_version || '1.0.0';
  }

  private shouldLog(level: string): boolean {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level as keyof typeof levels] <= levels[this.logLevel as keyof typeof levels];
  }

  private formatLog(level: string, message: string, meta: any = {}): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      service: this.service,
      version: this.version,
      ...meta,
    };

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(entry);
    } else {
      // Development format with colors
      const colors = {
        ERROR: '\x1b[31m', // Red
        WARN: '\x1b[33m', // Yellow
        INFO: '\x1b[36m', // Cyan
        DEBUG: '\x1b[35m', // Magenta
      };
      const color = colors[level.toUpperCase() as keyof typeof colors] || '';
      const reset = '\x1b[0m';
      const time = entry.timestamp.split('T')[1].split('.')[0]; // HH:MM:SS

      let log = `${color}${time} ${level.toUpperCase()}${reset}: ${message}`;

      const metaKeys = Object.keys(meta).filter(key => !['service', 'version'].includes(key));
      if (metaKeys.length > 0) {
        log += ` ${JSON.stringify(Object.fromEntries(metaKeys.map(key => [key, meta[key]])), null, 2)}`;
      }

      return log;
    }
  }

  private write(level: string, message: string, meta: any = {}): void {
    if (!this.shouldLog(level)) return;

    const logMessage = this.formatLog(level, message, meta);
    console.log(logMessage);

    // Write to file in production
    if (process.env.NODE_ENV === 'production') {
      try {
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }

        const logFile = level === 'error' ? 'error.log' : 'combined.log';
        const logPath = path.join(logDir, logFile);

        fs.appendFileSync(logPath, logMessage + '\n');
      } catch (error) {
        // Fallback to console if file writing fails
        console.error('Failed to write to log file:', error);
      }
    }
  }

  error(message: string, meta: any = {}): void {
    this.write('error', message, meta);
  }

  warn(message: string, meta: any = {}): void {
    this.write('warn', message, meta);
  }

  info(message: string, meta: any = {}): void {
    this.write('info', message, meta);
  }

  debug(message: string, meta: any = {}): void {
    this.write('debug', message, meta);
  }
}

// Create logger instance
export const logger = new Logger();

// Request logging middleware
export function requestLogger(req: any, res: any, next: any): void {
  const start = Date.now();

  // Log request
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    if (logLevel === 'warn') {
      logger.warn('Request completed', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      });
    } else {
      logger.info('Request completed', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      });
    }
  });

  next();
}

// Error logging middleware
export function errorLogger(error: any, req: any, res: any, next: any): void {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  next(error);
}

// Application logging helpers
export const log = {
  info: (message: string, meta: any = {}) => logger.info(message, meta),
  warn: (message: string, meta: any = {}) => logger.warn(message, meta),
  error: (message: string, meta: any = {}) => logger.error(message, meta),
  debug: (message: string, meta: any = {}) => logger.debug(message, meta),

  // Specialized logging methods
  webhook: (event: string, deliveryId: string, data: any = {}) =>
    logger.info('Webhook received', {
      event,
      deliveryId,
      ...data,
    }),

  task: (action: string, taskId: string, data: any = {}) =>
    logger.info(`Task ${action}`, {
      taskId,
      ...data,
    }),

  api: (endpoint: string, status: number, duration: number, data: any = {}) =>
    logger.info('API call', {
      endpoint,
      status,
      duration: `${duration}ms`,
      ...data,
    }),

  ai: (action: string, model: string, tokens: number, data: any = {}) =>
    logger.info(`AI ${action}`, {
      model,
      tokens,
      ...data,
    }),

  github: (action: string, resource: string, data: any = {}) =>
    logger.info(`GitHub ${action}`, {
      resource,
      ...data,
    }),
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
});

export default logger;
