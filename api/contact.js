// Vercel serverless function for contact form
import nodemailer from "nodemailer";

// Enhanced email retry logic and error handling
class EmailService {
  constructor() {
    this.retryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      retryableErrors: [
        "ECONNRESET",
        "ETIMEDOUT",
        "ENOTFOUND",
        "ECONNREFUSED",
        "timeout",
        "connection",
        "network",
        "temporary",
      ],
      nonRetryableErrors: [
        "authentication failed",
        "invalid credentials",
        "authentication credentials invalid",
        "535",
        "530",
      ],
      rateLimitErrors: [
        "rate limit",
        "too many messages",
        "429",
        "451",
        "452",
        "454",
      ],
    };
  }

  categorizeError(error) {
    const errorMessage = error.message.toLowerCase();

    if (
      this.retryConfig.nonRetryableErrors.some((pattern) =>
        errorMessage.includes(pattern),
      )
    ) {
      return "AUTHENTICATION";
    }

    if (
      this.retryConfig.rateLimitErrors.some((pattern) =>
        errorMessage.includes(pattern),
      )
    ) {
      return "RATE_LIMIT";
    }

    if (
      this.retryConfig.retryableErrors.some((pattern) =>
        errorMessage.includes(pattern),
      )
    ) {
      if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("etimedout")
      ) {
        return "TIMEOUT";
      }
      if (
        errorMessage.includes("network") ||
        errorMessage.includes("connection")
      ) {
        return "NETWORK";
      }
      return "TRANSIENT";
    }

    if (
      errorMessage.includes("permanent") ||
      errorMessage.includes("550") ||
      errorMessage.includes("551")
    ) {
      return "PERMANENT";
    }

    if (
      errorMessage.includes("config") ||
      errorMessage.includes("setup") ||
      errorMessage.includes("invalid")
    ) {
      return "CONFIGURATION";
    }

    return "TRANSIENT";
  }

  shouldRetry(error, attempts, errorType) {
    if (attempts >= this.retryConfig.maxAttempts) {
      return false;
    }

    switch (errorType) {
      case "AUTHENTICATION":
      case "CONFIGURATION":
      case "PERMANENT":
        return false;

      case "RATE_LIMIT":
      case "TRANSIENT":
      case "NETWORK":
      case "TIMEOUT":
        return true;

      default:
        return false;
    }
  }

  calculateRetryDelay(attempt, errorType) {
    let delay =
      this.retryConfig.baseDelay *
      Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);

    if (errorType === "RATE_LIMIT") {
      delay = Math.max(delay, 60000);
    }

    delay = Math.min(delay, this.retryConfig.maxDelay);

    if (this.retryConfig.jitter) {
      const jitterAmount = delay * 0.1;
      delay += Math.random() * jitterAmount * 2 - jitterAmount;
    }

    return Math.max(delay, 100);
  }

  async sendEmailWithRetry(mailOptions, transporter) {
    let lastError;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        const result = await transporter.sendMail(mailOptions);
        return { success: true, result, attempts: attempt };
      } catch (error) {
        lastError = error;
        const errorType = this.categorizeError(error);

        console.error(`Email send attempt ${attempt} failed:`, {
          error: error.message,
          code: error.code,
          errorType,
          timestamp: new Date().toISOString(),
        });

        if (!this.shouldRetry(error, attempt, errorType)) {
          break;
        }

        if (attempt < this.retryConfig.maxAttempts) {
          const delay = this.calculateRetryDelay(attempt, errorType);
          console.log(
            `Retrying email send in ${delay}ms (attempt ${attempt + 1}/${this.retryConfig.maxAttempts})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: this.retryConfig.maxAttempts,
      errorType: this.categorizeError(lastError),
    };
  }

  generateUserMessage(errorType) {
    switch (errorType) {
      case "RATE_LIMIT":
        return "O sistema está a processar muitas solicitações. Por favor, tente novamente dentro de alguns minutos.";

      case "TIMEOUT":
        return "A ligação ao servidor de email demorou demasiado tempo. Por favor, tente novamente.";

      case "NETWORK":
        return "Problema de conectividade com o servidor de email. Por favor, verifique a sua ligação e tente novamente.";

      case "AUTHENTICATION":
        return "Ocorreu um erro de configuração no serviço de email. A nossa equipa foi notificada.";

      case "CONFIGURATION":
        return "Serviço de email temporariamente indisponível. Por favor, tente novamente mais tarde.";

      case "PERMANENT":
        return "Não foi possível entregar o email para o endereço fornecido. Por favor, verifique o endereço e tente novamente.";

      default:
        return "Ocorreu um erro ao enviar o email. Por favor, tente novamente mais tarde.";
    }
  }

  generateAdminMessage(errorType, error) {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] Email sending failed`;

    switch (errorType) {
      case "AUTHENTICATION":
        return `${baseMessage} - AUTHENTICATION ERROR: SMTP credentials are invalid or expired. Immediate attention required. Error: ${error.message}`;

      case "CONFIGURATION":
        return `${baseMessage} - CONFIGURATION ERROR: SMTP configuration is invalid. Error: ${error.message}`;

      case "RATE_LIMIT":
        return `${baseMessage} - RATE LIMIT: SMTP provider rate limit exceeded. Consider implementing throttling. Error: ${error.message}`;

      case "PERMANENT":
        return `${baseMessage} - PERMANENT FAILURE: Email permanently rejected. Check recipient address and sender reputation. Error: ${error.message}`;

      default:
        return `${baseMessage} - TRANSIENT ERROR: Temporary failure, retry recommended. Error: ${error.message}`;
    }
  }

  needsAdminAttention(errorType) {
    return ["AUTHENTICATION", "CONFIGURATION", "PERMANENT"].includes(errorType);
  }
}

const emailService = new EmailService();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Nome, email e mensagem são obrigatórios",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Nome deve ter pelo menos 2 caracteres",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Email inválido",
      });
    }

    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        error: "Mensagem deve ter pelo menos 10 caracteres",
      });
    }

    // Log the contact attempt
    console.log("Contact form submission:", {
      name,
      email,
      message,
      timestamp: new Date().toISOString(),
    });

    // Try to send email if SMTP is configured
    let emailSent = false;
    let emailError = null;
    let userMessage = "";

    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587"),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          // Enhanced connection configuration
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          rateDelta: 1000,
          rateLimit: 5,
          timeout: parseInt(process.env.SMTP_TIMEOUT || "30000"),
        });

        const mailOptions = {
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: process.env.TO_EMAIL || process.env.SMTP_USER,
          subject: `Nova mensagem de contacto - ${name}`,
          html: `
            <h2>Nova mensagem de contacto</h2>
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mensagem:</strong></p>
            <p>${message.replace(/\n/g, "<br>")}</p>
            <hr>
            <p><small>Enviado através do formulário de contacto em ${new Date().toLocaleString("pt-PT")}</small></p>
          `,
          replyTo: email,
          // Additional headers for better deliverability
          headers: {
            "X-Priority": "3",
            "X-Mailer": "LOFERSIL Contact Form",
            "X-Original-To": email,
          },
        };

        // Verify connection first
        try {
          await transporter.verify();
          console.log("SMTP connection verified successfully");
        } catch (verifyError) {
          console.error("SMTP verification failed:", verifyError);
          // Continue with send attempt even if verification fails
        }

        // Send email with retry logic
        const emailResult = await emailService.sendEmailWithRetry(
          mailOptions,
          transporter,
        );

        if (emailResult.success) {
          emailSent = true;
          console.log("Email sent successfully to:", process.env.TO_EMAIL, {
            messageId: emailResult.result.messageId,
            attempts: emailResult.attempts,
            responseTime: emailResult.result.responseTime,
          });
        } else {
          emailError = emailResult.error;
          const errorType = emailResult.errorType;

          console.error("Email sending failed after retries:", {
            error: emailError.message,
            code: emailError.code,
            attempts: emailResult.attempts,
            errorType,
            timestamp: new Date().toISOString(),
          });

          // Generate appropriate messages
          userMessage = emailService.generateUserMessage(errorType);
          const adminMessage = emailService.generateAdminMessage(
            errorType,
            emailError,
          );

          // Log admin message for monitoring
          console.error(adminMessage);

          // For critical errors, you might want to send alerts to admins
          if (emailService.needsAdminAttention(errorType)) {
            console.error("CRITICAL: Email service requires admin attention", {
              errorType,
              errorMessage: emailError.message,
              timestamp: new Date().toISOString(),
            });
          }
        }

        // Close the connection pool
        transporter.close();
      } catch (error) {
        emailError = error;
        console.error("Email service error:", {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
        userMessage =
          "Ocorreu um erro ao enviar o email. Por favor, tente novamente mais tarde.";
      }
    } else {
      console.log("SMTP not configured, skipping email send");
      userMessage =
        "Serviço de email não configurado. A sua mensagem foi registada.";
    }

    // Determine the appropriate response message
    let responseMessage;
    if (emailSent) {
      responseMessage =
        "Mensagem enviada com sucesso! Entraremos em contacto em breve.";
    } else if (emailError) {
      // Use the user-friendly error message if available
      responseMessage =
        userMessage ||
        "Mensagem registada com sucesso! Entraremos em contacto em breve.";
    } else {
      responseMessage =
        "Mensagem registada com sucesso! Entraremos em contacto em breve.";
    }

    res.status(200).json({
      success: true,
      message: responseMessage,
      emailSent,
      emailError: emailError
        ? {
            message: emailError.message,
            type: emailService.categorizeError(emailError),
            timestamp: new Date().toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Contact form error:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      requestBody: {
        name: req.body.name || "not provided",
        email: req.body.email || "not provided",
        messageLength: req.body.message?.length || 0,
      },
    });

    res.status(500).json({
      success: false,
      error: "Erro interno do servidor. Por favor, tente novamente mais tarde.",
      errorDetails:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              timestamp: new Date().toISOString(),
            }
          : undefined,
    });
  }
}
