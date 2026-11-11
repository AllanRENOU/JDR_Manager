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

  describe('Recommencer : appui long de 3 s (10.1.2, PRS-03)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const pointer = (target: HTMLElement, type: string) =>
      target.dispatchEvent(new MouseEvent(type, { button: 0, bubbles: true }));
    const key = (target: HTMLElement, type: string, init: KeyboardEventInit) =>
      target.dispatchEvent(new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init }));

    it('un clic simple ne valide pas : message sous le bouton, aucune confirmation', () => {
      const { dialog } = open(saved);
      const restart = button(dialog, 'Recommencer');
      expect(restart.getAttribute('aria-describedby')).toBe('launch-restart-help');
      expect(dialog.querySelector('#launch-restart-help')?.textContent).toContain(
        'Restez appuyé 3 secondes',
      );

      restart.click();
      pointer(restart, 'pointerdown');
      TestBed.tick();
      expect(restart.classList).toContain('app-hold--active');
      vi.advanceTimersByTime(500);
      pointer(restart, 'pointerup');
      TestBed.tick();

      expect(restart.classList).not.toContain('app-hold--active');
      expect(restart.style.getPropertyValue('--hold-progress')).toBe('0');
      const error = dialog.querySelector('.launch-actions__error');
      expect(error?.getAttribute('role')).toBe('alert');
      expect(error?.textContent).toContain('Restez appuyé pour valider');
      expect(error?.textContent).toContain('toute la progression sera perdue');
      expect(document.querySelector('app-confirm-dialog')).toBeNull();

      // Nouvel appui : le message reste affiché.
      pointer(restart, 'pointerdown');
      TestBed.tick();
      expect(dialog.querySelector('.launch-actions__error')).not.toBeNull();
      // Relâché avant la fin : il faut recommencer les 3 secondes.
      vi.advanceTimersByTime(2_900);
      pointer(restart, 'pointerup');
      vi.advanceTimersByTime(1_000);
      TestBed.tick();
      expect(document.querySelector('app-launch-dialog')).not.toBeNull();
    });

    it('rester appuyé 3 s recommence la partie et débloque l’audio', async () => {
      const { dialog, result } = open(saved);
      const restart = button(dialog, 'Recommencer');
      pointer(restart, 'pointerdown');
      TestBed.tick();
      expect(dialog.querySelector('.launch-actions__error')).toBeNull();
      vi.advanceTimersByTime(2_999);
      expect(document.querySelector('app-launch-dialog')).not.toBeNull();
      vi.advanceTimersByTime(1);
      expect(await result).toEqual({ start: 'restart', display: 'single' });
      expect(audio.contexts[0].resume).toHaveBeenCalled();
    });

    it('au clavier : Espace maintenu 3 s valide, relâché avant affiche le message', async () => {
      const { dialog, result } = open(saved);
      const restart = button(dialog, 'Recommencer');
      key(restart, 'keydown', { key: ' ' });
      vi.advanceTimersByTime(1_000);
      key(restart, 'keyup', { key: ' ' });
      TestBed.tick();
      expect(dialog.querySelector('.launch-actions__error')).not.toBeNull();

      key(restart, 'keydown', { key: ' ' });
      key(restart, 'keydown', { key: ' ', repeat: true });
      vi.advanceTimersByTime(3_000);
      expect(await result).toEqual({ start: 'restart', display: 'single' });
    });
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
