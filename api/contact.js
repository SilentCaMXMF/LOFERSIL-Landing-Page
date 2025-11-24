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

    // Try to send email if SMTP is configured
    let emailSent = false;
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
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log("Email sent successfully to:", process.env.TO_EMAIL);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Continue with success response even if email fails
        // This ensures the user gets a positive response
      }
    } else {
      console.log("SMTP not configured, skipping email send");
    }

    res.status(200).json({
      success: true,
      message: emailSent
        ? "Mensagem enviada com sucesso! Entraremos em contacto em breve."
        : "Mensagem registada com sucesso! Entraremos em contacto em breve.",
      emailSent,
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor. Por favor, tente novamente mais tarde.",
    });
  }
}
