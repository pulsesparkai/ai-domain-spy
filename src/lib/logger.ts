// Comprehensive logging system with structured logging and multiple transports

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  stack?: string;
}

export interface LogTransport {
  log(entry: LogEntry): void | Promise<void>;
}

class ConsoleTransport implements LogTransport {
  log(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = new Date(entry.timestamp).toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    
    const message = `${timestamp} ${levelName} ${context} ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(message, entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.metadata);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.metadata, entry.stack);
        break;
    }
  }
}

class RemoteTransport implements LogTransport {
  private buffer: LogEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxBufferSize: number = 50;
  private endpoint: string;

  constructor(endpoint: string = '') {
    this.endpoint = endpoint;
    // Disable logging to prevent API calls to non-existent endpoints
    // this.startFlushTimer();
  }

  async log(entry: LogEntry): Promise<void> {
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });
    } catch (error) {
      console.error('Failed to send logs to remote:', error);
      // Put logs back in buffer for retry
      this.buffer.unshift(...logs);
    }
  }

  private startFlushTimer(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
}

class LocalStorageTransport implements LogTransport {
  private storageKey = 'app_logs';
  private maxEntries = 1000;

  log(entry: LogEntry): void {
    try {
      const existingLogs = this.getLogs();
      const newLogs = [entry, ...existingLogs].slice(0, this.maxEntries);
      
      localStorage.setItem(this.storageKey, JSON.stringify(newLogs));
    } catch (error) {
      console.warn('Failed to store log in localStorage:', error);
    }
  }

  getLogs(): LogEntry[] {
    try {
      const logs = localStorage.getItem(this.storageKey);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      return [];
    }
  }

  clearLogs(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export class Logger {
  private static instance: Logger;
  private transports: LogTransport[] = [];
  private currentLevel: LogLevel = LogLevel.INFO;
  private context?: string;
  private sessionId: string;
  private isDebugMode: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupDefaultTransports();
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private setupDefaultTransports(): void {
    this.addTransport(new ConsoleTransport());
    this.addTransport(new LocalStorageTransport());
    
    // Add remote transport in production
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.addTransport(new RemoteTransport());
    }
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled Error', 'Global', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', 'Global', {
        reason: event.reason,
        stack: event.reason?.stack,
      });
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  public setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  public setContext(context: string): void {
    this.context = context;
  }

  public setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
    this.currentLevel = enabled ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || this.context,
      metadata,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }

  private getCurrentUserId(): string | undefined {
    // This would integrate with your auth system
    try {
      // Example: get from auth context or localStorage
      return localStorage.getItem('userId') || undefined;
    } catch {
      return undefined;
    }
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    const promises = this.transports.map(transport => {
      try {
        return transport.log(entry);
      } catch (error) {
        console.error('Transport error:', error);
      }
    });

    await Promise.allSettled(promises);
  }

  public debug(message: string, context?: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, metadata);
    this.writeLog(entry);
  }

  public info(message: string, context?: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, context, metadata);
    this.writeLog(entry);
  }

  public warn(message: string, context?: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, context, metadata);
    this.writeLog(entry);
  }

  public error(message: string, context?: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, {
      ...metadata,
      stack: error?.stack,
      errorName: error?.name,
      errorMessage: error?.message,
    });
    
    this.writeLog(entry);
  }

  public fatal(message: string, context?: string, metadata?: Record<string, any>, error?: Error): void {
    const entry = this.createLogEntry(LogLevel.FATAL, message, context, {
      ...metadata,
      stack: error?.stack,
      errorName: error?.name,
      errorMessage: error?.message,
    });
    
    this.writeLog(entry);
  }

  // Business KPI tracking
  public trackKPI(name: string, value: number, metadata?: Record<string, any>): void {
    this.info(`KPI: ${name}`, 'Analytics', {
      type: 'kpi',
      kpiName: name,
      value,
      ...metadata,
    });
  }

  // User action tracking
  public trackUserAction(action: string, metadata?: Record<string, any>): void {
    this.info(`User Action: ${action}`, 'UserActions', {
      type: 'user_action',
      action,
      ...metadata,
    });
  }

  // Performance tracking
  public trackPerformance(name: string, duration: number, metadata?: Record<string, any>): void {
    this.info(`Performance: ${name}`, 'Performance', {
      type: 'performance',
      metric: name,
      duration,
      ...metadata,
    });
  }

  // Get logs for debugging
  public getLogs(): LogEntry[] {
    const localTransport = this.transports.find(t => t instanceof LocalStorageTransport) as LocalStorageTransport;
    return localTransport?.getLogs() || [];
  }

  // Clear logs
  public clearLogs(): void {
    const localTransport = this.transports.find(t => t instanceof LocalStorageTransport) as LocalStorageTransport;
    localTransport?.clearLogs();
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience exports
export const log = {
  debug: (message: string, context?: string, metadata?: Record<string, any>) => 
    logger.debug(message, context, metadata),
  info: (message: string, context?: string, metadata?: Record<string, any>) => 
    logger.info(message, context, metadata),
  warn: (message: string, context?: string, metadata?: Record<string, any>) => 
    logger.warn(message, context, metadata),
  error: (message: string, context?: string, metadata?: Record<string, any>, error?: Error) => 
    logger.error(message, context, metadata, error),
  fatal: (message: string, context?: string, metadata?: Record<string, any>, error?: Error) => 
    logger.fatal(message, context, metadata, error),
  kpi: (name: string, value: number, metadata?: Record<string, any>) => 
    logger.trackKPI(name, value, metadata),
  action: (action: string, metadata?: Record<string, any>) => 
    logger.trackUserAction(action, metadata),
  performance: (name: string, duration: number, metadata?: Record<string, any>) => 
    logger.trackPerformance(name, duration, metadata),
};