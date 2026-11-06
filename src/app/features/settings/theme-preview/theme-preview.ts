import { Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { ThemeId } from '../../../core/theme/theme';

/**
 * Aperçu d'un thème (Brief §11.1) : fond, carte, texte et bouton principal.
 * L'attribut `data-theme` redéfinit les variables CSS du thème sur cet élément seulement :
 * l'aperçu est donc construit à partir des jetons du thème, sans valeur propre (NF-34).
 */
@Component({
  selector: 'app-theme-preview',
  imports: [TranslocoPipe],
  templateUrl: './theme-preview.html',
  styleUrl: './theme-preview.scss',
  host: {
    '[attr.data-theme]': 'theme()',
    'aria-hidden': 'true',
  },
})
export class ThemePreview {
  readonly theme = input.required<ThemeId>();
}
