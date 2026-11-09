import { Component, computed, inject, input, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucidePause, LucidePlay, LucideVolume1, LucideVolume2 } from '@lucide/angular';

import { Button } from '../../../../shared/ui/button/button';
import { ActiveSound } from '../../audio/audio-player';
import { PresentationEngine } from '../../engine/presentation-engine';

let nextId = 0;

/**
 * Carte d'un son en cours (Brief §6.12, CTL-08, CTL-09) : nom, « boucle », pause / reprise ;
 * un clic sur la carte la déplie et montre le curseur de volume. Pas d'arrêt manuel.
 */
@Component({
  selector: 'app-sound-card',
  imports: [Button, TranslocoPipe, LucidePause, LucidePlay, LucideVolume1, LucideVolume2],
  templateUrl: './sound-card.html',
  styleUrl: './sound-card.scss',
  host: { '[class.expanded]': 'expanded()' },
})
export class SoundCard {
  protected readonly engine = inject(PresentationEngine);

  readonly sound = input.required<ActiveSound>();

  protected readonly expanded = signal(false);
  protected readonly volumeId = `app-sound-volume-${++nextId}`;
  protected readonly name = computed(
    () => this.engine.soundNodes().find((n) => n.id === this.sound().soundId)?.name ?? '',
  );
  protected readonly percent = computed(() => Math.round(this.sound().volume * 100));

  protected toggle(): void {
    const sound = this.sound();
    if (sound.paused) {
      void this.engine.resumeSound(sound.soundId);
    } else {
      this.engine.pauseSound(sound.soundId);
    }
  }

  protected setVolume(value: string): void {
    this.engine.setVolume(this.sound().soundId, Number(value) / 100);
  }
}
