import { TestBed } from '@angular/core/testing';
import { RequestCacheService } from '../request-cache.service';
import { LoggerService } from '../logger.service';

class LoggerServiceStub {
  debug = jest.fn();
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
}

describe('RequestCacheService', () => {
  let service: RequestCacheService;
  let logger: LoggerServiceStub;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [RequestCacheService, { provide: LoggerService, useClass: LoggerServiceStub }],
    });
    service = TestBed.inject(RequestCacheService);
    logger = TestBed.inject(LoggerService) as unknown as LoggerServiceStub;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns cached values for repeated requests within TTL', async () => {
    const requestSpy = jest.fn().mockResolvedValue({ value: 42 });

    const first = await service.execute('key', requestSpy, 1000);
    const second = await service.execute('key', requestSpy, 1000);

    expect(first).toEqual({ value: 42 });
    expect(second).toEqual({ value: 42 });
    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith('Cache HIT: key', undefined, 'RequestCache');
  });

  it('deduplicates concurrent requests', async () => {
    let resolveFn: ((value: number) => void) | undefined;
    const requestSpy = jest.fn(() => new Promise<number>(resolve => { resolveFn = resolve; }));

    const promise1 = service.execute('parallel', requestSpy, 1000);
    const promise2 = service.execute('parallel', requestSpy, 1000);

    expect(requestSpy).toHaveBeenCalledTimes(1);

    resolveFn?.(7);
    await expect(promise1).resolves.toBe(7);
    await expect(promise2).resolves.toBe(7);
  });

  it('expires cached entries after TTL and refreshes the value', async () => {
    const requestSpy = jest.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');

    const first = await service.execute('ttl', requestSpy, 500);
    expect(first).toBe('first');

    jest.advanceTimersByTime(600);

    const second = await service.execute('ttl', requestSpy, 500);
    expect(second).toBe('second');
    expect(requestSpy).toHaveBeenCalledTimes(2);
  });

  it('supports manual invalidation of cache entries', async () => {
    const requestSpy = jest.fn().mockResolvedValue('value');

    await service.execute('invalidate', requestSpy, 1000);
    service.invalidate('invalidate');
    await service.execute('invalidate', requestSpy, 1000);

    expect(requestSpy).toHaveBeenCalledTimes(2);
  });

  it('clears pending requests on failure and surfaces the error', async () => {
    const error = new Error('network failed');
    const requestSpy = jest.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('recovered');

    await expect(service.execute('error', requestSpy, 1000)).rejects.toThrow('network failed');

    const recovered = await service.execute('error', requestSpy, 1000);
    expect(recovered).toBe('recovered');
    expect(requestSpy).toHaveBeenCalledTimes(2);
  });

  it('invalidates entries by pattern and reports statistics', async () => {
    const requestSpy = jest.fn().mockResolvedValue('value');

    await service.execute('users:1', requestSpy, 1000);
    await service.execute('users:2', requestSpy, 1000);
    await service.execute('posts:1', requestSpy, 1000);

    service.invalidatePattern('users:');

    expect(service.get('users:1')).toBeNull();
    expect(service.get('posts:1')).toBe('value');

    const stats = service.getStats();
    expect(stats).toEqual({ size: 1, pending: 0 });
  });

  it('accepts regular expressions when invalidating patterns', async () => {
    const requestSpy = jest.fn().mockResolvedValue('value');

    await service.execute('alpha:1', requestSpy, 1000);
    await service.execute('beta:1', requestSpy, 1000);

    service.invalidatePattern(/alpha:/);

    expect(service.get('alpha:1')).toBeNull();
    expect(service.get('beta:1')).toEqual('value');
  });

  it('removes expired entries during cleanup', async () => {
    const requestSpy = jest.fn().mockResolvedValue('expiring');
    await service.execute('expire', requestSpy, 50);

    jest.advanceTimersByTime(75);
    service.cleanup();

    expect(service.get('expire')).toBeNull();
  });

  it('schedules periodic cleanup with the provided interval', () => {
    const cleanupSpy = jest.spyOn(service, 'cleanup');
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    service.startPeriodicCleanup(5000);

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
    const callback = setIntervalSpy.mock.calls[0][0] as () => void;
    callback();
    expect(cleanupSpy).toHaveBeenCalled();

    cleanupSpy.mockRestore();
    setIntervalSpy.mockRestore();
  });
});
