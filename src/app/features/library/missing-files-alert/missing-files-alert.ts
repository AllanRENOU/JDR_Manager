import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { pluralKey } from '../../../core/i18n/plural';
import { LibraryNode } from '../../../core/models';
import { Alert } from '../../../shared/ui/alert/alert';

/**
 * Alerte de la Bibliothèque : sons et vidéos sans fichier (ex. vidéo exportée sans son fichier,
 * VID-13), avec un lien vers chacun, car ils peuvent être dans un dossier fermé. Rien n'est
 * affiché si la liste est vide.
 */
@Component({
  selector: 'app-missing-files-alert',
  imports: [Alert, TranslocoPipe],
  templateUrl: './missing-files-alert.html',
  styleUrl: './missing-files-alert.scss',
})
export class MissingFilesAlert {
  readonly nodes = input.required<readonly LibraryNode[]>();
  /** Lien cliqué : l'écran ouvre le dossier de l'élément et le met en évidence. */
  readonly selected = output<LibraryNode>();

  protected readonly pluralKey = pluralKey;
}
