import { CdkMenuTrigger } from '@angular/cdk/menu';
import {
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  LucideEllipsis,
  LucidePencil,
  LucideStar,
  LucideTrash2,
  LucideUpload,
} from '@lucide/angular';

import { pluralKey } from '../../../core/i18n/plural';
import { acceptAttribute } from '../../../core/media/media-types';
import { Battlemap, Id } from '../../../core/models';
import { Button } from '../../../shared/ui/button/button';
import { CollapsibleSection } from '../../../shared/ui/collapsible-section/collapsible-section';
import { Menu } from '../../../shared/ui/menu/menu';
import { MenuItem } from '../../../shared/ui/menu/menu-item';
import { Modals } from '../../../shared/ui/modal/modals';
import { Notifications } from '../../../shared/ui/notification-host/notifications';
import { BattlemapCard } from '../battlemap-card/battlemap-card';
import { EditorStore } from '../editor-store';

/**
 * Partie « Battlemaps » du volet droit de l'éditeur (BTM-01, BTM-02) : miniatures en grille,
 * import, et menu de chaque battlemap (définir par défaut, renommer, supprimer).
 */
@Component({
  selector: 'app-battlemaps-panel',
  imports: [
    BattlemapCard,
    Button,
    CdkMenuTrigger,
    CollapsibleSection,
    Menu,
    MenuItem,
    TranslocoPipe,
    LucideEllipsis,
    LucidePencil,
    LucideStar,
    LucideTrash2,
    LucideUpload,
  ],
  templateUrl: './battlemaps-panel.html',
  styleUrl: './battlemaps-panel.scss',
})
export class BattlemapsPanel {
  protected readonly store = inject(EditorStore);
  protected readonly accept = acceptAttribute('image');
  private readonly modals = inject(Modals);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);

  /** Battlemap en cours de renommage. */
  protected readonly editingId = signal<Id | null>(null);
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  constructor() {
    afterRenderEffect(() => {
      const input = this.nameInput()?.nativeElement;
      if (input && document.activeElement !== input) {
        input.focus();
        input.select();
      }
    });
  }

  /** Images choisies avec « Importer » ; l'écran les importe (même traitement qu'un dépôt). */
  readonly filesChosen = output<File[]>();

  protected onFilesChosen(input: HTMLInputElement): void {
    const files = [...(input.files ?? [])];
    input.value = '';
    if (files.length > 0) {
      this.filesChosen.emit(files);
    }
  }

  /** Entrée ou sortie du champ : enregistre un nom non vide et différent. */
  protected commitRename(map: Battlemap, value: string): void {
    if (this.editingId() !== map.id) {
      return;
    }
    this.editingId.set(null);
    const name = value.trim();
    if (name && name !== map.name) {
      this.run(this.store.renameBattlemap(map.id, name));
    }
  }

  /** Supprime après confirmation ; avertit si des actions affichent cette battlemap. */
  protected async remove(map: Battlemap): Promise<void> {
    const used = this.store.battlemapUsage(map.id);
    const t = (key: string) => this.transloco.translate(key, { name: map.name, count: used });
    const confirmed = await this.modals.confirm({
      title: t('battlemap.deleteTitle'),
      message:
        used > 0 ? t(pluralKey('battlemap.deleteUsedMessage', used)) : t('battlemap.deleteMessage'),
      confirmLabel: t('common.actions.delete'),
      destructive: true,
    });
    if (confirmed) {
      this.run(this.store.deleteBattlemap(map.id));
    }
  }

  protected run(task: Promise<unknown>): void {
    task.catch((error) => this.notifications.fromError(error));
  }
}
