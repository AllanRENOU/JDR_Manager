import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { MarkdownEditor } from '../markdown-editor';
import { MarkdownToolbar } from './markdown-toolbar';

@Component({
  imports: [MarkdownEditor, MarkdownToolbar],
  template: `
    <app-markdown-toolbar [editor]="md" controlId="t" />
    <textarea id="t" appMarkdownEditor #md="appMarkdownEditor"></textarea>
  `,
})
class Host {}

describe('MarkdownToolbar', () => {
  it('propose un bouton libellé par mise en forme, sans voler le focus', async () => {
    TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Gras',
      'Italique',
      'Titre',
      'Liste à puces',
      'Liste numérotée',
      'Citation',
    ]);
    expect(buttons[0].title).toBe('Gras (Ctrl+B)');
    expect(buttons[0].getAttribute('aria-keyshortcuts')).toBe('Control+B');

    const mousedown = new MouseEvent('mousedown', { cancelable: true });
    buttons[0].dispatchEvent(mousedown);
    expect(mousedown.defaultPrevented).toBe(true);
  });

  it('applique la mise en forme au champ', async () => {
    TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Titre';
    textarea.setSelectionRange(0, 0);
    (
      fixture.nativeElement.querySelector('button[aria-label="Titre"]') as HTMLButtonElement
    ).click();
    expect(textarea.value).toBe('## Titre');
  });
});
