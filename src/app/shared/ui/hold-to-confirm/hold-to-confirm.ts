import { DestroyRef, Directive, inject, input, output, signal } from '@angular/core';

/** Durée d'appui par défaut qui valide une action irréversible (PRS-03, NF-31). */
export const HOLD_TO_CONFIRM_MS = 3000;

/**
 * Bouton à valider par un appui long (souris, doigt, Espace ou Entrée maintenus) : le fond se
 * remplit de gauche à droite pendant `appHoldToConfirmDuration` ms (`--hold-progress`, de 0 à 1,
 * piloté en JS pour rester visible avec `prefers-reduced-motion`), puis `holdConfirmed` est émis.
 * Relâché avant, le fond se vide et `tooShort()` passe à `true` jusqu'à la destruction : l'écran
 * affiche alors son message (le texte n'est pas fourni par la directive).
 *
 * Pas de `(click)` sur le bouton : le clic simple ne doit rien valider.
 *
 * ```html
 * <button appButton="secondary" appHoldToConfirm #hold="appHoldToConfirm"
 *         aria-describedby="aide" (holdConfirmed)="supprimer()">Supprimer</button>
 * @if (hold.tooShort()) { <p role="alert">…</p> }
 * ```
 *
 * Styles globaux : `styles/components/_hold-to-confirm.scss` (couleur de remplissage `--hold-fill`).
 */
@Directive({
  selector: '[appHoldToConfirm]',
  exportAs: 'appHoldToConfirm',
  host: {
    class: 'app-hold',
    '[class.app-hold--active]': 'holding()',
    '[style.--hold-progress]': 'progress()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'release()',
    '(pointercancel)': 'release()',
    '(keydown)': 'onKeydown($event)',
    '(keyup)': 'onKeyup($event)',
    '(blur)': 'release()',
    '(contextmenu)': '$event.preventDefault()',
  },
})
export class HoldToConfirm {
  /** Durée de l'appui qui valide, en millisecondes. */
  readonly duration = input(HOLD_TO_CONFIRM_MS, { alias: 'appHoldToConfirmDuration' });
  /** Début d'un appui : c'est un geste de l'utilisateur (ex. débloquer l'audio, TEC-43). */
  readonly holdStarted = output<void>();
  /** Appui maintenu jusqu'au bout : l'action est validée. */
  readonly holdConfirmed = output<void>();

  private readonly holdingState = signal(false);
  private readonly progressState = signal(0);
  private readonly tooShortState = signal(false);
  /** Appui en cours. */
  readonly holding = this.holdingState.asReadonly();
  /** Remplissage du bouton, de 0 à 1. */
  readonly progress = this.progressState.asReadonly();
  /** Relâché trop tôt au moins une fois : le message reste affiché, même pendant un nouvel appui. */
  readonly tooShort = this.tooShortState.asReadonly();

  private timer: ReturnType<typeof setTimeout> | null = null;
  private frame: number | null = null;
  private startedAt = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }

  /** Bouton principal de la souris ou contact ; le pointeur est capturé. */
  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }
    // Capturé : seul le relâchement arrête l'appui, même si le pointeur sort du bouton.
    if (typeof event.pointerId === 'number') {
      (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    }
    this.start();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat) {
        this.start();
      }
    }
  }

  protected onKeyup(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.release();
    }
  }

  /** Relâché (ou focus perdu) avant la fin : le fond revient à l'état initial. */
  protected release(): void {
    if (!this.holding()) {
      return;
    }
    this.clear();
    this.tooShortState.set(true);
  }

  private start(): void {
    if (this.holding()) {
      return;
    }
    this.holdingState.set(true);
    this.startedAt = performance.now();
    this.timer = setTimeout(() => this.complete(), this.duration());
    this.animate();
    this.holdStarted.emit();
  }

  private animate(): void {
    if (typeof requestAnimationFrame !== 'function') {
      return;
    }
    this.frame = requestAnimationFrame(() => {
      this.progressState.set(Math.min(1, (performance.now() - this.startedAt) / this.duration()));
      if (this.holding()) {
        this.animate();
      }
    });
  }

  private complete(): void {
    this.clear();
    this.holdConfirmed.emit();
  }

  private clear(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
    this.holdingState.set(false);
    this.progressState.set(0);
  }
}
