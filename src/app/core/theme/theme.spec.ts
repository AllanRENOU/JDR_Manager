import { TestBed } from '@angular/core/testing';

import { UI_PREFERENCES_PREFIX } from '../preferences/ui-preferences';
import { DEFAULT_THEME, THEME_PREFERENCE_KEY, Theme, ThemeId, isThemeId } from './theme';

const STORAGE_KEY = UI_PREFERENCES_PREFIX + THEME_PREFERENCE_KEY;

describe('Theme', () => {
  function createService(): Theme {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(Theme);
    TestBed.tick();
    return service;
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => localStorage.clear());

  it('utilise Nuit dorée par défaut et l’applique sur <html>', () => {
    const service = createService();
    expect(service.theme()).toBe(DEFAULT_THEME);
    expect(DEFAULT_THEME).toBe('nuit-doree');
    expect(document.documentElement.getAttribute('data-theme')).toBe('nuit-doree');
  });

  it('change de thème, met à jour <html> et mémorise le choix', () => {
    const service = createService();
    service.setTheme('automne');
    TestBed.tick();

    expect(service.theme()).toBe('automne');
    expect(service.definition().labelKey).toBe('settings.themes.automne');
    expect(document.documentElement.getAttribute('data-theme')).toBe('automne');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('"automne"');
  });

  it('reprend le thème mémorisé au démarrage', () => {
    localStorage.setItem(STORAGE_KEY, '"automne"');
    expect(createService().theme()).toBe('automne');
  });

  it('ignore un thème mémorisé inconnu', () => {
    localStorage.setItem(STORAGE_KEY, '"inexistant"');
    expect(createService().theme()).toBe(DEFAULT_THEME);
  });

  it('ignore un identifiant inconnu passé à setTheme', () => {
    const service = createService();
    service.setTheme('inexistant' as ThemeId);
    expect(service.theme()).toBe(DEFAULT_THEME);
  });

  it('reconnaît les identifiants valides', () => {
    expect(isThemeId('automne')).toBe(true);
    expect(isThemeId('autre')).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
  });
});
