/**
 * One JSON object per line, which Cloud Logging reads as a structured entry
 * (`severity` and `message` are its well-known fields).
 */
export type Severity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

type LogSink = (line: string) => void;
let sink: LogSink = line => {
  process.stdout.write(`${line}\n`);
};

/** Replaces where lines go; tests use it to capture output. Returns a restore function. */
export function setLogSink(next: LogSink): () => void {
  const previous = sink;
  sink = next;
  return () => {
    sink = previous;
  };
}

function describeDetail(detail: unknown): string {
  if (detail instanceof Error) return `${detail.name}: ${detail.message}`;
  if (typeof detail === 'string') return detail;
  try {
    return JSON.stringify(detail) ?? String(detail);
  } catch {
    return String(detail);
  }
}

function write(severity: Severity, message: string, details: unknown[]) {
  sink(JSON.stringify({ severity, message: [message, ...details.map(describeDetail)].join(' ').slice(0, 2000) }));
}

export const logger = {
  debug: (message: string, ...details: unknown[]) => write('DEBUG', message, details),
  info: (message: string, ...details: unknown[]) => write('INFO', message, details),
  warn: (message: string, ...details: unknown[]) => write('WARNING', message, details),
  error: (message: string, ...details: unknown[]) => write('ERROR', message, details),
};
