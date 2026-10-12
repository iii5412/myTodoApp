function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  return trimTrailingSlashes(String(import.meta.env.VITE_API_BASE_URL || '').trim());
}

/**
 * Web requests stay same-origin. The bundled native WebView has its own
 * https://localhost origin, so Android builds inject the deployed server origin
 * through VITE_API_BASE_URL. The server only serves screen updates; no task
 * data ever leaves the phone.
 */
export function apiUrl(path: string, baseUrl = getApiBaseUrl()): string {
  if (!path.startsWith('/')) throw new Error('API path must start with /.');
  if (!baseUrl) return path;
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
    throw new Error('Native API base URL must use HTTPS.');
  }
  return `${trimTrailingSlashes(parsed.toString())}${path}`;
}
