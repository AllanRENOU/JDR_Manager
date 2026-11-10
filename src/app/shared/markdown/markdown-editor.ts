import { Directive, ElementRef, afterEveryRender, inject, signal } from '@angular/core';

import { MarkdownFormat, applyMarkdownFormat } from './markdown-format';

/**
 * Champ de texte avec mise en page Markdown, à poser sur un `<textarea>` :
 *
 * ```html
 * <app-field label="Texte" #f>
 *   <textarea appInput appMarkdownEditor [id]="f.controlId"></textarea>
 * </app-field>
 * ```
 * Dans un `app-field`, la barre d'outils (`MarkdownToolbar`) flotte au-dessus du champ
 * quand il a le focus. Le champ affiche alors le texte source coloré (marqueurs visibles et texte
 * mis en forme, `highlightMarkdown`) ; sans le focus, il affiche le texte mis en page.
 * Le texte du `<textarea>` est transparent : c'est `app-field` qui le dessine par-dessus.
 * Raccourcis : Ctrl / Cmd + B (gras), Ctrl / Cmd + I (italique).
 *
 * Chaque mise en forme passe par un événement `input` natif : les gestionnaires `(input)`
 * et `[formField]` du champ la reçoivent comme une frappe (enregistrement automatique compris).
 */
@Directive({
  selector: 'textarea[appMarkdownEditor]',
  exportAs: 'appMarkdownEditor',
  host: {
    class: 'app-markdown-editor',
    '(keydown)': 'onKeydown($event)',
    '(input)': 'sync()',
    '(focus)': 'sync()',
    '(scroll)': 'scrollTop.set(element.scrollTop)',
  },
})
export class MarkdownEditor {
  readonly element: HTMLTextAreaElement = inject(ElementRef).nativeElement;

  /** Texte du champ, tenu à jour à la saisie et après chaque rendu (`[value]`, `[formField]`). */
  readonly text = signal('');
  /** Défilement vertical du champ, pour aligner le texte coloré. */
  readonly scrollTop = signal(0);

  constructor() {
    afterEveryRender({ read: () => this.sync() });
  }

  /** Relit la valeur du champ (une valeur posée par le code ne déclenche pas d'événement). */
  protected sync(): void {
    if (this.text() !== this.element.value) {
      this.text.set(this.element.value);
    }
  }

  /** Applique (ou retire) une mise en forme sur la sélection, puis rend le focus au champ. */
  apply(format: MarkdownFormat): void {
    const textarea = this.element;
    const edit = applyMarkdownFormat(
      { value: textarea.value, start: textarea.selectionStart, end: textarea.selectionEnd },
      format,
    );
    textarea.focus();
    textarea.setSelectionRange(edit.from, edit.to);
    // `insertText` garde l'historique d'annulation (Ctrl + Z) ; repli si le navigateur le refuse.
    const inserted =
      typeof document.execCommand === 'function' &&
      document.execCommand('insertText', false, edit.text);
    if (!inserted || textarea.value.slice(edit.from, edit.from + edit.text.length) !== edit.text) {
      textarea.setRangeText(edit.text, edit.from, edit.to);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    textarea.setSelectionRange(edit.start, edit.end);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) {
      return;
    }
    const format = SHORTCUTS[event.key.toLowerCase()];
    if (format) {
      event.preventDefault();
      this.apply(format);
    }
  }
}

const SHORTCUTS: Record<string, MarkdownFormat | undefined> = { b: 'bold', i: 'italic' };
