/**
 * LOFERSIL Landing Page - Email Retry Logic and Failure Handling
 * Comprehensive email retry strategies with exponential backoff and queue management
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
  nonRetryableErrors: string[];
  rateLimitErrors: string[];
}

export interface EmailJob {
  id: string;
  recipient: string;
  subject: string;
  content: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType: string;
  }>;
  priority: "high" | "medium" | "low";
  createdAt: Date;
  attempts: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  errorHistory: Array<{
    timestamp: Date;
    error: string;
    errorCode?: string;
    errorType: ErrorType;
  }>;
}

export interface RetryResult {
  success: boolean;
  attempts: number;
  totalTime: number;
  finalError?: string;
  deliveredAt?: Date;
}

export enum ErrorType {
  TRANSIENT = "transient",
  AUTHENTICATION = "authentication",
  RATE_LIMIT = "rate_limit",
  PERMANENT = "permanent",
  CONFIGURATION = "configuration",
  NETWORK = "network",
  TIMEOUT = "timeout",
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  deadLetter: number;
}

export class EmailRetryManager {
  private config: RetryConfig;
  private queue: Map<string, EmailJob> = new Map();
  private processing: Set<string> = new Set();
  protected deadLetterQueue: Map<string, EmailJob> = new Map();
  private stats: QueueStats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    deadLetter: 0,
  };

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      retryableErrors: [
        "ECONNRESET",
        "ETIMEDOUT",
        "ENOTFOUND",
        "ECONNREFUSED",
        "timeout",
        "connection",
        "network",
        "temporary",
      ],
      nonRetryableErrors: [
        "authentication failed",
        "invalid credentials",
        "authentication credentials invalid",
        "535",
        "530",
      ],
      rateLimitErrors: [
        "rate limit",
        "too many messages",
        "429",
        "451",
        "452",
        "454",
      ],
      ...config,
    };
  }

  categorizeError(error: Error | string): ErrorType {
    const errorMessage =
      error instanceof Error
        ? error.message.toLowerCase()
        : error.toLowerCase();

    const errorCode = (error as any).code?.toLowerCase() || "";

    // Check for specific error codes first
    if (errorCode === "429" || errorMessage.includes("429")) {
      return ErrorType.RATE_LIMIT;
    }

    if (errorCode === "550" || errorMessage.includes("550")) {
      return ErrorType.PERMANENT;
    }

    if (errorCode === "551" || errorMessage.includes("551")) {
      return ErrorType.PERMANENT;
    }

    if (errorCode === "552" || errorMessage.includes("552")) {
      return ErrorType.PERMANENT;
    }

    if (errorCode === "etimedout" || errorMessage.includes("etimedout")) {
      return ErrorType.TIMEOUT;
    }

    if (errorCode === "econnrefused" || errorMessage.includes("econnrefused")) {
      return ErrorType.NETWORK;
    }

    if (errorCode === "econnreset" || errorMessage.includes("econnreset")) {
      return ErrorType.NETWORK;
    }

    if (errorCode === "enotfound" || errorMessage.includes("enotfound")) {
      return ErrorType.NETWORK;
    }

    // Check for specific error patterns
    if (
      errorMessage.includes("connection limit") ||
      errorMessage.includes("too many connections")
    ) {
      return ErrorType.RATE_LIMIT;
    }

    if (
      errorMessage.includes("message size exceeds") ||
      errorMessage.includes("size limit")
    ) {
      return ErrorType.PERMANENT;
    }

    if (errorMessage.includes("network unreachable")) {
      return ErrorType.NETWORK;
    }

    if (errorMessage.includes("connection timeout")) {
      return ErrorType.TIMEOUT;
    }

    if (errorMessage.includes("permanent failure")) {
      return ErrorType.PERMANENT;
    }

    if (errorMessage.includes("mailbox unavailable")) {
      return ErrorType.PERMANENT;
    }

    if (
      this.config.nonRetryableErrors.some((pattern) =>
        errorMessage.includes(pattern.toLowerCase()),
      )
    ) {
      return ErrorType.AUTHENTICATION;
    }

    if (
      this.config.rateLimitErrors.some((pattern) =>
        errorMessage.includes(pattern.toLowerCase()),
      )
    ) {
      return ErrorType.RATE_LIMIT;
    }

    if (
      this.config.retryableErrors.some((pattern) =>
        errorMessage.includes(pattern.toLowerCase()),
      )
    ) {
      if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("etimedout")
      ) {
        return ErrorType.TIMEOUT;
      }
      if (
        errorMessage.includes("network") ||
        errorMessage.includes("connection")
      ) {
        return ErrorType.NETWORK;
      }
      return ErrorType.TRANSIENT;
    }

    if (
      errorMessage.includes("permanent") ||
      errorMessage.includes("550") ||
      errorMessage.includes("551")
    ) {
      return ErrorType.PERMANENT;
    }

    if (
      errorMessage.includes("config") ||
      errorMessage.includes("setup") ||
      errorMessage.includes("invalid")
    ) {
      return ErrorType.CONFIGURATION;
    }

    return ErrorType.TRANSIENT;
  }

  calculateRetryDelay(attempt: number, errorType: ErrorType): number {
    // Authentication and permanent errors should not retry
    if (
      errorType === ErrorType.AUTHENTICATION ||
      errorType === ErrorType.PERMANENT ||
      errorType === ErrorType.CONFIGURATION
    ) {
      return 0;
    }

    let delay =
      this.config.baseDelay *
      Math.pow(this.config.backoffMultiplier, attempt - 1);

    if (errorType === ErrorType.RATE_LIMIT) {
      delay = Math.max(delay, 60000); // Minimum 60 seconds for rate limits
    }

    // For rate limit errors, allow higher delays than maxDelay
    if (errorType !== ErrorType.RATE_LIMIT) {
      delay = Math.min(delay, this.config.maxDelay);
    }

    if (this.config.jitter) {
      const jitterAmount = delay * 0.1;
      delay += Math.random() * jitterAmount * 2 - jitterAmount;
    }

    // Ensure rate limit delays are never below 60 seconds even after jitter
    if (errorType === ErrorType.RATE_LIMIT) {
      delay = Math.max(delay, 60000);
    }

    return Math.max(delay, 100);
  }

  shouldRetry(
    error: Error | string,
    attempts: number,
    errorType: ErrorType,
  ): boolean {
    if (attempts >= this.config.maxAttempts) {
      return false;
    }

    switch (errorType) {
      case ErrorType.AUTHENTICATION:
      case ErrorType.CONFIGURATION:
      case ErrorType.PERMANENT:
        return false;

      case ErrorType.RATE_LIMIT:
      case ErrorType.TRANSIENT:
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
        return true;

      default:
        return false;
    }
  }

  addToQueue(
    job: Omit<EmailJob, "id" | "attempts" | "createdAt" | "errorHistory">,
  ): string {
    const id = this.generateJobId();
    const emailJob: EmailJob = {
      ...job,
      id,
      attempts: 0,
      createdAt: new Date(),
      errorHistory: [],
    };

    this.queue.set(id, emailJob);
    this.stats.pending++;

    return id;
  }

  getNextJob(): EmailJob | null {
    const jobs = Array.from(this.queue.values())
      .filter((job) => !job.nextRetry || job.nextRetry <= new Date())
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    if (jobs.length === 0) {
      return null;
    }

    const job = jobs[0];
    this.queue.delete(job.id);
    this.stats.pending--;
    this.processing.add(job.id);
    this.stats.processing++;

    return job;
  }

  async processJobWithRetry(
    job: EmailJob,
    sendFunction: (job: EmailJob) => Promise<void>,
  ): Promise<RetryResult> {
    const startTime = Date.now();
    let currentJob = { ...job };
    let finalError: string | undefined;

    while (currentJob.attempts < this.config.maxAttempts) {
      currentJob.attempts++;
      currentJob.lastAttempt = new Date();

      try {
        await sendFunction(currentJob);

        this.processing.delete(currentJob.id);
        this.stats.processing--;
        this.stats.completed++;

        return {
          success: true,
          attempts: currentJob.attempts,
          totalTime: Date.now() - startTime,
          deliveredAt: new Date(),
        };
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message;
        const errorType = this.categorizeError(errorObj);

        currentJob.errorHistory.push({
          timestamp: new Date(),
          error: errorMessage,
          errorCode: (errorObj as any).code,
          errorType,
        });

        if (!this.shouldRetry(errorObj, currentJob.attempts, errorType)) {
          finalError = errorMessage;
          break;
        }

        const delay = this.calculateRetryDelay(currentJob.attempts, errorType);
        currentJob.nextRetry = new Date(Date.now() + delay);

        await this.sleep(delay);
      }
    }

    this.processing.delete(currentJob.id);
    this.stats.processing--;

    if (currentJob.attempts >= this.config.maxAttempts || finalError) {
      this.deadLetterQueue.set(currentJob.id, currentJob);
      this.stats.deadLetter++;
      finalError = finalError || "Max retry attempts exceeded";
    } else {
      this.stats.failed++;
    }

    return {
      success: false,
      attempts: currentJob.attempts,
      totalTime: Date.now() - startTime,
      finalError,
    };
  }

  retryJob(jobId: string): boolean {
    const job = this.deadLetterQueue.get(jobId);
    if (!job) {
      return false;
    }

    job.attempts = 0;
    job.errorHistory = [];
    job.nextRetry = new Date();

    this.deadLetterQueue.delete(jobId);
    this.stats.deadLetter--;
    this.queue.set(jobId, job);
    this.stats.pending++;

    return true;
  }

  getJob(jobId: string): EmailJob | null {
    return (
      this.queue.get(jobId) ||
      this.deadLetterQueue.get(jobId) ||
      (this.processing.has(jobId)
        ? Array.from(this.queue.values()).find((j) => j.id === jobId) || null
        : null)
    );
  }

  getQueueStats(): QueueStats {
    return { ...this.stats };
  }

  getDeadLetterJobs(): EmailJob[] {
    return Array.from(this.deadLetterQueue.values());
  }

  clearDeadLetterQueue(): number {
    const count = this.deadLetterQueue.size;
    this.deadLetterQueue.clear();
    this.stats.deadLetter = 0;
    return count;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class SMTPErrorHandler {
  private retryManager: EmailRetryManager;

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryManager = new EmailRetryManager(retryConfig);
  }

  categorizeError(error: Error | string): ErrorType {
    return this.retryManager.categorizeError(error);
  }

  async handleSMTPError(
    error: Error,
    emailData: {
      to: string;
      subject: string;
      content: string;
      from?: string;
    },
    originalError?: Error,
  ): Promise<{
    shouldRetry: boolean;
    retryDelay?: number;
    errorType: ErrorType;
    userMessage: string;
    adminMessage: string;
    needsAttention: boolean;
  }> {
    const errorType = this.retryManager.categorizeError(error);
    const errorMessage = error.message;

    const userMessage = this.generateUserMessage(errorType, errorMessage);
    const adminMessage = this.generateAdminMessage(
      errorType,
      error,
      originalError,
    );
    const needsAttention = this.needsAdminAttention(errorType);

    let shouldRetry = false;
    let retryDelay: number | undefined;

    if (this.retryManager.shouldRetry(error, 1, errorType)) {
      shouldRetry = true;
      retryDelay = this.retryManager.calculateRetryDelay(1, errorType);
    }

    return {
      shouldRetry,
      retryDelay,
      errorType,
      userMessage,
      adminMessage,
      needsAttention,
    };
  }

  private generateUserMessage(
    errorType: ErrorType,
    errorMessage: string,
  ): string {
    switch (errorType) {
      case ErrorType.RATE_LIMIT:
        return "O sistema está a processar muitas solicitações. Por favor, tente novamente dentro de alguns minutos.";

      case ErrorType.TIMEOUT:
        return "A ligação ao servidor de email demorou demasiado tempo. Por favor, tente novamente.";

      case ErrorType.NETWORK:
        return "Problema de conectividade com o servidor de email. Por favor, verifique a sua ligação e tente novamente.";

      case ErrorType.AUTHENTICATION:
        return "Ocorreu um erro de configuração no serviço de email. A nossa equipa foi notificada.";

      case ErrorType.CONFIGURATION:
        return "Serviço de email temporariamente indisponível. Por favor, tente novamente mais tarde.";

      case ErrorType.PERMANENT:
        return "Não foi possível entregar o email para o endereço fornecido. Por favor, verifique o endereço e tente novamente.";

      default:
        return "Ocorreu um erro ao enviar o email. Por favor, tente novamente mais tarde.";
    }
  }

  private generateAdminMessage(
    errorType: ErrorType,
    error: Error,
    originalError?: Error,
  ): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] Email sending failed`;

    switch (errorType) {
      case ErrorType.AUTHENTICATION:
        return `${baseMessage} - AUTHENTICATION ERROR: SMTP credentials are invalid or expired. Immediate attention required. Error: ${error.message}`;

      case ErrorType.CONFIGURATION:
        return `${baseMessage} - CONFIGURATION ERROR: SMTP configuration is invalid. Error: ${error.message}`;

      case ErrorType.RATE_LIMIT:
        return `${baseMessage} - RATE LIMIT: SMTP provider rate limit exceeded. Consider implementing throttling. Error: ${error.message}`;

      case ErrorType.PERMANENT:
        return `${baseMessage} - PERMANENT FAILURE: Email permanently rejected. Check recipient address and sender reputation. Error: ${error.message}`;

      default:
        return `${baseMessage} - TRANSIENT ERROR: Temporary failure, retry recommended. Error: ${error.message}${originalError ? ` | Original: ${originalError.message}` : ""}`;
    }
  }

  private needsAdminAttention(errorType: ErrorType): boolean {
    return [ErrorType.AUTHENTICATION, ErrorType.CONFIGURATION].includes(
      errorType,
    );
  }

  getRetryManager(): EmailRetryManager {
    return this.retryManager;
  }
}

export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: [
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ECONNREFUSED",
    "timeout",
    "connection",
    "network",
    "temporary",
  ],
  nonRetryableErrors: [
    "authentication failed",
    "invalid credentials",
    "authentication credentials invalid",
    "535",
    "530",
  ],
  rateLimitErrors: [
    "rate limit",
    "too many messages",
    "429",
    "451",
    "452",
    "454",
  ],
};
