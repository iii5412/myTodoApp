import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

// Builds the web assets and copies them into the Android project.
// VITE_API_BASE_URL (the deployed Cloud Run origin) is optional: tasks are stored on the
// phone, so the app works without it. The URL is only used to download screen updates.
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...loadEnv('production', rootDir, ''), ...process.env };
const apiBaseUrl = String(env.VITE_API_BASE_URL || '').trim();
const isRelease = process.argv.includes('--release');

function fail(message) {
  console.error(`\nAndroid build stopped: ${message}\n`);
  process.exit(1);
}

if (isRelease && !existsSync(resolve(rootDir, 'android/keystore.properties'))) {
  fail('android/keystore.properties is required for a signed release APK. See docs/ANDROID.md.');
}

let origin = '';
if (apiBaseUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(apiBaseUrl);
  } catch {
    fail('VITE_API_BASE_URL must be an absolute URL.');
  }
  if (parsedUrl.protocol !== 'https:' || parsedUrl.pathname !== '/' || parsedUrl.search || parsedUrl.hash) {
    fail('VITE_API_BASE_URL must be an HTTPS origin without a path, query, or fragment.');
  }
  origin = parsedUrl.origin;
} else {
  console.warn('\nVITE_API_BASE_URL is not set: this APK will not download screen updates.\n');
}

function runNode(entry, args) {
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd: rootDir,
    env: { ...process.env, VITE_API_BASE_URL: origin },
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const viteEntry = resolve(rootDir, 'node_modules/vite/bin/vite.js');
const capacitorEntry = resolve(rootDir, 'node_modules/@capacitor/cli/bin/capacitor');
if (!existsSync(viteEntry) || !existsSync(capacitorEntry)) {
  fail('Dependencies are missing. Run npm install first.');
}

runNode(viteEntry, ['build']);
runNode(capacitorEntry, ['sync', 'android']);

console.log(origin ? `\nAndroid web assets now target ${origin}` : '\nAndroid web assets built without a server origin.');
