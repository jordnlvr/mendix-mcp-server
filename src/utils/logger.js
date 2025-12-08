/**
 * Centralized logging utility
 * Provides consistent logging across all modules
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor(component = 'MCP') {
    this.component = component;
    this.level = process.env.LOG_LEVEL
      ? LogLevel[process.env.LOG_LEVEL.toUpperCase()]
      : LogLevel.INFO;
  }

  /**
   * Format log message with timestamp and component
   */
  _format(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] [${this.component}] ${message}${metaStr}`;
  }

  debug(message, meta) {
    if (this.level <= LogLevel.DEBUG) {
      console.error(this._format('DEBUG', message, meta));
    }
  }

  info(message, meta) {
    if (this.level <= LogLevel.INFO) {
      console.error(this._format('INFO', message, meta));
    }
  }

  warn(message, meta) {
    if (this.level <= LogLevel.WARN) {
      console.error(this._format('WARN', message, meta));
    }
  }

  error(message, meta) {
    if (this.level <= LogLevel.ERROR) {
      console.error(this._format('ERROR', message, meta));
    }
  }

  /**
   * Create child logger with different component name
   */
  child(component) {
    return new Logger(`${this.component}:${component}`);
  }
}

export default Logger;
