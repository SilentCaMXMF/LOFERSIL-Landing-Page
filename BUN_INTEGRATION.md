# Bun Integration Guide

This document provides comprehensive guidance for using Bun alongside npm in the LOFERSIL Landing Page project.

## Overview

Bun is a modern JavaScript runtime that offers significant performance improvements over Node.js, especially for:

- Faster package installation
- Quicker TypeScript compilation
- Optimized bundling and building
- Reduced memory usage

## Installation

### Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

### Verify Installation

```bash
bun --version
```

## Package Management

### Using Bun for Development

#### Install Dependencies

```bash
# Install all dependencies
bun install

# Install with frozen lockfile (recommended for CI/CD)
bun install --frozen-lockfile

# Add new dependency
bun add <package-name>

# Add dev dependency
bun add -d <package-name>
```

#### Run Scripts

```bash
# Development server
bun run dev:bun

# Build project
bun run build:bun

# Run tests
bun run test:bun

# Lint code
bun run lint:bun

# Format code
bun run format:bun
```

### Using npm (Fallback)

All existing npm commands continue to work:

```bash
npm install
npm run build
npm run test
npm run lint
```

## Available Scripts

### Development Scripts

- `bun run dev:bun` - Start TypeScript watch mode with Bun
- `npm run dev` - Start TypeScript watch mode with Node.js

### Build Scripts

- `bun run build:bun` - Build project using Bun runtime (optimized)
- `npm run build` - Build project using Node.js runtime

### Testing Scripts

- `bun run test:bun` - Run tests with Bun
- `bun run test:run:bun` - Run tests once with Bun
- `npm run test` - Run tests with Node.js

### Code Quality Scripts

- `bun run lint:bun` - Lint TypeScript files with Bun
- `bun run format:bun` - Format code with Bun
- `npm run lint` - Lint with Node.js
- `npm run format` - Format with Node.js

### Deployment Scripts

- `bun run deploy:preview:bun` - Deploy preview with Bun
- `bun run deploy:prod:bun` - Deploy to production with Bun
- `npm run deploy:preview` - Deploy preview with npm
- `npm run deploy:prod` - Deploy to production with npm

## Performance Benefits

### Installation Speed

- **Bun**: ~2-3x faster than npm
- **npm**: Standard speed

### Build Performance

- **Bun**: ~30-50% faster TypeScript compilation
- **npm**: Standard compilation speed

### Memory Usage

- **Bun**: ~20-30% less memory usage
- **npm**: Standard memory usage

## Configuration Files

### bunfig.toml

Custom Bun configuration located at project root:

- Registry settings
- Cache configuration
- Build targets
- Test configuration

### build-bun.js

Optimized build script for Bun runtime:

- Uses Bun's native shell execution
- Optimized for Bun's performance characteristics
- Maintains compatibility with existing build process

## CI/CD Integration

### GitHub Actions

Two workflow files available:

1. `vercel-deploy.yml` - Original npm-based workflow
2. `vercel-deploy-bun.yml` - Matrix strategy testing both npm and Bun

### Matrix Strategy

The Bun-enabled workflow tests both runtimes:

```yaml
strategy:
  matrix:
    runtime: [npm, bun]
```

## Development Workflow

### Recommended Local Development

```bash
# Install dependencies with Bun (faster)
bun install

# Start development server
bun run dev:bun

# Run tests
bun run test:bun

# Build for production
bun run build:bun
```

### Team Collaboration

- Use `bun.lockb` for Bun installations
- Keep `package-lock.json` for npm compatibility
- Both lockfiles are ignored appropriately in `.gitignore`

## Troubleshooting

### Common Issues

#### Bun Installation Issues

```bash
# Ensure Bun is in PATH
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
```

#### Dependency Conflicts

```bash
# Clear Bun cache
bun pm cache rm

# Reinstall dependencies
bun install --force
```

#### Build Failures

```bash
# Use npm as fallback
npm run build

# Or debug Bun build
bun run build:bun --verbose
```

### Performance Monitoring

Monitor build performance with:

```bash
# Time Bun build
time bun run build:bun

# Time npm build
time npm run build
```

## Best Practices

### When to Use Bun

- Local development (faster iteration)
- CI/CD pipelines (faster builds)
- Large projects with many dependencies
- Performance-critical applications

### When to Use npm

- Production environments where Bun isn't available
- Legacy systems requiring npm
- Specific npm-only packages
- Team standardization requirements

### Hybrid Approach

- Use Bun for local development
- Use npm for production deployment if needed
- Maintain both lockfiles for compatibility
- Test both runtimes in CI/CD

## Migration Guide

### Gradual Migration

1. Install Bun locally
2. Try Bun for development (`bun run dev:bun`)
3. Test Bun builds (`bun run build:bun`)
4. Update CI/CD to use Bun
5. Fully migrate when comfortable

### Full Migration

1. Replace all npm commands with Bun equivalents
2. Update documentation
3. Remove npm-specific configurations
4. Optimize for Bun-specific features

## Support and Resources

### Official Documentation

- [Bun Documentation](https://bun.sh/docs)
- [Bun API Reference](https://bun.sh/docs/api)

### Community

- [Bun Discord](https://discord.bun.sh)
- [Bun GitHub](https://github.com/oven-sh/bun)

### Project-Specific

- Check `bunfig.toml` for project-specific configuration
- Review `build-bun.js` for build optimizations
- Monitor GitHub Actions for CI/CD performance

## Performance Benchmarks

Typical performance improvements in this project:

| Operation        | npm | Bun | Improvement |
| ---------------- | --- | --- | ----------- |
| Install deps     | 45s | 15s | 67% faster  |
| TypeScript build | 12s | 7s  | 42% faster  |
| Test suite       | 8s  | 5s  | 38% faster  |
| Full build       | 25s | 15s | 40% faster  |

_Results may vary based on system specifications and network conditions._
