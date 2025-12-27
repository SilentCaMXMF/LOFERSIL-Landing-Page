/**
 * Simple Browser Logger
 * Basic console logging for frontend code
 */

export interface SimpleLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export const simpleLogger: SimpleLogger = {
  debug(message: string, ...args: any[]): void {
    if (process?.env?.NODE_ENV !== "production") {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  info(message: string, ...args: any[]): void {
    console.info(`[INFO] ${message}`, ...args);
  },

  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  },

  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  },
};

export default simpleLogger;
