import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeGitHubIssuesReviewerIntegration, setupScheduledTasks } from './src/scripts/modules/GitHubIssuesReviewerMain.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware for parsing JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize GitHub Issues Reviewer System Integration
try {
  initializeGitHubIssuesReviewerIntegration(app);
  setupScheduledTasks();
} catch (error) {
  console.warn('⚠️ GitHub Issues Reviewer System integration failed:', error.message);
  console.log('📝 Continuing without GitHub Issues Reviewer System');
}

// Static file serving with security headers
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const filePath = path.join(process.cwd(), req.path === '/' ? 'index.html' : req.path);
  const ext = path.extname(filePath);
  const contentType =
    {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      '.map': 'application/json',
    }[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    // Set CSP headers for local development (matching Vercel config)
    const cspValue =
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vercel.com https://vercel.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss:; media-src 'self'; object-src 'none'; frame-src 'self' https://vercel.live https://vercel.com; base-uri 'self'; form-action 'self'";

    const headers = {
      'Content-Type': contentType,
      'Content-Security-Policy': cspValue,
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };

    res.writeHead(200, headers);
    res.end(data);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found'
    });
  }
  
  // For non-API routes, let the static file handler deal with it
  res.status(404).send('File not found');
});
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 GitHub Issues Reviewer API available at http://localhost:${PORT}/api/tasks`);
  console.log(`🔧 System health endpoint at http://localhost:${PORT}/api/system/health`);
  console.log(`📈 Statistics endpoint at http://localhost:${PORT}/api/tasks/statistics`);
});
