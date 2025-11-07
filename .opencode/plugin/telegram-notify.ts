import type { Plugin } from '@opencode-ai/plugin';
import SimpleTelegramBot from './lib/SimpleTelegramBot';
import { 
  NotificationError, 
  ErrorHandler,
  BasePluginError 
} from './lib/errors.js';
import { SecurityAuditLogger } from './lib/security-utils.js';
import { messageConfig } from './lib/config.js';
import { 
  TelegramSender,
  MessageTemplates,
  CommandProcessor,
  MessageFormatter
} from './lib/message-utils.js';



// Define event interfaces for better type safety
interface BaseEvent {
  type: string;
  timestamp?: number;
  sessionId?: string;
}

interface SessionIdleEvent extends BaseEvent {
  type: 'session.idle';
  // OpenCode may include additional session context
  sessionId?: string;
  duration?: number;
  lastActivity?: number;
}

interface MessageUpdatedEvent extends BaseEvent {
  type: 'message.updated';
  message?: { content: string };
  content?: string;
  // Additional fields that might be present
  id?: string;
  timestamp?: number;
}

interface FileEditedEvent extends BaseEvent {
  type: 'file.edited';
  // Additional fields that might be present
  filePath?: string;
  operation?: string;
}

interface MessagePartUpdatedEvent extends BaseEvent {
  type: 'message.part.updated';
  part?: { content: string };
  // Additional fields that might be present
  messageId?: string;
  partIndex?: number;
}

type OpenCodeEvent =
  | SessionIdleEvent
  | MessageUpdatedEvent
  | FileEditedEvent
  | MessagePartUpdatedEvent;

export const TelegramNotify: Plugin = async ({ project, client, directory, worktree }) => {
  // Initialize Telegram bot
  const bot = await SimpleTelegramBot.create();
  if (!bot) {
    return {}; // Return empty plugin if bot initialization fails
  }

  // Initialize message utilities
  const sender = new TelegramSender(bot);
  const commandProcessor = new CommandProcessor();
  
  let lastMessage = '';
  const MAX_MESSAGE_LENGTH = messageConfig.MAX_MESSAGE_LENGTH; // Use centralized config

  // Helper function to extract message content from event
  const extractMessageContent = (event: OpenCodeEvent): string => {
    if ('message' in event && event.message) return event.message.content;
    if ('content' in event) return event.content || '';
    if ('part' in event && event.part) return event.part.content;
    return '';
  };

  // Helper function to update last message with truncation
  const updateLastMessage = (content: string) => {
    if (content && content !== 'Message updated' && content !== 'Message part updated') {
      lastMessage = content.length > MAX_MESSAGE_LENGTH
        ? content.substring(0, MAX_MESSAGE_LENGTH) + '...[truncated]'
        : content;
    }
  };

  // Register command handlers
  commandProcessor.registerHandler('/send-last', async (content, lastMessage) => {
    if (lastMessage) {
      const response = MessageTemplates.commandResponse('/send-last', lastMessage, true);
      return await sender.sendMessage(response);
    } else {
      const response = MessageTemplates.commandResponse('/send-last', 'No previous message found.', false);
      return await sender.sendMessage(response);
    }
  });

  commandProcessor.registerHandler('/last', async (content, lastMessage) => {
    return await commandProcessor.processCommand('/send-last ' + content, lastMessage);
  });

  commandProcessor.registerHandler('/send-to-phone', async (content, lastMessage) => {
    if (lastMessage) {
      const response = MessageTemplates.commandResponse('/send-to-phone', lastMessage, true);
      return await sender.sendMessage(response);
    } else {
      const response = MessageTemplates.commandResponse('/send-to-phone', 'No message to send to phone.', false);
      return await sender.sendMessage(response);
    }
  });

  commandProcessor.registerHandler('/phone', async (content, lastMessage) => {
    return await commandProcessor.processCommand('/send-to-phone ' + content, lastMessage);
  });

  return {
    event: async ({ event }) => {
      const e = event as OpenCodeEvent;

      if (e.type === 'session.idle') {
        
        // Use message template for idle notification
        const idleMessage = MessageTemplates.sessionIdle(lastMessage);
        
        try {
          // Send using the centralized sender with proper error handling
          const success = await sender.sendMessage(idleMessage, {
            operation: 'idle_notification'
          });
          
          // Notification sent successfully or failed - handled by error logging
        } catch (error: unknown) {
          const notificationError = error instanceof BasePluginError
            ? error
            : new NotificationError(
                `Failed to send idle notification: ${error instanceof Error ? error.message : String(error)}`,
                'idle_notification',
                ErrorHandler.isRetryableError(error),
                ErrorHandler.createErrorContext('idle_notification', {
                  messageLength: idleMessage.length,
                  hasLastMessage: !!lastMessage
                })
              );

          const errorContext = ErrorHandler.sanitizeErrorForLogging(notificationError);
          SecurityAuditLogger.error('telegram_idle_notification_failed', errorContext);

          // Don't re-throw to avoid breaking plugin chain
        }
      }

      if (e.type === 'message.updated') {
        // Reset idle timer when user sends messages
        bot.resetActivity();

        const messageContent = extractMessageContent(e);

        // Process commands using the command processor
        const commandHandled = await commandProcessor.processCommand(messageContent, lastMessage);
        if (commandHandled) {
          return; // Command was handled, exit early
        }

        // Update last message using helper
        try {
          updateLastMessage(messageContent);
        } catch (error: unknown) {
          const captureError = error instanceof BasePluginError
            ? error
            : new NotificationError(
                `Failed to capture message content: ${error instanceof Error ? error.message : String(error)}`,
                'message_capture',
                false
              );

          const errorContext = ErrorHandler.sanitizeErrorForLogging(captureError);
          SecurityAuditLogger.warn('telegram_message_capture_failed', errorContext);
        }
      }

      if (e.type === 'file.edited') {
        // Reset idle timer when user edits files
        bot.resetActivity();
      }

      // Also listen for message parts being updated
      if (e.type === 'message.part.updated') {
        bot.resetActivity();

        try {
          const partContent = e.part?.content || extractMessageContent(e) || 'Message part updated';
          updateLastMessage(partContent);
        } catch (error: unknown) {
          const captureError = error instanceof BasePluginError
            ? error
            : new NotificationError(
                `Failed to capture message part content: ${error instanceof Error ? error.message : String(error)}`,
                'message_part_capture',
                false
              );

          const errorContext = ErrorHandler.sanitizeErrorForLogging(captureError);
          SecurityAuditLogger.warn('telegram_message_part_capture_failed', errorContext);
        }
      }
    },
  };
};