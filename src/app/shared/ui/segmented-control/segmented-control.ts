import { Component, ElementRef, input, model, viewChildren } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

/** Option d'un contrôle segmenté. */
export interface SegmentedOption<T> {
  value: T;
  /** Texte affiché (déjà traduit). */
  label: string;
}

/**
 * Contrôle segmenté (Brief §6.3), ex. déclencheur d'une action.
 * Groupe de boutons radio accessible (flèches gauche / droite), compatible Signal Forms
 * (`[formField]`) grâce au modèle `value`.
 */
@Component({
  selector: 'app-segmented-control',
  templateUrl: './segmented-control.html',
  styleUrl: './segmented-control.scss',
  host: { role: 'radiogroup', '[attr.aria-label]': 'label()' },
})
export class SegmentedControl<T> implements FormValueControl<T | null> {
  readonly options = input.required<readonly SegmentedOption<T>[]>();
  readonly value = model<T | null>(null);
  /** Libellé d'accessibilité du groupe. */
  readonly label = input('');
  readonly disabled = input(false);

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('option');

  protected select(value: T): void {
    if (!this.disabled()) {
      this.value.set(value);
    }
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) {
      return;
    }
    event.preventDefault();
    const options = this.options();
    const next = (index + step + options.length) % options.length;
    this.select(options[next].value);
    this.buttons()[next]?.nativeElement.focus();
  }

  /** Seule l'option choisie (ou la première) est atteignable par Tab, comme un groupe radio natif. */
  protected tabIndex(index: number): number {
    const selected = this.options().findIndex((o) => o.value === this.value());
    return index === (selected === -1 ? 0 : selected) ? 0 : -1;
  }
}
