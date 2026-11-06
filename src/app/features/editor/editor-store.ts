import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { DATA_REPOSITORY } from '../../core/data/data-repository';
import { Action, AddTextElement, Id, Project, Scene, SceneNode, newId } from '../../core/models';
import { DebouncedTask } from '../../shared/util/debounced-task';

export type EditorStatus = 'loading' | 'ready' | 'missing';

/** État de l'enregistrement automatique, affiché dans l'en-tête. */
export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

/** Délai de calme avant d'enregistrer une saisie (ms). */
export const AUTO_SAVE_DELAY = 500;

/**
 * État de l'éditeur d'un projet : projet, arborescence des scènes, scène ouverte.
 * Fourni par `EditorPage` (une instance par écran) ; toutes les écritures passent par le dépôt.
 */
@Injectable()
export class EditorStore {
  private readonly repository = inject(DATA_REPOSITORY);
  private readonly transloco = inject(TranslocoService);

  readonly status = signal<EditorStatus>('loading');
  readonly project = signal<Project | null>(null);
  readonly sceneNodes = signal<SceneNode[]>([]);
  readonly selectedSceneId = signal<Id | null>(null);
  /** Contenu de la scène ouverte. */
  readonly scene = signal<Scene | null>(null);

  /** Action « Texte de scène » de la scène ouverte (créée à la première saisie). */
  readonly sceneTextAction = signal<Action | null>(null);
  /** Texte de scène : texte du premier élément « Ajouter un texte » de cette action. */
  readonly sceneText = computed(() => firstTextElement(this.sceneTextAction())?.text ?? '');

  /**
   * Texte de scène au moment de l'ouverture de la scène : valeur initiale du champ. Il ne suit
   * pas la saisie, pour qu'un enregistrement en retard ne réécrive jamais ce que le MJ tape.
   */
  readonly initialSceneText = signal('');

  /** Enregistrement automatique (4.5). */
  readonly saveState = signal<SaveState>('idle');
  private readonly sceneTextSave = new DebouncedTask<{ sceneId: Id; text: string }>(
    ({ sceneId, text }) => this.autoSaveSceneText(sceneId, text),
    AUTO_SAVE_DELAY,
  );

  /** Écritures enchaînées une à une : deux saisies rapprochées ne créent pas deux actions. */
  private writes: Promise<unknown> = Promise.resolve();

  readonly hasScenes = computed(() => this.sceneNodes().some((n) => n.kind === 'item'));
  readonly selectedNode = computed(
    () => this.sceneNodes().find((n) => n.id === this.selectedSceneId()) ?? null,
  );

  /** Charge le projet et ouvre la première scène (ou la première de l'arborescence). */
  async load(projectId: Id): Promise<void> {
    this.status.set('loading');
    const project = await this.repository.getProject(projectId);
    if (!project) {
      this.project.set(null);
      this.status.set('missing');
      return;
    }
    const nodes = await this.repository.listSceneNodes(projectId);
    this.project.set(project);
    this.sceneNodes.set(nodes);
    const firstItem = nodes.find((n) => n.kind === 'item');
    const initial = project.firstSceneId ?? firstItem?.id ?? null;
    await this.openScene(initial);
    this.status.set('ready');
  }

  /**
   * Saisie du texte de scène : enregistrée automatiquement après un court temps de calme
   * (moins d'écritures pendant la frappe), ou tout de suite avec `flush()`.
   */
  editSceneText(text: string): void {
    const sceneId = this.selectedSceneId();
    if (sceneId) {
      this.saveState.set('pending');
      this.sceneTextSave.schedule({ sceneId, text });
    }
  }

  /** Enregistre immédiatement les saisies en attente (sortie du champ, changement de scène ou d'écran). */
  flush(): Promise<void> {
    return this.sceneTextSave.flush();
  }

  private async autoSaveSceneText(sceneId: Id, text: string): Promise<void> {
    if (this.selectedSceneId() !== sceneId) {
      return;
    }
    this.saveState.set('saving');
    try {
      await this.setSceneText(text);
      this.saveState.set(this.sceneTextSave.pending ? 'pending' : 'saved');
    } catch (error) {
      this.saveState.set('error');
      throw error;
    }
  }

  /** Ouvre une scène (élément de l'arborescence). */
  async openScene(id: Id | null): Promise<void> {
    await this.flush();
    const node = this.sceneNodes().find((n) => n.id === id);
    if (!id || node?.kind !== 'item') {
      return;
    }
    this.selectedSceneId.set(id);
    const [scene, actions] = await Promise.all([
      this.repository.getScene(id),
      this.repository.listActions(id),
    ]);
    this.scene.set(scene ?? null);
    this.sceneTextAction.set(actions.find((a) => a.isSceneText) ?? null);
    this.initialSceneText.set(this.sceneText());
  }

  /**
   * Crée la première scène du projet (SCN-03) et la marque comme première scène.
   * @returns la scène créée.
   */
  async createFirstScene(): Promise<Scene> {
    const project = this.requireProject();
    const id = newId();
    const node: SceneNode = {
      id,
      projectId: project.id,
      parentId: null,
      order: this.sceneNodes().filter((n) => n.parentId === null).length,
      kind: 'item',
      name: this.transloco.translate('scene.defaultName'),
    };
    const scene: Scene = {
      id,
      projectId: project.id,
      defaultBattlemapId: null,
      nextSceneIds: [],
      sceneTextActionId: null,
    };
    await this.repository.saveSceneNodes([node]);
    await this.repository.saveScene(scene);
    await this.saveProject({ ...project, firstSceneId: project.firstSceneId ?? id });
    this.sceneNodes.update((nodes) => [...nodes, node]);
    this.selectedSceneId.set(id);
    this.scene.set(scene);
    this.sceneTextAction.set(null);
    this.initialSceneText.set('');
    return scene;
  }

  /**
   * Met à jour le texte de scène (SCN-05, SCN-06). La première saisie non vide crée l'action
   * « Texte de scène » (déclencheur : ouverture de la scène ; élément : ajouter un texte) et la
   * relie à la scène ; ensuite seul le texte de l'élément est modifié.
   */
  setSceneText(text: string): Promise<void> {
    const run = this.writes.then(() => this.writeSceneText(text));
    this.writes = run.catch(() => undefined);
    return run;
  }

  private async writeSceneText(text: string): Promise<void> {
    const scene = this.scene();
    if (!scene) {
      return;
    }
    const current = this.sceneTextAction();
    if (!current) {
      if (!text.trim()) {
        return;
      }
      const action: Action = {
        id: newId(),
        sceneId: scene.id,
        name: this.transloco.translate('action.sceneText'),
        trigger: 'scene-open',
        order: 0,
        isSceneText: true,
        elements: [{ id: newId(), type: 'add-text', text }],
      };
      const updatedScene: Scene = { ...scene, sceneTextActionId: action.id };
      await this.repository.saveAction(action);
      await this.repository.saveScene(updatedScene);
      this.sceneTextAction.set(action);
      this.scene.set(updatedScene);
    } else {
      const element = firstTextElement(current);
      const elements = element
        ? current.elements.map((e) => (e.id === element.id ? { ...element, text } : e))
        : [{ id: newId(), type: 'add-text' as const, text }, ...current.elements];
      const action = { ...current, elements };
      await this.repository.saveAction(action);
      this.sceneTextAction.set(action);
    }
    await this.touchProject();
  }

  /** Met à jour la date de modification du projet. */
  private async touchProject(): Promise<void> {
    const project = this.project();
    if (project) {
      await this.saveProject(project);
    }
  }

  /** Enregistre le projet en mettant à jour sa date de modification. */
  async saveProject(project: Project): Promise<void> {
    const saved = { ...project, updatedAt: new Date().toISOString() };
    await this.repository.saveProject(saved);
    this.project.set(saved);
  }

  /** Vrai si la scène est la première scène du projet. */
  isFirstScene(id: Id): boolean {
    return this.project()?.firstSceneId === id;
  }

  private requireProject(): Project {
    const project = this.project();
    if (!project) {
      throw new Error('EditorStore : aucun projet chargé');
    }
    return project;
  }
}

function firstTextElement(action: Action | null): AddTextElement | undefined {
  return action?.elements.find((e): e is AddTextElement => e.type === 'add-text');
}
