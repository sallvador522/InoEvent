/**
 * InoEvents Elite Logging & Diagnostics System
 * Provides categorized, stylized client-side logs and structured server logs.
 */

export type LogCategory = 'AUTH' | 'DATABASE' | 'PAYMENT' | 'SYSTEM' | 'ROUTER' | 'SEO' | 'AI';
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

interface LogOptions {
  category?: LogCategory;
  data?: any;
}

// Check if running on browser or node environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const COLORS = {
  DEBUG: { text: '#6B7280', bg: '#F3F4F6' },
  INFO: { text: '#3B82F6', bg: '#EFF6FF' },
  WARN: { text: '#D97706', bg: '#FEF3C7' },
  ERROR: { text: '#EF4444', bg: '#FEE2E2' },
  SUCCESS: { text: '#10B981', bg: '#ECFDF5' },
};

const CATEGORY_COLORS: Record<LogCategory, string> = {
  AUTH: '#8B5CF6',     // Purple
  DATABASE: '#3B82F6', // Blue
  PAYMENT: '#10B981',  // Emerald
  SYSTEM: '#6B7280',   // Gray
  ROUTER: '#EC4899',   // Pink
  SEO: '#F59E0B',      // Amber
  AI: '#14B8A6',       // Teal
};

function formatTime(): string {
  const now = new Date();
  return now.toISOString().split('T')[1].slice(0, -1); // e.g. "12:34:56.789"
}

export const logger = {
  debug(message: string, options: LogOptions = {}) {
    this.log('DEBUG', message, options);
  },

  info(message: string, options: LogOptions = {}) {
    this.log('INFO', message, options);
  },

  warn(message: string, options: LogOptions = {}) {
    this.log('WARN', message, options);
  },

  error(message: string, options: LogOptions = {}) {
    this.log('ERROR', message, options);
  },

  success(message: string, options: LogOptions = {}) {
    this.log('SUCCESS', message, options);
  },

  log(level: LogLevel, message: string, options: LogOptions = {}) {
    const category = options.category || 'SYSTEM';
    const data = options.data;
    const timestamp = formatTime();

    if (isBrowser) {
      // Stylized Console Log for Developer Experience (Apple-level aesthetic)
      const levelColors = COLORS[level];
      const categoryColor = CATEGORY_COLORS[category];

      const badgeStyle = `
        background: ${levelColors.bg};
        color: ${levelColors.text};
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 10px;
        border: 1px solid ${levelColors.text}33;
      `;

      const categoryStyle = `
        background: ${categoryColor}15;
        color: ${categoryColor};
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 10px;
        border: 1px solid ${categoryColor}33;
      `;

      const msgStyle = `
        color: ${level === 'ERROR' ? '#EF4444' : '#1F2937'};
        font-weight: ${level === 'ERROR' ? '600' : 'normal'};
      `;

      const parts = [
        `%c${timestamp}`,
        `%c${level}`,
        `%c${category}`,
        `%c${message}`
      ];

      const styles = [
        'color: #9CA3AF; font-size: 10px; font-family: monospace;',
        badgeStyle,
        categoryStyle,
        msgStyle
      ];

      if (level === 'ERROR') {
        if (data) {
          console.groupCollapsed(parts.join(' '), styles[0], styles[1], styles[2], styles[3]);
          console.error('[Diagnostic Payload]:', data);
          console.trace('[Trace Details]:');
          console.groupEnd();
        } else {
          console.error(parts.join(' '), styles[0], styles[1], styles[2], styles[3]);
        }
      } else if (level === 'WARN') {
        if (data) {
          console.groupCollapsed(parts.join(' '), styles[0], styles[1], styles[2], styles[3]);
          console.warn('[Diagnostic Payload]:', data);
          console.groupEnd();
        } else {
          console.warn(parts.join(' '), styles[0], styles[1], styles[2], styles[3]);
        }
      } else {
        if (data) {
          console.groupCollapsed(parts.join(' '), styles[0], styles[1], styles[2], styles[3]);
          console.log('[Payload]:', data);
          console.groupEnd();
        } else {
          console.log(parts.join(' '), styles[0], styles[1], styles[2], styles[3]);
        }
      }
    } else {
      // Node.js server-side logging formatting (Structured & standard)
      const colorReset = '\x1b[0m';
      const colorDim = '\x1b[2m';
      
      const serverColors: Record<LogLevel, string> = {
        DEBUG: '\x1b[37m',   // White
        INFO: '\x1b[36m',    // Cyan
        WARN: '\x1b[33m',    // Yellow
        ERROR: '\x1b[31m',   // Red
        SUCCESS: '\x1b[32m', // Green
      };

      const levelColor = serverColors[level] || '';
      const prefix = `[${timestamp}] ${levelColor}${level}${colorReset} [${category}]`;
      const serializedData = data ? ` | Data: ${JSON.stringify(data)}` : '';

      if (level === 'ERROR') {
        console.error(`${prefix} ${message}${serializedData}`);
      } else if (level === 'WARN') {
        console.warn(`${prefix} ${message}${serializedData}`);
      } else {
        console.log(`${prefix} ${message}${serializedData}`);
      }
    }
  }
};
