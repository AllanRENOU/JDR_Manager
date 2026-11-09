import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideArrowLeft, LucidePlay } from '@lucide/angular';

import { pluralKey } from '../../../../core/i18n/plural';
import { Button } from '../../../../shared/ui/button/button';
import { Modal } from '../../../../shared/ui/modal/modal';
import { Modals } from '../../../../shared/ui/modal/modals';
import { Placeholder } from '../../../../shared/ui/placeholder/placeholder';
import { AudioPlayer } from '../../audio/audio-player';

/** Mode d'affichage choisi au lancement (AFF-01 à AFF-03). */
export type DisplayMode = 'single' | 'dual';

/** Partie sauvegardée présentée dans la fenêtre. */
export interface SavedGameSummary {
  sceneName: string;
  /** Date ISO 8601 de la dernière sauvegarde. */
  updatedAt: string;
  visitedScenes: number;
}

export interface LaunchDialogData {
  projectName: string;
  /** `null` : pas de partie sauvegardée, la partie commence sur la première scène (PRS-01). */
  saved: SavedGameSummary | null;
  firstSceneName: string;
}

/** `continue` : reprendre (PRS-05) ; `restart` : partie neuve (confirmée s'il y en avait une). */
export interface LaunchChoice {
  start: 'continue' | 'restart';
  display: DisplayMode;
}

/**
 * Fenêtre de lancement de la Présentation (Brief §7.2, maquette « Présentation — lancement ») :
 * dernière scène, choix de l'affichage, Continuer / Recommencer. Le clic de lancement débloque
 * l'audio (TEC-43). Fermée sans choix : `undefined` (retour aux projets).
 */
@Component({
  selector: 'app-launch-dialog',
  imports: [Modal, Button, Placeholder, DatePipe, TranslocoPipe, LucidePlay, LucideArrowLeft],
  templateUrl: './launch-dialog.html',
  styleUrl: './launch-dialog.scss',
})
export class LaunchDialog {
  private readonly ref = inject<DialogRef<LaunchChoice>>(DialogRef);
  private readonly modals = inject(Modals);
  private readonly audio = inject(AudioPlayer);
  private readonly transloco = inject(TranslocoService);
  protected readonly data = inject<LaunchDialogData>(DIALOG_DATA);

  protected readonly display = signal<DisplayMode>('single');
  protected readonly visitedKey = pluralKey(
    'presentation.launch.visited',
    this.data.saved?.visitedScenes ?? 0,
  );
  protected readonly modes: readonly DisplayMode[] = ['single', 'dual'];

  /** Continuer la partie, ou la commencer s'il n'y en a pas. */
  protected launch(): void {
    this.close(this.data.saved ? 'continue' : 'restart');
  }

  /** Recommencer : avertissement puis confirmation destructive (PRS-03). */
  protected async restart(): Promise<void> {
    // Débloqué avant l'attente : le clic de confirmation compte aussi, mais autant ne rien risquer.
    void this.audio.unlock();
    const confirmed = await this.modals.confirm({
      title: this.transloco.translate('presentation.launch.restartTitle'),
      message: this.transloco.translate('presentation.launch.restartMessage'),
      confirmLabel: this.transloco.translate('presentation.launch.restartConfirm'),
      destructive: true,
    });
    if (confirmed) {
      this.close('restart');
    }
  }

  protected back(): void {
    this.ref.close();
  }

  private close(start: LaunchChoice['start']): void {
    // Dans le gestionnaire du clic : le navigateur autorise alors le son (TEC-43).
    void this.audio.unlock();
    this.ref.close({ start, display: this.display() });
  }
}
