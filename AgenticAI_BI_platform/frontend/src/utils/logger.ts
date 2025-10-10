/**
 * Logger utility for consistent logging across the application
 * Automatically disabled in production builds
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: unknown[]): void => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

export default logger;

