import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { Input } from '../../../shared/ui/input/input';
import { Modal } from '../../../shared/ui/modal/modal';

/** Données de la fenêtre : un nom existant la passe en mode « Renommer ». */
export interface ProjectNameDialogData {
  name?: string;
}

/**
 * Fenêtre « Créer un projet » ou « Renommer le projet » (si `data.name` est fourni) :
 * demande le nom ; renvoie le nom saisi (sans espaces superflus).
 */
@Component({
  selector: 'app-create-project-dialog',
  imports: [Modal, Field, Input, Button, TranslocoPipe],
  templateUrl: './create-project-dialog.html',
})
export class CreateProjectDialog {
  protected readonly ref = inject<DialogRef<string>>(DialogRef);
  private readonly data = inject<ProjectNameDialogData | null>(DIALOG_DATA, { optional: true });

  protected readonly renaming = this.data?.name !== undefined;
  protected readonly name = signal(this.data?.name ?? '');
  protected readonly valid = computed(() => this.name().trim().length > 0);

  protected submit(event?: Event): void {
    event?.preventDefault();
    if (this.valid()) {
      this.ref.close(this.name().trim());
    }
  }
}
