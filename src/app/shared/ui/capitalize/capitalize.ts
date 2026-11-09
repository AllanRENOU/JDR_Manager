import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';

/** Met en majuscule la première lettre d'un texte (après d'éventuels espaces). */
export function capitalizeFirst(text: string): string {
  return text.replace(/^(\s*)(\p{Ll})/u, (_, spaces: string, letter: string) =>
    spaces.concat(letter.toLocaleUpperCase('fr')),
  );
}

/**
 * Champ de nom (projet, dossier, scène, son, action) : la première lettre passe en majuscule
 * pendant la saisie. Le curseur reste en place.
 *
 * L'écoute se fait en phase de capture : elle passe avant les autres gestionnaires `input` du
 * champ (`(input)`, `[formField]`), qui lisent donc déjà la valeur corrigée.
 */
@Directive({
  selector: 'input[appCapitalize]',
})
export class Capitalize {
  constructor() {
    const input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
    const onInput = (): void => {
      const value = input.value;
      const capitalized = capitalizeFirst(value);
      if (capitalized === value) {
        return;
      }
      const { selectionStart, selectionEnd } = input;
      const shift = capitalized.length - value.length;
      input.value = capitalized;
      if (selectionStart !== null && selectionEnd !== null) {
        input.setSelectionRange(selectionStart + shift, selectionEnd + shift);
      }
    };
    input.addEventListener('input', onInput, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      input.removeEventListener('input', onInput, { capture: true }),
    );
  }
}
