import { Injectable, computed, inject, signal } from '@angular/core';

import { DATA_REPOSITORY } from '../../core/data/data-repository';
import { Id, Project, Sheet, SheetNode } from '../../core/models';

/** État de chargement de l'écran Fiches. */
export type SheetsStatus = 'loading' | 'ready' | 'missing';

/**
 * État de l'écran « Fiches » d'un projet (FCH-02, TRD §2.3) : projet, arborescence des fiches,
 * textes (recherche) et nombre d'actions qui utilisent chaque fiche.
 *
 * Fourni par `SheetsPage` (une instance par écran), comme `EditorStore` et `LibraryStore`.
 */
@Injectable()
export class SheetsStore {
  private readonly repository = inject(DATA_REPOSITORY);

  readonly status = signal<SheetsStatus>('loading');
  readonly project = signal<Project | null>(null);
  /** Nœuds de l'arborescence des fiches, triés par `order`. */
  readonly nodes = signal<readonly SheetNode[]>([]);
  /** Textes des fiches, par id de nœud. */
  readonly sheets = signal<Readonly<Record<Id, Sheet>>>({});
  /** Nombre d'actions « Afficher une fiche » par fiche (FCH-07). */
  readonly usages = signal<Readonly<Record<Id, number>>>({});

  /** Le projet a au moins une fiche (sinon : état vide de l'écran). */
  readonly hasSheets = computed(() => this.nodes().some((n) => n.kind === 'item'));

  /** Charge le projet et ses fiches ; statut `missing` si le projet n'existe pas. */
  async load(projectId: Id): Promise<void> {
    this.status.set('loading');
    const project = await this.repository.getProject(projectId);
    if (!project) {
      this.project.set(null);
      this.nodes.set([]);
      this.sheets.set({});
      this.usages.set({});
      this.status.set('missing');
      return;
    }
    const [nodes, sheets, usages] = await Promise.all([
      this.repository.listSheetNodes(projectId),
      this.repository.listSheets(projectId),
      this.repository.countSheetUsages(projectId),
    ]);
    this.project.set(project);
    this.nodes.set(nodes);
    this.sheets.set(Object.fromEntries(sheets.map((s) => [s.id, s])));
    this.usages.set(usages);
    this.status.set('ready');
  }
}
