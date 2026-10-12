/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import packageInfo from './package.json';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const builtAt = new Date().toISOString();
  // Deploys pass the commit; local builds get a unique id so the app still picks up the deployed bundle.
  const bundleVersion = process.env.LIVE_BUNDLE_VERSION?.trim() || `local-${builtAt.replace(/[^0-9]/g, '').slice(0, 14)}`;
  return {
    define: { __APP_BUILD__: JSON.stringify({ version: packageInfo.version, builtAt, bundleVersion }) },
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    test: { exclude: ['**/node_modules/**', '**/dist/**', 'android/**'] },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules') && id.includes('react')) return 'react-vendor';
          },
        },
      },
    },
  };
});
