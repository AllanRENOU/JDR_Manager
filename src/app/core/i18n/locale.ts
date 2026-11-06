import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, Provider } from '@angular/core';

/** Dates et nombres au format français (pipes `date`, `number`…). */
export function provideFrenchLocale(): Provider {
  registerLocaleData(localeFr);
  return { provide: LOCALE_ID, useValue: 'fr' };
}
