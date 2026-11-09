import { Component, ElementRef, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideCheck } from '@lucide/angular';

import { Theme, ThemeId } from '../../../core/theme/theme';
import { StorageUsage } from '../storage-usage/storage-usage';
import { ThemePreview } from '../theme-preview/theme-preview';

/**
 * Contenu des paramètres (Apparence, Stockage), partagé par la page `/settings` (accueil)
 * et la fenêtre `SettingsDialog` (modes Édition et Présentation).
 */
@Component({
  selector: 'app-settings-content',
  imports: [StorageUsage, ThemePreview, TranslocoPipe, LucideCheck],
  templateUrl: './settings-content.html',
  styleUrl: './settings-content.scss',
})
export class SettingsContent {
  protected readonly theme = inject(Theme);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Applique le thème immédiatement et le mémorise (NF-33). */
  protected choose(id: ThemeId): void {
    this.theme.setTheme(id);
  }

  /** Groupe de boutons radio (WAI-ARIA) : les flèches choisissent le thème voisin. */
  protected onKeydown(event: KeyboardEvent, index: number): void {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (step === undefined) {
      return;
    }
    event.preventDefault();
    const themes = this.theme.themes;
    const next = themes[(index + step + themes.length) % themes.length];
    this.choose(next.id);
    this.host.nativeElement.querySelector<HTMLElement>(`[data-theme-option="${next.id}"]`)?.focus();
  }
}
