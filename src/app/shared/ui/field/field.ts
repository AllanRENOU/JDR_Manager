import { Component, contentChild, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { MarkdownEditor } from '../../markdown/markdown-editor';
import { MarkdownToolbar } from '../../markdown/markdown-toolbar/markdown-toolbar';

let nextId = 0;

/**
 * Champ de formulaire (Brief §6.2) : libellé au-dessus, contrôle projeté, aide ou erreur dessous.
 *
 * ```html
 * <app-field label="Nom" [required]="true" #f>
 *   <input appInput [id]="f.controlId" />
 * </app-field>
 * ```
 * `controlId` relie le libellé au contrôle. `hiddenLabel` garde le libellé pour les lecteurs
 * d'écran seulement (ex. texte de scène).
 *
 * Un `<textarea appMarkdownEditor>` projeté ajoute la barre de mise en page Markdown
 * (`MarkdownToolbar`) : masquée par défaut, elle s'affiche quand le champ a le focus et flotte
 * juste au-dessus, par-dessus le libellé ou le contenu qui précède (sans décaler la page).
 */
@Component({
  selector: 'app-field',
  imports: [MarkdownToolbar, TranslocoPipe],
  templateUrl: './field.html',
  styleUrl: './field.scss',
})
export class Field {
  readonly label = input.required<string>();
  readonly required = input(false);
  readonly hint = input('');
  readonly error = input('');
  readonly hiddenLabel = input(false);

  /** Champ Markdown projeté, s'il y en a un : affiche la barre d'outils. */
  protected readonly markdownEditor = contentChild(MarkdownEditor);

  /** Identifiant à poser sur le contrôle projeté. */
  readonly controlId = `app-field-${++nextId}`;
  readonly messageId = `${this.controlId}-message`;
}
