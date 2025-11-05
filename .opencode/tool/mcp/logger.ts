/**
 * MCP Logging Framework
 *
 * Provides structured logging with different levels and metadata support
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  metadata?: Record<string, any>;
  error?: Error;
}

export class MCPLogger {
  private static instance: MCPLogger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private readonly MAX_LOG_ENTRIES = 1000;

  static getInstance(): MCPLogger {
    if (!MCPLogger.instance) {
      MCPLogger.instance = new MCPLogger();
    }
    return MCPLogger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(component: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, component, message, metadata);
  }

  info(component: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, component, message, metadata);
  }

  warn(component: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, component, message, metadata);
  }

  error(component: string, message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, component, message, {
      ...metadata,
      error: error?.message,
      stack: error?.stack,
    });
  }

  private log(
    level: LogLevel,
    component: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      metadata,
    };

    // Store in memory for debugging
    this.logs.push(entry);
    if (this.logs.length > this.MAX_LOG_ENTRIES) {
      this.logs.shift(); // Remove oldest entries
    }

    // Output to console with structured format
    const levelName = LogLevel[level];
    const output = `[${entry.timestamp}] ${levelName} [${component}] ${message}`;

    if (metadata) {
      console.log(output, metadata);
    } else {
      console.log(output);
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(entry => entry.level >= level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
