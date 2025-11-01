/**
 * ErrorHandler - Centralized error handling, display, and logging
 * Handles application errors gracefully with user-friendly messages and logging
 */

const IS_DEVELOPMENT =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

/**
 * Error handler configuration interface
 */
interface ErrorHandlerConfig {
  showUserMessages: boolean;
  logToConsole: boolean;
  maxRetries?: number;
}

/**
 * Error context information
 */
interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: string;
}

/**
 * ErrorHandler class for managing application errors
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;

  constructor(
    config: ErrorHandlerConfig = { showUserMessages: true, logToConsole: IS_DEVELOPMENT }
  ) {
    this.config = config;
    this.setupGlobalErrorHandling();
  }

  /**
   * Setup global error handling for unhandled errors and rejections
   */
  private setupGlobalErrorHandling(): void {
    // Global error handler for unhandled errors
    window.addEventListener('error', event => {
      this.handleError(event.error, `Unhandled error: ${event.message}`, {
        component: 'Global',
        action: 'unhandled_error',
        timestamp: new Date().toISOString(),
      });
    });

    // Global handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', event => {
      this.handleError(event.reason, 'Unhandled promise rejection', {
        component: 'Global',
        action: 'unhandled_rejection',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle missing resources
    window.addEventListener(
      'error',
      event => {
        const target = event.target as HTMLElement;
        if (
          target instanceof HTMLImageElement ||
          target instanceof HTMLScriptElement ||
          target instanceof HTMLLinkElement
        ) {
          let resourceUrl = '';
          if (target instanceof HTMLImageElement || target instanceof HTMLScriptElement) {
            resourceUrl = target.src;
          } else if (target instanceof HTMLLinkElement) {
            resourceUrl = target.href;
          }
          if (this.config.logToConsole && resourceUrl) {
            console.warn(`Failed to load resource: ${resourceUrl}`);
          }
        }
      },
      true
    );
  }

  /**
   * Handle application errors gracefully
   */
  public handleError(error: unknown, context: string, errorContext?: ErrorContext): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    // Log error if configured
    if (this.config.logToConsole) {
      console.error(`${context}:`, errorMessage);
      if (errorStack) console.error(errorStack);
    }

    // Send to error reporting service in production
    if (!IS_DEVELOPMENT) {
      this.reportError(error, context, errorContext);
    }

    // Show user-friendly message for critical errors
    if (this.config.showUserMessages && this.isCriticalError(context)) {
      this.showErrorMessage('An unexpected error occurred. Please refresh the page and try again.');
    }
  }

  /**
   * Show user-friendly error message
   */
  public showErrorMessage(message: string, duration: number = 5000): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification error';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');

    // Auto-remove after specified duration
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, duration);

    document.body.appendChild(errorDiv);
  }

  /**
   * Show success message
   */
  public showSuccessMessage(message: string, duration: number = 3000): void {
    const successDiv = document.createElement('div');
    successDiv.className = 'notification success';
    successDiv.textContent = message;
    successDiv.setAttribute('role', 'status');
    successDiv.setAttribute('aria-live', 'polite');

    // Auto-remove after specified duration
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, duration);

    document.body.appendChild(successDiv);
  }

  /**
   * Show info message
   */
  public showInfoMessage(message: string, duration: number = 3000): void {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'notification info';
    infoDiv.textContent = message;
    infoDiv.setAttribute('role', 'status');
    infoDiv.setAttribute('aria-live', 'polite');

    // Auto-remove after specified duration
    setTimeout(() => {
      if (infoDiv.parentNode) {
        infoDiv.parentNode.removeChild(infoDiv);
      }
    }, duration);

    document.body.appendChild(infoDiv);
  }

  /**
   * Report error to external service (placeholder)
   */
  private reportError(error: unknown, context: string, errorContext?: ErrorContext): void {
    // In a real application, send to error reporting service like Sentry, Rollbar, etc.
    // For now, just prepare the error data
    const errorData = {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : String(error),
      context,
      errorContext,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Example: Send to error reporting service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData),
    // }).catch(() => {
    //   // Silently fail if error reporting fails
    // });
  }

  /**
   * Check if error is critical and should show user message
   */
  private isCriticalError(context: string): boolean {
    const criticalContexts = [
      'Application initialization failed',
      'Failed to load translations',
      'Routing error',
      'Critical rendering error',
    ];
    return criticalContexts.some(critical => context.includes(critical));
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
