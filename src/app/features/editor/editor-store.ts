import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import { DATA_REPOSITORY, SceneLink } from '../../core/data/data-repository';
import { resolveMediaType } from '../../core/media/media-types';
import {
  Action,
  ActionElement,
  AddTextElement,
  Battlemap,
  GLOBAL_SOUND_LIBRARY,
  Id,
  Project,
  Scene,
  SceneNode,
  SoundNode,
  TreeNodeKind,
  Trigger,
  newId,
} from '../../core/models';
import { TreeMoveEvent, applyMove, descendantIds } from '../../shared/tree/tree-model';
import { DebouncedTask } from '../../shared/util/debounced-task';
import { baseName } from '../../shared/util/file-name';

export type EditorStatus = 'loading' | 'ready' | 'missing';

/** Élément « Ajouter un texte » d'une action, désigné pour l'enregistrement. */
export interface TextTarget {
  actionId: Id;
  elementId: Id;
}

/** Texte d'action affiché dans la zone centrale, avec son action (pastille). */
export interface ActionText {
  action: Action;
  element: AddTextElement;
}

/** Résultat d'un import d'images de battlemap. */
export interface BattlemapImportResult {
  imported: Battlemap[];
  /** Fichiers refusés : format non pris en charge. */
  rejected: File[];
  /** Erreur qui a interrompu l'import (ex. quota dépassé) ; les images déjà importées restent. */
  failure?: unknown;
}

/** Contenu modifiable d'une action (éditeur d'action). */
export interface ActionDraftData {
  name: string;
  trigger: Trigger;
  elements: ActionElement[];
}

interface PendingText {
  sceneId: Id;
  /** `null` : texte de scène. */
  target: TextTarget | null;
  text: string;
}

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
  /** Liens « Changer de scène » du projet (avertissement à la suppression d'une scène). */
  private readonly sceneLinks = signal<readonly SceneLink[]>([]);
  readonly selectedSceneId = signal<Id | null>(null);
  /** Contenu de la scène ouverte. */
  readonly scene = signal<Scene | null>(null);

  /** Battlemaps de la scène ouverte, par `order`. */
  readonly battlemaps = signal<Battlemap[]>([]);
  /** Nœuds des bibliothèques de sons (projet puis globale), pour choisir et nommer les sons. */
  readonly soundNodes = signal<readonly SoundNode[]>([]);
  /** Noms des sons (bibliothèque du projet et globale), pour résumer les actions. */
  readonly soundNames = computed<Readonly<Record<Id, string>>>(() =>
    Object.fromEntries(
      this.soundNodes()
        .filter((n) => n.kind === 'item')
        .map((n) => [n.id, n.name]),
    ),
  );

  /** Actions de la scène ouverte : ouverture de la scène puis clic du MJ, chacune par `order`. */
  readonly actions = signal<Action[]>([]);
  /** Action « Texte de scène » de la scène ouverte (créée à la première saisie). */
  readonly sceneTextAction = computed(() => this.actions().find((a) => a.isSceneText) ?? null);
  /** Texte de scène : texte du premier élément « Ajouter un texte » de cette action. */
  readonly sceneText = computed(() => firstTextElement(this.sceneTextAction())?.text ?? '');

  /**
   * Textes ajoutés par les actions, sous le texte de scène (SCN-07) : chaque élément « Ajouter
   * un texte » dans l'ordre des actions puis des éléments, sauf le texte de scène lui-même.
   */
  readonly actionTexts = computed<ActionText[]>(() => {
    const sceneTextElement = firstTextElement(this.sceneTextAction());
    return this.actions().flatMap((action) =>
      action.elements
        .filter((e): e is AddTextElement => e.type === 'add-text' && e !== sceneTextElement)
        .map((element) => ({ action, element })),
    );
  });

  /**
   * Textes au moment de l'ouverture de la scène : valeurs initiales des champs (texte de scène,
   * puis un par élément). Ils ne suivent pas la saisie, pour qu'un enregistrement en retard ne
   * réécrive jamais ce que le MJ tape.
   */
  readonly initialSceneText = signal('');
  readonly initialTexts = signal<Readonly<Record<Id, string>>>({});

  /** Enregistrement automatique (4.5) de tous les champs de texte de la scène. */
  readonly saveState = signal<SaveState>('idle');
  /** Saisies en attente, par champ (`scene` ou id de l'élément). */
  private readonly pendingTexts = new Map<string, PendingText>();
  private readonly textSave = new DebouncedTask<void>(
    () => this.savePendingTexts(),
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
    const [nodes, projectSounds, globalSounds] = await Promise.all([
      this.repository.listSceneNodes(projectId),
      this.repository.listSoundNodes(projectId),
      this.repository.listSoundNodes(GLOBAL_SOUND_LIBRARY),
    ]);
    this.project.set(project);
    this.sceneNodes.set(nodes);
    this.soundNodes.set([...projectSounds, ...globalSounds]);
    await this.refreshSceneLinks();
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
    this.queueText('scene', null, text);
  }

  /** Saisie d'un texte d'action dans la zone centrale (SCN-07), enregistrée comme le texte de scène. */
  editActionText(target: TextTarget, text: string): void {
    this.queueText(target.elementId, target, text);
  }

  private queueText(key: string, target: TextTarget | null, text: string): void {
    const sceneId = this.selectedSceneId();
    if (sceneId) {
      this.saveState.set('pending');
      this.pendingTexts.set(key, { sceneId, target, text });
      this.textSave.schedule();
    }
  }

  /** Enregistre immédiatement les saisies en attente (sortie du champ, changement de scène ou d'écran). */
  flush(): Promise<void> {
    return this.textSave.flush();
  }

  private async savePendingTexts(): Promise<void> {
    const pending = [...this.pendingTexts.values()].filter(
      (p) => p.sceneId === this.selectedSceneId(),
    );
    this.pendingTexts.clear();
    if (pending.length === 0) {
      return;
    }
    this.saveState.set('saving');
    try {
      for (const { target, text } of pending) {
        await (target ? this.setActionText(target, text) : this.setSceneText(text));
      }
      this.saveState.set(this.textSave.pending ? 'pending' : 'saved');
    } catch (error) {
      this.saveState.set('error');
      throw error;
    }
  }

  /** Met à jour le texte d'un élément « Ajouter un texte » d'une action de la scène ouverte. */
  setActionText(target: TextTarget, text: string): Promise<void> {
    const run = this.writes.then(async () => {
      const action = this.actions().find((a) => a.id === target.actionId);
      if (!action) {
        return;
      }
      const updated: Action = {
        ...action,
        elements: action.elements.map((e) =>
          e.id === target.elementId && e.type === 'add-text' ? { ...e, text } : e,
        ),
      };
      await this.repository.saveAction(updated);
      this.replaceAction(updated);
      await this.touchProject();
    });
    this.writes = run.catch(() => undefined);
    return run;
  }

  /**
   * Déplace une action parmi celles du même déclencheur (7.3.2). « Texte de scène » reste en
   * tête des actions d'ouverture. Les rangs (`order`) sont renumérotés et enregistrés.
   */
  async reorderAction(trigger: Trigger, from: number, to: number): Promise<void> {
    const group = this.actions().filter((a) => a.trigger === trigger);
    const locked = group[0]?.isSceneText ? 1 : 0;
    const target = Math.max(locked, Math.min(to, group.length - 1));
    if (from < locked || from === target || from >= group.length) {
      return;
    }
    const reordered = [...group];
    reordered.splice(target, 0, ...reordered.splice(from, 1));
    const others = this.actions().filter((a) => a.trigger !== trigger);
    const all = trigger === 'scene-open' ? [...reordered, ...others] : [...others, ...reordered];
    const changed = all
      .map((action, order) => ({ action, order }))
      .filter(({ action, order }) => action.order !== order)
      .map(({ action, order }) => ({ ...action, order }));
    for (const action of changed) {
      await this.repository.saveAction(action);
    }
    const byId = new Map(changed.map((a) => [a.id, a]));
    this.actions.set(sortActions(this.actions().map((a) => byId.get(a.id) ?? a)));
    await this.touchProject();
  }

  /**
   * Importe des images comme battlemaps de la scène ouverte (BTM-01, BTM-04), à la suite des
   * existantes ; nom = nom du fichier sans extension. Si la scène n'avait pas de battlemap par
   * défaut, la première importée le devient (BTM-02).
   */
  async importBattlemaps(files: readonly File[]): Promise<BattlemapImportResult> {
    const scene = this.scene();
    const accepted = files.filter((file) => resolveMediaType(file)?.kind === 'image');
    const rejected = files.filter((file) => !accepted.includes(file));
    const imported: Battlemap[] = [];
    if (!scene) {
      return { imported, rejected };
    }
    let failure: unknown;
    try {
      for (const file of accepted) {
        const mediaId = await this.repository.uploadMedia(file);
        const existing = this.battlemaps();
        const battlemap: Battlemap = {
          id: newId(),
          sceneId: scene.id,
          name: baseName(file.name),
          mediaId,
          order: existing.length === 0 ? 0 : Math.max(...existing.map((b) => b.order)) + 1,
        };
        await this.repository.saveBattlemap(battlemap);
        this.battlemaps.update((maps) => [...maps, battlemap]);
        imported.push(battlemap);
        const current = this.scene();
        if (current?.id === scene.id && !current.defaultBattlemapId) {
          const updated = { ...current, defaultBattlemapId: battlemap.id };
          await this.repository.saveScene(updated);
          this.scene.set(updated);
        }
      }
    } catch (error) {
      failure = error;
    }
    if (imported.length > 0) {
      await this.touchProject();
    }
    return failure === undefined ? { imported, rejected } : { imported, rejected, failure };
  }

  /** Définit la battlemap par défaut de la scène ouverte (BTM-02). */
  async setDefaultBattlemap(id: Id): Promise<void> {
    const scene = this.scene();
    if (!scene || scene.defaultBattlemapId === id) {
      return;
    }
    const updated = { ...scene, defaultBattlemapId: id };
    await this.repository.saveScene(updated);
    this.scene.set(updated);
    await this.touchProject();
  }

  async renameBattlemap(id: Id, name: string): Promise<void> {
    const battlemap = this.battlemaps().find((b) => b.id === id);
    if (!battlemap || battlemap.name === name) {
      return;
    }
    const renamed = { ...battlemap, name };
    await this.repository.saveBattlemap(renamed);
    this.battlemaps.update((maps) => maps.map((b) => (b.id === id ? renamed : b)));
    await this.touchProject();
  }

  /** Nombre d'actions de la scène ouverte qui affichent cette battlemap (avertissement). */
  battlemapUsage(id: Id): number {
    return this.actions().filter((a) =>
      a.elements.some((e) => e.type === 'show-battlemap' && e.battlemapId === id),
    ).length;
  }

  /**
   * Supprime une battlemap (et son image si elle n'est plus utilisée). Si c'était la battlemap
   * par défaut, la première restante le devient. Les éléments « Afficher une battlemap » qui la
   * visaient ne sont pas modifiés : ils sont signalés (PRS-07).
   */
  async deleteBattlemap(id: Id): Promise<void> {
    const scene = this.scene();
    await this.repository.deleteBattlemap(id);
    const remaining = this.battlemaps().filter((b) => b.id !== id);
    this.battlemaps.set(remaining);
    if (scene && scene.defaultBattlemapId === id) {
      const updated = { ...scene, defaultBattlemapId: remaining[0]?.id ?? null };
      await this.repository.saveScene(updated);
      this.scene.set(updated);
    }
    await this.touchProject();
  }

  /** Remplace les scènes suivantes de la scène ouverte (SCN-04), dans l'ordre donné. */
  async setNextScenes(ids: readonly Id[]): Promise<void> {
    const scene = this.scene();
    if (!scene) {
      return;
    }
    const nextSceneIds = [...new Set(ids)].filter((id) => id !== scene.id);
    const updated = { ...scene, nextSceneIds };
    await this.repository.saveScene(updated);
    this.scene.set(updated);
    await this.touchProject();
  }

  /**
   * Enregistre une action modifiée dans l'éditeur d'action, ou crée une nouvelle action à la fin
   * des actions de la scène (ACT-01). Les champs de texte de la zone centrale reprennent les
   * textes enregistrés.
   */
  async saveAction(existing: Action | null, draft: ActionDraftData): Promise<Action> {
    const scene = this.scene();
    if (!scene) {
      throw new Error('EditorStore : aucune scène ouverte');
    }
    await this.flush();
    const actions = this.actions();
    const action: Action = existing
      ? { ...existing, ...draft, trigger: existing.isSceneText ? 'scene-open' : draft.trigger }
      : {
          id: newId(),
          sceneId: scene.id,
          ...draft,
          order: actions.length === 0 ? 0 : Math.max(...actions.map((a) => a.order)) + 1,
          isSceneText: false,
        };
    await this.repository.saveAction(action);
    this.replaceAction(action);
    this.initialSceneText.set(this.sceneText());
    this.initialTexts.update((texts) => ({
      ...texts,
      ...Object.fromEntries(
        action.elements.flatMap((e) => (e.type === 'add-text' ? [[e.id, e.text]] : [])),
      ),
    }));
    await this.refreshSceneLinks();
    await this.touchProject();
    return action;
  }

  /** Supprime une action (sauf « Texte de scène », SCN-06). */
  async deleteAction(id: Id): Promise<void> {
    const action = this.actions().find((a) => a.id === id);
    if (!action || action.isSceneText) {
      return;
    }
    await this.flush();
    await this.repository.deleteAction(id);
    this.actions.update((actions) => actions.filter((a) => a.id !== id));
    await this.refreshSceneLinks();
    await this.touchProject();
  }

  /**
   * Nombre d'actions extérieures à la scène (ou au dossier) qui la visent par « Changer de scène » :
   * elles la signaleront comme introuvable si elle est supprimée (avertissement, 12.3).
   */
  sceneTargetCount(nodeId: Id): number {
    const removed = descendantIds(this.sceneNodes(), nodeId).add(nodeId);
    return this.sceneLinks().filter(
      (link) => !removed.has(link.sceneId) && link.targetIds.some((id) => removed.has(id)),
    ).length;
  }

  private async refreshSceneLinks(): Promise<void> {
    const project = this.project();
    this.sceneLinks.set(project ? await this.repository.listSceneLinks(project.id) : []);
  }

  /** Remplace (ou ajoute) une action dans la liste de la scène ouverte, en gardant l'ordre d'affichage. */
  private replaceAction(action: Action): void {
    this.actions.update((actions) =>
      sortActions([...actions.filter((a) => a.id !== action.id), action]),
    );
  }

  /** Ouvre une scène (élément de l'arborescence). */
  async openScene(id: Id | null): Promise<void> {
    await this.flush();
    const node = this.sceneNodes().find((n) => n.id === id);
    if (!id || node?.kind !== 'item') {
      return;
    }
    this.selectedSceneId.set(id);
    const [scene, actions, battlemaps] = await Promise.all([
      this.repository.getScene(id),
      this.repository.listActions(id),
      this.repository.listBattlemaps(id),
    ]);
    this.scene.set(scene ?? null);
    this.actions.set(sortActions(actions));
    this.battlemaps.set(battlemaps);
    this.initialSceneText.set(this.sceneText());
    this.initialTexts.set(
      Object.fromEntries(this.actionTexts().map(({ element }) => [element.id, element.text])),
    );
  }

  /**
   * Crée la première scène du projet (SCN-03) et la marque comme première scène.
   * @returns la scène créée.
   */
  async createFirstScene(): Promise<Scene> {
    const node = await this.createNode('item', null, this.transloco.translate('scene.defaultName'));
    return this.scene() ?? { ...emptyScene(node) };
  }

  /**
   * Dossier où créer un élément depuis les boutons du haut de l'arborescence (SCN-08) : celui
   * de la scène ouverte, sinon la racine.
   */
  creationParent(): Id | null {
    return this.selectedNode()?.parentId ?? null;
  }

  /**
   * Crée un dossier ou une scène à la fin de son dossier (SCN-02, SCN-08). Une nouvelle scène
   * est ouverte ; si le projet n'a pas encore de première scène, elle le devient.
   */
  async createNode(kind: TreeNodeKind, parentId: Id | null, name: string): Promise<SceneNode> {
    const project = this.requireProject();
    const siblings = this.sceneNodes().filter((n) => n.parentId === parentId);
    const node: SceneNode = {
      id: newId(),
      projectId: project.id,
      parentId,
      order: siblings.length === 0 ? 0 : Math.max(...siblings.map((n) => n.order)) + 1,
      kind,
      name,
    };
    await this.flush();
    await this.repository.saveSceneNodes([node]);
    this.sceneNodes.update((nodes) => [...nodes, node]);
    if (kind === 'item') {
      const scene = emptyScene(node);
      await this.repository.saveScene(scene);
      await this.saveProject({ ...project, firstSceneId: project.firstSceneId ?? node.id });
      this.selectedSceneId.set(node.id);
      this.scene.set(scene);
      this.actions.set([]);
      this.battlemaps.set([]);
      this.initialSceneText.set('');
      this.initialTexts.set({});
    } else {
      await this.touchProject();
    }
    return node;
  }

  /** Renomme un dossier ou une scène. */
  async renameNode(id: Id, name: string): Promise<void> {
    const node = this.sceneNodes().find((n) => n.id === id);
    if (!node || node.name === name) {
      return;
    }
    const renamed = { ...node, name };
    await this.repository.saveSceneNodes([renamed]);
    this.sceneNodes.update((nodes) => nodes.map((n) => (n.id === id ? renamed : n)));
    await this.touchProject();
  }

  /**
   * Supprime un dossier ou une scène avec son contenu (SCN-11, confirmation faite par
   * l'arborescence). Si la scène ouverte disparaît, ouvre la première scène restante.
   */
  async removeNode(id: Id): Promise<void> {
    const project = this.requireProject();
    const removed = descendantIds(this.sceneNodes(), id).add(id);
    await this.flush();
    await this.repository.deleteSceneNode(id);
    const [reloaded, nodes] = await Promise.all([
      this.repository.getProject(project.id),
      this.repository.listSceneNodes(project.id),
    ]);
    this.sceneNodes.set(nodes);
    await this.refreshSceneLinks();
    if (reloaded) {
      await this.saveProject(reloaded);
    }
    const selected = this.selectedSceneId();
    if (selected && removed.has(selected)) {
      this.selectedSceneId.set(null);
      this.scene.set(null);
      this.actions.set([]);
      this.battlemaps.set([]);
      const next = this.project()?.firstSceneId ?? nodes.find((n) => n.kind === 'item')?.id ?? null;
      await this.openScene(next);
    }
  }

  /** Déplace ou réordonne un nœud (glisser-déposer, SCN-02). */
  async moveNode(move: TreeMoveEvent): Promise<void> {
    const changed = applyMove(this.sceneNodes(), move);
    if (changed.length === 0) {
      return;
    }
    await this.repository.saveSceneNodes(changed);
    const byId = new Map(changed.map((n) => [n.id, n]));
    this.sceneNodes.update((nodes) =>
      nodes.map((n) => byId.get(n.id) ?? n).sort((a, b) => a.order - b.order),
    );
    await this.touchProject();
  }

  /**
   * Duplique une scène juste après elle (SCN-12) : copie de son contenu, de ses battlemaps
   * (même image, sans la recopier) et de ses actions, avec de nouveaux identifiants. Les
   * éléments « Afficher une battlemap » visent les copies ; les scènes suivantes et les cibles
   * de « Changer de scène » restent les mêmes. Ouvre la copie.
   */
  async duplicateScene(id: Id): Promise<SceneNode | null> {
    const source = this.sceneNodes().find((n) => n.id === id && n.kind === 'item');
    const scene = source && (await this.repository.getScene(id));
    if (!source || !scene) {
      return null;
    }
    await this.flush();
    const [battlemaps, actions] = await Promise.all([
      this.repository.listBattlemaps(id),
      this.repository.listActions(id),
    ]);
    const copyId = newId();
    const battlemapIds = new Map(battlemaps.map((b) => [b.id, newId()]));
    const actionIds = new Map(actions.map((a) => [a.id, newId()]));

    // Place la copie juste après l'original en décalant les frères suivants.
    const shifted = this.sceneNodes()
      .filter((n) => n.parentId === source.parentId && n.order > source.order)
      .map((n) => ({ ...n, order: n.order + 1 }));
    const node: SceneNode = {
      ...source,
      id: copyId,
      order: source.order + 1,
      name: this.transloco.translate('scene.copyName', { name: source.name }),
    };
    await this.repository.saveSceneNodes([...shifted, node]);
    await this.repository.saveScene({
      ...scene,
      id: copyId,
      defaultBattlemapId: scene.defaultBattlemapId
        ? (battlemapIds.get(scene.defaultBattlemapId) ?? null)
        : null,
      nextSceneIds: [...scene.nextSceneIds],
      sceneTextActionId: scene.sceneTextActionId
        ? (actionIds.get(scene.sceneTextActionId) ?? null)
        : null,
    });
    for (const battlemap of battlemaps) {
      const copy: Battlemap = {
        ...battlemap,
        id: battlemapIds.get(battlemap.id)!,
        sceneId: copyId,
      };
      await this.repository.saveBattlemap(copy);
    }
    for (const action of actions) {
      await this.repository.saveAction({
        ...action,
        id: actionIds.get(action.id)!,
        sceneId: copyId,
        elements: action.elements.map((e) => copyElement(e, battlemapIds)),
      });
    }
    const byId = new Map(shifted.map((n) => [n.id, n]));
    this.sceneNodes.update((nodes) =>
      [...nodes.map((n) => byId.get(n.id) ?? n), node].sort((a, b) => a.order - b.order),
    );
    await this.refreshSceneLinks();
    await this.touchProject();
    await this.openScene(copyId);
    return node;
  }

  /** Définit (ou retire, avec `null`) la première scène du projet (SCN-03). */
  async setFirstScene(id: Id | null): Promise<void> {
    const project = this.requireProject();
    if (project.firstSceneId !== id) {
      await this.saveProject({ ...project, firstSceneId: id });
    }
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
      this.replaceAction(action);
      this.scene.set(updatedScene);
    } else {
      const element = firstTextElement(current);
      const elements = element
        ? current.elements.map((e) => (e.id === element.id ? { ...element, text } : e))
        : [{ id: newId(), type: 'add-text' as const, text }, ...current.elements];
      const action = { ...current, elements };
      await this.repository.saveAction(action);
      this.replaceAction(action);
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

/** Contenu d'une nouvelle scène : sans battlemap, sans scène suivante, sans texte. */
function emptyScene(node: SceneNode): Scene {
  return {
    id: node.id,
    projectId: node.projectId,
    defaultBattlemapId: null,
    nextSceneIds: [],
    sceneTextActionId: null,
  };
}

/** Copie d'un élément d'action avec un nouvel id ; une battlemap copiée remplace l'originale. */
function copyElement(element: ActionElement, battlemapIds: Map<Id, Id>): ActionElement {
  const copy = { ...element, id: newId() };
  if (copy.type === 'show-battlemap') {
    copy.battlemapId = battlemapIds.get(copy.battlemapId) ?? copy.battlemapId;
  }
  return copy;
}

/** Ordre d'affichage des actions : ouverture de la scène d'abord (texte de scène en tête), puis clic du MJ. */
export function sortActions(actions: readonly Action[]): Action[] {
  const rank = (a: Action) => (a.trigger === 'scene-open' ? 0 : 1);
  return [...actions].sort(
    (a, b) =>
      rank(a) - rank(b) || Number(b.isSceneText) - Number(a.isSceneText) || a.order - b.order,
  );
}
