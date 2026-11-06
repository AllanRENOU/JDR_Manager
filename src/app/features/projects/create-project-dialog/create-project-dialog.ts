import { DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Button } from '../../../shared/ui/button/button';
import { Field } from '../../../shared/ui/field/field';
import { Input } from '../../../shared/ui/input/input';
import { Modal } from '../../../shared/ui/modal/modal';

/** Fenêtre « Créer un projet » : demande le nom ; renvoie le nom saisi (sans espaces superflus). */
@Component({
  selector: 'app-create-project-dialog',
  imports: [Modal, Field, Input, Button, TranslocoPipe],
  templateUrl: './create-project-dialog.html',
})
export class CreateProjectDialog {
  protected readonly ref = inject<DialogRef<string>>(DialogRef);
  protected readonly name = signal('');
  protected readonly valid = computed(() => this.name().trim().length > 0);

  protected submit(event?: Event): void {
    event?.preventDefault();
    if (this.valid()) {
      this.ref.close(this.name().trim());
    }
  }
}
