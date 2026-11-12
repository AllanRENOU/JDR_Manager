import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Input } from './input';

@Component({
  imports: [Input],
  template: `<input appInput /><textarea appInput surface="card"></textarea>`,
})
class Host {}

@Component({
  imports: [Input],
  template: `<textarea appInput rows="3" [value]="text()"></textarea>`,
})
class TextHost {
  readonly text = signal('');
}

describe('Input', () => {
  it('applique le style de champ et la variante de surface', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [input, textarea] = fixture.nativeElement.querySelectorAll(
      '.app-input',
    ) as NodeListOf<HTMLElement>;
    expect(input.classList).not.toContain('app-input--on-card');
    expect(textarea.classList).toContain('app-input--on-card');
  });

  describe('zone de texte qui suit la hauteur du texte', () => {
    // jsdom ne met rien en page : 20 px par ligne de texte.
    beforeEach(() => {
      vi.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockImplementation(function (
        this: HTMLTextAreaElement,
      ) {
        return this.value.split('\n').length * 20;
      });
    });
    afterEach(() => vi.restoreAllMocks());

    it('donne le nombre de lignes minimal au style (`rows`)', async () => {
      const fixture = TestBed.createComponent(TextHost);
      await fixture.whenStable();
      const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea.style.getPropertyValue('--app-input-rows')).toBe('3');
      // Navigateur qui gère `field-sizing` (jsdom le prétend) : rien à faire en JS.
      expect(textarea.style.height).toBe('');
    });

    it('sans `field-sizing`, ajuste la hauteur à la saisie et à une valeur posée par le code', async () => {
      vi.spyOn(CSS, 'supports').mockReturnValue(false);
      const fixture = TestBed.createComponent(TextHost);
      await fixture.whenStable();
      const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea.style.height).toBe('20px');

      textarea.value = 'Un\nDeux\nTrois';
      textarea.dispatchEvent(new Event('input'));
      expect(textarea.style.height).toBe('60px');

      fixture.componentInstance.text.set('Un\nDeux');
      await fixture.whenStable();
      expect(textarea.style.height).toBe('40px');
    });
  });
});
