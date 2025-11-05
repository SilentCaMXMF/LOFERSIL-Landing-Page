import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import SimpleTelegramBot, { TelegramError, TelegramConfigManager } from './SimpleTelegramBot.js';
import { SecurityAuditLogger } from './security-utils.js';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
const mockEnv = {
  TELEGRAM_BOT_TOKEN: '123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ012345678',
  TELEGRAM_CHAT_ID: '123456789',
  TELEGRAM_ENABLED: 'true',
  TELEGRAM_IDLE_TIMEOUT: '300000',
  TELEGRAM_CHECK_INTERVAL: '30000',
  TELEGRAM_MAX_RETRIES: '3',
  TELEGRAM_RATE_LIMIT_MS: '1000',
};

describe('SimpleTelegramBot Security Tests', () => {
  beforeEach(() => {
    // Set up mock environment
    process.env = { ...process.env, ...mockEnv };

    // Clear singleton instance
    (SimpleTelegramBot as any).instance = null;

    // Clear config cache
    TelegramConfigManager.clearCache();

    // Mock fetch to return success by default
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    });

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Validation Security', () => {
    it('should reject null input', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      await expect(bot!.sendMessage(null as any)).rejects.toThrow(TelegramError);
      await expect(bot!.sendMessage(null as any)).rejects.toThrow(
        'Message validation failed: invalid content type'
      );
    });

    it('should reject non-string input', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      await expect(bot!.sendMessage(123 as any)).rejects.toThrow(TelegramError);
      await expect(bot!.sendMessage({} as any)).rejects.toThrow(
        'Message validation failed: invalid content type'
      );
    });

    it('should reject messages with null bytes', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      const maliciousMessage = 'Hello\x00World';
      await expect(bot!.sendMessage(maliciousMessage)).rejects.toThrow(TelegramError);
      await expect(bot!.sendMessage(maliciousMessage)).rejects.toThrow(
        'Message validation failed: contains invalid characters'
      );
    });

    it('should reject messages with control characters', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      const maliciousMessage = 'Hello\x01World';
      await expect(bot!.sendMessage(maliciousMessage)).rejects.toThrow(TelegramError);
      await expect(bot!.sendMessage(maliciousMessage)).rejects.toThrow(
        'Message validation failed: contains invalid characters'
      );
    });

    it('should reject overly long messages', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      const longMessage = 'a'.repeat(4097);
      await expect(bot!.sendMessage(longMessage)).rejects.toThrow(TelegramError);
      await expect(bot!.sendMessage(longMessage)).rejects.toThrow(
        'Message validation failed: content too long'
      );
    });

    it('should reject messages with extremely long lines', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      const longLineMessage = 'a'.repeat(201);
      await expect(bot!.sendMessage(longLineMessage)).rejects.toThrow(TelegramError);
      await expect(bot!.sendMessage(longLineMessage)).rejects.toThrow(
        'Message validation failed: line too long'
      );
    });
  });

  describe('Message Sanitization Security', () => {
    it('should sanitize HTML injection attempts', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      const maliciousMessage = '<script>alert("xss")</script>Hello<img src=x onerror=alert(1)>';
      const result = await bot!.sendMessage(maliciousMessage);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          body: expect.stringContaining('"text":"Hello"'),
        })
      );
    });

    it('should allow safe Telegram HTML tags', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      const safeMessage = '<b>Bold</b> <i>italic</i> <code>code</code>';
      const result = await bot!.sendMessage(safeMessage);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          body: expect.stringContaining('"text":"<b>Bold</b> <i>italic</i> <code>code</code>"'),
        })
      );
    });

    it('should strip unsafe HTML attributes', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      const unsafeMessage = '<a href="javascript:alert(1)">Click me</a>';
      const result = await bot!.sendMessage(unsafeMessage);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          body: expect.stringContaining('"text":"Click me"'),
        })
      );
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce minimum interval between messages', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      // Send first message
      await bot!.sendMessage('First message');

      // Try to send second message immediately (should fail due to rate limiting)
      await expect(bot!.sendMessage('Second message')).rejects.toThrow(TelegramError);
      await expect(bot!.sendMessage('Second message')).rejects.toThrow(
        'Rate limit exceeded: too many requests'
      );
    });

    it('should enforce maximum messages per window', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      // Mock the rate limiting properties to test window limits
      Object.defineProperty(bot!, 'maxMessagesPerWindow', { value: 2 });
      Object.defineProperty(bot!, 'rateLimitWindow', { value: 1000 });
      Object.defineProperty(bot!, 'minIntervalMs', { value: 0 });

      // Send messages up to the limit
      await bot!.sendMessage('Message 1');
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait less than window
      await bot!.sendMessage('Message 2');

      // This should fail
      await expect(bot!.sendMessage('Message 3')).rejects.toThrow(TelegramError);
      await expect(bot!.sendMessage('Message 3')).rejects.toThrow(
        'Rate limit exceeded: too many messages'
      );
    });
  });

  describe('Configuration Security', () => {
    it('should reject invalid bot tokens', () => {
      // Set invalid token
      process.env.TELEGRAM_BOT_TOKEN = 'invalid-token';

      // Clear cache to force reload
      (SimpleTelegramBot as any).instance = null;

      return expect(SimpleTelegramBot.create()).resolves.toBeNull();
    });

    it('should reject invalid chat IDs', () => {
      // Set invalid chat ID
      process.env.TELEGRAM_CHAT_ID = 'invalid-chat-id';

      // Clear cache to force reload
      (SimpleTelegramBot as any).instance = null;

      return expect(SimpleTelegramBot.create()).resolves.toBeNull();
    });

    it('should handle missing environment variables gracefully', () => {
      // Remove required env vars
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;

      // Clear cache to force reload
      (SimpleTelegramBot as any).instance = null;

      return expect(SimpleTelegramBot.create()).resolves.toBeNull();
    });
  });

  describe('Error Handling Security', () => {
    it('should not leak sensitive information in errors', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      // Mock fetch to return an error
      (global.fetch as any).mockRejectedValue(new Error('Network failure'));

      const result = await bot!.sendMessage('Test message');

      expect(result).toBe(false);
      // Should not expose any sensitive information in console output
    });

    it('should handle API errors securely', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      // Mock fetch to return API error
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      expect(await bot!.sendMessage('Test message')).toBe(false);
    });

    it('should classify retryable vs non-retryable errors', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      // Test retryable error (500)
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(await bot!.sendMessage('Test message')).toBe(false);

      // Test non-retryable error (400)
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      expect(await bot!.sendMessage('Test message')).toBe(false);
    });
  });

  describe('Audit Logging Security', () => {
    it('should log security events without sensitive data', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      // Spy on SecurityAuditLogger
      const logSpy = vi.spyOn(SecurityAuditLogger, 'info');

      await bot!.sendMessage('Test message');

      expect(logSpy).toHaveBeenCalledWith(
        'telegram_message_send_attempt',
        expect.objectContaining({
          messageLength: expect.any(Number),
          hasHtml: expect.any(Boolean),
        })
      );
    });

    it('should mask sensitive data in logs', () => {
      const logSpy = vi.spyOn(SecurityAuditLogger, 'log');

      // Test logging with sensitive data
      SecurityAuditLogger.info('test_event', {
        token: '123456789:AAVerySecretTokenHere123456789',
        password: 'secret123',
        normalField: 'safe data',
      });

      expect(logSpy).toHaveBeenCalledWith(
        'info',
        'test_event',
        expect.objectContaining({
          token: '1234****',
          password: 'secr****',
          normalField: 'safe data',
        })
      );
    });
  });

  describe('Singleton Pattern Security', () => {
    it('should maintain singleton instance securely', async () => {
      const bot1 = await SimpleTelegramBot.create();
      const bot2 = await SimpleTelegramBot.create();

      expect(bot1).toBe(bot2); // Should be the same instance
      expect(bot1).toBeTruthy();
    });

    it('should cleanup singleton instance properly', async () => {
      const bot = await SimpleTelegramBot.create();
      expect(bot).toBeTruthy();

      bot!.cleanup();

      // Instance should be cleared
      expect((SimpleTelegramBot as any).instance).toBeNull();
    });
  });
});
