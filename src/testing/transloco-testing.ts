import { TranslocoTestingModule, TranslocoTestingOptions } from '@jsverse/transloco';

import fr from '../../public/i18n/fr.json';

/**
 * Transloco pour les tests unitaires : traductions françaises chargées de façon synchrone,
 * sans requête HTTP.
 */
export function getTranslocoTestingModule(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: { fr },
    translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
    preloadLangs: true,
    ...options,
  });
}
