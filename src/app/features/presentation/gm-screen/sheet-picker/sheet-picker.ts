import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, ElementRef, afterRenderEffect, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideScrollText, LucideSearch } from '@lucide/angular';

import { Id, Sheet, SheetNode } from '../../../../core/models';
import { Input } from '../../../../shared/ui/input/input';
import { Modal } from '../../../../shared/ui/modal/modal';
import { searchSheets } from '../../../sheets/sheet-search';

/** Fiches du projet, lues dans le moteur à l'ouverture de la fenêtre. */
export interface SheetPickerData {
  nodes: readonly SheetNode[];
  sheets: readonly Sheet[];
}

let nextPickerId = 0;

/**
 * Recherche d'une fiche en Présentation (CTL-14, Brief §6.9) : liste des fiches filtrée au fil de
 * la saisie sur le titre et le texte, avec un extrait ; flèches haut / bas, Entrée ou clic pour
 * choisir. Se ferme en renvoyant l'id de la fiche choisie ; c'est l'écran qui l'ouvre.
 */
@Component({
  selector: 'app-sheet-picker',
  imports: [Modal, Input, TranslocoPipe, LucideScrollText, LucideSearch],
  templateUrl: './sheet-picker.html',
  styleUrl: './sheet-picker.scss',
})
export class SheetPicker {
  protected readonly ref = inject<DialogRef<Id>>(DialogRef);
  private readonly data = inject<SheetPickerData>(DIALOG_DATA);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly listId = `sheet-picker-${nextPickerId++}`;
  protected readonly query = signal('');
  protected readonly searching = computed(() => this.query().trim().length > 0);
  protected readonly results = computed(() =>
    searchSheets(this.data.nodes, this.data.sheets, this.query()),
  );
  protected readonly hasSheets = this.data.nodes.some((n) => n.kind === 'item');
  /** Ligne active (flèches) ; revient à la première à chaque saisie. */
  protected readonly activeIndex = signal(0);
  protected readonly activeId = computed(() => {
    const result = this.results()[this.activeIndex()];
    return result ? this.optionId(result.node.id) : null;
  });

  constructor() {
    // La ligne active reste visible quand on la déplace au clavier.
    afterRenderEffect(() => {
      const id = this.activeId();
      if (id) {
        this.host.nativeElement.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView?.({
          block: 'nearest',
        });
      }
    });
  }

  protected optionId(sheetId: Id): string {
    return `${this.listId}-${sheetId}`;
  }

  protected folderPath(folders: readonly SheetNode[]): string {
    return folders.map((f) => f.name).join(' › ');
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.results().length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (count > 0) {
        const step = event.key === 'ArrowDown' ? 1 : -1;
        this.activeIndex.update((i) => (i + step + count) % count);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const result = this.results()[this.activeIndex()];
      if (result) {
        this.choose(result.node.id);
      }
    }
  }

  protected choose(sheetId: Id): void {
    this.ref.close(sheetId);
  }
}
