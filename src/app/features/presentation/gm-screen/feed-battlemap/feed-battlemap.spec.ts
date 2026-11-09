import { TestBed } from '@angular/core/testing';

import { aBattlemap } from '../../../../../testing/data-builders';
import { usePresentation } from '../../../../../testing/presentation-harness';
import { FeedBattlemap } from './feed-battlemap';

describe('FeedBattlemap', () => {
  usePresentation();

  function render(battlemapId: string, mediaId = 'm1') {
    const fixture = TestBed.createComponent(FeedBattlemap);
    fixture.componentRef.setInput('battlemapId', battlemapId);
    fixture.componentRef.setInput('battlemaps', [
      aBattlemap('A', mediaId, { id: 'b1', name: 'Salle' }),
    ]);
    TestBed.tick();
    return fixture.nativeElement as HTMLElement;
  }

  it('miniature cliquable qui ouvre la battlemap en grand (10.3.2, FIL-04)', async () => {
    const el = render('b1');
    expect(el.querySelector('img')?.getAttribute('src')).toBe('blob:m1');
    (el.querySelector('button') as HTMLButtonElement).click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.querySelector('app-battlemap-viewer img')).not.toBeNull();
    });
    const viewer = document.querySelector('app-battlemap-viewer') as HTMLElement;
    expect(viewer.textContent).toContain('Salle');
    expect(viewer.querySelector('img')?.getAttribute('alt')).toBe('Salle');
  });

  it('battlemap ou image supprimée : message d’erreur (PRS-07)', () => {
    expect(render('autre').querySelector('[role=alert]')?.textContent).toContain('supprimée');
    expect(render('b1', 'absent-m').querySelector('[role=alert]')).not.toBeNull();
  });
});
