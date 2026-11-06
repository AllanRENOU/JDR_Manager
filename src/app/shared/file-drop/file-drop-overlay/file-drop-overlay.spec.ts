import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { MediaKind } from '../../../core/media/media-types';
import { FileDropOverlay } from './file-drop-overlay';

@Component({
  imports: [FileDropOverlay],
  template: `<app-file-drop-overlay
    [fileCount]="count()"
    [destination]="destination()"
    [kinds]="kinds()"
  />`,
})
class Host {
  readonly count = signal(3);
  readonly destination = signal('Bibliothèque globale › Ambiances');
  readonly kinds = signal<MediaKind[]>(['sound']);
}

describe('FileDropOverlay', () => {
  it('affiche le titre, le nombre de fichiers, la destination et les formats acceptés', async () => {
    TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text()).toContain('Déposez vos fichiers');
    expect(text()).toContain('3 fichier(s)');
    expect(text()).toContain('Destination : Bibliothèque globale › Ambiances');
    expect(text()).toContain('Formats acceptés : MP3, OGG, WAV, M4A');

    fixture.componentInstance.count.set(0);
    fixture.componentInstance.destination.set('');
    fixture.componentInstance.kinds.set(['image', 'sound']);
    await fixture.whenStable();
    expect(text()).not.toContain('fichier(s)');
    expect(text()).not.toContain('Destination');
    expect(text()).toContain('PNG, JPG, WebP, MP3');
  });
});
