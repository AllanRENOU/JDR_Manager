import { DOCUMENT, Service, computed, effect, inject, signal } from '@angular/core';
import { UiPreferences } from '../preferences/ui-preferences';

/** Identifiant d'un thème : valeur de l'attribut `data-theme` et nom du fichier `styles/themes/_<id>.scss`. */
export type ThemeId = 'nuit-doree' | 'automne';

export interface ThemeDefinition {
  id: ThemeId;
  /** Clé de traduction du nom affiché. */
  labelKey: string;
}

/**
 * Thèmes disponibles (TEC-17, Brief UI/UX §11). Le premier est le thème par défaut.
 * Ajouter un thème : créer son fichier SCSS, l'inclure dans `styles.scss`, le déclarer ici et
 * traduire son nom (`settings.themes.*`). `npm run check:themes` vérifie ces branchements ;
 * les écrans (Paramètres › Apparence) n'ont pas à être modifiés.
 */
export const THEMES: readonly ThemeDefinition[] = [
  { id: 'nuit-doree', labelKey: 'settings.themes.nuitDoree' },
  { id: 'automne', labelKey: 'settings.themes.automne' },
];

export const DEFAULT_THEME: ThemeId = THEMES[0].id;

/** Clé de préférence. Doit rester identique au script de `index.html`. */
export const THEME_PREFERENCE_KEY = 'theme';

/**
 * Thème de l'application (TEC-16) : applique `data-theme` sur `<html>` et mémorise le choix.
 * Le script de `index.html` applique déjà le thème mémorisé avant le chargement d'Angular.
 */
@Service()
export class Theme {
  private readonly document = inject(DOCUMENT);
  private readonly preferences = inject(UiPreferences);

  private readonly current = signal<ThemeId>(this.readStoredTheme());

  /** Thème actif. */
  readonly theme = this.current.asReadonly();

  /** Définition du thème actif. */
  readonly definition = computed(() => THEMES.find((t) => t.id === this.current()) ?? THEMES[0]);

  /** Liste des thèmes proposés au MJ. */
  readonly themes = THEMES;

  constructor() {
    effect(() => {
      this.document.documentElement.setAttribute('data-theme', this.current());
    });
  }

  /** Change le thème immédiatement et mémorise le choix. Un identifiant inconnu est ignoré. */
  setTheme(id: ThemeId): void {
    if (!isThemeId(id)) {
      return;
    }
    this.current.set(id);
    this.preferences.set(THEME_PREFERENCE_KEY, id);
  }

  private readStoredTheme(): ThemeId {
    const stored = this.preferences.get<unknown>(THEME_PREFERENCE_KEY, DEFAULT_THEME);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  }
}

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}
