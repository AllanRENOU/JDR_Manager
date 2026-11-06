import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { aProject } from '../../../../testing/data-builders';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { DATA_REPOSITORY, DataRepository } from '../../../core/data/data-repository';
import { provideFrenchLocale } from '../../../core/i18n/locale';
import { ProjectSummary } from '../project-summary';
import { ProjectCard } from './project-card';

describe('ProjectCard (5.1.2)', () => {
  const getMediaUrl = vi.fn(async (id: string) => `blob:test/${id}`);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [
        provideRouter([]),
        provideFrenchLocale(),
        { provide: DATA_REPOSITORY, useValue: { getMediaUrl } as Partial<DataRepository> },
      ],
    });
  });

  async function render(summary: Partial<ProjectSummary>) {
    const fixture = TestBed.createComponent(ProjectCard);
    fixture.componentRef.setInput('summary', {
      project: aProject({ name: 'La crypte', updatedAt: '2026-03-02T10:00:00.000Z' }),
      sceneCount: 0,
      soundCount: 0,
      lastSceneName: null,
      hasPlaySession: false,
      thumbnailMediaId: null,
      ...summary,
    });
    await fixture.whenStable();
    return fixture;
  }

  it('affiche nom, statistiques (singulier / pluriel), date et visuel de remplacement', async () => {
    const el = (await render({ sceneCount: 1, soundCount: 3 })).nativeElement as HTMLElement;
    expect(el.querySelector('h2')?.textContent).toContain('La crypte');
    expect(el.querySelector('.card__stats')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '1 scène · 3 sons',
    );
    expect(el.textContent).toContain('Modifié le 2 mars 2026');
    expect(el.querySelector('app-placeholder')).not.toBeNull();
    expect(el.textContent).not.toContain('Dernière scène jouée');
  });

  it('affiche la dernière scène jouée et l’image de la vignette', async () => {
    const fixture = await render({ lastSceneName: 'La crypte', thumbnailMediaId: 'carte' });
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Dernière scène jouée : La crypte');
    await vi.waitFor(async () => {
      await fixture.whenStable();
      expect(el.querySelector('img')?.getAttribute('src')).toBe('blob:test/carte');
    });
  });

  it('affiche la pastille « Partie en cours » seulement si une partie est sauvegardée (5.1.3)', async () => {
    const without = (await render({})).nativeElement as HTMLElement;
    expect(without.querySelector('.card__badge')).toBeNull();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [
        provideRouter([]),
        provideFrenchLocale(),
        { provide: DATA_REPOSITORY, useValue: { getMediaUrl } as Partial<DataRepository> },
      ],
    });
    const withSession = (await render({ hasPlaySession: true })).nativeElement as HTMLElement;
    const badge = withSession.querySelector('.card__badge') as HTMLElement;
    expect(badge.textContent).toContain('Partie en cours');
    expect(badge.classList).toContain('tone-active');
  });
});
