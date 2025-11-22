import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/test-setup.ts'],
    include: ['tests/**/*.test.{ts,js}', 'src/**/*.test.{ts,js}', '.opencode/**/*.test.{ts,js}'],
    exclude: ['node_modules', 'dist'],
  },
  esbuild: {
    target: 'node14',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
