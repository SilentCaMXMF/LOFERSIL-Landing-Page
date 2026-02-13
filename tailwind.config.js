/**
 * Tailwind CSS Configuration
 * Configures Tailwind for the LOFERSIL landing page
 */

const path = require('path');

module.exports = {
  content: [
    // HTML files
    './src/pages/**/*.astro',
    './src/pages/**/*.html',
    
    // TypeScript/JavaScript files
    './src/scripts/**/*.ts',
    './src/scripts/**/*.js',
    './public/scripts/**/*.ts',
    './public/scripts/**/*.js',
    
    // CSS files
    './src/styles/**/*.css',
    './src/styles_backup/**/*.css',
    
    // Astro layout files
    './src/layouts/**/*.astro',
    
    // Public assets
    './public/**/*.html',
    
    // Components
    './src/components/**/*.astro',
  ],
  
  theme: {
    extend: {
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'lofersil-blue': '#2563eb',
        'lofersil-dark': '#1e293b',
        'lofersil-gray': '#64748b',
        'lofersil-light': '#f1f5f9',
      },
    },
  },
  
  plugins: [],
  
  darkMode: ['class', '[data-theme="dark"]'],
};