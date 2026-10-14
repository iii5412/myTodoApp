import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createLiveUpdateRouter, parseLiveBundleManifestFile } from './liveUpdate';
import { setLogSink } from '../lib/logger';
import { listen } from '../testServer';

const manifest = { version: 'abc123def456', checksum: 'a'.repeat(64), minNativeBuild: 12 };

let dir: string;
let running: Awaited<ReturnType<typeof listen>> | null = null;
let restoreLog: (() => void) | null = null;

beforeEach(async () => {
  restoreLog = setLogSink(() => undefined);
  dir = await mkdtemp(path.join(tmpdir(), 'live-update-'));
});
afterEach(async () => {
  restoreLog?.();
  await running?.close();
  running = null;
  await rm(dir, { recursive: true, force: true });
});

async function start() {
  const app = express();
  app.use('/api', createLiveUpdateRouter({ dir }));
  running = await listen(app);
  return running.url;
}

describe('live update manifest file', () => {
  it('accepts a well-formed manifest', () => {
    expect(parseLiveBundleManifestFile(manifest)).toMatchObject(manifest);
  });

  it('rejects versions that could escape the bundle directory', () => {
    expect(parseLiveBundleManifestFile({ ...manifest, version: '../secret' })).toBeNull();
  });

  it('rejects a checksum the native updater would not match', () => {
    expect(parseLiveBundleManifestFile({ ...manifest, checksum: 'A'.repeat(64) })).toBeNull();
  });
});

describe('live update routes', () => {
  it('lets the Android WebView read the manifest and download the bundle', async () => {
    await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
    await writeFile(path.join(dir, `${manifest.version}.zip`), 'zip-bytes');
    const url = await start();

    for (const route of ['/api/live-update', `/api/live-update/${manifest.version}.zip`]) {
      const response = await fetch(url(route), { headers: { Origin: 'https://localhost' } });
      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe('https://localhost');
      expect(response.headers.get('vary')).toContain('Origin');
      await response.text();
    }

    const preflight = await fetch(url('/api/live-update'), {
      method: 'OPTIONS',
      headers: { Origin: 'https://localhost', 'Access-Control-Request-Method': 'GET' },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('https://localhost');
    expect(preflight.headers.get('access-control-allow-methods')).toContain('GET');
  });

  it('keeps empty and missing bundle responses readable by Android', async () => {
    const url = await start();
    for (const [route, status] of [['/api/live-update', 204], ['/api/live-update/missing.zip', 404]] as const) {
      const response = await fetch(url(route), { headers: { Origin: 'https://localhost' } });
      expect(response.status).toBe(status);
      expect(response.headers.get('access-control-allow-origin')).toBe('https://localhost');
      await response.text();
    }
  });

  it('does not grant other websites cross-origin access', async () => {
    const url = await start();
    const response = await fetch(url('/api/live-update'), { headers: { Origin: 'https://example.com' } });
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(response.headers.get('vary')).toContain('Origin');
  });

  it('answers 204 when the image carries no bundle', async () => {
    const url = await start();
    const response = await fetch(url('/api/live-update'));
    expect(response.status).toBe(204);
  });

  it('serves the manifest uncached and the matching zip', async () => {
    await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
    await writeFile(path.join(dir, `${manifest.version}.zip`), 'zip-bytes');
    const url = await start();

    const meta = await fetch(url('/api/live-update'));
    expect(meta.headers.get('cache-control')).toBe('no-store');
    expect(await meta.json()).toMatchObject({ ...manifest, path: `/api/live-update/${manifest.version}.zip` });

    const zip = await fetch(url(`/api/live-update/${manifest.version}.zip`));
    expect(zip.status).toBe(200);
    expect(await zip.text()).toBe('zip-bytes');
  });

  it('refuses any file other than the current bundle', async () => {
    await writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
    const url = await start();
    expect((await fetch(url('/api/live-update/manifest.json'))).status).toBe(404);
    expect((await fetch(url('/api/live-update/old.zip'))).status).toBe(404);
  });
});
