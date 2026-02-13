/**
 * ErrorManager - Simple Error Handling System
 *
 * Basic error handling and user notifications for the LOFERSIL Landing Page.
 */

const IS_DEVELOPMENT =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

/**
 * Simple Error Manager class for basic error handling
 */
export class ErrorManager {
  private showUserMessages: boolean;
  private logToConsole: boolean;

  constructor(config: { showUserMessages?: boolean; logToConsole?: boolean } = {}) {
    this.showUserMessages = config.showUserMessages ?? true;
    this.logToConsole = config.logToConsole ?? IS_DEVELOPMENT;
    this.setupGlobalErrorHandling();
  }

  /**
   * Setup global error handling for unhandled errors
   */
  private setupGlobalErrorHandling(): void {
    window.addEventListener('error', event => {
      this.handleError(event.error, `Unhandled error: ${event.message}`);
    });

    window.addEventListener('unhandledrejection', event => {
      this.handleError(event.reason, 'Unhandled promise rejection');
    });
  }

  /**
   * Handle errors with logging and optional user notification
   */
  handleError(error: unknown, context: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    if (this.logToConsole) {
      console.error(`${context}:`, errorMessage);
      if (errorStack) console.error(errorStack);
    }

    if (this.showUserMessages && this.isCriticalError(context)) {
      this.showErrorMessage('An unexpected error occurred. Please refresh the page and try again.');
    }
  }

  /**
   * Show error notification to user
   */
  showErrorMessage(message: string, duration: number = 5000): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification error';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');

    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, duration);

    document.body.appendChild(errorDiv);
  }

  /**
   * Show success notification to user
   */
  showSuccessMessage(message: string, duration: number = 3000): void {
    const successDiv = document.createElement('div');
    successDiv.className = 'notification success';
    successDiv.textContent = message;
    successDiv.setAttribute('role', 'status');
    successDiv.setAttribute('aria-live', 'polite');

    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, duration);

    document.body.appendChild(successDiv);
  }

  /**
   * Show info notification to user
   */
  showInfoMessage(message: string, duration: number = 3000): void {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'notification info';
    infoDiv.textContent = message;
    infoDiv.setAttribute('role', 'status');
    infoDiv.setAttribute('aria-live', 'polite');

    setTimeout(() => {
      if (infoDiv.parentNode) {
        infoDiv.parentNode.removeChild(infoDiv);
      }
    }, duration);

    document.body.appendChild(infoDiv);
  }

  /**
   * Show warning notification to user
   */
  showWarning(message: string, duration: number = 4000): void {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'notification warning';
    warningDiv.textContent = message;
    warningDiv.setAttribute('role', 'alert');
    warningDiv.setAttribute('aria-live', 'assertive');

    setTimeout(() => {
      if (warningDiv.parentNode) {
        warningDiv.parentNode.removeChild(warningDiv);
      }
    }, duration);

    document.body.appendChild(warningDiv);
  }

  /**
   * Check if error should show user message
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
  updateConfig(newConfig: { showUserMessages?: boolean; logToConsole?: boolean }): void {
    if (newConfig.showUserMessages !== undefined) {
      this.showUserMessages = newConfig.showUserMessages;
    }
    if (newConfig.logToConsole !== undefined) {
      this.logToConsole = newConfig.logToConsole;
    }
  }
}
