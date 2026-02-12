/**
 * Utility functions module for LOFERSIL Landing Page
 * Contains reusable utility functions for performance optimization and DOM manipulation
 */
/**
 * Debounce function for performance optimization
 * Delays function execution until after wait time has elapsed since last call
 */
export function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
/**
 * Throttle function for scroll events and other high-frequency events
 * Limits function execution to once per limit period
 */
export function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
/**
 * Check if element is in viewport
 * Returns true if the element is fully visible in the current viewport
 */
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
            (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth));
}
//# sourceMappingURL=Utils.js.map