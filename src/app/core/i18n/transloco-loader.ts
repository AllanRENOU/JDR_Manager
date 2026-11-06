import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

/**
 * Charge les fichiers de traduction depuis `public/i18n/<langue>.json` (TEC-61).
 * Chemin relatif : l'application fonctionne aussi si elle est servie dans un sous-dossier.
 */
@Service()
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`i18n/${lang}.json`);
  }
}
