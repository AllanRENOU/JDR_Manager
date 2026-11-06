import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideLucideConfig } from '@lucide/angular';
import { provideTransloco } from '@jsverse/transloco';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
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
