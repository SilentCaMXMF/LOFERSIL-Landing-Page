/**
 * Browser-Safe Logging Configuration
 * Structured logging for LOFERSIL Landing Page
 */

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
    // Browser-safe environment detection
    const isProduction =
      import.meta.env?.MODE === "production" ||
      (!import.meta.env?.DEV && window.location.hostname !== "localhost");

    this.logLevel = isProduction ? "info" : "debug";
    this.service = "lofersil-landing-page";
    this.version = "1.0.0";
  }

  private shouldLog(level: string): boolean {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return (
      levels[level as keyof typeof levels] <=
      levels[this.logLevel as keyof typeof levels]
    );
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

    // Check if we're in production
    const isProduction =
      import.meta.env?.MODE === "production" ||
      (!import.meta.env?.DEV && window.location.hostname !== "localhost");

    if (isProduction) {
      return JSON.stringify(entry);
    } else {
      // Development format with colors (browser-safe)
      const colors = {
        ERROR: "color: #ff4444", // Red
        WARN: "color: #ffaa00", // Yellow/Orange
        INFO: "color: #00aaff", // Cyan/Blue
        DEBUG: "color: #aa00ff", // Purple/Magenta
      };
      const color = colors[level.toUpperCase() as keyof typeof colors] || "";
      const time = entry.timestamp.split("T")[1].split(".")[0]; // HH:MM:SS

      let log = `[${time}] ${level.toUpperCase()}: ${message}`;

      const metaKeys = Object.keys(meta).filter(
        (key) => !["service", "version"].includes(key),
      );
      if (metaKeys.length > 0) {
        log += ` ${JSON.stringify(Object.fromEntries(metaKeys.map((key) => [key, meta[key]])), null, 2)}`;
      }

      return log;
    }
  }

  private write(level: string, message: string, meta: any = {}): void {
    if (!this.shouldLog(level)) return;

    const logMessage = this.formatLog(level, message, meta);

    // Browser-safe logging
    const isProduction =
      import.meta.env?.MODE === "production" ||
      (!import.meta.env?.DEV && window.location.hostname !== "localhost");

    if (isProduction) {
      // In production, use appropriate console methods
      switch (level) {
        case "error":
          console.error(logMessage);
          break;
        case "warn":
          console.warn(logMessage);
          break;
        case "info":
          console.info(logMessage);
          break;
        case "debug":
          console.debug(logMessage);
          break;
        default:
          console.log(logMessage);
      }
    } else {
      // In development, use styled console logs
      const colors = {
        ERROR: "color: #ff4444; font-weight: bold",
        WARN: "color: #ffaa00; font-weight: bold",
        INFO: "color: #00aaff",
        DEBUG: "color: #aa00ff",
      };
      const color = colors[level.toUpperCase() as keyof typeof colors] || "";

      if (color) {
        console.log(`%c${logMessage}`, color);
      } else {
        console.log(logMessage);
      }
    }

    // Optional: Send logs to external service in production
    if (isProduction && level === "error") {
      this.sendToExternalService(level, message, meta);
    }
  }

  private sendToExternalService(
    level: string,
    message: string,
    meta: any,
  ): void {
    // Browser-safe error reporting (optional)
    try {
      // You could integrate with services like Sentry, LogRocket, etc.
      // For now, just log to console
      console.warn("Error reporting service not configured:", {
        level,
        message,
        meta,
      });
    } catch (error) {
      console.error("Failed to send error to external service:", error);
    }
  }

  error(message: string, meta: any = {}): void {
    this.write("error", message, meta);
  }

  warn(message: string, meta: any = {}): void {
    this.write("warn", message, meta);
  }

  info(message: string, meta: any = {}): void {
    this.write("info", message, meta);
  }

  debug(message: string, meta: any = {}): void {
    this.write("debug", message, meta);
  }
}

// Create logger instance
export const logger = new Logger();

// Browser-safe event logging
export function logUserAction(action: string, details: any = {}): void {
  logger.info("User action", {
    action,
    ...details,
  });
}

// Browser-safe error logging
export function logError(error: Error, context: any = {}): void {
  logger.error("Application error", {
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

// Browser-safe application logging helpers
export const log = {
  info: (message: string, meta: any = {}) => logger.info(message, meta),
  warn: (message: string, meta: any = {}) => logger.warn(message, meta),
  error: (message: string, meta: any = {}) => logger.error(message, meta),
  debug: (message: string, meta: any = {}) => logger.debug(message, meta),

  // Browser-specific logging methods
  user: (action: string, data: any = {}) =>
    logger.info("User action", {
      action,
      ...data,
    }),

  performance: (metric: string, value: number, data: any = {}) =>
    logger.info("Performance metric", {
      metric,
      value,
      ...data,
    }),

  navigation: (page: string, data: any = {}) =>
    logger.info("Navigation", {
      page,
      ...data,
    }),

  form: (formName: string, action: string, data: any = {}) =>
    logger.info("Form action", {
      form: formName,
      action,
      ...data,
    }),

  api: (endpoint: string, status: number, duration: number, data: any = {}) =>
    logger.info("API call", {
      endpoint,
      status,
      duration: `${duration}ms`,
      ...data,
    }),
};

// Browser-safe page lifecycle logging
if (typeof window !== "undefined") {
  // Log page visibility changes
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      logger.debug("Page hidden");
    } else {
      logger.debug("Page visible");
    }
  });

  // Log page unload
  window.addEventListener("beforeunload", () => {
    logger.info("Page unloading");
  });

  // Log errors
  window.addEventListener("error", (event) => {
    logger.error("Unhandled error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Log unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", {
      reason: event.reason,
    });
  });
}

export default logger;
