import SimpleTelegramBot from './lib/SimpleTelegramBot';
export const TelegramNotify = async ({ $ }) => {
    console.log('📲 TelegramNotify plugin loaded');
    // Initialize Telegram bot
    const bot = await SimpleTelegramBot.create();
    if (!bot) {
        console.warn('Telegram bot not initialized - check your TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables');
        return {}; // Return empty plugin if bot initialization fails
    }
    let lastMessage = '';
    const MAX_MESSAGE_LENGTH = 10000; // Limit stored messages to 10KB to prevent memory issues
    // Helper function to extract message content from event
    const extractMessageContent = (event) => {
        if ('message' in event && event.message)
            return event.message.content;
        if ('content' in event)
            return event.content || '';
        if ('part' in event && event.part)
            return event.part.content;
        return '';
    };
    return {
        event: async ({ event }) => {
            const e = event;
            if (e.type === 'session.idle') {
                // Send the last message content along with idle notification
                const message = lastMessage
                    ? `🟡 Session idle! Here's your last message:\n\n${lastMessage}`
                    : '🟡 Hey! Your OpenCode session is idle - time to check your work!';
                try {
                    const success = await bot.sendMessage(message);
                    if (!success) {
                        console.warn('Failed to send idle notification to Telegram');
                    }
                }
                catch (error) {
                    console.error('Error sending idle notification:', error);
                }
            }
            if (e.type === 'message.updated') {
                // Reset idle timer when user sends messages
                bot.resetActivity();
                const messageContent = extractMessageContent(e);
                // Check if it's a command to send last message
                if (messageContent.includes('/send-last') || messageContent.includes('/last')) {
                    try {
                        if (lastMessage) {
                            const success = await bot.sendMessage(`📱 Here's your last message:\n\n${lastMessage}`);
                            if (!success)
                                console.warn('Failed to send last message to Telegram');
                        }
                        else {
                            const success = await bot.sendMessage('📱 No previous message found.');
                            if (!success)
                                console.warn('Failed to send no message found notification');
                        }
                    }
                    catch (error) {
                        console.error('Error sending last message command response:', error);
                    }
                    return;
                }
                // Check if it's a command to send to phone
                if (messageContent.includes('/send-to-phone') || messageContent.includes('/phone')) {
                    try {
                        if (lastMessage) {
                            const success = await bot.sendMessage(`📱 Sending to your phone:\n\n${lastMessage}`);
                            if (!success)
                                console.warn('Failed to send message to phone');
                        }
                        else {
                            const success = await bot.sendMessage('📱 No message to send to phone.');
                            if (!success)
                                console.warn('Failed to send no message to phone notification');
                        }
                    }
                    catch (error) {
                        console.error('Error sending phone command response:', error);
                    }
                    return;
                }
                // Try to capture message content from the event
                try {
                    // Access message content if available (reuse the already extracted messageContent)
                    if (messageContent && messageContent !== 'Message updated') {
                        lastMessage =
                            messageContent.length > MAX_MESSAGE_LENGTH
                                ? messageContent.substring(0, MAX_MESSAGE_LENGTH) + '...[truncated]'
                                : messageContent;
                        // Send a preview of the message to Telegram
                        const preview = lastMessage.length > 200 ? lastMessage.substring(0, 200) + '...' : lastMessage;
                        try {
                            const success = await bot.sendMessage(`📱 Last message preview:\n\n${preview}`);
                            if (!success) {
                                console.warn('Failed to send message preview to Telegram');
                            }
                        }
                        catch (error) {
                            console.error('Error sending message preview:', error);
                        }
                    }
                }
                catch (error) {
                    // If we can't access the message content, just log it
                    console.warn("Message updated but couldn't capture content");
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
                        lastMessage =
                            partContent.length > MAX_MESSAGE_LENGTH
                                ? partContent.substring(0, MAX_MESSAGE_LENGTH) + '...[truncated]'
                                : partContent;
                        const preview = lastMessage.length > 200 ? lastMessage.substring(0, 200) + '...' : lastMessage;
                        try {
                            const success = await bot.sendMessage(`📱 Message part preview:\n\n${preview}`);
                            if (!success) {
                                console.warn('Failed to send message part preview to Telegram');
                            }
                        }
                        catch (error) {
                            console.error('Error sending message part preview:', error);
                        }
                    }
                }
                catch (error) {
                    console.warn("Message part updated but couldn't capture content");
                }
            }
        },
    };
};
