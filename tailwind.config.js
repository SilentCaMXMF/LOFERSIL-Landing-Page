/**
 * Tailwind CSS Configuration
 * Configures Tailwind for the LOFERSIL landing page
 */

const path = require('path');

module.exports = {
  content: [
    // HTML files
    './*.html',
    './src/**/*.html',
    './en/**/*.html',
    
    // TypeScript/JavaScript files
    './src/scripts/**/*.ts',
    './src/scripts/**/*.js',
    
    // CSS files
    './src/styles/**/*.css',
    './src/styles_backup/**/*.css',
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