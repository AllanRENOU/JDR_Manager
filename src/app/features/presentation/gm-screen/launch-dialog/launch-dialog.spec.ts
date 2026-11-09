import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { useFakeAudio } from '../../../../../testing/fake-audio';
import { getTranslocoTestingModule } from '../../../../../testing/transloco-testing';
import { provideFrenchLocale } from '../../../../core/i18n/locale';
import { Modals } from '../../../../shared/ui/modal/modals';
import { LaunchChoice, LaunchDialog, LaunchDialogData, SavedGameSummary } from './launch-dialog';

describe('LaunchDialog', () => {
  const audio = useFakeAudio();

  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [provideFrenchLocale(), ...audio.providers],
    }),
  );
  afterEach(() => TestBed.inject(Modals).closeAll());

  function open(saved: SavedGameSummary | null) {
    const ref = TestBed.inject(Modals).open<LaunchChoice, LaunchDialogData>(LaunchDialog, {
      size: 'md',
      data: { projectName: 'La crypte', firstSceneName: 'La taverne', saved },
    });
    TestBed.tick();
    const dialog = document.querySelector('app-launch-dialog') as HTMLElement;
    return { dialog, result: firstValueFrom(ref.closed) };
  }
  const button = (root: ParentNode, label: string) =>
    [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent?.includes(label),
    )!;
  const saved: SavedGameSummary = {
    sceneName: 'La forêt',
    updatedAt: '2026-11-02T22:41:00',
    visitedScenes: 4,
  };

  it('partie sauvegardée : dernière scène, date, scènes visitées ; Continuer (10.1.1, 10.1.2)', async () => {
    const { dialog, result } = open(saved);
    expect(dialog.textContent).toContain('Une partie est en cours');
    expect(dialog.textContent).toContain('La crypte');
    expect(dialog.textContent).toContain('Dernière scène');
    expect(dialog.textContent).toContain('La forêt');
    expect(dialog.textContent).toContain('Sauvegardée le 2 novembre à 22h41');
    expect(dialog.textContent).toContain('4 scènes visitées');
    const radios = [...dialog.querySelectorAll<HTMLInputElement>('input[type=radio]')];
    expect(radios.map((r) => [r.value, r.checked])).toEqual([
      ['single', true],
      ['dual', false],
    ]);
    radios[1].click();
    TestBed.tick();
    button(dialog, 'Continuer la partie').click();
    expect(await result).toEqual({ start: 'continue', display: 'dual' });
    // Le clic de lancement débloque l'audio (TEC-43).
    expect(audio.contexts[0].resume).toHaveBeenCalled();
  });

  it('Recommencer demande une confirmation destructive (10.1.2, PRS-03)', async () => {
    const { dialog, result } = open(saved);
    button(dialog, 'Recommencer').click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.querySelector('app-confirm-dialog')).not.toBeNull();
    });
    const confirm = document.querySelector('app-confirm-dialog') as HTMLElement;
    expect(confirm.textContent).toContain('Recommencer la partie ?');
    expect(confirm.textContent).toContain('Tout ce qui a été fait dans cette partie sera perdu');
    button(confirm, 'Annuler').click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(document.querySelector('app-confirm-dialog')).toBeNull();
    });
    expect(document.querySelector('app-launch-dialog')).not.toBeNull();

    button(dialog, 'Recommencer').click();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(
        document.querySelector('app-confirm-dialog .app-button--danger-strong'),
      ).not.toBeNull();
    });
    (
      document.querySelector('app-confirm-dialog .app-button--danger-strong') as HTMLElement
    ).click();
    expect(await result).toEqual({ start: 'restart', display: 'single' });
  });

  it('sans partie : première scène, « Commencer la partie », pas de Recommencer (10.1.3)', async () => {
    const { dialog, result } = open(null);
    expect(dialog.textContent).toContain('Lancer la présentation');
    expect(dialog.textContent).toContain('Première scène');
    expect(dialog.textContent).toContain('La taverne');
    expect(button(dialog, 'Recommencer')).toBeUndefined();
    button(dialog, 'Commencer la partie').click();
    expect(await result).toEqual({ start: 'restart', display: 'single' });
    expect(audio.contexts).toHaveLength(1);
  });

  it('« Retour aux projets » ferme sans lancer', async () => {
    const { dialog, result } = open(null);
    button(dialog, 'Retour aux projets').click();
    expect(await result).toBeUndefined();
  });
});
