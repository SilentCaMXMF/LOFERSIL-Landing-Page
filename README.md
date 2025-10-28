# LOFERSIL Landing Page

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/your-username/lofersil-landing-page/workflows/CI/badge.svg)](https://github.com/your-username/lofersil-landing-page/actions)
[![Vercel Deployment](https://vercel.com/button)](https://vercel.com)

A modern, static landing page for LOFERSIL, built with TypeScript and optimized for performance. Features dual language support (Portuguese/English), image optimization, and PWA capabilities for an enhanced user experience.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Scripts](#scripts)
- [Configuration](#configuration)
- [Development Workflow](#development-workflow)
- [Internationalization](#internationalization)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- 🌐 **Dual Language Support**: Seamless switching between Portuguese and English
- 🖼️ **Image Optimization**: Automatic image compression and WebP conversion
- 📱 **Progressive Web App (PWA)**: Offline capabilities and installable experience
- ⚡ **Performance Optimized**: Fast loading with modern web technologies
- 🎨 **Responsive Design**: Mobile-first approach with PostCSS styling
- 🔍 **SEO Friendly**: Optimized for search engines with meta tags and structured data
- 🛠️ **TypeScript**: Type-safe development with strict mode
- 🧪 **Testing**: Unit tests with Vitest and performance audits with Lighthouse

## Tech Stack

- **Language**: TypeScript 5.0.0
- **Build Tool**: Custom Node.js build script
- **Styling**: PostCSS 8.4.0 with Autoprefixer and CSSNano
- **Linting**: ESLint 9.0.0 with TypeScript support
- **Formatting**: Prettier 3.0.0
- **Testing**: Vitest 2.1.9
- **Image Processing**: Sharp 0.33.0
- **Security**: DOMPurify 3.3.0
- **Performance**: Web Vitals 5.1.0
- **Deployment**: Vercel

## Project Structure

```
lofersil-landing-page/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── assets/
│   └── images/             # Static images and assets
├── src/
│   ├── locales/            # Translation files (en.json, pt.json)
│   ├── scripts/
│   │   ├── modules/        # Core functionality modules
│   │   └── *.ts            # Main scripts and service worker
│   └── styles/             # PostCSS stylesheets
├── tasks/                  # Development tasks and subtasks
├── index.html              # Main HTML template
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── postcss.config.js       # PostCSS configuration
├── eslint.config.js        # ESLint configuration
├── vercel.json             # Vercel deployment config
└── site.webmanifest        # PWA manifest
```

## Quick Start

### Prerequisites

- Node.js (version 18 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/lofersil-landing-page.git
   cd lofersil-landing-page
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

4. Start the development server:

   ```bash
   npm start
   ```

5. Open your browser to `http://localhost:3000`

## Scripts

| Script                    | Description                                           |
| ------------------------- | ----------------------------------------------------- |
| `npm run build`           | Build the static site using the custom build script   |
| `npm run build:dev`       | Compile TypeScript and process CSS for development    |
| `npm run dev`             | Watch TypeScript files for changes during development |
| `npm run start`           | Serve the built site locally on port 3000             |
| `npm run test`            | Run tests in watch mode with Vitest                   |
| `npm run test:run`        | Run tests once and exit                               |
| `npm run lint`            | Lint TypeScript files with ESLint                     |
| `npm run format`          | Format code with Prettier                             |
| `npm run optimize-images` | Optimize images in assets/images/                     |
| `npm run lighthouse`      | Run Lighthouse performance audit on localhost:3000    |
| `npm run vercel-deploy`   | Deploy to Vercel using the custom script              |
| `npm run deploy:preview`  | Deploy a preview build to Vercel                      |
| `npm run deploy:prod`     | Deploy to production on Vercel                        |

## Configuration

### TypeScript

Configured in `tsconfig.json` with:

- Target: ES2020
- Strict mode enabled
- Module resolution: Node
- Source maps for debugging

### PostCSS

Configured in `postcss.config.js` with:

- Autoprefixer for browser compatibility
- CSSNano for production minification

### ESLint

Configured in `eslint.config.js` with:

- TypeScript support
- Custom rules for code quality
- Integration with Prettier

## Development Workflow

1. **Code Changes**: Edit files in `src/`
2. **Linting**: Run `npm run lint` to check code quality
3. **Formatting**: Run `npm run format` to auto-format code
4. **Testing**: Run `npm run test` for unit tests
5. **Build**: Run `npm run build` to generate production assets
6. **Performance Audit**: Run `npm run lighthouse` for performance checks

### Code Style Guidelines

- **Imports**: ES6 imports, external libraries first, then internal modules
- **Formatting**: Single quotes, semicolons, trailing commas, 100 char width, 2-space indentation
- **Types**: Explicit types, avoid `any`
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Error Handling**: Try-catch blocks with custom errors
- **Console**: Allowed for debugging (warn level), no unused variables

## Internationalization

The site supports dual language functionality with JSON-based translations:

- **Portuguese**: `src/locales/pt.json`
- **English**: `src/locales/en.json`

Language switching is handled by the `LanguageManager.ts` module, providing a seamless user experience.

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Deploy preview:

   ```bash
   npm run deploy:preview
   ```

3. Deploy to production:
   ```bash
   npm run deploy:prod
   ```

### Alternative Deployment

The site can be deployed to any static hosting service:

1. Build the site: `npm run build`
2. Upload the `dist/` folder to your hosting provider
3. Configure redirects if necessary (see `vercel.json`)

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following the code style guidelines
4. Run tests: `npm run test:run`
5. Lint and format: `npm run lint && npm run format`
6. Commit your changes: `git commit -m 'Add your feature'`
7. Push to the branch: `git push origin feature/your-feature`
8. Open a Pull Request

### Code Standards

- Follow the established code style (see Development Workflow)
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors**

- Ensure all dependencies are installed: `npm install`
- Check TypeScript configuration in `tsconfig.json`

**Images not optimizing**

- Verify Sharp is installed: `npm list sharp`
- Check image formats (supports JPEG, PNG, WebP)

**PWA not working**

- Ensure `site.webmanifest` and `sw.js` are in the root
- Check browser console for service worker errors

**Language switching not working**

- Verify `src/locales/` contains valid JSON files
- Check `LanguageManager.ts` for errors

**Performance issues**

- Run `npm run lighthouse` for detailed audit
- Optimize images with `npm run optimize-images`
- Minimize unused CSS/JS in build process

For more help, check the [Issues](https://github.com/your-username/lofersil-landing-page/issues) page or create a new issue.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
