import { Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { CollapsibleSection } from '../../../../shared/ui/collapsible-section/collapsible-section';
import { PresentationEngine } from '../../engine/presentation-engine';
import { FeedBattlemap } from '../feed-battlemap/feed-battlemap';

/** Panneau de contrôle › Battlemap (CTL-07) : aperçu de la battlemap affichée et choix. */
@Component({
  selector: 'app-battlemap-section',
  imports: [CollapsibleSection, FeedBattlemap, TranslocoPipe],
  templateUrl: './battlemap-section.html',
  styleUrl: './battlemap-section.scss',
})
export class BattlemapSection {
  protected readonly engine = inject(PresentationEngine);

  protected readonly summary = computed(() => {
    const shown = this.engine.shownBattlemap();
    return shown?.battlemap ? `· ${shown.battlemap.name}` : '';
  });
}
