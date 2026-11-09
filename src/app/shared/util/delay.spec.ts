import { delay } from './delay';

describe('delay', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('se résout après la durée demandée', async () => {
    const done = vi.fn();
    delay(2000, new AbortController().signal).then(done);
    await vi.advanceTimersByTimeAsync(1999);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalled();
  });

  it('est rejetée dès que le signal est annulé', async () => {
    const controller = new AbortController();
    const waiting = delay(5000, controller.signal);
    controller.abort();
    await expect(waiting).rejects.toThrow();
  });

  it('est rejetée tout de suite si le signal est déjà annulé', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(delay(10, controller.signal)).rejects.toThrow();
  });
});
