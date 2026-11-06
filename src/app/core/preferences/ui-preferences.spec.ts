import { TestBed } from '@angular/core/testing';

import { UI_PREFERENCES_PREFIX, UiPreferences } from './ui-preferences';

describe('UiPreferences', () => {
  let service: UiPreferences;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiPreferences);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renvoie la valeur par défaut si la préférence est absente', () => {
    expect(service.get('absente', 'défaut')).toBe('défaut');
  });

  it('enregistre en JSON sous une clé préfixée et relit la valeur', () => {
    expect(service.set('panneaux', { sons: true })).toBe(true);
    expect(localStorage.getItem(UI_PREFERENCES_PREFIX + 'panneaux')).toBe('{"sons":true}');
    expect(service.get('panneaux', {})).toEqual({ sons: true });
  });

  it('renvoie la valeur par défaut si la valeur stockée est illisible', () => {
    localStorage.setItem(UI_PREFERENCES_PREFIX + 'abime', '{pas du json');
    expect(service.get('abime', 42)).toBe(42);
  });

  it('supprime une préférence', () => {
    service.set('temp', 1);
    service.remove('temp');
    expect(service.get('temp', null)).toBeNull();
  });

  it('ne lève pas d’erreur si le stockage est indisponible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(service.get('theme', 'nuit-doree')).toBe('nuit-doree');
    expect(service.set('theme', 'automne')).toBe(false);
    expect(() => service.remove('theme')).not.toThrow();
  });
});
