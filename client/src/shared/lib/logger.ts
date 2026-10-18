/**
 * Утилиты для логирования
 * В production режиме используется структурированное JSON логирование
 * В development режиме - читаемый формат
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Структурированное логирование с поддержкой метаданных
 */
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  meta?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

function formatLogEntry(
  level: LogEntry['level'],
  message: string,
  meta?: Record<string, unknown>,
  error?: Error,
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (meta && Object.keys(meta).length > 0) {
    entry.meta = meta;
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return entry;
}

function logStructured(entry: LogEntry) {
  if (isDevelopment) {
    // В development - читаемый формат
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    if (entry.error) {
      console.error(prefix, entry.message, entry.meta || {}, entry.error);
    } else if (entry.level === 'error' || entry.level === 'critical') {
      console.error(prefix, entry.message, entry.meta || {});
    } else if (entry.level === 'warn') {
      console.warn(prefix, entry.message, entry.meta || {});
    } else {
      console.log(prefix, entry.message, entry.meta || {});
    }
  } else {
    // В production - JSON формат для парсинга логов
    console.log(JSON.stringify(entry));
  }
}

/**
 * Структурированный logger с уровнями логирования
 */
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    logStructured(formatLogEntry('info', message, meta));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    logStructured(formatLogEntry('warn', message, meta));
  },
  error: (message: string, meta?: Record<string, unknown>, error?: Error) => {
    logStructured(formatLogEntry('error', message, meta, error));
  },
  critical: (message: string, meta?: Record<string, unknown>, error?: Error) => {
    logStructured(formatLogEntry('critical', message, meta, error));
  },
};

/**
 * Логирование в development режиме (обратная совместимость)
 * @deprecated Используйте logger.info(), logger.warn(), logger.error() вместо devLog
 */
export const devLog = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Ошибки всегда логируем
    console.error(...args);
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};
