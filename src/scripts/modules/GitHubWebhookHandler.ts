/**
 * GitHub Webhook Handler
 *
 * Handles incoming GitHub webhook events for issues, validates signatures,
 * and processes webhook payloads for the AI-powered GitHub Issues Reviewer System.
 */

import { createHmac } from 'crypto';
import { logger } from './logger';

export interface GitHubWebhookPayload {
  action:
    | 'opened'
    | 'edited'
    | 'closed'
    | 'reopened'
    | 'assigned'
    | 'unassigned'
    | 'labeled'
    | 'unlabeled';
  issue: {
    number: number;
    title: string;
    body: string | null;
    labels: Array<{ name: string }>;
    user: { login: string };
    created_at: string;
    updated_at: string;
    state: 'open' | 'closed';
    html_url: string;
    assignee?: { login: string } | null;
  };
  repository: {
    name: string;
    full_name: string;
    owner: { login: string };
    html_url: string;
  };
  sender: {
    login: string;
  };
}

export interface WebhookValidationResult {
  isValid: boolean;
  error?: string;
}

export interface WebhookProcessingResult {
  success: boolean;
  eventType: string;
  issueNumber: number;
  action: string;
  error?: string;
}

export interface GitHubWebhookHandlerConfig {
  webhookSecret: string;
  supportedEvents: string[];
  maxPayloadSize: number; // in bytes
  timeout: number; // in milliseconds
}

export class GitHubWebhookHandler {
  private config: GitHubWebhookHandlerConfig;

  constructor(config: GitHubWebhookHandlerConfig) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate the handler configuration
   */
  private validateConfig(): void {
    if (!this.config.webhookSecret) {
      throw new Error('Webhook secret is required for security validation');
    }
    if (this.config.webhookSecret.length < 16) {
      throw new Error('Webhook secret should be at least 16 characters long');
    }
    if (!this.config.supportedEvents.includes('issues')) {
      throw new Error('Issues event must be supported');
    }
  }

  /**
   * Handle incoming webhook request
   */
  async handleWebhook(
    headers: Record<string, string>,
    rawBody: string,
    eventType: string
  ): Promise<WebhookProcessingResult> {
    try {
      // Validate event type
      if (!this.isSupportedEvent(eventType)) {
        logger.warn('Unsupported webhook event type', { eventType });
        return {
          success: false,
          eventType,
          issueNumber: 0,
          action: 'unsupported',
          error: `Unsupported event type: ${eventType}`,
        };
      }

      // Validate payload size
      if (rawBody.length > this.config.maxPayloadSize) {
        logger.warn('Webhook payload too large', {
          size: rawBody.length,
          maxSize: this.config.maxPayloadSize,
        });
        return {
          success: false,
          eventType,
          issueNumber: 0,
          action: 'payload_too_large',
          error: 'Payload size exceeds maximum allowed',
        };
      }

      // Validate signature
      const signatureValidation = this.validateSignature(headers, rawBody);
      if (!signatureValidation.isValid) {
        logger.error('Invalid webhook signature', { error: signatureValidation.error });
        return {
          success: false,
          eventType,
          issueNumber: 0,
          action: 'invalid_signature',
          error: signatureValidation.error,
        };
      }

      // Parse payload
      const payload = this.parsePayload(rawBody);
      if (!payload) {
        logger.error('Failed to parse webhook payload');
        return {
          success: false,
          eventType,
          issueNumber: 0,
          action: 'parse_error',
          error: 'Failed to parse webhook payload',
        };
      }

      // Validate payload structure
      if (!this.isValidIssueEvent(payload)) {
        logger.warn('Invalid issue event payload', { action: (payload as any).action });
        return {
          success: false,
          eventType,
          issueNumber: (payload as any).issue?.number || 0,
          action: (payload as any).action || 'invalid',
          error: 'Invalid issue event payload structure',
        };
      }

      // At this point, payload is guaranteed to be GitHubWebhookPayload
      const validPayload = payload;

      logger.info('Successfully processed webhook', {
        eventType,
        action: payload.action,
        issueNumber: payload.issue.number,
        repository: payload.repository.full_name,
      });

      return {
        success: true,
        eventType,
        issueNumber: payload.issue.number,
        action: payload.action,
      };
    } catch (error: any) {
      logger.error('Error processing webhook', { error: error.message, eventType });
      return {
        success: false,
        eventType,
        issueNumber: 0,
        action: 'processing_error',
        error: error.message,
      };
    }
  }

  /**
   * Validate webhook signature using HMAC-SHA256
   */
  private validateSignature(
    headers: Record<string, string>,
    rawBody: string
  ): WebhookValidationResult {
    try {
      const signature = headers['x-hub-signature-256'];
      if (!signature) {
        return { isValid: false, error: 'Missing X-Hub-Signature-256 header' };
      }

      if (!signature.startsWith('sha256=')) {
        return { isValid: false, error: 'Invalid signature format' };
      }

      const expectedSignature = createHmac('sha256', this.config.webhookSecret)
        .update(rawBody, 'utf8')
        .digest('hex');

      const providedSignature = signature.slice(7); // Remove 'sha256=' prefix

      // Use constant-time comparison to prevent timing attacks
      if (!this.constantTimeEquals(expectedSignature, providedSignature)) {
        return { isValid: false, error: 'Signature verification failed' };
      }

      return { isValid: true };
    } catch (error: any) {
      return { isValid: false, error: `Signature validation error: ${error.message}` };
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Parse webhook payload from raw body
   */
  private parsePayload(rawBody: string): GitHubWebhookPayload | null {
    try {
      const payload: GitHubWebhookPayload = JSON.parse(rawBody);

      // Basic validation of required fields
      if (!payload.action || !payload.issue || !payload.repository) {
        return null;
      }

      return payload;
    } catch (error) {
      logger.error('JSON parse error in webhook payload', { error });
      return null;
    }
  }

  /**
   * Check if event type is supported
   */
  private isSupportedEvent(eventType: string): boolean {
    return this.config.supportedEvents.includes(eventType);
  }

  /**
   * Validate that the payload is a valid issue event
   */
  private isValidIssueEvent(payload: any): payload is GitHubWebhookPayload {
    return (
      payload &&
      typeof payload.action === 'string' &&
      [
        'opened',
        'edited',
        'closed',
        'reopened',
        'assigned',
        'unassigned',
        'labeled',
        'unlabeled',
      ].includes(payload.action) &&
      payload.issue &&
      typeof payload.issue.number === 'number' &&
      typeof payload.issue.title === 'string' &&
      payload.repository &&
      typeof payload.repository.full_name === 'string'
    );
  }

  /**
   * Get supported actions for issue events
   */
  getSupportedActions(): string[] {
    return [
      'opened',
      'edited',
      'closed',
      'reopened',
      'assigned',
      'unassigned',
      'labeled',
      'unlabeled',
    ];
  }

  /**
   * Get configuration for debugging
   */
  getConfig(): Readonly<GitHubWebhookHandlerConfig> {
    return { ...this.config };
  }
}
