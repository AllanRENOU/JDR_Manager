import { Component, computed, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucidePause, LucidePlay, LucidePlus } from '@lucide/angular';

import { pluralKey } from '../../../../core/i18n/plural';
import { soundChoiceNodes } from '../../../../shared/selection-dialog/sound-choice';
import { Selections } from '../../../../shared/selection-dialog/selections';
import { Button } from '../../../../shared/ui/button/button';
import { CollapsibleSection } from '../../../../shared/ui/collapsible-section/collapsible-section';
import { Notifications } from '../../../../shared/ui/notification-host/notifications';
import { PresentationEngine } from '../../engine/presentation-engine';
import { SoundCard } from '../sound-card/sound-card';

/**
 * Panneau de contrôle › Sons (CTL-08 à CTL-10) : sons en cours, bouton global lecture / pause
 * dans l'en-tête, « Lancer un son » depuis les deux bibliothèques.
 */
@Component({
  selector: 'app-sounds-section',
  imports: [
    CollapsibleSection,
    SoundCard,
    Button,
    TranslocoPipe,
    LucidePause,
    LucidePlay,
    LucidePlus,
  ],
  templateUrl: './sounds-section.html',
  styleUrl: './sounds-section.scss',
})
export class SoundsSection {
  protected readonly engine = inject(PresentationEngine);
  private readonly selections = inject(Selections);
  private readonly transloco = inject(TranslocoService);
  private readonly notifications = inject(Notifications);

  protected readonly summaryKey = computed(() =>
    pluralKey('presentation.sounds.playing', this.engine.sounds().length),
  );

  protected toggleAll(): void {
    this.engine.togglePlayback().catch((error) => this.notifications.fromError(error));
  }

  /** « Lancer un son » : fenêtre de sélection, bibliothèque du projet puis globale (CTL-08). */
  protected async launch(): Promise<void> {
    const project = this.engine.project();
    if (!project) {
      return;
    }
    const chosen = await this.selections.select({
      title: this.transloco.translate('sound.launch'),
      nodes: soundChoiceNodes(this.engine.soundNodes(), project.id, {
        project: this.transloco.translate('sound.project'),
        global: this.transloco.translate('sound.global'),
      }),
      mode: 'single',
      confirmLabel: this.transloco.translate('presentation.sounds.launchConfirm'),
    });
    if (chosen?.[0]) {
      await this.engine.playLibrarySound(chosen[0]);
    }
  }
}
