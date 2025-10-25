import { TestBed } from '@angular/core/testing';
import { LoggerService, LogLevel } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggerService);

    // Spy on console methods
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setLogLevel', () => {
    it('should set log level', () => {
      service.setLogLevel(LogLevel.ERROR);
      service.debug('test');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug messages', () => {
      service.setLogLevel(LogLevel.DEBUG);
      service.debug('test message', { data: 'test' }, 'TestSource');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should not log debug when level is higher', () => {
      service.setLogLevel(LogLevel.INFO);
      service.debug('test');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      service.info('test message');
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warn messages', () => {
      service.warn('test warning');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      const error = new Error('test error');
      service.error('error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('should return log history', () => {
      service.info('test1');
      service.info('test2');
      const history = service.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should limit history size', () => {
      service.setLogLevel(LogLevel.DEBUG);
      for (let i = 0; i < 150; i++) {
        service.debug(`message ${i}`);
      }
      const history = service.getHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('clearHistory', () => {
    it('should clear log history', () => {
      service.info('test');
      service.clearHistory();
      const history = service.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('exportLogs', () => {
    it('should export logs as JSON string', () => {
      service.info('test message');
      const exported = service.exportLogs();
      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should include all log entries with metadata', () => {
      service.info('test 1', { key: 'value1' }, 'Source1');
      service.warn('test 2', { key: 'value2' }, 'Source2');
      const exported = service.exportLogs();
      const logs = JSON.parse(exported);
      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs[0]).toHaveProperty('level');
      expect(logs[0]).toHaveProperty('message');
      expect(logs[0]).toHaveProperty('timestamp');
    });
  });

  describe('integration tests', () => {
    it('should handle rapid logging without data loss', () => {
      for (let i = 0; i < 50; i++) {
        service.info(`message ${i}`);
      }
      const history = service.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should maintain log order', () => {
      service.info('first');
      service.info('second');
      service.info('third');
      const history = service.getHistory();
      const messages = history.map((log) => log.message);
      const firstIndex = messages.indexOf('first');
      const secondIndex = messages.indexOf('second');
      const thirdIndex = messages.indexOf('third');
      expect(firstIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(thirdIndex);
    });

    it('should handle complex data structures', () => {
      const complexData = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        nullValue: null,
        undefinedValue: undefined,
      };
      service.info('complex', complexData);
      const history = service.getHistory();
      const lastLog = history[history.length - 1];
      expect(lastLog.data).toBeDefined();
    });
  });
});
