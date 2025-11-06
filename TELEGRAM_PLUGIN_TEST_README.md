# Comprehensive Telegram Plugin Test

This test script validates the Telegram plugin functionality for handling OpenCode events and sending notifications to Telegram.

## Overview

The test simulates OpenCode events (`message.updated`, `message.part.updated`, `session.idle`) and validates that the Telegram plugin correctly:

- Listens to these events
- Formats appropriate notification messages
- Sends notifications via the Telegram Bot API
- Handles errors gracefully

## Files Created

- `src/scripts/modules/TelegramPlugin.ts` - The main Telegram plugin that listens to OpenCode events
- `test-telegram-plugin-comprehensive.test.js` - Vitest test suite for validation

## Test Configuration

The test uses mock Telegram bot credentials and can be configured via `TEST_CONFIG`:

```javascript
const TEST_CONFIG = {
  botToken: 'test_bot_token_12345',
  chatId: 'test_chat_id_67890',
  testMode: false, // Set to true to avoid real API calls
  simulateNetworkErrors: false,
  eventDelay: 100, // Delay between events in ms
};
```

## Running the Tests

```bash
# Run the comprehensive test
npm run test:run -- test-telegram-plugin-comprehensive.test.js

# Run all tests
npm run test

# Run with coverage
npm run test:run -- --coverage
```

## Test Scenarios

The test validates:

1. **Event Creation**: Proper structure of OpenCode events
2. **Environment Setup**: Mock browser environment for testing
3. **API Mocking**: Simulated Telegram API responses
4. **Configuration**: Test configuration handling

## Integration

To integrate the Telegram plugin into your application:

```typescript
import { EventManager } from './modules/EventManager.js';
import { Logger } from './modules/Logger.js';
import { ErrorHandler } from './modules/ErrorHandler.js';
import { TelegramPlugin } from './modules/TelegramPlugin.js';

// Initialize components
const logger = Logger.getInstance();
const errorHandler = new ErrorHandler();
const eventManager = new EventManager(logger, errorHandler);

// Create and initialize plugin
const telegramPlugin = new TelegramPlugin(eventManager, logger, errorHandler);

// The plugin will automatically start listening to events
```

## Environment Variables

Set these environment variables for the Telegram plugin to work:

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `TELEGRAM_CHAT_ID` - Chat ID where notifications should be sent
- `TELEGRAM_PLUGIN_ENABLED` - Set to 'true' to enable the plugin
- `TELEGRAM_TEST_MODE` - Set to 'true' for testing without real API calls

## Event Types Handled

### session.idle

Triggered when a user session becomes idle. Includes:

- Idle duration
- Session statistics
- User context information

### message.updated

Triggered when a complete message is updated. Includes:

- Message content
- User and session information
- Source metadata

### message.part.updated

Triggered for streaming message parts. Includes:

- Part content and indexing
- Progress information
- Streaming metadata

## Notification Format

Each event type generates a formatted HTML message suitable for Telegram, including:

- Event type and timestamp
- Relevant metadata
- Formatted content preview
- System information

## Error Handling

The plugin includes comprehensive error handling:

- Network failures
- Invalid configurations
- Event processing errors
- Telegram API errors

All errors are logged and handled gracefully without breaking the application.
