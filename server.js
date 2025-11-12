import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
  const filePath = path.join(process.cwd(), req.url === '/' ? 'index.html' : req.url);
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
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vercel.com https://vercel.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss:; media-src 'self'; object-src 'none'; frame-src 'self' https://vercel.live https://vercel.com;";

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

server.listen(8000, () => {
  console.log('Server running at http://localhost:8000');
});
