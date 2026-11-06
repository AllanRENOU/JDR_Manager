import { Component, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideArrowLeft, LucideCheck } from '@lucide/angular';

import { Theme, ThemeId } from '../../../core/theme/theme';
import { AppHeader } from '../../../shared/ui/app-header/app-header';
import { Button } from '../../../shared/ui/button/button';
import { ThemePreview } from '../theme-preview/theme-preview';

/** Paramètres de l'application, ouverts depuis l'en-tête de l'accueil (NF-33, Brief §11.1). */
@Component({
  selector: 'app-settings-page',
  imports: [
    AppHeader,
    Button,
    ThemePreview,
    RouterLink,
    TranslocoPipe,
    LucideArrowLeft,
    LucideCheck,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
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
