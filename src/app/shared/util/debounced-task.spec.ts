import { DebouncedTask } from './debounced-task';

describe('DebouncedTask', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('n’exécute que la dernière valeur, après le délai de calme', async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const debounced = new DebouncedTask<string>(task, 500);
    debounced.schedule('L');
    vi.advanceTimersByTime(300);
    debounced.schedule('La');
    vi.advanceTimersByTime(300);
    expect(task).not.toHaveBeenCalled();
    expect(debounced.pending).toBe(true);
    await vi.advanceTimersByTimeAsync(200);
    expect(task).toHaveBeenCalledExactlyOnceWith('La');
    expect(debounced.pending).toBe(false);
  });

  it('flush exécute immédiatement ; cancel abandonne', async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    const debounced = new DebouncedTask<string>(task, 500);
    debounced.schedule('A');
    await debounced.flush();
    expect(task).toHaveBeenCalledExactlyOnceWith('A');
    await debounced.flush();
    expect(task).toHaveBeenCalledTimes(1);

    debounced.schedule('B');
    debounced.cancel();
    await vi.advanceTimersByTimeAsync(1000);
    expect(task).toHaveBeenCalledTimes(1);
  });
});
