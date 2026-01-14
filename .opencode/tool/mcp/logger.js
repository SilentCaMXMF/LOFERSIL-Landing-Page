/**
 * MCP Logging Framework
 *
 * Provides structured logging with different levels and metadata support
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
export class MCPLogger {
    static instance;
    logLevel = LogLevel.INFO;
    logs = [];
    MAX_LOG_ENTRIES = 1000;
    static getInstance() {
        if (!MCPLogger.instance) {
            MCPLogger.instance = new MCPLogger();
        }
        return MCPLogger.instance;
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
    debug(component, message, metadata) {
        this.log(LogLevel.DEBUG, component, message, metadata);
    }
    info(component, message, metadata) {
        this.log(LogLevel.INFO, component, message, metadata);
    }
    warn(component, message, metadata) {
        this.log(LogLevel.WARN, component, message, metadata);
    }
    error(component, message, error, metadata) {
        this.log(LogLevel.ERROR, component, message, {
            ...metadata,
            error: error?.message,
            stack: error?.stack,
        });
    }
    log(level, component, message, metadata) {
        if (level < this.logLevel) {
            return;
        }
        const entry = {
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
        }
        else {
            console.log(output);
        }
    }
    getLogs(level) {
        if (level !== undefined) {
            return this.logs.filter(entry => entry.level >= level);
        }
        return [...this.logs];
    }
    clearLogs() {
        this.logs = [];
    }
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
}
