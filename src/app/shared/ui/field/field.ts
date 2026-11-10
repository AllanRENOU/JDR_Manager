import {
  Component,
  ElementRef,
  computed,
  contentChild,
  inject,
  input,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { MarkdownEditor } from '../../markdown/markdown-editor';
import { highlightMarkdown } from '../../markdown/markdown-highlight';
import { MarkdownPipe } from '../../markdown/markdown-pipe';
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
 * Le texte du champ est dessiné par-dessus le `<textarea>` (dont le texte est transparent) :
 * - avec le focus : texte source coloré, marqueurs visibles (`highlightMarkdown`) ;
 * - sans le focus : texte mis en page (pipe `markdown`) ; un clic rend la main au champ.
 * Ces calques sont `aria-hidden` : les lecteurs d'écran lisent le `<textarea>`.
 */
@Component({
  selector: 'app-field',
  imports: [MarkdownPipe, MarkdownToolbar, TranslocoPipe],
  templateUrl: './field.html',
  styleUrl: './field.scss',
  host: {
    '(focusin)': 'focused.set(true)',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class Field {
  readonly label = input.required<string>();
  readonly required = input(false);
  readonly hint = input('');
  readonly error = input('');
  readonly hiddenLabel = input(false);

  /** Champ Markdown projeté, s'il y en a un : affiche la barre d'outils. */
  protected readonly markdownEditor = contentChild(MarkdownEditor);

  /** Le focus est dans le champ (ou sa barre d'outils) : on montre le texte source. */
  protected readonly focused = signal(false);
  protected readonly sourceHtml = computed(() =>
    highlightMarkdown(this.markdownEditor()?.text() ?? ''),
  );

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  /** Identifiant à poser sur le contrôle projeté. */
  readonly controlId = `app-field-${++nextId}`;
  readonly messageId = `${this.controlId}-message`;

  protected onFocusOut(event: FocusEvent): void {
    this.focused.set(this.host.contains(event.relatedTarget as Node | null));
  }

  /** Clic sur le texte mis en page : le champ reprend le focus (le clic n'est pas transmis). */
  protected editMarkdown(event: MouseEvent, editor: MarkdownEditor): void {
    event.preventDefault();
    editor.element.focus();
  }
}
