import { Component, effect, inject, input, model, untracked } from '@angular/core';
import { LucideChevronDown } from '@lucide/angular';

import { UiPreferences } from '../../../core/preferences/ui-preferences';

let nextId = 0;

/**
 * Section repliable (Brief §6.6) : chevron, titre, résumé (« · 2 en cours ») et action à droite.
 *
 * ```html
 * <app-collapsible-section title="Sons" summary="· 2 en cours" preferenceKey="play.sounds">
 *   <button sectionAction appButton="icon" …>…</button>
 *   … contenu …
 * </app-collapsible-section>
 * ```
 * Avec `preferenceKey`, l'état ouvert / fermé est mémorisé comme préférence d'affichage (TEC-62).
 */
@Component({
  selector: 'app-collapsible-section',
  imports: [LucideChevronDown],
  templateUrl: './collapsible-section.html',
  styleUrl: './collapsible-section.scss',
  host: { '[class.open]': 'open()' },
})
export class CollapsibleSection {
  private readonly preferences = inject(UiPreferences);

  readonly title = input.required<string>();
  readonly summary = input('');
  /** Clé de préférence ; sans clé, l'état n'est pas mémorisé. */
  readonly preferenceKey = input<string>();
  /** Ouverte par défaut (maquettes). */
  readonly open = model(true);

  protected readonly contentId = `app-section-${++nextId}`;

  constructor() {
    // Relit l'état mémorisé quand la clé est connue.
    effect(() => {
      const key = this.preferenceKey();
      if (key) {
        const stored = this.preferences.get<boolean | null>(this.storageKey(key), null);
        if (stored !== null) {
          untracked(() => this.open.set(stored));
        }
      }
    });
  }

  protected toggle(): void {
    const open = !this.open();
    this.open.set(open);
    const key = this.preferenceKey();
    if (key) {
      this.preferences.set(this.storageKey(key), open);
    }
  }

  private storageKey(key: string): string {
    return `section:${key}`;
  }
}
