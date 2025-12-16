/**
 * Vercel Serverless SMTP Test Endpoint
 * Tests Gmail connection from serverless environment
 * Verifies environment variables and provides detailed status
 */

import nodemailer from "nodemailer";

// Vercel-specific configuration
const VERCEL_CONFIG = {
  // Timeout optimizations for Vercel's 10-second limit
  CONNECTION_TIMEOUT: 7000, // 7 seconds for connection
  GREETING_TIMEOUT: 3000, // 3 seconds for greeting
  SOCKET_TIMEOUT: 7000, // 7 seconds for socket operations

  // Performance thresholds
  SLOW_OPERATION_THRESHOLD: 2000, // 2 seconds
  CRITICAL_THRESHOLD: 5000, // 5 seconds

  // Rate limiting for test endpoint
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 10, // Max 10 requests per minute

  // Caching
  CACHE_DURATION: 300000, // 5 minutes cache for test results
};

// Simple in-memory rate limiting (for production, use Redis)
const rateLimitStore = new Map();

// Test result cache
const testResultCache = new Map();

// Performance metrics for test endpoint
class TestPerformanceMetrics {
  constructor() {
    this.startTime = Date.now();
    this.operations = [];
  }

  startOperation(name) {
    return {
      name,
      startTime: Date.now(),
      memoryStart: this.getMemoryUsage(),
    };
  }

  endOperation(context, success = true, error = null) {
    const duration = Date.now() - context.startTime;
    const memoryEnd = this.getMemoryUsage();

    const operation = {
      name: context.name,
      duration,
      success,
      error: error?.message,
      timestamp: new Date().toISOString(),
      memoryDelta: memoryEnd - context.memoryStart,
    };

    this.operations.push(operation);
    this.logOperation(operation);

    return operation;
  }

  getMemoryUsage() {
    if (typeof process !== "undefined" && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  logOperation(operation) {
    if (operation.duration > VERCEL_CONFIG.CRITICAL_THRESHOLD) {
      console.error(
        `[TEST-PERF] Critical: ${operation.name} took ${operation.duration}ms`,
      );
    } else if (operation.duration > VERCEL_CONFIG.SLOW_OPERATION_THRESHOLD) {
      console.warn(
        `[TEST-PERF] Slow: ${operation.name} took ${operation.duration}ms`,
      );
    } else {
      console.log(`[TEST-PERF] ${operation.name}: ${operation.duration}ms`);
    }
  }

  getSummary() {
    const totalDuration = Date.now() - this.startTime;
    const successful = this.operations.filter((op) => op.success).length;
    const failed = this.operations.filter((op) => !op.success).length;

    return {
      totalDuration,
      operations: this.operations.length,
      successful,
      failed,
      operations: this.operations,
    };
  }
}

// Portuguese messages
const messages = {
  testing: "🧪 A testar conexão SMTP...",
  success: "✅ Sucesso",
  error: "❌ Erro",
  warning: "⚠️ Aviso",
  info: "ℹ️ Informação",

  envCheck: "Verificação de Variáveis de Ambiente",
  connectionTest: "Teste de Conexão SMTP",
  authTest: "Teste de Autenticação",
  emailTest: "Teste de Envio de Email",

  envOk: "Variáveis de ambiente configuradas",
  envMissing: "Variáveis de ambiente em falta",
  connected: "Conectado ao servidor SMTP",
  authSuccess: "Autenticação bem-sucedida",
  emailSent: "Email de teste enviado",

  connectionFailed: "Falha na conexão",
  authFailed: "Falha na autenticação",
  emailFailed: "Falha no envio",
  timeout: "Timeout na conexão",
  serverError: "Erro interno do servidor",
};

/**
 * Rate limiting check
 */
function checkRateLimit(clientIP) {
  const now = Date.now();
  const windowStart = now - VERCEL_CONFIG.RATE_LIMIT_WINDOW;

  // Clean old entries
  for (const [ip, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(
      (timestamp) => timestamp > windowStart,
    );
    if (validRequests.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, validRequests);
    }
  }

  // Check current IP
  const requests = rateLimitStore.get(clientIP) || [];

  if (requests.length >= VERCEL_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: Math.max(...requests) + VERCEL_CONFIG.RATE_LIMIT_WINDOW,
    };
  }

  // Add current request
  requests.push(now);
  rateLimitStore.set(clientIP, requests);

  return {
    allowed: true,
    remaining: VERCEL_CONFIG.RATE_LIMIT_MAX_REQUESTS - requests.length,
    resetTime: now + VERCEL_CONFIG.RATE_LIMIT_WINDOW,
  };
}

/**
 * Get cached test result
 */
function getCachedResult(cacheKey) {
  const cached = testResultCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < VERCEL_CONFIG.CACHE_DURATION) {
    return cached;
  }
  return null;
}

/**
 * Cache test result
 */
function cacheResult(cacheKey, result) {
  testResultCache.set(cacheKey, {
    ...result,
    timestamp: Date.now(),
  });

  // Clean old cache entries
  for (const [key, value] of testResultCache.entries()) {
    if (Date.now() - value.timestamp > VERCEL_CONFIG.CACHE_DURATION) {
      testResultCache.delete(key);
    }
  }
}

/**
 * Check environment variables with caching
 */
function checkEnvironment() {
  const required = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_USER",
    "SMTP_PASS",
    "FROM_EMAIL",
    "TO_EMAIL",
  ];

  const env = {};
  const missing = [];

  for (const key of required) {
    const value = process.env[key];
    env[key] = value ? "***CONFIGURADO***" : "EM FALTA";
    if (!value) missing.push(key);
  }

  return {
    success: missing.length === 0,
    env,
    missing,
    message: missing.length === 0 ? messages.envOk : messages.envMissing,
  };
}

/**
 * Create SMTP transporter with Vercel optimizations
 */
function createTransporter() {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
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
    // Serverless optimizations
    pool: false,
    maxConnections: 1,
    maxMessages: 1,
    // Security optimizations
    disableFileAccess: true,
    disableUrlAccess: true,
  };

  return nodemailer.createTransport(config);
}

/**
 * Test SMTP connection with timeout and performance metrics
 */
async function testConnection(metrics) {
  const operation = metrics.startOperation("connection_test");

  try {
    const transporter = createTransporter();

    // Test connection with timeout
    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Connection timeout")),
          VERCEL_CONFIG.CONNECTION_TIMEOUT,
        ),
      ),
    ]);

    return metrics.endOperation(operation, true);
  } catch (error) {
    return metrics.endOperation(operation, false, error);
  }
}

/**
 * Test authentication with performance metrics
 */
async function testAuthentication(metrics) {
  const operation = metrics.startOperation("authentication_test");

  try {
    const transporter = createTransporter();

    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Authentication timeout")),
          VERCEL_CONFIG.CONNECTION_TIMEOUT,
        ),
      ),
    ]);

    return metrics.endOperation(operation, true);
  } catch (error) {
    return metrics.endOperation(operation, false, error);
  }
}

/**
 * Test email sending with performance metrics
 */
async function testEmailSending(metrics) {
  const operation = metrics.startOperation("email_test");

  try {
    const transporter = createTransporter();

    const testEmail = {
      from: `"LOFERSIL SMTP Test" <${process.env.FROM_EMAIL}>`,
      to: process.env.TO_EMAIL,
      subject: "🧪 Teste SMTP - Vercel Serverless",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">🧪 Teste SMTP - Vercel Serverless</h2>
          <p>Teste de conexão SMTP executado com sucesso no ambiente Vercel.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Detalhes:</h3>
            <ul style="color: #6c757d;">
              <li><strong>Ambiente:</strong> Vercel Serverless</li>
              <li><strong>Servidor:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>Porta:</strong> ${process.env.SMTP_PORT}</li>
              <li><strong>Data:</strong> ${new Date().toLocaleString("pt-PT")}</li>
            </ul>
          </div>
          
          <p style="color: #28a745;">✅ Configuração SMTP verificada com sucesso!</p>
        </div>
      `,
    };

    const info = await Promise.race([
      transporter.sendMail(testEmail),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Email sending timeout")),
          VERCEL_CONFIG.CONNECTION_TIMEOUT,
        ),
      ),
    ]);

    const result = metrics.endOperation(operation, true);
    result.details = {
      messageId: info.messageId,
      response: info.response,
    };

    return result;
  } catch (error) {
    return metrics.endOperation(operation, false, error);
  }
}

/**
 * Main handler function with Vercel optimizations
 */
export default async function handler(req, res) {
  // Initialize performance metrics
  const metrics = new TestPerformanceMetrics();
  const handlerOperation = metrics.startOperation("test_handler");

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
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Content-Type", "application/json");

  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    metrics.endOperation(handlerOperation, true);
    res.status(200).end();
    return;
  }

  // Only allow GET and POST
  if (!["GET", "POST"].includes(req.method)) {
    metrics.endOperation(
      handlerOperation,
      false,
      new Error("Method not allowed"),
    );
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  // Rate limiting
  const clientIP =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    "unknown";

  const rateLimit = checkRateLimit(clientIP);
  if (!rateLimit.allowed) {
    metrics.endOperation(
      handlerOperation,
      false,
      new Error("Rate limit exceeded"),
    );
    return res.status(429).json({
      success: false,
      message: "Too many requests",
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
    });
  }

  const testId = `test_${Date.now()}`;

  // Check cache first
  const cacheKey = `${testId}_${req.query.sendEmail || "false"}`;
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult && !req.query.nocache) {
    metrics.endOperation(handlerOperation, true);
    return res.status(200).json({
      success: true,
      message: "Resultados do cache",
      cached: true,
      results: cachedResult,
      performance: metrics.getSummary(),
    });
  }

  try {
    console.log(`[${testId}] Iniciando teste SMTP...`);

    const results = {
      testId,
      timestamp: new Date().toISOString(),
      environment: "vercel-serverless",
      vercel: process.env.VERCEL === "1",
      totalDuration: null,
      tests: {},
      rateLimit: {
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
      },
    };

    // Step 1: Check environment variables
    console.log(`[${testId}] Verificando variáveis de ambiente...`);
    const envCheck = checkEnvironment();
    results.tests.environment = envCheck;

    if (!envCheck.success) {
      results.totalDuration = `${Date.now() - metrics.startTime}ms`;
      metrics.endOperation(
        handlerOperation,
        false,
        new Error("Environment validation failed"),
      );
      return res.status(400).json({
        success: false,
        message: "Variáveis de ambiente em falta",
        results,
        performance: metrics.getSummary(),
      });
    }

    // Step 2: Test connection
    console.log(`[${testId}] Testando conexão...`);
    const connectionTest = await testConnection(metrics);
    results.tests.connection = {
      success: connectionTest.success,
      duration: `${connectionTest.duration}ms`,
      message: connectionTest.success
        ? messages.connected
        : messages.connectionFailed,
      error: connectionTest.error,
      details: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === "true",
      },
    };

    if (!connectionTest.success) {
      results.totalDuration = `${Date.now() - metrics.startTime}ms`;
      metrics.endOperation(
        handlerOperation,
        false,
        new Error("Connection test failed"),
      );
      return res.status(500).json({
        success: false,
        message: "Falha na conexão SMTP",
        results,
        performance: metrics.getSummary(),
      });
    }

    // Step 3: Test authentication
    console.log(`[${testId}] Testando autenticação...`);
    const authTest = await testAuthentication(metrics);
    results.tests.authentication = {
      success: authTest.success,
      duration: `${authTest.duration}ms`,
      message: authTest.success ? messages.authSuccess : messages.authFailed,
      error: authTest.error,
    };

    if (!authTest.success) {
      results.totalDuration = `${Date.now() - metrics.startTime}ms`;
      metrics.endOperation(
        handlerOperation,
        false,
        new Error("Authentication test failed"),
      );
      return res.status(500).json({
        success: false,
        message: "Falha na autenticação SMTP",
        results,
        performance: metrics.getSummary(),
      });
    }

    // Step 4: Test email sending (optional for quick tests)
    const sendEmail =
      req.query.sendEmail === "true" || req.body?.sendEmail === true;

    if (sendEmail) {
      console.log(`[${testId}] Testando envio de email...`);
      const emailTest = await testEmailSending(metrics);
      results.tests.email = {
        success: emailTest.success,
        duration: `${emailTest.duration}ms`,
        message: emailTest.success ? messages.emailSent : messages.emailFailed,
        error: emailTest.error,
        details: emailTest.details,
      };
    } else {
      results.tests.email = {
        success: null,
        message: "Teste de envio pulado (use ?sendEmail=true para ativar)",
      };
    }

    results.totalDuration = `${Date.now() - metrics.startTime}ms`;

    // Determine overall success
    const allPassed =
      envCheck.success &&
      connectionTest.success &&
      authTest.success &&
      (sendEmail ? results.tests.email.success : true);

    console.log(`[${testId}] Teste concluído em ${results.totalDuration}`);

    // Cache successful results
    if (allPassed) {
      cacheResult(cacheKey, results);
    }

    metrics.endOperation(handlerOperation, true);

    return res.status(allPassed ? 200 : 500).json({
      success: allPassed,
      message: allPassed
        ? "Todos os testes passaram"
        : "Alguns testes falharam",
      results,
      performance: metrics.getSummary(),
    });
  } catch (error) {
    console.error(`[${testId}] Erro no handler:`, error);
    metrics.endOperation(handlerOperation, false, error);

    return res.status(500).json({
      success: false,
      message: messages.serverError,
      error: error.message,
      testId,
      duration: `${Date.now() - metrics.startTime}ms`,
      performance: metrics.getSummary(),
    });
  }
}

/**
 * Enhanced health check endpoint for Vercel monitoring
 */
export async function healthCheck(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const envCheck = checkEnvironment();
    const metrics = new TestPerformanceMetrics();

    let smtpStatus = "not_tested";
    let smtpError = null;

    if (envCheck.success) {
      try {
        const operation = metrics.startOperation("health_smtp_test");
        const transporter = createTransporter();

        await Promise.race([
          transporter.verify(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Health check timeout")), 3000),
          ),
        ]);

        metrics.endOperation(operation, true);
        smtpStatus = "healthy";
      } catch (error) {
        smtpStatus = "unhealthy";
        smtpError = error.message;
      }
    }

    const overallStatus =
      envCheck.success && smtpStatus === "healthy" ? "healthy" : "unhealthy";

    return res.status(overallStatus === "healthy" ? 200 : 503).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: "vercel-serverless",
      vercel: process.env.VERCEL === "1",
      checks: {
        environment: {
          status: envCheck.success ? "healthy" : "unhealthy",
          missing: envCheck.missing,
          configured: envCheck.configured,
        },
        smtp: {
          status: smtpStatus,
          error: smtpError,
        },
      },
      performance: metrics.getSummary(),
      rateLimit: {
        activeIPs: rateLimitStore.size,
        cachedResults: testResultCache.size,
      },
    });
  } catch (error) {
    return res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
