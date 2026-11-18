import { TestBed } from '@angular/core/testing';

import { useTestRepository } from '../../../../testing/test-repository';
import { getTranslocoTestingModule } from '../../../../testing/transloco-testing';
import { Modals } from '../../../shared/ui/modal/modals';
import { SettingsButton } from './settings-button';

describe('SettingsButton', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoTestingModule()],
      providers: [...useTestRepository()],
    });
  });

  afterEach(() => TestBed.inject(Modals).closeAll());

  it('ouvre les paramètres dans une fenêtre, sans quitter l’écran', async () => {
    const fixture = TestBed.createComponent(SettingsButton);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.getAttribute('aria-label')).toBe('Ouvrir les paramètres');

    button.click();
    TestBed.tick();

    const dialog = document.querySelector('app-settings-dialog') as HTMLElement;
    expect(dialog.querySelector('.modal__title')?.textContent).toContain('Paramètres');
    expect(dialog.querySelector('[role="radiogroup"]')).not.toBeNull();
    expect(TestBed.inject(Modals).isOpen()).toBe(true);
    // Sans projet : pas de section Projet.
    expect(dialog.querySelector('app-project-image')).toBeNull();
  });

  it('montre la section Projet quand un projet est ouvert (5.3)', async () => {
    const fixture = TestBed.createComponent(SettingsButton);
    fixture.componentRef.setInput('projectId', 'p1');
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    TestBed.tick();

    const dialog = document.querySelector('app-settings-dialog') as HTMLElement;
    expect(dialog.querySelector('app-project-image #settings-project')).not.toBeNull();
  });
});
