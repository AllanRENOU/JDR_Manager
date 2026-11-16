import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryNode } from '../../../core/models';
import { aSoundNode } from '../../../../testing/data-builders';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { MissingFilesAlert } from './missing-files-alert';

describe('MissingFilesAlert', () => {
  let fixture: ComponentFixture<MissingFilesAlert>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [getTranslocoTestingModule()] });
    fixture = TestBed.createComponent(MissingFilesAlert);
  });

  async function show(nodes: LibraryNode[]): Promise<HTMLElement> {
    fixture.componentRef.setInput('nodes', nodes);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('n’affiche rien sans élément', async () => {
    expect((await show([])).querySelector('app-alert')).toBeNull();
  });

  it('nomme chaque élément sans fichier et signale le lien cliqué', async () => {
    const intro = aSoundNode('p1', { name: 'Intro', mediaKind: 'video' });
    const orage = aSoundNode('global', { name: 'Orage' });
    const el = await show([intro, orage]);
    expect(el.textContent).toContain('2 éléments n’ont pas de fichier');
    const selected: LibraryNode[] = [];
    fixture.componentInstance.selected.subscribe((n) => selected.push(n));
    const links = [...el.querySelectorAll('button')];
    expect(links.map((b) => b.textContent?.trim())).toEqual(['Intro', 'Orage']);
    links[1].click();
    expect(selected).toEqual([orage]);
  });

  it('accorde le message au singulier', async () => {
    const el = await show([aSoundNode('p1', { name: 'Intro' })]);
    expect(el.textContent).toContain('1 élément n’a pas de fichier');
  });
});
