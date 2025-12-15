// Vercel serverless function to test environment variable access
export default async function handler(req, res) {
  // Only allow GET requests for testing
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET for testing.',
    });
  }

  try {
    // Test environment variable access
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      WEBSITE_URL: process.env.WEBSITE_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '[SET]' : '[NOT SET]',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '[SET]' : '[NOT SET]',
      SMTP_HOST: process.env.SMTP_HOST ? '[SET]' : '[NOT SET]',
      GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID ? '[SET]' : '[NOT SET]',
      ENABLE_MCP_INTEGRATION: process.env.ENABLE_MCP_INTEGRATION,
      MCP_SERVER_URL: process.env.MCP_SERVER_URL,
    };

    // Log for debugging (will appear in Vercel function logs)
    console.log('Environment variables test:', {
      timestamp: new Date().toISOString(),
      envVars: envVars,
      hasSecrets: {
        openai: !!process.env.OPENAI_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY,
        smtp: !!process.env.SMTP_HOST,
        analytics: !!process.env.GOOGLE_ANALYTICS_ID,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Environment variables test completed',
      timestamp: new Date().toISOString(),
      environment: envVars,
      note: 'API keys are masked for security. Check Vercel function logs for full details.',
    });
  } catch (error) {
    console.error('Environment test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test environment variables',
      details: error.message,
    });
  }
}
