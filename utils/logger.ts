/**
 * Production-safe logger.
 * In __DEV__ mode, logs are forwarded to console.
 * In production builds, all logging is silenced.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

function createLogger(): Logger {
  const noop = (): void => {};

  if (!__DEV__) {
    return {
      debug: noop,
      info: noop,
      log: noop,
      warn: noop,
      error: noop,
    };
  }

  return {
    debug: (...args: unknown[]) => console.debug('[Jahera]', ...args),
    info: (...args: unknown[]) => console.info('[Jahera]', ...args),
    log: (...args: unknown[]) => console.log('[Jahera]', ...args),
    warn: (...args: unknown[]) => console.warn('[Jahera]', ...args),
    error: (...args: unknown[]) => console.error('[Jahera]', ...args),
  };
}

export const logger = createLogger();
