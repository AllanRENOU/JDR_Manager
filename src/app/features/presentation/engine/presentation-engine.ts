import { Injectable, inject, signal } from '@angular/core';

import { DATA_REPOSITORY } from '../../../core/data/data-repository';
import {
  Action,
  AddTextElement,
  FeedItem,
  Id,
  Project,
  Scene,
  SceneNode,
  newId,
} from '../../../core/models';
import { visibleRows } from '../../../shared/tree/tree-model';
import { ActionContext, ActionRunner } from './action-runner';

export type PresentationStatus = 'loading' | 'ready' | 'missing' | 'no-scene';

/**
 * Moteur de présentation (TRD §6) : charge le projet, ouvre les scènes, lance leurs actions
 * d'ouverture et tient le fil d'actualité. Fourni par l'écran de Présentation.
 *
 * Lot 4 : version minimale, sans partie sauvegardée (lot 9) — la Présentation ouvre toujours
 * la première scène (PRS-01).
 */
@Injectable()
export class PresentationEngine {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly runner = inject(ActionRunner);

  readonly status = signal<PresentationStatus>('loading');
  readonly project = signal<Project | null>(null);
  readonly scene = signal<Scene | null>(null);
  readonly sceneNode = signal<SceneNode | null>(null);
  /** Fil d'actualité de la scène ouverte (références vers les éléments d'action, FIL-01). */
  readonly feed = signal<readonly FeedItem[]>([]);
  /** Actions de la scène ouverte, par identifiant (lecture des textes du fil). */
  readonly actions = signal<ReadonlyMap<Id, Action>>(new Map());

  private sceneController: AbortController | null = null;
  private readonly context: ActionContext = {
    addText: (action, element) => this.addText(action, element),
  };

  /** Démarre la Présentation d'un projet : ouvre la première scène. */
  async start(projectId: Id): Promise<void> {
    this.stop();
    this.status.set('loading');
    const project = await this.repository.getProject(projectId);
    if (!project) {
      this.status.set('missing');
      return;
    }
    this.project.set(project);
    const nodes = await this.repository.listSceneNodes(projectId);
    const firstId = firstSceneId(project, nodes);
    if (!firstId) {
      this.status.set('no-scene');
      return;
    }
    await this.openScene(firstId, nodes);
  }

  /** Ouvre une scène : fil vide, puis actions d'ouverture dans l'ordre (texte de scène d'abord). */
  async openScene(sceneId: Id, nodes?: readonly SceneNode[]): Promise<void> {
    this.stop();
    const controller = new AbortController();
    this.sceneController = controller;

    const allNodes = nodes ?? (await this.repository.listSceneNodes(this.project()!.id));
    const [scene, actions] = await Promise.all([
      this.repository.getScene(sceneId),
      this.repository.listActions(sceneId),
    ]);
    if (controller.signal.aborted) {
      return;
    }
    this.sceneNode.set(allNodes.find((n) => n.id === sceneId) ?? null);
    this.scene.set(scene ?? null);
    this.actions.set(new Map(actions.map((a) => [a.id, a])));
    this.feed.set([]);
    this.status.set('ready');

    for (const action of openingActions(actions)) {
      try {
        await this.runner.run(action, this.context, controller.signal);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        throw error;
      }
    }
  }

  /** Texte d'une entrée du fil, relu dans l'action ; `null` si l'action ou l'élément a été supprimé. */
  textOf(item: FeedItem): string | null {
    if (item.type !== 'text') {
      return null;
    }
    const element = this.actions()
      .get(item.actionId)
      ?.elements.find((e) => e.id === item.elementId);
    return element?.type === 'add-text' ? element.text : null;
  }

  /** Arrête les actions de la scène en cours (changement de scène, sortie de l'écran). */
  stop(): void {
    this.sceneController?.abort();
    this.sceneController = null;
  }

  /** FIL-02 : ajout sous les éléments existants ; un texte déjà présent n'est pas ajouté deux fois. */
  private addText(action: Action, element: AddTextElement): void {
    if (this.feed().some((item) => item.type === 'text' && item.elementId === element.id)) {
      return;
    }
    this.feed.update((feed) => [
      ...feed,
      { id: newId(), type: 'text', actionId: action.id, elementId: element.id },
    ]);
  }
}

/** Première scène du projet, sinon la première scène de l'arborescence (ordre d'affichage). */
function firstSceneId(project: Project, nodes: readonly SceneNode[]): Id | null {
  const items = nodes.filter((n) => n.kind === 'item');
  if (project.firstSceneId && items.some((n) => n.id === project.firstSceneId)) {
    return project.firstSceneId;
  }
  // Ordre d'affichage, tous dossiers dépliés.
  return visibleRows(nodes, new Set()).find((row) => row.node.kind === 'item')?.node.id ?? null;
}

/** Actions déclenchées à l'ouverture : « Texte de scène » d'abord, puis par ordre (TRD §6.2). */
function openingActions(actions: readonly Action[]): Action[] {
  return actions
    .filter((a) => a.trigger === 'scene-open')
    .sort((a, b) => Number(b.isSceneText) - Number(a.isSceneText) || a.order - b.order);
}
