import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideLucideConfig } from '@lucide/angular';
import { provideTransloco } from '@jsverse/transloco';

import { routes } from './app.routes';
import { DATA_REPOSITORY } from './core/data/data-repository';
import { IndexedDbRepository } from './core/data/indexed-db-repository';
import { StoragePersistence } from './core/data/storage-persistence';
import { provideFrenchLocale } from './core/i18n/locale';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Paramètres de route (ex. :projectId) reçus comme inputs des écrans.
    provideRouter(routes, withComponentInputBinding()),
    // Dates et nombres au format français.
    provideFrenchLocale(),
    provideHttpClient(),
    // Couche de données (TEC-22) : seul endroit où l'implémentation est choisie.
    // Pour passer à l'API : remplacer IndexedDbRepository par l'implémentation API.
    { provide: DATA_REPOSITORY, useExisting: IndexedDbRepository },
    // Stockage persistant (TEC-26) : demande lancée au démarrage sans bloquer l'affichage.
    provideAppInitializer(() => {
      void inject(StoragePersistence).request();
    }),
    // i18n (TEC-61) : français seul en V1, toutes les chaînes passent par des clés.
    provideTransloco({
      config: {
        availableLangs: ['fr'],
        defaultLang: 'fr',
        fallbackLang: 'fr',
        reRenderOnLangChange: true,
        missingHandler: { logMissingKey: isDevMode() },
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    // Icônes (Brief UI/UX §5) : trait fin, taille par défaut 16 px, couleur héritée.
    provideLucideConfig({ strokeWidth: 1.75, size: 16 }),
  ],
};
