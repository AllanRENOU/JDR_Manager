import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';

import { Button } from '../../../../shared/ui/button/button';
import { Input } from '../../../../shared/ui/input/input';
import { Field } from '../../../../shared/ui/field/field';
import { Modal } from '../../../../shared/ui/modal/modal';

/** Fenêtre d'exemple de la page de démonstration. */
@Component({
  selector: 'app-demo-modal',
  imports: [Modal, Button, Field, Input],
  template: `
    <app-modal title="Modifier l’action" [subtitle]="'Scène : ' + data.scene">
      <app-field label="Nom de l’action" [required]="true" #name>
        <input appInput cdkFocusInitial [id]="name.controlId" value="Entrée dans la taverne" />
      </app-field>
      <button modalFooterStart appButton="danger" type="button" (click)="ref.close('delete')">
        Supprimer l’action
      </button>
      <button modalFooterEnd appButton="secondary" type="button" (click)="ref.close()">
        Annuler
      </button>
      <button modalFooterEnd appButton type="button" (click)="ref.close('save')">
        Enregistrer
      </button>
    </app-modal>
  `,
})
export class DemoModal {
  protected readonly ref = inject<DialogRef<string>>(DialogRef);
  protected readonly data = inject<{ scene: string }>(DIALOG_DATA);
}
