# OpenCode Telegram Plugin

Secure Telegram notifications for OpenCode sessions with comprehensive security hardening.

## Files

- **`telegram-notify.ts`** - Main OpenCode plugin for session events
- **`notify.ts`** - Simple system notification plugin (uses `say`)
- **`lib/SimpleTelegramBot.ts`** - Core Telegram bot implementation with security features
- **`lib/security-utils.ts`** - Security utilities and audit logging
- **`lib/SimpleTelegramBot.test.ts`** - Comprehensive security test suite
- **`tsconfig.json`** - TypeScript configuration

## Security Features

- 🔒 **Input Validation**: Comprehensive validation of all inputs (messages, tokens, IDs)
- 🧹 **Message Sanitization**: DOMPurify-based HTML sanitization preventing XSS
- 🚦 **Rate Limiting**: Built-in rate limiting to prevent API abuse
- 📊 **Audit Logging**: Security event logging without sensitive data exposure
- ⚙️ **Secure Configuration**: Environment-based configuration with validation
- 🚫 **Error Handling**: Security-conscious error messages that don't leak information
- 🛡️ **Control Character Protection**: Blocks null bytes and dangerous control characters

## Features

- 🕐 **Enhanced Session Idle Detection**: Comprehensive idle notifications with 5-second delay and last message context
- 📱 **Advanced Telegram Integration**: Secure message delivery with rate limiting and sanitization
- 📝 **Intelligent Message Capture**: Captures messages from multiple event types (message.updated, message.part.updated) for idle notifications
- 🚀 **Session Lifecycle Tracking**: Monitors complete session activity and idle states
- ✅ **Task Completion Notifications**: Tracks and reports on completed work sessions
- ❌ **Error Notifications**: Comprehensive error handling and reporting
- 🛡️ **Security Hardened**: Input validation, message sanitization, and audit logging
- 💬 **Interactive Commands**: `/send-last`, `/send-to-phone` for manual message forwarding
- 🔍 **Debug Logging**: Extensive logging for troubleshooting session.idle events
- 🚫 **No Message Spam**: Message previews disabled by default to prevent notification overload

## Usage

### As OpenCode Plugin

```javascript
// The plugin automatically responds to session events
import { TelegramNotify } from './telegram-notify.js';
```

**Commands you can use in OpenCode:**

- `/send-last` - Send the last message to Telegram
- `/send-to-phone` - Send the last message to your phone
- `/last` - Same as `/send-last`
- `/phone` - Same as `/send-to-phone`


### Standalone Bot

```bash
# Run the bot directly
bun telegram-bot.ts

# Test the plugin
bun telegram-notify.ts
```

### Setup

1. **Create a Telegram Bot**
   - Message @BotFather on Telegram
   - Create a new bot with `/newbot`
   - Save the bot token

2. **Get Your Chat ID**
   - Start a chat with your bot
   - Send a message to the bot
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your `chat_id` in the response

3. **Configure Environment Variables**

   ```bash
   export TELEGRAM_BOT_TOKEN="your_bot_token_here"
   export TELEGRAM_CHAT_ID="your_chat_id_here"
   ```

4. **Or Update Configuration**
   Edit `.opencode/plugin/telegram-config.json`:
   ```json
   {
     "telegramIdle": {
       "enabled": true,
       "botToken": "your_bot_token_here",
       "chatId": "your_chat_id_here"
     }
   }
   ```

### Usage

The plugin automatically initializes when OpenCode starts. It will:

- Monitor session activity
- Send idle notifications after 5 minutes of inactivity
- Send resume notifications when activity resumes
- Clean up resources on session end

### Customization

You can customize the plugin behavior by modifying the configuration:

- `idleTimeout`: Time in milliseconds before considering session idle
- `checkInterval`: How often to check for idle state
- `notificationDelayMs`: Delay in milliseconds before sending idle notifications
- `messages`: Customize notification messages

### Integration with OpenCode

To integrate this plugin with OpenCode's event system, you would need to:

1. Hook into OpenCode's activity tracking events
2. Call `handleActivity()` when user interacts with OpenCode
3. Call `init()` when OpenCode session starts
4. Call `cleanup()` when OpenCode session ends

## Security Considerations

### Input Validation

The plugin validates all inputs to prevent malicious content:

- **Message Content**: Length limits, control character detection, HTML sanitization
- **Bot Tokens**: Format validation, length checks, character validation
- **Chat IDs**: Numeric format validation, length constraints

### Message Sanitization

Messages are sanitized using DOMPurify to prevent XSS attacks:

- **Allowed Tags**: `<b>`, `<i>`, `<u>`, `<s>`, `<code>`, `<pre>` (Telegram-safe)
- **Blocked**: Scripts, event handlers, dangerous attributes
- **Fallback**: Basic HTML escaping if DOMPurify unavailable

### Rate Limiting

Built-in rate limiting prevents API abuse:

- **Per-Message Interval**: Minimum 1 second between messages
- **Window Limits**: Maximum 20 messages per minute
- **Telegram Compliance**: Respects Telegram's API rate limits

### Audit Logging

Security events are logged without exposing sensitive data:

- **Event Types**: Configuration loads, message sends, validation failures, rate limit hits
- **Data Sanitization**: Sensitive fields (tokens, passwords) are masked
- **Log Levels**: Configurable logging levels (info, warn, error)

### Configuration Security

Environment variables are validated and securely managed:

- **Required Variables**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- **Optional Variables**: Rate limits, timeouts, enable/disable flag
- **Validation**: Format checking, constraint validation, secure defaults

### Error Handling

Errors are handled securely without information leakage:

- **User-Facing**: Generic error messages
- **Logging**: Detailed internal logging for debugging
- **Retry Logic**: Automatic retry for transient failures

## Testing

### Security Tests

Run the comprehensive security test suite:

```bash
npm run test:run .opencode/plugin/lib/SimpleTelegramBot.test.ts
```

Test coverage includes:

- Input validation (XSS prevention, control characters, length limits)
- Message sanitization (HTML injection, safe tags, attribute stripping)
- Rate limiting (interval enforcement, window limits)
- Configuration validation (token formats, environment variables)
- Error handling (secure messages, retry logic)
- Audit logging (data masking, event tracking)

### Manual Testing

Test the plugin independently:

```bash
# Test with mock environment
TELEGRAM_BOT_TOKEN="123456789:AAFakeTokenForTestingPurposes123456789" \
TELEGRAM_CHAT_ID="123456789" \
node .opencode/plugin/telegram-notify.ts
```

### Development Testing

For development testing, use the comprehensive test suite:

```bash
# Run security and functionality tests
npm run test:run .opencode/plugin/lib/SimpleTelegramBot.test.ts
```

## Troubleshooting

### Security-Related Issues

- **"Message validation failed"**: Check message content for control characters or excessive length
- **"Rate limit exceeded"**: Wait before sending more messages or adjust rate limit settings
- **"Configuration validation failed"**: Verify token format and chat ID are correct

### General Issues

- **"Bot token not configured"**: Set `TELEGRAM_BOT_TOKEN` environment variable
- **"Chat ID not configured"**: Set `TELEGRAM_CHAT_ID` environment variable
- **"Failed to send message"**: Check bot token and chat ID are correct
- **No notifications**: Ensure bot is started and chat is active

### Session Idle Issues

- **No idle notifications**: Check OpenCode console logs for `📥 TelegramNotify received event: session.idle` messages
- **Missing message context**: Verify that `message.updated` or `message.part.updated` events are being received before idle
- **Plugin not loading**: Look for `📲 TelegramNotify plugin loaded` in OpenCode logs
- **Event structure issues**: Check for `⏰ DEBUG: session.idle event received` logs with full event details
- **Bot configuration**: Ensure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are properly set

### Environment Variables

| Variable                  | Required | Default  | Description                           |
| ------------------------- | -------- | -------- | ------------------------------------- |
| `TELEGRAM_BOT_TOKEN`      | Yes      | -        | Bot token from @BotFather             |
| `TELEGRAM_CHAT_ID`        | Yes      | -        | Chat ID for notifications             |
| `TELEGRAM_ENABLED`        | No       | `true`   | Enable/disable the plugin             |
| `TELEGRAM_IDLE_TIMEOUT`   | No       | `300000` | Idle timeout in ms (5 min)            |
| `TELEGRAM_CHECK_INTERVAL` | No       | `30000`  | Check interval in ms (30 sec)         |
| `TELEGRAM_MAX_RETRIES`           | No       | `3`      | Max retry attempts                    |
| `TELEGRAM_RATE_LIMIT_MS`         | No       | `1000`   | Min interval between messages (1 sec) |
| `TELEGRAM_NOTIFICATION_DELAY_MS` | No       | `5000`   | Delay before sending idle notifications (5 sec) |

## Security Best Practices

### Token Management

- **Never commit tokens** to version control
- **Use environment variables** for all sensitive configuration
- **Rotate tokens regularly** for enhanced security
- **Limit token permissions** to only necessary bot capabilities

### Message Content

- **Validate all inputs** before processing
- **Sanitize HTML content** to prevent XSS attacks
- **Limit message lengths** to prevent abuse
- **Monitor for suspicious patterns** in message content

### Rate Limiting

- **Configure appropriate limits** for your usage patterns
- **Monitor rate limit hits** for potential abuse
- **Implement exponential backoff** for retries
- **Respect API provider limits** to avoid service disruption

### Logging and Monitoring

- **Enable audit logging** for security monitoring
- **Monitor failed authentication** attempts
- **Set up alerts** for unusual activity patterns
- **Regularly review logs** for security incidents

### Configuration

- **Use secure defaults** for all settings
- **Validate configuration** on startup
- **Document security settings** for team members
- **Test configuration changes** in staging environments

### Development

- **Run security tests** as part of CI/CD pipeline
- **Code review** security-related changes
- **Keep dependencies updated** for security patches
- **Follow principle of least privilege** in all configurations
