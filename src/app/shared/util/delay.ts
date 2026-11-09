/**
 * Attend `ms` millisecondes ; rejetée avec la raison du signal s'il est annulé avant
 * (élément « Attendre » interrompu par un changement de scène, TEC-51).
 */
export function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(
      () => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      },
      Math.max(0, ms),
    );
    signal.addEventListener('abort', onAbort, { once: true });
  });
}
