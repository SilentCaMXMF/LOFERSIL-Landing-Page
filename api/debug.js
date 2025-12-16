// Simple debug endpoint to test environment variables
export default async function handler(req, res) {
  // Set appropriate headers
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({
      status: "error",
      message: "Method not allowed",
    });
  }

  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "not set",
      vercel: process.env.VERCEL || "not set",
      smtpConfig: {
        host: process.env.SMTP_HOST || "not set",
        port: process.env.SMTP_PORT || "not set",
        user: process.env.SMTP_USER || "not set",
        passSet: process.env.SMTP_PASS ? "yes" : "no",
        fromEmail: process.env.FROM_EMAIL || "not set",
        toEmail: process.env.TO_EMAIL || "not set",
      },
      allEnvVars: Object.keys(process.env)
        .filter(
          (key) =>
            key.includes("SMTP") ||
            key.includes("EMAIL") ||
            key.includes("NODE_ENV") ||
            key.includes("VERCEL"),
        )
        .reduce((obj, key) => {
          obj[key] = process.env[key] ? "***SET***" : "NOT SET";
          return obj;
        }, {}),
    };

    return res.status(200).json({
      status: "success",
      message: "Debug information retrieved successfully",
      data: debugInfo,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Debug endpoint failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
