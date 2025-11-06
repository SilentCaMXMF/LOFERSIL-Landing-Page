import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageFormatter, MessageValidator, TelegramSender, CommandProcessor, MessageTemplates } from './TelegramNotify.js';
import { Logger } from './Logger.js';
import { ErrorHandler } from './ErrorHandler.js';

describe('TelegramNotify Utility', () => {
  let logger: Logger;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    logger = Logger.getInstance();
    errorHandler = new ErrorHandler();
    vi.clearAllMocks();
  });

  describe('MessageFormatter', () => {
    it('should format a message with sections', () => {
      const message = MessageFormatter.formatMessage(
        'Test Title',
        [
          { label: 'Field1', value: 'Value1', emoji: '🔥' },
          { label: 'Field2', value: 'Value2' },
        ],
        'Test System'
      );

      expect(message).toContain('<b>Test Title</b>');
      expect(message).toContain('🔥 <b>Field1:</b> Value1');
      expect(message).toContain('<b>Field2:</b> Value2');
      expect(message).toContain('<b>System:</b> Test System');
    });

    it('should generate preview correctly', () => {
      const shortContent = 'Short';
      const longContent = 'A'.repeat(300);

      expect(MessageFormatter.generatePreview(shortContent)).toBe(shortContent);
      expect(MessageFormatter.generatePreview(longContent)).toBe('A'.repeat(200) + '...');
    });

    it('should escape HTML characters', () => {
      const html = '<script>&"\'</script>';
      const escaped = MessageFormatter.escapeHtml(html);

      expect(escaped).toBe('&lt;script&gt;&amp;&quot;&#39;&lt;/script&gt;');
    });

    it('should format timestamp', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formatted = MessageFormatter.formatTimestamp(date);

      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}/);
    });
  });

  describe('MessageValidator', () => {
    it('should validate valid messages', () => {
      const result = MessageValidator.validateMessage('Valid message');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty messages', () => {
      const result = MessageValidator.validateMessage('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message cannot be empty');
    });

    it('should reject messages that are too long', () => {
      const longMessage = 'A'.repeat(5000);
      const result = MessageValidator.validateMessage(longMessage);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message exceeds maximum length');
    });
  });

  describe('TelegramSender', () => {
    let sender: TelegramSender;

    beforeEach(() => {
      sender = new TelegramSender(
        {
          botToken: 'test-token',
          chatId: 'test-chat',
          testMode: true,
        },
        logger,
        errorHandler
      );
    });

    it('should send message in test mode', async () => {
      const loggerSpy = vi.spyOn(logger, 'info');

      await sender.sendMessage('Test message');

      expect(loggerSpy).toHaveBeenCalledWith(
        'TelegramSender: Test mode - would send message',
        expect.objectContaining({
          messageLength: 12,
          messagePreview: 'Test message',
          parseMode: 'HTML',
        })
      );
    });

    it('should validate message before sending', async () => {
      await expect(sender.sendMessage('')).rejects.toThrow('Message validation failed');
    });
  });

  describe('MessageTemplates', () => {
    it('should create session idle message', () => {
      const message = MessageTemplates.sessionIdle({
        sessionId: 'test-session',
        userId: 'test-user',
        idleDuration: 300000, // 5 minutes
        sessionStart: new Date('2023-01-01T10:00:00Z'),
        lastActivity: new Date('2023-01-01T10:05:00Z'),
        pageUrl: 'https://example.com',
        referrer: 'https://google.com',
        userAgent: 'Test Browser',
      });

      expect(message).toContain('OpenCode Session Idle');
      expect(message).toContain('test-session');
      expect(message).toContain('5 minutes');
      expect(message).toContain('https://example.com');
    });

    it('should create message updated message', () => {
      const message = MessageTemplates.messageUpdated({
        messageId: 'msg-123',
        content: 'Test content for message',
        timestamp: new Date('2023-01-01T12:00:00Z'),
        userId: 'user-456',
        source: 'test-source',
      });

      expect(message).toContain('OpenCode Message Updated');
      expect(message).toContain('msg-123');
      expect(message).toContain('Test content for message');
      expect(message).toContain('user-456');
    });
  });

  describe('CommandProcessor', () => {
    let processor: CommandProcessor;

    beforeEach(() => {
      processor = new CommandProcessor(logger);
    });

    it('should register and execute commands', async () => {
      const mockHandler = {
        command: 'test',
        description: 'Test command',
        execute: vi.fn().mockResolvedValue(undefined),
      };

      processor.registerHandler(mockHandler);

      const sender = {} as TelegramSender;
      const result = await processor.processCommand('/test arg1 arg2', sender);

      expect(result).toBe(true);
      expect(mockHandler.execute).toHaveBeenCalledWith(['arg1', 'arg2'], sender);
    });

    it('should return false for unknown commands', async () => {
      const sender = {} as TelegramSender;
      const result = await processor.processCommand('/unknown', sender);

      expect(result).toBe(false);
    });

    it('should not process non-command messages', async () => {
      const sender = {} as TelegramSender;
      const result = await processor.processCommand('regular message', sender);

      expect(result).toBe(false);
    });
  });
});