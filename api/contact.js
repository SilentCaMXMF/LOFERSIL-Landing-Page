// Vercel serverless function for contact form
// Inline Telegram functionality for testing
class InlineTelegramBot {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    this.enabled = !!(this.botToken && this.chatId);
  }

  async sendContactNotification(contactData) {
    if (!this.enabled) {
      return 'Telegram bot not enabled';
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
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

      const response = await fetch(url, {
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
        const errorText = await response.text();
        return `Telegram API error: ${response.status} - ${errorText}`;
      }

      const result = await response.json();

      if (!result.ok) {
        return `Telegram API error: ${result.description}`;
      }

      return true;
    } catch (error) {
      return `Network error: ${error.message}`;
    }
  }

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

  isEnabled() {
    return this.enabled;
  }
}

const telegramBot = new InlineTelegramBot();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Nome, email e mensagem são obrigatórios',
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Nome deve ter pelo menos 2 caracteres',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido',
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Mensagem deve ter pelo menos 10 caracteres',
      });
    }

    // Log the contact attempt
    console.log('Contact form submission:', { name, email, message });

    // Send Telegram notification (don't fail the request if Telegram fails)
    let telegramSuccess = false;
    let telegramErrorMessage = '';
    if (telegramBot) {
      try {
        const result = await telegramBot.sendContactNotification({
          name,
          email,
          message,
        });
        if (typeof result === 'boolean') {
          telegramSuccess = result;
        } else {
          // If it returns an error message
          telegramSuccess = false;
          telegramErrorMessage = result;
        }
      } catch (telegramError) {
        console.error('Telegram notification failed, but continuing with response:', telegramError);
        telegramErrorMessage = telegramError.message;
        // Don't fail the request due to Telegram issues
      }
    } else {
      console.warn('Telegram bot not available');
      telegramErrorMessage = 'Telegram bot not available';
    }

    // Log Telegram status
    if (telegramSuccess) {
      console.log('Telegram notification sent successfully');
    } else {
      console.warn('Telegram notification was not sent (credentials missing or API error)');
    }

    res.status(200).json({
      success: true,
      message: 'Mensagem enviada com sucesso! Entraremos em contacto em breve.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor. Por favor, tente novamente mais tarde.',
    });
  }
}
