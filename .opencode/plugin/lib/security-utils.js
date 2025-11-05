/**
 * Security utilities for Telegram plugin
 * Provides audit logging and security monitoring
 */
/**
 * Security audit logger for plugin operations
 */
export class SecurityAuditLogger {
    static logLevel = 'info';
    static setLogLevel(level) {
        this.logLevel = level;
    }
    static log(level, event, details) {
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
            console.log(`[SECURITY-AUDIT] ${JSON.stringify(logEntry)}`);
        }
    }
    static info(event, details) {
        this.log('info', event, details);
    }
    static warn(event, details) {
        this.log('warn', event, details);
    }
    static error(event, details) {
        this.log('error', event, details);
    }
    static shouldLog(level) {
        const levels = { info: 0, warn: 1, error: 2 };
        return levels[level] >= levels[this.logLevel];
    }
    static sanitizeLogEntry(entry) {
        // Remove or mask potentially sensitive fields
        const sensitiveFields = ['token', 'password', 'secret', 'key', 'auth'];
        const maskValue = (obj, key) => {
            if (obj[key] && typeof obj[key] === 'string' && obj[key].length > 4) {
                obj[key] = obj[key].substring(0, 4) + '****';
            }
        };
        const sanitizeObject = (obj) => {
            if (typeof obj === 'object' && obj !== null) {
                Object.keys(obj).forEach(key => {
                    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                        maskValue(obj, key);
                    }
                    else if (typeof obj[key] === 'object') {
                        sanitizeObject(obj[key]);
                    }
                });
            }
        };
        sanitizeObject(entry);
    }
}
