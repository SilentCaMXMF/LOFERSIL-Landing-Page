// Vercel serverless function for contact form
import nodemailer from "nodemailer";

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

    // Check SMTP configuration
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || "587",
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.FROM_EMAIL,
      to: process.env.TO_EMAIL,
    };

    console.log("SMTP Configuration Check:", {
      host: smtpConfig.host ? "SET" : "NOT SET",
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.user ? "SET" : "NOT SET",
      pass: smtpConfig.pass ? "SET" : "NOT SET",
      from: smtpConfig.from || "DEFAULT",
      to: smtpConfig.to || "DEFAULT",
    });

    // Try to send email if SMTP is configured
    let emailSent = false;
    let emailError = null;

    if (smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
      try {
        console.log("Creating email transporter...");
        const transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: parseInt(smtpConfig.port),
          secure: smtpConfig.secure,
          auth: {
            user: smtpConfig.user,
            pass: smtpConfig.pass,
          },
          // Add debugging for troubleshooting
          debug: process.env.NODE_ENV === "development",
          logger: process.env.NODE_ENV === "development",
        });

        console.log("Verifying SMTP connection...");
        await transporter.verify();
        console.log("SMTP connection verified successfully");

        const mailOptions = {
          from: smtpConfig.from || smtpConfig.user,
          to: smtpConfig.to || smtpConfig.user,
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

        console.log("Sending email to:", smtpConfig.to || smtpConfig.user);
        const result = await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log("Email sent successfully:", {
          messageId: result.messageId,
          response: result.response,
          to: smtpConfig.to || smtpConfig.user,
        });
      } catch (error) {
        emailError = error;
        console.error("Email sending failed:", {
          error: error.message,
          code: error.code,
          command: error.command,
          responseCode: error.responseCode,
          response: error.response,
          timestamp: new Date().toISOString(),
        });

        // Provide specific error information in development
        if (process.env.NODE_ENV === "development") {
          console.error("Full email error details:", error);
        }
      }
    } else {
      console.log("SMTP not fully configured - missing required fields");
      emailError = new Error("SMTP configuration incomplete");
    }

    // Always return success to the user, but include email status
    // This prevents user frustration even if email delivery fails
    const responseMessage = emailSent
      ? "Mensagem enviada com sucesso! Entraremos em contacto em breve."
      : "Mensagem registada com sucesso! Entraremos em contacto em breve.";

    const responseData = {
      success: true,
      message: responseMessage,
      emailSent,
      timestamp: new Date().toISOString(),
    };

    // Include error details in development for debugging
    if (process.env.NODE_ENV === "development" && emailError) {
      responseData.debug = {
        emailError: emailError.message,
        smtpConfig: {
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          userConfigured: !!smtpConfig.user,
          passConfigured: !!smtpConfig.pass,
        },
      };
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Contact form error:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      error: "Erro interno do servidor. Por favor, tente novamente mais tarde.",
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && {
        debug: { error: error.message },
      }),
    });
  }
}
