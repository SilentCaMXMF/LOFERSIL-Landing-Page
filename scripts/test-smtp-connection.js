/**
 * SMTP Connection Test Script
 * Tests Gmail SMTP connectivity with provided credentials
 * Verifies authentication, TLS/SSL configuration, and email sending capability
 */

import nodemailer from "nodemailer";

// Environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "pedroocalado@gmail.com",
    pass: process.env.SMTP_PASS || "pvlh kfrm tfnq qhij",
  },
};

const FROM_EMAIL = process.env.FROM_EMAIL || "pedroocalado@gmail.com";
const TO_EMAIL = process.env.TO_EMAIL || "pedroocalado@gmail.com";

// Portuguese messages
const messages = {
  testing: "🧪 A testar conexão SMTP...",
  success: "✅ Sucesso",
  error: "❌ Erro",
  warning: "⚠️ Aviso",
  info: "ℹ️ Informação",

  connectionTest: "Teste de Conexão SMTP",
  authTest: "Teste de Autenticação",
  tlsTest: "Teste TLS/SSL",
  emailTest: "Teste de Envio de Email",

  connected: "Conectado ao servidor SMTP com sucesso",
  authSuccess: "Autenticação bem-sucedida",
  tlsSuccess: "Configuração TLS/SSL verificada",
  emailSent: "Email de teste enviado com sucesso",

  connectionFailed: "Falha na conexão com o servidor SMTP",
  authFailed: "Falha na autenticação",
  tlsFailed: "Falha na configuração TLS/SSL",
  emailFailed: "Falha no envio do email",
  timeout: "Timeout na conexão",
  configMissing: "Configuração SMTP em falta",

  checkingConfig: "A verificar configuração...",
  creatingTransporter: "A criar transporter...",
  verifyingConnection: "A verificar conexão...",
  sendingTestEmail: "A enviar email de teste...",
};

/**
 * Log message with timestamp
 */
function log(message, type = "info") {
  const timestamp = new Date().toLocaleString("pt-PT");
  const prefix = messages[type] || messages.info;
  console.log(`[${timestamp}] ${prefix}: ${message}`);
}

/**
 * Validate SMTP configuration
 */
function validateConfig() {
  log(messages.checkingConfig);

  const required = ["host", "port", "auth.user", "auth.pass"];
  const missing = required.filter((key) => {
    const value = key.split(".").reduce((obj, k) => obj?.[k], SMTP_CONFIG);
    return !value;
  });

  if (missing.length > 0) {
    log(`Configuração em falta: ${missing.join(", ")}`, "error");
    return false;
  }

  log("Configuração SMTP válida", "success");
  return true;
}

/**
 * Test basic SMTP connection
 */
async function testConnection() {
  log(messages.connectionTest);

  try {
    log(messages.creatingTransporter);
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    log(messages.verifyingConnection);
    await transporter.verify();

    log(messages.connected, "success");
    return { success: true, transporter };
  } catch (error) {
    log(`${messages.connectionFailed}: ${error.message}`, "error");

    if (error.code === "ETIMEDOUT") {
      log(messages.timeout, "warning");
    } else if (error.code === "EAUTH") {
      log("Verifique as credenciais (App Password)", "warning");
    }

    return { success: false, error: error.message };
  }
}

/**
 * Test SMTP authentication
 */
async function testAuthentication(transporter) {
  log(messages.authTest);

  try {
    // Verify method already tests authentication
    await transporter.verify();
    log(messages.authSuccess, "success");
    return { success: true };
  } catch (error) {
    log(`${messages.authFailed}: ${error.message}`, "error");

    if (error.code === "EAUTH") {
      log("Possíveis causas:", "warning");
      log("1. App Password incorreto ou não gerado", "warning");
      log("2. Autenticação de 2 fatores não ativada", "warning");
      log('3. "Acesso a apps menos seguros" desativado', "warning");
    }

    return { success: false, error: error.message };
  }
}

/**
 * Test TLS/SSL configuration
 */
async function testTLS(transporter) {
  log(messages.tlsTest);

  try {
    const connectionDetails = transporter.options;

    log(`Host: ${connectionDetails.host}`);
    log(`Porta: ${connectionDetails.port}`);
    log(`Seguro: ${connectionDetails.secure ? "Sim" : "Não"}`);

    if (connectionDetails.port === 587 && !connectionDetails.secure) {
      log("Configuração STARTTLS correta para porta 587", "success");
    } else if (connectionDetails.port === 465 && connectionDetails.secure) {
      log("Configuração SSL/TLS correta para porta 465", "success");
    } else {
      log("Configuração de porta/segurança não padrão", "warning");
    }

    log(messages.tlsSuccess, "success");
    return { success: true };
  } catch (error) {
    log(`${messages.tlsFailed}: ${error.message}`, "error");
    return { success: false, error: error.message };
  }
}

/**
 * Test email sending capability
 */
async function testEmailSending(transporter) {
  log(messages.emailTest);

  try {
    const testEmail = {
      from: `"LOFERSIL Test" <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      subject: "🧪 Teste de Conexão SMTP - LOFERSIL",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">🧪 Teste de Conexão SMTP</h2>
          <p>Este é um email de teste para verificar a configuração SMTP do LOFERSIL.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Detalhes do Teste:</h3>
            <ul style="color: #6c757d;">
              <li><strong>Servidor:</strong> ${SMTP_CONFIG.host}</li>
              <li><strong>Porta:</strong> ${SMTP_CONFIG.port}</li>
              <li><strong>Seguro:</strong> ${SMTP_CONFIG.secure ? "Sim" : "Não"}</li>
              <li><strong>Utilizador:</strong> ${SMTP_CONFIG.auth.user}</li>
              <li><strong>Data/Hora:</strong> ${new Date().toLocaleString("pt-PT")}</li>
            </ul>
          </div>
          
          <p style="color: #6c757d;">
            Se recebeu este email, a configuração SMTP está a funcionar corretamente! 🎉
          </p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          <p style="font-size: 12px; color: #6c757d;">
            Este email foi enviado automaticamente pelo sistema de teste SMTP da LOFERSIL.
          </p>
        </div>
      `,
    };

    log(messages.sendingTestEmail);
    const info = await transporter.sendMail(testEmail);

    log(`Email enviado! ID: ${info.messageId}`, "success");
    log(`Resposta do servidor: ${info.response}`, "info");

    log(messages.emailSent, "success");
    return { success: true, info };
  } catch (error) {
    log(`${messages.emailFailed}: ${error.message}`, "error");
    return { success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function runSMTPTests() {
  console.log("=".repeat(60));
  console.log("🚀 TESTE DE CONEXÃO SMTP - GMAIL");
  console.log("=".repeat(60));

  const results = {
    timestamp: new Date().toISOString(),
    config: SMTP_CONFIG,
    tests: {},
  };

  try {
    // Step 1: Validate configuration
    if (!validateConfig()) {
      results.tests.config = { success: false, error: "Configuração inválida" };
      return results;
    }
    results.tests.config = { success: true };

    // Step 2: Test connection
    const connectionResult = await testConnection();
    results.tests.connection = connectionResult;

    if (!connectionResult.success) {
      return results;
    }

    const transporter = connectionResult.transporter;

    // Step 3: Test authentication
    const authResult = await testAuthentication(transporter);
    results.tests.authentication = authResult;

    if (!authResult.success) {
      return results;
    }

    // Step 4: Test TLS/SSL
    const tlsResult = await testTLS(transporter);
    results.tests.tls = tlsResult;

    // Step 5: Test email sending
    const emailResult = await testEmailSending(transporter);
    results.tests.email = emailResult;

    // Close connection
    transporter.close();
  } catch (error) {
    log(`Erro inesperado: ${error.message}`, "error");
    results.tests.unexpected = { success: false, error: error.message };
  }

  return results;
}

/**
 * Print test results summary
 */
function printResults(results) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO DOS TESTES");
  console.log("=".repeat(60));

  const testNames = {
    config: "Configuração",
    connection: "Conexão",
    authentication: "Autenticação",
    tls: "TLS/SSL",
    email: "Envio de Email",
  };

  let allPassed = true;

  for (const [test, result] of Object.entries(results.tests)) {
    const name = testNames[test] || test;
    const status = result.success ? "✅ PASSOU" : "❌ FALHOU";
    console.log(`${name.padEnd(15)}: ${status}`);

    if (!result.success) {
      allPassed = false;
      console.log(`  Erro: ${result.error}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  if (allPassed) {
    console.log("🎉 TODOS OS TESTES PASSARAM! Configuração SMTP está pronta.");
  } else {
    console.log("⚠️ ALGUNS TESTES FALHARAM. Verifique os erros acima.");
  }
  console.log("=".repeat(60));
}

/**
 * Run tests if script is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runSMTPTests()
    .then((results) => {
      printResults(results);
      process.exit(results.tests.email?.success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Erro fatal:", error);
      process.exit(1);
    });
}

export {
  runSMTPTests,
  validateConfig,
  testConnection,
  testAuthentication,
  testTLS,
  testEmailSending,
  messages,
};
