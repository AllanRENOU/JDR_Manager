import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideArrowLeft, LucidePlay } from '@lucide/angular';

import { pluralKey } from '../../../../core/i18n/plural';
import { Button } from '../../../../shared/ui/button/button';
import {
  HOLD_TO_CONFIRM_MS,
  HoldToConfirm,
} from '../../../../shared/ui/hold-to-confirm/hold-to-confirm';
import { Modal } from '../../../../shared/ui/modal/modal';
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
  /**
   * Appelé dans le gestionnaire du clic de lancement, avant la fermeture : c'est là qu'on peut
   * ouvrir la fenêtre joueurs sans que le navigateur la bloque.
   */
  onLaunch?: (choice: LaunchChoice) => void;
}

/** `continue` : reprendre (PRS-05) ; `restart` : partie neuve (appui long s'il y en avait une). */
export interface LaunchChoice {
  start: 'continue' | 'restart';
  display: DisplayMode;
}

/** Durée de l'appui sur « Recommencer » qui valide (PRS-03). */
export const RESTART_HOLD_MS = HOLD_TO_CONFIRM_MS;

/**
 * Fenêtre de lancement de la Présentation (Brief §7.2, maquette « Présentation — lancement ») :
 * dernière scène, choix de l'affichage, Continuer / Recommencer. Le clic de lancement débloque
 * l'audio (TEC-43). Fermée sans choix : `undefined` (retour aux projets).
 *
 * « Recommencer » se valide en restant appuyé `RESTART_HOLD_MS` (directive `appHoldToConfirm`) ;
 * relâché avant, un message explique qu'il faut rester appuyé et que la progression sera perdue
 * (PRS-03).
 */
@Component({
  selector: 'app-launch-dialog',
  imports: [
    Modal,
    Button,
    HoldToConfirm,
    Placeholder,
    DatePipe,
    TranslocoPipe,
    LucidePlay,
    LucideArrowLeft,
  ],
  templateUrl: './launch-dialog.html',
  styleUrl: './launch-dialog.scss',
})
export class LaunchDialog {
  private readonly ref = inject<DialogRef<LaunchChoice>>(DialogRef);
  private readonly audio = inject(AudioPlayer);
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

  /** Appui long sur « Recommencer » maintenu jusqu'au bout. */
  protected restart(): void {
    this.close('restart');
  }

  /** Début de l'appui sur « Recommencer » : geste de l'utilisateur, l'audio est débloqué (TEC-43). */
  protected unlockAudio(): void {
    void this.audio.unlock();
  }

  protected back(): void {
    this.ref.close();
  }

  private close(start: LaunchChoice['start']): void {
    // Dans le gestionnaire du clic : le navigateur autorise alors le son (TEC-43).
    void this.audio.unlock();
    const choice: LaunchChoice = { start, display: this.display() };
    this.data.onLaunch?.(choice);
    this.ref.close(choice);
  }
}
