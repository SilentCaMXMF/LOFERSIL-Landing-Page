/**
 * Security utilities for Telegram plugin
 * Provides audit logging and security monitoring
 */

/**
 * Security audit logger for plugin operations
 */
export class SecurityAuditLogger {
  private static logLevel: 'info' | 'warn' | 'error' = 'info';

  static setLogLevel(level: 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }

  static log(level: 'info' | 'warn' | 'error', event: string, details?: Record<string, any>): void {
    if (this.shouldLog(level)) {
      const timestamp = new Date().toISOString();
      // Sanitize details in place
      if (details) {
        this.sanitizeLogEntry(details);
      }
      const logEntry = {
        timestamp,
        level,
        event,
        ...(details || {}),
      };

      // Only log security audits when TELEGRAM_DEBUG is explicitly enabled
      if (process.env.TELEGRAM_DEBUG === 'true') {
        console.log(`[SECURITY-AUDIT] ${JSON.stringify(logEntry)}`);
      }
    }
  }

  static info(event: string, details?: Record<string, any>): void {
    this.log('info', event, details);
  }

  static warn(event: string, details?: Record<string, any>): void {
    this.log('warn', event, details);
  }

  static error(event: string, details?: Record<string, any>): void {
    this.log('error', event, details);
  }

  /**
   * Log operation with standardized context
   */
  static logOperation(
    level: 'info' | 'warn' | 'error',
    operation: string,
    result: 'success' | 'failed' | 'attempt',
    details?: Record<string, any>
  ): void {
    this.log(level, `telegram_${operation}_${result}`, {
      operation,
      result,
      ...details
    });
  }

  /**
   * Log error with context from ErrorHandler
   */
  static logError(error: any, operation: string): void {
    this.error(`telegram_${operation}_failed`, {
      operation,
      error: error instanceof Error ? error.message : String(error),
      ...(error.context || {})
    });
  }

  private static shouldLog(level: 'info' | 'warn' | 'error'): boolean {
    const levels = { info: 0, warn: 1, error: 2 };
    return levels[level] >= levels[this.logLevel];
  }

  private static sanitizeLogEntry(entry: any): void {
    // Remove or mask potentially sensitive fields
    const sensitiveFields = ['token', 'password', 'secret', 'key', 'auth'];
    const maskValue = (obj: any, key: string) => {
      if (obj[key] && typeof obj[key] === 'string' && obj[key].length > 4) {
        obj[key] = obj[key].substring(0, 4) + '****';
      }
    };

    const sanitizeObject = (obj: any) => {
      if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            maskValue(obj, key);
          } else if (typeof obj[key] === 'object') {
            sanitizeObject(obj[key]);
          }
        });
      }
    };

    sanitizeObject(entry);
  }
}
