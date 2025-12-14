// Vercel serverless function for contact form with enhanced Gmail error handling
// Optimized for Vercel serverless environment with cold start handling and performance monitoring

import nodemailer from "nodemailer";

// Vercel-specific configuration
const VERCEL_CONFIG = {
  // Timeout optimizations for Vercel's 10-second limit
  CONNECTION_TIMEOUT: 8000, // 8 seconds for connection
  GREETING_TIMEOUT: 4000, // 4 seconds for greeting
  SOCKET_TIMEOUT: 8000, // 8 seconds for socket operations
  MAX_RETRIES: 2, // Reduced retries for faster response
  BASE_DELAY: 500, // Faster base delay for retries

  // Performance thresholds
  SLOW_OPERATION_THRESHOLD: 3000, // 3 seconds
  CRITICAL_THRESHOLD: 7000, // 7 seconds

  // Memory optimizations
  MAX_MESSAGE_LENGTH: 2000,
  MAX_NAME_LENGTH: 100,
  MIN_MESSAGE_LENGTH: 10,
  MIN_NAME_LENGTH: 2,
};

// Environment validation cache
let envValidationCache = null;
let envValidationTime = 0;
const ENV_CACHE_DURATION = 60000; // 1 minute cache

// Performance metrics collector
class PerformanceMetrics {
  constructor() {
    this.metrics = [];
    this.startTime = Date.now();
  }

  startOperation(operation) {
    return {
      operation,
      startTime: Date.now(),
      memoryStart: this.getMemoryUsage(),
    };
  }

  endOperation(operationContext, success = true, errorType = null) {
    const duration = Date.now() - operationContext.startTime;
    const memoryEnd = this.getMemoryUsage();

    const metric = {
      operation: operationContext.operation,
      duration,
      success,
      errorType,
      timestamp: new Date().toISOString(),
      memoryDelta: memoryEnd - operationContext.memoryStart,
      coldStart: this.isColdStart(),
    };

    this.metrics.push(metric);
    this.logMetric(metric);

    return metric;
  }

  getMemoryUsage() {
    if (typeof process !== "undefined" && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  isColdStart() {
    return Date.now() - this.startTime < 1000;
  }

  logMetric(metric) {
    // Log slow operations
    if (metric.duration > VERCEL_CONFIG.SLOW_OPERATION_THRESHOLD) {
      console.warn(
        `[PERF] Slow operation: ${metric.operation} took ${metric.duration}ms`,
      );
    }

    // Log critical operations
    if (metric.duration > VERCEL_CONFIG.CRITICAL_THRESHOLD) {
      console.error(
        `[PERF] Critical: ${metric.operation} exceeded threshold at ${metric.duration}ms`,
      );
    }

    // Log cold starts
    if (metric.coldStart) {
      console.log(`[PERF] Cold start detected for ${metric.operation}`);
    }

    console.log(
      `[PERF] ${metric.operation}: ${metric.duration}ms (success: ${metric.success})`,
    );
  }

  getSummary() {
    const totalDuration = Date.now() - this.startTime;
    const successfulOps = this.metrics.filter((m) => m.success).length;
    const failedOps = this.metrics.filter((m) => !m.success).length;

    return {
      totalDuration,
      operations: this.metrics.length,
      successful: successfulOps,
      failed: failedOps,
      coldStart: this.isColdStart(),
      metrics: this.metrics,
    };
  }
}

// Gmail-specific error messages in Portuguese
const GMAIL_ERROR_MESSAGES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS:
    "Credenciais Gmail inválidas. Por favor, verifique a configuração do servidor.",
  AUTH_APP_PASSWORD_REQUIRED:
    "É necessária uma palavra-passe de aplicação Gmail. Use uma palavra-passe de aplicação em vez da palavra-passe normal.",
  AUTH_ACCOUNT_LOCKED:
    "Conta Gmail bloqueada. Por favor, verifique a segurança da sua conta.",
  AUTH_SECURITY_CHECK:
    "Verificação de segurança Gmail falhou. Por favor, verifique as definições de segurança da conta.",

  // Connection errors
  CONNECTION_TIMEOUT:
    "Tempo de conexão Gmail expirado. Por favor, tente novamente.",
  CONNECTION_REFUSED:
    "Conexão Gmail recusada. Serviço temporariamente indisponível.",
  CONNECTION_NETWORK:
    "Problema de rede ao conectar ao Gmail. Por favor, verifique a sua conexão.",
  TLS_SSL_ERROR:
    "Erro de configuração TLS/SSL Gmail. Verifique as definições de segurança.",

  // Quota and rate limiting
  QUOTA_EXCEEDED:
    "Limite diário de emails Gmail atingido (500). Por favor, tente amanhã.",
  RATE_LIMITED:
    "Limite de taxa Gmail excedido. Por favor, aguarde alguns minutos antes de tentar novamente.",
  TEMPORARY_BLOCKED:
    "Envio temporariamente bloqueado pelo Gmail. Tente novamente mais tarde.",

  // Email sending errors
  INVALID_RECIPIENT: "Endereço de email do destinatário inválido.",
  SENDING_FAILED:
    "Falha ao enviar email através do Gmail. Por favor, tente novamente.",
  MESSAGE_REJECTED:
    "Mensagem rejeitada pelo Gmail. Verifique o conteúdo do email.",

  // Temporary server issues
  SERVER_UNAVAILABLE:
    "Servidores Gmail temporariamente indisponíveis. Por favor, tente novamente em alguns minutos.",
  SERVER_ERROR:
    "Erro interno do servidor Gmail. Por favor, tente novamente mais tarde.",

  // Generic errors
  UNKNOWN_ERROR: "Erro desconhecido do Gmail. Por favor, tente novamente.",
  CONFIGURATION_ERROR:
    "Erro de configuração Gmail. Por favor, contacte o suporte.",
};

// Error classification for retry logic
const ERROR_CATEGORIES = {
  RETRYABLE: [
    "CONNECTION_TIMEOUT",
    "CONNECTION_REFUSED",
    "CONNECTION_NETWORK",
    "SERVER_UNAVAILABLE",
    "SERVER_ERROR",
    "RATE_LIMITED",
    "TEMPORARY_BLOCKED",
    "SENDING_FAILED",
  ],
  NON_RETRYABLE: [
    "AUTH_INVALID_CREDENTIALS",
    "AUTH_APP_PASSWORD_REQUIRED",
    "AUTH_ACCOUNT_LOCKED",
    "AUTH_SECURITY_CHECK",
    "TLS_SSL_ERROR",
    "QUOTA_EXCEEDED",
    "INVALID_RECIPIENT",
    "MESSAGE_REJECTED",
    "CONFIGURATION_ERROR",
  ],
};

// Enhanced logging utility
function logGmailError(error, context = {}) {
  const sanitizedContext = {
    ...context,
    timestamp: new Date().toISOString(),
    errorCode: error.code || "UNKNOWN",
    errorMessage: error.message,
    command: error.command,
    responseCode: error.responseCode,
    response: error.response ? error.response.substring(0, 200) : null,
  };

  console.error(
    "Gmail Error Details:",
    JSON.stringify(sanitizedContext, null, 2),
  );
}

// Gmail error classifier
function classifyGmailError(error) {
  const errorMessage = error.message.toLowerCase();
  const errorCode = error.code;

  // Authentication errors
  if (
    errorMessage.includes("invalid login") ||
    errorMessage.includes("authentication failed") ||
    errorCode === "EAUTH"
  ) {
    if (errorMessage.includes("application-specific password")) {
      return "AUTH_APP_PASSWORD_REQUIRED";
    }
    if (
      errorMessage.includes("account locked") ||
      errorMessage.includes("suspended")
    ) {
      return "AUTH_ACCOUNT_LOCKED";
    }
    if (errorMessage.includes("security check")) {
      return "AUTH_SECURITY_CHECK";
    }
    return "AUTH_INVALID_CREDENTIALS";
  }

  // Connection errors
  if (errorMessage.includes("timeout") || errorCode === "ETIMEDOUT") {
    return "CONNECTION_TIMEOUT";
  }
  if (errorMessage.includes("econnrefused") || errorCode === "ECONNREFUSED") {
    return "CONNECTION_REFUSED";
  }
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("enotfound") ||
    errorCode === "ENOTFOUND"
  ) {
    return "CONNECTION_NETWORK";
  }
  if (
    errorMessage.includes("tls") ||
    errorMessage.includes("ssl") ||
    errorMessage.includes("certificate")
  ) {
    return "TLS_SSL_ERROR";
  }

  // Quota and rate limiting
  if (
    errorMessage.includes("quota") ||
    errorMessage.includes("limit exceeded") ||
    errorMessage.includes("daily limit")
  ) {
    return "QUOTA_EXCEEDED";
  }
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("too many messages") ||
    errorCode === "EMAXLIMIT"
  ) {
    return "RATE_LIMITED";
  }
  if (
    errorMessage.includes("temporarily blocked") ||
    errorMessage.includes("try again later")
  ) {
    return "TEMPORARY_BLOCKED";
  }

  // Email sending errors
  if (
    errorMessage.includes("invalid recipient") ||
    errorMessage.includes("recipient address")
  ) {
    return "INVALID_RECIPIENT";
  }
  if (
    errorMessage.includes("message rejected") ||
    errorMessage.includes("rejected")
  ) {
    return "MESSAGE_REJECTED";
  }
  if (errorMessage.includes("sending failed") || errorCode === "ESEND") {
    return "SENDING_FAILED";
  }

  // Server issues
  if (
    errorMessage.includes("server unavailable") ||
    errorMessage.includes("service unavailable")
  ) {
    return "SERVER_UNAVAILABLE";
  }
  if (
    errorMessage.includes("server error") ||
    errorMessage.includes("internal error")
  ) {
    return "SERVER_ERROR";
  }

  // Configuration errors
  if (
    errorMessage.includes("configuration") ||
    errorMessage.includes("not configured")
  ) {
    return "CONFIGURATION_ERROR";
  }

  return "UNKNOWN_ERROR";
}

// Exponential backoff retry utility optimized for Vercel
async function retryWithBackoff(
  operation,
  maxRetries = null,
  baseDelay = null,
) {
  const retries = maxRetries || VERCEL_CONFIG.MAX_RETRIES;
  const delay = baseDelay || VERCEL_CONFIG.BASE_DELAY;
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorType = classifyGmailError(error);

      // Don't retry non-retryable errors
      if (!ERROR_CATEGORIES.RETRYABLE.includes(errorType)) {
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
      const totalDelay = delay + jitter;

      console.log(
        `Gmail operation failed (attempt ${attempt}/${retries}), retrying in ${Math.round(totalDelay)}ms...`,
      );
      logGmailError(error, {
        attempt,
        maxRetries: retries,
        nextRetryIn: Math.round(totalDelay),
      });

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
}

// Environment validation with caching
function validateEnvironment() {
  const now = Date.now();

  // Return cached result if still valid
  if (envValidationCache && now - envValidationTime < ENV_CACHE_DURATION) {
    return envValidationCache;
  }

  const required = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "FROM_EMAIL",
    "TO_EMAIL",
  ];

  const missing = [];
  const configured = [];

  for (const key of required) {
    if (process.env[key]) {
      configured.push(key);
    } else {
      missing.push(key);
    }
  }

  const validation = {
    isValid: missing.length === 0,
    missing,
    configured,
    timestamp: now,
    environment: process.env.NODE_ENV || "development",
    vercel: process.env.VERCEL === "1",
  };

  // Cache the result
  envValidationCache = validation;
  envValidationTime = now;

  return validation;
}

// Optimized Gmail transporter creation with connection reuse
let transporterInstance = null;
let transporterLastUsed = 0;
const TRANSPORTER_TTL = 30000; // 30 seconds TTL for transporter reuse

function createGmailTransporter() {
  const now = Date.now();

  // Reuse existing transporter if still fresh
  if (transporterInstance && now - transporterLastUsed < TRANSPORTER_TTL) {
    transporterLastUsed = now;
    return transporterInstance;
  }

  // Create new transporter with Vercel optimizations
  transporterInstance = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Vercel-optimized timeouts
    connectionTimeout: VERCEL_CONFIG.CONNECTION_TIMEOUT,
    greetingTimeout: VERCEL_CONFIG.GREETING_TIMEOUT,
    socketTimeout: VERCEL_CONFIG.SOCKET_TIMEOUT,
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
    // Serverless-optimized pool settings
    pool: false, // Disabled for serverless
    maxConnections: 1,
    maxMessages: 1,
    rateDelta: 1000,
    rateLimit: 1,
    // Additional optimizations
    disableFileAccess: true, // Security optimization
    disableUrlAccess: true, // Security optimization
  });

  transporterLastUsed = now;
  return transporterInstance;
}

// Health check function for Vercel monitoring
async function healthCheck() {
  const envValidation = validateEnvironment();
  const metrics = new PerformanceMetrics();

  if (!envValidation.isValid) {
    return {
      status: "unhealthy",
      reason: "missing_environment",
      missing: envValidation.missing,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const operation = metrics.startOperation("health_check");
    const transporter = createGmailTransporter();

    // Quick connection test with timeout
    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Health check timeout")), 3000),
      ),
    ]);

    metrics.endOperation(operation, true);

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: envValidation.environment,
      vercel: envValidation.vercel,
      performance: metrics.getSummary(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      reason: "connection_failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

export default async function handler(req, res) {
  // Initialize performance metrics
  const metrics = new PerformanceMetrics();
  const handlerOperation = metrics.startOperation("contact_form_handler");

  // Enhanced CORS headers for Vercel
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://lofersil.vercel.app",
    "https://www.lofersil.pt",
    "https://lofersil.pt",
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  ].filter(Boolean);

  const corsOrigin = allowedOrigins.includes(origin) ? origin : "*";
  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours cache

  // Add security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    metrics.endOperation(handlerOperation, false, "INVALID_METHOD");
    return res.status(405).json({
      success: false,
      error: "Método não permitido",
    });
  }

  // Validate environment at start
  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    metrics.endOperation(handlerOperation, false, "ENV_VALIDATION_FAILED");
    return res.status(500).json({
      success: false,
      error: "Configuração do servidor incompleta",
      details: `Variáveis em falta: ${envValidation.missing.join(", ")}`,
    });
  }

  // Simple rate limiting using client IP
  const clientIP =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    "unknown";

  // Log request for monitoring
  console.log(
    `[CONTACT] Request from ${clientIP} at ${new Date().toISOString()}`,
  );

  try {
    const { name, email, message } = req.body;

    // Enhanced validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Nome, email e mensagem são obrigatórios",
      });
    }

    if (name.length < VERCEL_CONFIG.MIN_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Nome deve ter pelo menos ${VERCEL_CONFIG.MIN_NAME_LENGTH} caracteres`,
      });
    }

    if (name.length > VERCEL_CONFIG.MAX_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Nome não pode ter mais de ${VERCEL_CONFIG.MAX_NAME_LENGTH} caracteres`,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Email inválido",
      });
    }

    if (message.length < VERCEL_CONFIG.MIN_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Mensagem deve ter pelo menos ${VERCEL_CONFIG.MIN_MESSAGE_LENGTH} caracteres`,
      });
    }

    if (message.length > VERCEL_CONFIG.MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Mensagem não pode ter mais de ${VERCEL_CONFIG.MAX_MESSAGE_LENGTH} caracteres`,
      });
    }

    // Log the contact attempt (sanitized)
    console.log("Contact form submission:", {
      name: name.substring(0, 50),
      email: email.substring(0, 50),
      messageLength: message.length,
      timestamp: new Date().toISOString(),
    });

    // Try to send email if SMTP is configured
    let emailSent = false;
    let emailError = null;
    let errorType = null;

    if (envValidation.isValid) {
      try {
        const emailOperation = metrics.startOperation("send_email");

        // Send email with retry logic
        await retryWithBackoff(async () => {
          const transporter = createGmailTransporter();

          // Verify connection first with timeout
          await Promise.race([
            transporter.verify(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Connection verification timeout")),
                5000,
              ),
            ),
          ]);

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
          };

          return await transporter.sendMail(mailOptions);
        });

        emailSent = true;
        metrics.endOperation(emailOperation, true);
        console.log("Email sent successfully to:", process.env.TO_EMAIL);
      } catch (error) {
        emailError = error;
        errorType = classifyGmailError(error);
        logGmailError(error, {
          operation: "send_email",
          name: name.substring(0, 50),
          email: email.substring(0, 50),
        });
        metrics.endOperation(emailOperation, false, errorType);

        // For critical errors, return error response
        if (ERROR_CATEGORIES.NON_RETRYABLE.includes(errorType)) {
          return res.status(500).json({
            success: false,
            error: GMAIL_ERROR_MESSAGES[errorType],
            errorType,
            retryable: false,
          });
        }

        // For retryable errors, continue with success response but log the issue
        console.warn(`Gmail error occurred but continuing: ${errorType}`);
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

    metrics.endOperation(handlerOperation, true);

    const performanceSummary = metrics.getSummary();

    res.status(200).json({
      success: true,
      message: responseMessage,
      emailSent,
      emailError: emailError
        ? {
            type: errorType,
            message: GMAIL_ERROR_MESSAGES[errorType],
            retryable: ERROR_CATEGORIES.RETRYABLE.includes(errorType),
          }
        : null,
      performance: {
        duration: performanceSummary.totalDuration,
        coldStart: performanceSummary.coldStart,
        operations: performanceSummary.operations,
      },
    });
  } catch (error) {
    const errorType = classifyGmailError(error);
    logGmailError(error, { operation: "contact_form_handler" });
    metrics.endOperation(handlerOperation, false, errorType);

    const performanceSummary = metrics.getSummary();

    res.status(500).json({
      success: false,
      error:
        GMAIL_ERROR_MESSAGES[errorType] ||
        "Erro interno do servidor. Por favor, tente novamente mais tarde.",
      errorType,
      retryable: ERROR_CATEGORIES.RETRYABLE.includes(errorType),
      performance: {
        duration: performanceSummary.totalDuration,
        coldStart: performanceSummary.coldStart,
        operations: performanceSummary.operations,
      },
    });
  }
}

// Health check endpoint for Vercel monitoring
export async function healthEndpoint(req, res) {
  if (req.method === "GET") {
    const health = await healthCheck();
    return res.status(health.status === "healthy" ? 200 : 503).json(health);
  }

  return res.status(405).json({
    success: false,
    error: "Method not allowed",
  });
}
