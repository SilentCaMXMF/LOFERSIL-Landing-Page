/**
 * Simple Browser Logger
 * Basic console logging for frontend code
 */
export const simpleLogger = {
    debug(message, ...args) {
        if (process?.env?.NODE_ENV !== "production") {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    },
    info(message, ...args) {
        console.info(`[INFO] ${message}`, ...args);
    },
    warn(message, ...args) {
        console.warn(`[WARN] ${message}`, ...args);
    },
    error(message, ...args) {
        console.error(`[ERROR] ${message}`, ...args);
    },
};
export default simpleLogger;
//# sourceMappingURL=simpleLogger.js.map