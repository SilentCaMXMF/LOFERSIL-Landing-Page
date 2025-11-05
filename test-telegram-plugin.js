/**
 * Telegram Plugin Test Script
 * Tests sending an idle state message using the real bot token and chat ID from .env
 */

import { readFileSync } from 'fs';

// Load environment variables from .env file
const envContent = readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
for (const line of envLines) {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').trim();
    process.env[key.trim()] = value;
  }
}

// Telegram configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env file');
  process.exit(1);
}

/**
 * Send message to Telegram
 */
async function sendTelegramMessage(message) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Failed to send Telegram message:', error.message);
    throw error;
  }
}

/**
 * Test sending idle state message
 */
async function testIdleStateMessage() {
  console.log('🧪 Testing Telegram plugin - Idle State Message\n');

  const idleMessage = `
🤖 <b>LOFERSIL System Status</b>

📊 <i>Idle State Detected</i>
⏰ Timestamp: ${new Date().toISOString()}
🏢 System: LOFERSIL Landing Page
📍 Status: Idle (No active operations)

System is running normally and monitoring for activity.
  `.trim();

  try {
    console.log('1. Sending idle state message...');
    const result = await sendTelegramMessage(idleMessage);
    console.log('✅ Message sent successfully!');
    console.log('📨 Message ID:', result.result.message_id);
    console.log('📅 Timestamp:', new Date(result.result.date * 1000).toISOString());
    console.log('\n🎉 Telegram plugin test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testIdleStateMessage().catch(console.error);
