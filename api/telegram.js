// Server-side Telegram notification module for Vercel serverless functions
class ServerTelegramBot {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    this.enabled = !!(this.botToken && this.chatId);

    console.log('ServerTelegramBot constructor:');
    console.log('- TELEGRAM_BOT_TOKEN present:', !!this.botToken, this.botToken ? '(length: ' + this.botToken.length + ')' : '');
    console.log('- TELEGRAM_CHAT_ID present:', !!this.chatId, this.chatId ? '(length: ' + this.chatId.length + ')' : '');
    console.log('- enabled:', this.enabled);

    if (!this.enabled) {
      console.warn('ServerTelegramBot: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables');
    }
  }

  /**
   * Send a contact form notification to Telegram
   */
  async sendContactNotification(contactData) {
    if (!this.enabled) {
      console.log('ServerTelegramBot: Telegram notifications disabled - missing credentials');
      return false;
    }

    const message = `
📬 <b>Nova Mensagem de Contacto - LOFERSIL</b>

👤 <b>Nome:</b> ${this.escapeHtml(contactData.name)}
📧 <b>Email:</b> ${this.escapeHtml(contactData.email)}
💬 <b>Mensagem:</b>
${this.escapeHtml(contactData.message)}

⏰ <b>Data/Hora:</b> ${new Date().toLocaleString('pt-PT')}
🏢 <b>Sistema:</b> LOFERSIL Landing Page
    `.trim();

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Telegram API error: ${response.status} - ${errorData.description || response.statusText}`
        );
      }

      const result = await response.json();
      if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
      }

      console.log('ServerTelegramBot: Contact notification sent successfully');
      return true;
    } catch (error) {
      console.error('ServerTelegramBot: Failed to send contact notification:', error);
      return false;
    }
  }

  /**
   * Send a system status notification to Telegram
   */
  async sendSystemNotification(message) {
    if (!this.enabled) {
      console.log('ServerTelegramBot: Telegram notifications disabled - missing credentials');
      return false;
    }

    const fullMessage = `
🤖 <b>LOFERSIL System Notification</b>

${message}

⏰ <b>Timestamp:</b> ${new Date().toISOString()}
🏢 <b>System:</b> LOFERSIL Landing Page
    `.trim();

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: fullMessage,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Telegram API error: ${response.status} - ${errorData.description || response.statusText}`
        );
      }

      const result = await response.json();
      if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
      }

      console.log('ServerTelegramBot: System notification sent successfully');
      return true;
    } catch (error) {
      console.error('ServerTelegramBot: Failed to send system notification:', error);
      return false;
    }
  }

  /**
   * Escape HTML characters for Telegram HTML parsing
   */
  escapeHtml(text) {
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
  }

  /**
   * Check if Telegram bot is properly configured
   */
  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
const telegramBot = new ServerTelegramBot();
module.exports = { telegramBot };
