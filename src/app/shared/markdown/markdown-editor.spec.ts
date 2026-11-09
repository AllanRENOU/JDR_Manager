import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../testing/transloco-testing';
import { Field } from '../ui/field/field';
import { Input } from '../ui/input/input';
import { MarkdownEditor } from './markdown-editor';

@Component({
  imports: [Field, Input, MarkdownEditor],
  template: `
    <app-field label="Texte" #f>
      <textarea
        appInput
        appMarkdownEditor
        [id]="f.controlId"
        (input)="typed.set($any($event.target).value)"
      ></textarea>
    </app-field>
    <app-field label="Nom" #g>
      <input appInput [id]="g.controlId" />
    </app-field>
  `,
})
class Host {
  readonly typed = signal('');
}

async function setup() {
  TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] });
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
  return { fixture, textarea };
}

describe('MarkdownEditor', () => {
  afterEach(() => document.body.replaceChildren());

  it('affiche la barre d’outils seulement pour un champ Markdown', async () => {
    const { fixture, textarea } = await setup();
    const toolbars = fixture.nativeElement.querySelectorAll('[role="toolbar"]');
    expect(toolbars.length).toBe(1);
    expect(toolbars[0].getAttribute('aria-label')).toBe('Mise en page');
    expect(toolbars[0].getAttribute('aria-controls')).toBe(textarea.id);
  });

  it('met en gras par le bouton et prévient le champ par un événement input', async () => {
    const { fixture, textarea } = await setup();
    textarea.value = 'Un mot';
    textarea.setSelectionRange(3, 6);
    (fixture.nativeElement.querySelector('button[aria-label="Gras"]') as HTMLButtonElement).click();

    expect(textarea.value).toBe('Un **mot**');
    expect(fixture.componentInstance.typed()).toBe('Un **mot**');
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([5, 8]);
    expect(document.activeElement).toBe(textarea);
  });

  it('met en italique avec Ctrl + I', async () => {
    const { textarea } = await setup();
    textarea.value = 'mot';
    textarea.setSelectionRange(0, 3);
    const event = new KeyboardEvent('keydown', { key: 'i', ctrlKey: true, cancelable: true });
    textarea.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(textarea.value).toBe('_mot_');
  });
});
