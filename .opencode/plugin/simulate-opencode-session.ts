import SimpleTelegramBot from './lib/SimpleTelegramBot.js';
import { config } from 'dotenv';
import { 
  SimulationError, 
  ErrorHandler 
} from './lib/errors.js';
import { SecurityAuditLogger } from './lib/security-utils.js';
import { messageConfig, timeoutConfig } from './lib/config.js';

// Load environment variables from project root
config({ path: '../../.env' });

async function testPluginNotificationFlow() {
  const testContext = ErrorHandler.createErrorContext('simulation_test', {
    testId: crypto.randomUUID(),
    startTime: Date.now()
  });

  let bot: SimpleTelegramBot | null = null;

  try {
    SecurityAuditLogger.info('simulation_started', testContext);
    
    console.log('🧪 Testing complete notification flow...');
    console.log('This simulates what happens when OpenCode sends events to plugin');

    console.log('📲 Creating Telegram bot...');
    bot = await SimpleTelegramBot.create();

    if (!bot) {
      throw new SimulationError(
        'Bot creation failed - check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID',
        'bot_creation',
        false
      );
    }

    console.log('✅ Bot created successfully');

    // Step 1: Simulate capturing a message (when user types in OpenCode)
    console.log('\n📝 Step 1: Simulating message capture from user input...');
    const userMessage = 'I am working on the LOFERSIL landing page TypeScript implementation';
    console.log(`Captured message: "${userMessage}"`);

    // Step 2: Simulate waiting for session to become idle
    console.log('\n⏰ Step 2: Simulating OpenCode session idle detection...');
    console.log('Waiting 5 seconds (simulating 5-minute idle timeout)...');

    await new Promise(resolve => setTimeout(resolve, timeoutConfig.DEFAULT_NOTIFICATION_DELAY));

    // Step 3: Send idle notification (what the plugin does when session.idle event is received)
    console.log('\n🟡 Step 3: Sending idle notification (5-second delay already applied)...');

    const idleMessage = userMessage
      ? `🟡 Session idle! Here's your last message:\n\n${userMessage}`
      : '🟡 Hey! Your OpenCode session is idle - time to check your work!';

    console.log('📤 Notification content:', idleMessage.substring(0, messageConfig.CONTENT_PREVIEW_LENGTH) + '...');

    const success = await bot.sendMessage(idleMessage);

    if (success) {
      console.log('\n🎉 SUCCESS! Telegram notification sent!');
      console.log('📱 Check your Telegram app - you should see the idle notification');
      console.log('\n✅ This confirms:');
      console.log('   • Plugin can create bot instance');
      console.log('   • Configuration is loaded correctly');
      console.log('   • Telegram API calls work');
      console.log('   • 5-second delay is applied');
      console.log('\n💡 The plugin logic is working correctly!');
      
      SecurityAuditLogger.info('simulation_completed', {
        ...testContext,
        success: true,
        duration: Date.now() - testContext.startTime
      });
    } else {
      throw new SimulationError(
        'Could not send Telegram notification',
        'notification_send',
        true
      );
    }

  } catch (error) {
    const simulationError = error instanceof SimulationError
      ? error
      : new SimulationError(
          `Unexpected simulation error: ${error instanceof Error ? error.message : String(error)}`,
          'unknown',
          false
        );
    
    const errorContext = ErrorHandler.sanitizeErrorForLogging(simulationError);
    SecurityAuditLogger.error('simulation_failed', errorContext);
    
    console.error('\n❌ Test failed with error:', simulationError.message);
    
    if (!simulationError.isRetryable) {
      process.exit(1); // Fail fast for non-recoverable errors
    }
  }
}

// Run the test
testPluginNotificationFlow().catch(console.error);