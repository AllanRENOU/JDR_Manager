import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  LucideArrowLeft,
  LucideKeyboard,
  LucideMap,
  LucideMonitor,
  LucideMonitorUp,
  LucidePresentation,
} from '@lucide/angular';

import { Id } from '../../../../core/models';
import { Selections } from '../../../../shared/selection-dialog/selections';
import { pathTo } from '../../../../shared/tree/tree-model';
import { Alert } from '../../../../shared/ui/alert/alert';
import { AppHeader } from '../../../../shared/ui/app-header/app-header';
import { Button } from '../../../../shared/ui/button/button';
import { Modals } from '../../../../shared/ui/modal/modals';
import { Notifications } from '../../../../shared/ui/notification-host/notifications';
import { ActionRunner } from '../../engine/action-runner';
import { PlaySessionStore } from '../../engine/play-session-store';
import { PresentationEngine } from '../../engine/presentation-engine';
import { ActionsSection } from '../actions-section/actions-section';
import { BattlemapSection } from '../battlemap-section/battlemap-section';
import { Feed } from '../feed/feed';
import { NextSceneButton } from '../next-scene-button/next-scene-button';
import { PlayerWindow } from '../player-window';
import { ShortcutsDialog } from '../shortcuts-dialog/shortcuts-dialog';
import { SoundsSection } from '../sounds-section/sounds-section';
import {
  DisplayMode,
  LaunchChoice,
  LaunchDialog,
  LaunchDialogData,
} from '../launch-dialog/launch-dialog';

/**
 * Mode Présentation, écran du MJ (`/projects/:projectId/play`, PRJ-03, Brief §7.2) : en-tête avec la
 * scène et « Aller à une scène », fil d'actualité et « Scène suivante » au centre, panneau de
 * contrôle Battlemap / Actions / Sons à droite.
 */
@Component({
  selector: 'app-gm-screen-page',
  imports: [
    AppHeader,
    Alert,
    Button,
    RouterLink,
    Feed,
    NextSceneButton,
    BattlemapSection,
    ActionsSection,
    SoundsSection,
    TranslocoPipe,
    LucideArrowLeft,
    LucideKeyboard,
    LucideMap,
    LucideMonitor,
    LucideMonitorUp,
    LucidePresentation,
  ],
  providers: [PresentationEngine, ActionRunner, PlaySessionStore, PlayerWindow],
  templateUrl: './gm-screen-page.html',
  styleUrl: './gm-screen-page.scss',
  host: { '(document:keydown)': 'onShortcut($event)' },
})
export class GmScreenPage {
  protected readonly engine = inject(PresentationEngine);
  private readonly notifications = inject(Notifications);
  private readonly modals = inject(Modals);
  private readonly router = inject(Router);

  private readonly selections = inject(Selections);
  private readonly nextScene = viewChild(NextSceneButton);
  private readonly transloco = inject(TranslocoService);

  protected readonly playerWindow = inject(PlayerWindow);

  /** Affichage choisi au lancement (AFF-03). */
  protected readonly displayMode = signal<DisplayMode>('single');

  /** Projet et dossiers de la scène : « Les Ombres de Valombre · Acte I — Valombre ». */
  protected readonly context = computed(() => {
    const node = this.engine.sceneNode();
    const folders = node
      ? pathTo(this.engine.sceneNodes(), node.id)
          .slice(0, -1)
          .map((n) => n.name)
      : [];
    return [this.engine.project()?.name ?? '', folders.join(' › ')].filter(Boolean).join(' · ');
  });

  /** Paramètre de route `:projectId`. */
  readonly projectId = input.required<Id>();

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      // Seul le projet relance la Présentation : les signals lus par le moteur ne sont pas suivis.
      untracked(() =>
        // Une erreur n'interrompt jamais la partie (NF-25) : on la signale.
        this.launch(projectId).catch((error) => this.notifications.fromError(error)),
      );
    });
    inject(DestroyRef).onDestroy(() => {
      this.modals.closeAll();
      void this.engine.stop();
    });
  }

  /** Ouvre ou rouvre la fenêtre joueurs (AFF-02) ; signale une fenêtre bloquée par le navigateur. */
  protected openPlayerWindow(): void {
    if (!this.playerWindow.openWindow()) {
      this.notifications.error(this.transloco.translate('presentation.player.blocked'));
    }
  }

  protected showShortcuts(): void {
    this.modals.open(ShortcutsDialog, { size: 'sm' });
  }

  /**
   * Raccourcis clavier (NF-32, liste dans `PRESENTATION_SHORTCUTS`) : ignorés pendant une saisie,
   * avec une touche de modification, ou quand une fenêtre est ouverte.
   */
  protected onShortcut(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (
      this.engine.status() !== 'ready' ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.repeat ||
      target?.closest('input, textarea, select, [contenteditable="true"]') ||
      this.modals.isOpen()
    ) {
      return;
    }
    const key = event.key.toLowerCase();
    const run = (action: () => unknown) => {
      event.preventDefault();
      Promise.resolve(action()).catch((error) => this.notifications.fromError(error));
    };
    if (key === 'c') {
      const pending = [...this.engine.feed()]
        .reverse()
        .find((item) => item.type === 'user-click' && !item.validated);
      if (pending) {
        run(() => this.engine.continueClick(pending.id));
      }
    } else if (key === 's') {
      run(() => this.nextScene()?.activate());
    } else if (key === 'a') {
      run(() => this.goToScene());
    } else if (key === 'p') {
      run(() => this.engine.togglePlayback());
    } else if (key === '?') {
      run(() => this.showShortcuts());
    } else if (/^[1-9]$/.test(key)) {
      const available = this.engine.manualActions().filter((a) => !a.done && !a.running);
      const action = available[Number(key) - 1];
      if (action) {
        run(() => this.engine.runAction(action.action.id));
      }
    }
  }

  /** « Aller à une scène » : arborescence en lecture seule, scène actuelle grisée (CTL-05). */
  protected async goToScene(): Promise<void> {
    const current = this.engine.scene()?.id;
    const chosen = await this.selections.select({
      title: this.transloco.translate('presentation.goToScene'),
      nodes: this.engine.sceneNodes(),
      mode: 'single',
      disabledIds: current ? [current] : [],
      labels: { disabled: 'scene.current' },
      confirmLabel: this.transloco.translate('presentation.goToSceneConfirm'),
    });
    if (chosen?.[0]) {
      await this.engine.openScene(chosen[0]);
    }
  }

  /** Charge le projet puis ouvre la fenêtre de lancement (10.1). */
  private async launch(projectId: Id): Promise<void> {
    await this.engine.load(projectId);
    if (this.engine.status() !== 'choose') {
      return;
    }
    this.playerWindow.connect(projectId);
    const saved = this.engine.savedSession();
    const ref = this.modals.open<LaunchChoice, LaunchDialogData>(LaunchDialog, {
      size: 'md',
      closable: false,
      data: {
        onLaunch: (choice) => {
          if (choice.display === 'dual') {
            this.openPlayerWindow();
          }
        },
        projectName: this.engine.project()?.name ?? '',
        firstSceneName: this.engine.firstScene()?.name ?? '',
        saved: saved && {
          sceneName:
            this.engine.sceneNodes().find((n) => n.id === saved.currentSceneId)?.name ??
            this.engine.firstScene()?.name ??
            '',
          updatedAt: saved.updatedAt,
          visitedScenes: Object.values(saved.scenes).filter((s) => s.visited).length,
        },
      },
    });
    const choice = await firstValueFrom(ref.closed);
    if (!choice) {
      await this.router.navigate(['/projects']);
      return;
    }
    this.displayMode.set(choice.display);
    await (choice.start === 'continue' ? this.engine.continueSession() : this.engine.restart());
  }
}
