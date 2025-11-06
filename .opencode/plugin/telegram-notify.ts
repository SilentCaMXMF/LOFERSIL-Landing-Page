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

export const TelegramNotify: Plugin = async ({ $ }) => {
   // Initialize Telegram bot
   const bot = new SimpleTelegramBot()
   let lastMessage = ""
  
   return {
     async event(input) {
       if (input.event.type === "session.idle") {
         // Send the last message content along with idle notification
         const message = lastMessage 
           ? `🟡 Session idle! Here's your last message:\n\n${lastMessage}`
           : "🟡 Hey! Your OpenCode session is idle - time to check your work!"
         bot.sendMessage(message)
       }
      
       if (input.event.type === "message.updated") {
         // Reset idle timer when user sends messages
         bot.resetActivity()
        
         const messageContent = (input.event as any).message?.content || 
                               (input.event as any).content || ""
        
         // Check if it's a command to send last message
         if (messageContent.includes("/send-last") || messageContent.includes("/last")) {
           if (lastMessage) {
             bot.sendMessage(`📱 Here's your last message:\n\n${lastMessage}`)
           } else {
             bot.sendMessage("📱 No previous message found.")
           }
           return
         }
        
         // Check if it's a command to send to phone
         if (messageContent.includes("/send-to-phone") || messageContent.includes("/phone")) {
           if (lastMessage) {
             bot.sendMessage(`📱 Sending to your phone:\n\n${lastMessage}`)
           } else {
             bot.sendMessage("📱 No message to send to phone.")
           }
           return
         }
        
         // Try to capture message content from the event
         try {
           // Access message content if available
           const messageContent = (input.event as any).message?.content || 
                                 (input.event as any).content ||
                                 "Message updated"
          
           if (messageContent && messageContent !== "Message updated") {
             lastMessage = messageContent
            
             // Send a preview of the message to Telegram
             const preview = lastMessage.length > 200 
               ? lastMessage.substring(0, 200) + "..."
               : lastMessage
            
             bot.sendMessage(`📱 Last message preview:\n\n${preview}`)
           }
         } catch (error) {
           // If we can't access the message content, just log it
           console.log("Message updated but couldn't capture content")
         }
       }
      
       if (input.event.type === "file.edited") {
         // Reset idle timer when user edits files
         bot.resetActivity()
       }
      
       if (input.event.type === "message.updated") {
         // Reset idle timer when user sends messages
         bot.resetActivity()
        
         // Try to capture message content from the event
         try {
           // Access message content if available
           const messageContent = (input.event as any).message?.content || 
                                 (input.event as any).content ||
                                 "Message updated"
   
           if (messageContent && messageContent !== "Message updated") {
             lastMessage = messageContent
            
             // Send a preview of the message to Telegram
             const preview = lastMessage.length > 200 
               ? lastMessage.substring(0, 200) + "..."
               : lastMessage
            
             bot.sendMessage(`📱 Last message preview:\n\n${preview}`)
           }
         } catch (error) {
           // If we can't access the message content, just log it
           console.log("Message updated but couldn't capture content")
         }
       }
      
       // Also listen for message parts being updated
       if (input.event.type === "message.part.updated") {
         bot.resetActivity()
        
         try {
           const partContent = (input.event as any).part?.content || 
                              (input.event as any).content ||
                              "Message part updated"
          
           if (partContent && partContent !== "Message part updated") {
             lastMessage = partContent
            
             const preview = lastMessage.length > 200 
               ? lastMessage.substring(0, 200) + "..."
               : lastMessage
            
             bot.sendMessage(`📱 Message part preview:\n\n${preview}`)
           }
         } catch (error) {
           console.log("Message part updated but couldn't capture content")
         }
       }
     }
   }
 }

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

export const TelegramNotify: Plugin = async ({ $, project, client, directory, worktree }) => {
  console.log('📲 TelegramNotify plugin loaded');
  console.log('📍 Working directory:', process.cwd());
  console.log('📁 Plugin directory:', directory);
  console.log('🌳 Worktree:', worktree);

  // Initialize Telegram bot
  const bot = await SimpleTelegramBot.create();
  if (!bot) {
    console.warn(
      'Telegram bot not initialized - check your TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables'
    );
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
      console.log('📥 TelegramNotify received event:', event.type);
      const e = event as OpenCodeEvent;

      if (e.type === 'session.idle') {
        console.log('⏰ Session idle event received');
        
        // Use message template for idle notification
        const idleMessage = MessageTemplates.sessionIdle(lastMessage);
        
        try {
          // Send using the centralized sender with proper error handling
          const success = await sender.sendMessage(idleMessage, {
            operation: 'idle_notification'
          });
          
          if (success) {
            console.log('✅ Idle notification sent successfully');
          } else {
            console.warn('⚠️ Idle notification delivery failed');
          }
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

        // Try to capture message content from event
        try {
          // Access message content if available (reuse the already extracted messageContent)
          if (messageContent && messageContent !== 'Message updated') {
            const previousLength = lastMessage.length;
            lastMessage =
              messageContent.length > MAX_MESSAGE_LENGTH
                ? messageContent.substring(0, MAX_MESSAGE_LENGTH) + '...[truncated]'
                : messageContent;
            
            console.log(
              `💬 Message captured: length ${previousLength} -> ${lastMessage.length}, preview: "${lastMessage.substring(0, messageConfig.CONTENT_PREVIEW_LENGTH)}${lastMessage.length > messageConfig.CONTENT_PREVIEW_LENGTH ? '...' : ''}"`
            );

            // Optional: Send a preview of the message to Telegram (disabled by default to avoid spam)
            // Uncomment the following lines if you want message previews:
            /*
            const preview = MessageFormatter.generatePreview(lastMessage);
            await sender.sendPreview(lastMessage, '📱 Message Preview', 'message_preview');
            */
          }
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

          if (partContent && partContent !== 'Message part updated') {
            const previousLength = lastMessage.length;
            lastMessage =
              partContent.length > MAX_MESSAGE_LENGTH
                ? partContent.substring(0, MAX_MESSAGE_LENGTH) + '...[truncated]'
                : partContent;
            
            console.log(
              `💬 Message part captured: length ${previousLength} -> ${lastMessage.length}, preview: "${lastMessage.substring(0, messageConfig.CONTENT_PREVIEW_LENGTH)}${lastMessage.length > messageConfig.CONTENT_PREVIEW_LENGTH ? '...' : ''}"`
            );

            // Optional: Send a preview of the message part to Telegram (disabled by default to avoid spam)
            // Uncomment the following lines if you want message part previews:
            /*
            const preview = MessageFormatter.generatePreview(lastMessage);
            await sender.sendPreview(lastMessage, '📱 Message Part Preview', 'message_part_preview');
            */
          }
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