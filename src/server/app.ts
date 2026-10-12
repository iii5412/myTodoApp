import express from 'express';
import type { Express } from 'express';
import { createLiveUpdateRouter } from './routes/liveUpdate';

export interface CreateAppOptions {
  liveUpdateDir?: string;
  appVersion?: string;
}

/**
 * The server holds no user data. It serves the web app, the Android screen
 * bundle (/api/live-update) and a version probe the deploy workflow checks.
 */
export function createApp({ liveUpdateDir, appVersion = process.env.APP_VERSION || 'dev' }: CreateAppOptions = {}): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);

  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, version: appVersion });
  });
  app.use('/api', createLiveUpdateRouter({ dir: liveUpdateDir }));
  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'Not found' });
  });
  return app;
}
