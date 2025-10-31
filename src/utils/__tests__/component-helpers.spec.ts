import { createLoadingState } from '../component-helpers';

describe('createLoadingState', () => {
  it('runs the provided operation and toggles loading state', async () => {
    const state = createLoadingState();
    const operation = jest.fn().mockResolvedValue('done');

    const resultPromise = state.execute(operation);

    expect(state.loading()).toBe(true);
    const result = await resultPromise;

    expect(result).toBe('done');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(state.loading()).toBe(false);
    expect(state.error()).toBeNull();
  });

  it('captures errors thrown by the operation', async () => {
    const state = createLoadingState();
    const failure = new Error('boom');

    await expect(state.execute(() => Promise.reject(failure))).rejects.toThrow('boom');

    expect(state.loading()).toBe(false);
    expect(state.error()).toBe(failure);
  });
});
