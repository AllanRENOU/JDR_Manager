import { TestBed } from '@angular/core/testing';

import { aBattlemap } from '../../../../testing/data-builders';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY, DataRepository } from '../../../core/data/data-repository';
import { BattlemapCard } from './battlemap-card';

describe('BattlemapCard', () => {
  it('affiche l’image de la battlemap et le badge « Par défaut » si demandé', async () => {
    const getMediaUrl = vi.fn(() => Promise.resolve('blob:carte'));
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [
        { provide: DATA_REPOSITORY, useValue: { getMediaUrl } as Partial<DataRepository> },
      ],
    });
    const fixture = TestBed.createComponent(BattlemapCard);
    fixture.componentRef.setInput('battlemap', aBattlemap('s1', 'm1', { name: 'Salle' }));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('img')?.getAttribute('src')).toBe('blob:carte');
    });
    expect(el.querySelector('app-pill')).toBeNull();

    fixture.componentRef.setInput('isDefault', true);
    await fixture.whenStable();
    expect(el.querySelector('app-pill')?.textContent).toContain('Par défaut');
  });
});
