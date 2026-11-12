import { DestroyRef, Directive, ElementRef, afterEveryRender, inject, input } from '@angular/core';

/**
 * Style de champ texte du design system (Brief §6.2), posé sur un vrai `<input>` ou `<textarea>`.
 * `surface="card"` quand le champ est posé directement sur la page (fond de carte).
 * Styles : `src/styles/components/_form.scss`.
 *
 * Un `<textarea>` s'agrandit avec son texte, à partir de `rows` lignes : CSS `field-sizing:
 * content` quand le navigateur le gère, sinon la directive ajuste la hauteur à chaque saisie,
 * changement de valeur ou de largeur.
 */
@Directive({
  selector: 'input[appInput], textarea[appInput]',
  host: {
    class: 'app-input',
    '[class.app-input--on-card]': 'surface() === "card"',
  },
})
export class Input {
  readonly surface = input<'panel' | 'card'>('panel');

  constructor() {
    const element: HTMLElement = inject(ElementRef).nativeElement;
    if (element instanceof HTMLTextAreaElement) {
      element.style.setProperty('--app-input-rows', String(element.rows));
      if (!supportsFieldSizing()) {
        autoSize(element, inject(DestroyRef));
      }
    }
  }
}

function supportsFieldSizing(): boolean {
  return globalThis.CSS?.supports?.('field-sizing', 'content') ?? false;
}

/** Repli sans `field-sizing` : hauteur = hauteur du texte (la hauteur minimale reste en CSS). */
function autoSize(textarea: HTMLTextAreaElement, destroyRef: DestroyRef): void {
  let measuredValue: string | null = null;
  let measuredWidth = -1;

  const fit = () => {
    measuredValue = textarea.value;
    measuredWidth = textarea.clientWidth;
    // Replier le champ pour le mesurer peut faire défiler la page : on remet les défilements.
    const scrolled = scrolledAncestors(textarea);
    textarea.style.height = 'auto';
    const borders = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = `${textarea.scrollHeight + borders}px`;
    for (const [el, top] of scrolled) {
      el.scrollTop = top;
    }
  };

  textarea.addEventListener('input', fit);
  // Valeur posée par le code (`[value]`, `[formField]`) : pas d'événement `input`.
  afterEveryRender({
    write: () => {
      if (textarea.value !== measuredValue) {
        fit();
      }
    },
  });
  // Largeur modifiée (fenêtre, volet) : le texte se replie autrement.
  const observer =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          if (textarea.clientWidth !== measuredWidth) {
            fit();
          }
        });
  observer?.observe(textarea);
  destroyRef.onDestroy(() => {
    textarea.removeEventListener('input', fit);
    observer?.disconnect();
  });
}

function scrolledAncestors(element: HTMLElement): [Element, number][] {
  const result: [Element, number][] = [];
  for (let el = element.parentElement; el; el = el.parentElement) {
    if (el.scrollTop > 0) {
      result.push([el, el.scrollTop]);
    }
  }
  const root = document.scrollingElement;
  if (root && root.scrollTop > 0 && !result.some(([el]) => el === root)) {
    result.push([root, root.scrollTop]);
  }
  return result;
}
