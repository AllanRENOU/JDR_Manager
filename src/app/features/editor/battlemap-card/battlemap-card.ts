import { Component, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { MediaUrls } from '../../../core/media/media-urls';
import { Battlemap } from '../../../core/models';
import { Pill } from '../../../shared/ui/pill/pill';
import { Placeholder } from '../../../shared/ui/placeholder/placeholder';

/**
 * Miniature d'une battlemap dans le volet de l'éditeur (Brief §6.5, BTM-02) : image, nom,
 * badge « Par défaut ». Les actions sur la battlemap sont projetées (`[cardActions]`).
 */
@Component({
  selector: 'app-battlemap-card',
  imports: [Pill, Placeholder, TranslocoPipe],
  templateUrl: './battlemap-card.html',
  styleUrl: './battlemap-card.scss',
  host: { '[class.default]': 'isDefault()' },
})
export class BattlemapCard {
  readonly battlemap = input.required<Battlemap>();
  readonly isDefault = input(false);

  protected readonly image = inject(MediaUrls).track(() => this.battlemap().mediaId);
}
