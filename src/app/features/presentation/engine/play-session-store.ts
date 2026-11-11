import { Injectable, inject, signal } from '@angular/core';

import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import { Id, PlaySession, SceneState } from '../../../core/models';
import { Notifications } from '../../../shared/ui/notification-host/notifications';

/** État d'une scène à sa première ouverture : battlemap par défaut, rien d'autre (TRD §6.3). */
export function newSceneState(defaultBattlemapId: Id | null): SceneState {
  return {
    visited: true,
    doneActionIds: [],
    currentBattlemapId: defaultBattlemapId,
    playingSounds: [],
    feed: [],
  };
}

/**
 * Partie en cours (TRD §6.1) : applique chaque événement à la `PlaySession` et l'enregistre
 * aussitôt (TEC-52, NF-24). Les écritures sont enchaînées : la dernière enregistrée est toujours
 * la plus récente. Fourni par l'écran de Présentation.
 *
 * Mode démo (`enableDemo()`) : la partie ne vit qu'en mémoire ; la partie sauvegardée n'est ni
 * lue, ni effacée, ni remplacée.
 */
@Injectable()
export class PlaySessionStore {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly notifications = inject(Notifications);
  private writes: Promise<void> = Promise.resolve();

  readonly session = signal<PlaySession | null>(null);
  /** Mode démo : rien n'est lu ni enregistré. */
  readonly demo = signal(false);

  /** Passe en mode démo, avant tout chargement. */
  enableDemo(): void {
    this.demo.set(true);
  }

  /** Partie sauvegardée du projet, s'il y en a une (choix Continuer / Recommencer, PRS-02). */
  async findSaved(projectId: Id): Promise<PlaySession | undefined> {
    return this.demo() ? undefined : this.repository.getPlaySession(projectId);
  }

  /** Reprend une partie sauvegardée (PRS-05). */
  resume(session: PlaySession): void {
    this.session.set(structuredClone(session));
  }

  /** Nouvelle partie : l'ancienne est effacée (PRS-03), sauf en démo. */
  async restart(projectId: Id, firstSceneId: Id): Promise<void> {
    await this.writes;
    if (!this.demo()) {
      await this.repository.deletePlaySession(projectId);
    }
    this.session.set({
      projectId,
      currentSceneId: firstSceneId,
      scenes: {},
      updatedAt: new Date().toISOString(),
    });
    this.save();
  }

  sceneState(sceneId: Id): SceneState | undefined {
    return this.session()?.scenes[sceneId];
  }

  setCurrentScene(sceneId: Id): void {
    this.change((session) => ({ ...session, currentSceneId: sceneId }));
  }

  /** Modifie l'état d'une scène (créé s'il n'existe pas) et enregistre. */
  updateScene(sceneId: Id, update: (state: SceneState) => SceneState): void {
    this.change((session) => ({
      ...session,
      scenes: {
        ...session.scenes,
        [sceneId]: update(session.scenes[sceneId] ?? newSceneState(null)),
      },
    }));
  }

  /** Attend la fin des écritures en cours (sortie de l'écran, tests). */
  flush(): Promise<void> {
    return this.writes;
  }

  private change(update: (session: PlaySession) => PlaySession): void {
    const session = this.session();
    if (!session) {
      return;
    }
    this.session.set({ ...update(session), updatedAt: new Date().toISOString() });
    this.save();
  }

  private save(): void {
    const snapshot = structuredClone(this.session());
    if (!snapshot || this.demo()) {
      return;
    }
    const write = this.writes.then(() => this.repository.savePlaySession(snapshot));
    // Une écriture ratée (ex. quota) est signalée sans bloquer la partie ni les suivantes (NF-25).
    this.writes = write.catch((error) => {
      this.notifications.fromError(error);
    });
  }
}
