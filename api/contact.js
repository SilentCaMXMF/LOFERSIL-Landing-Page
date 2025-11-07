// Vercel serverless function for contact form

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
