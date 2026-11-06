import { DOCUMENT, Service, inject } from '@angular/core';

/** Délai au-delà duquel on renonce à lire la durée (fichier illisible, navigateur muet). */
export const AUDIO_DURATION_TIMEOUT = 10_000;

/**
 * Lit la durée d'un fichier son avant son import (SON-03, avancement 6.7) : un élément `<audio>`
 * charge seulement les métadonnées du fichier (`preload="metadata"`), sans le jouer.
 */
@Service()
export class AudioDuration {
  private readonly document = inject(DOCUMENT);

  /**
   * @returns la durée en millisecondes, ou `null` si elle n'a pas pu être lue (format illisible
   * par le navigateur, durée inconnue, délai dépassé). Ne rejette jamais.
   */
  read(file: Blob): Promise<number | null> {
    const url = URL.createObjectURL(file);
    const audio = this.document.createElement('audio');
    audio.preload = 'metadata';

    return new Promise<number | null>((resolve) => {
      const done = (value: number | null) => {
        clearTimeout(timer);
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('error', onError);
        audio.removeAttribute('src');
        URL.revokeObjectURL(url);
        resolve(value);
      };
      const onLoaded = () =>
        done(
          Number.isFinite(audio.duration) && audio.duration >= 0
            ? Math.round(audio.duration * 1000)
            : null,
        );
      const onError = () => done(null);
      const timer = setTimeout(() => done(null), AUDIO_DURATION_TIMEOUT);

      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('error', onError);
      audio.src = url;
    });
  }
}
