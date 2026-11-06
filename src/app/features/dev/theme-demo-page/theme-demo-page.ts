import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  LucideAudioLines,
  LucideClapperboard,
  LucideHourglass,
  LucideMap,
  LucideMousePointerClick,
  LucidePalette,
  LucidePencil,
  LucideType,
  LucideVolumeX,
} from '@lucide/angular';

import { Theme, ThemeId } from '../../../core/theme/theme';

/**
 * Page temporaire du lot 1 (route `/dev/themes`) : vérifie les jetons, les polices, les icônes
 * et les composants Material dans chaque thème. À supprimer une fois les écrans réels en place.
 */
@Component({
  selector: 'app-theme-demo-page',
  imports: [
    TranslocoDirective,
    MatButton,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatFormField,
    MatLabel,
    MatInput,
    MatSlideToggle,
    LucidePalette,
    LucidePencil,
    LucideMap,
    LucideAudioLines,
    LucideVolumeX,
    LucideType,
    LucideHourglass,
    LucideMousePointerClick,
    LucideClapperboard,
  ],
  templateUrl: './theme-demo-page.html',
  styleUrl: './theme-demo-page.scss',
})
export class ThemeDemoPage {
  protected readonly theme = inject(Theme);

  /** Jetons de couleur affichés en nuancier. */
  protected readonly colorTokens = [
    'bg-app',
    'bg-panel',
    'bg-card',
    'bg-raised',
    'bg-control',
    'border-subtle',
    'border-default',
    'border-strong',
    'text-primary',
    'text-secondary',
    'text-tertiary',
    'accent',
    'accent-hover',
    'accent-text',
    'accent-tint',
    'active-text',
    'active-bg',
    'danger-text',
    'danger-bg',
  ] as const;

  protected onThemeChange(value: ThemeId): void {
    this.theme.setTheme(value);
  }
}
