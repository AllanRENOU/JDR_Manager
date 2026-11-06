/**
 * Exécute une tâche après un temps de calme (ex. enregistrement automatique pendant la saisie).
 * Seule la dernière valeur demandée est traitée ; `flush()` force l'exécution immédiate
 * (sortie du champ, changement d'écran).
 */
export class DebouncedTask<T> {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pendingValue: { value: T } | null = null;

  constructor(
    private readonly task: (value: T) => Promise<void>,
    private readonly delayMs: number,
  ) {}

  /** Une exécution est en attente. */
  get pending(): boolean {
    return this.pendingValue !== null;
  }

  schedule(value: T): void {
    this.pendingValue = { value };
    this.clearTimer();
    this.timer = setTimeout(() => void this.flush(), this.delayMs);
  }

  /** Exécute tout de suite la tâche en attente, s'il y en a une. */
  async flush(): Promise<void> {
    this.clearTimer();
    const pending = this.pendingValue;
    this.pendingValue = null;
    if (pending) {
      await this.task(pending.value);
    }
  }

  /** Abandonne la tâche en attente. */
  cancel(): void {
    this.clearTimer();
    this.pendingValue = null;
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
