import { DOCUMENT, Service, inject } from '@angular/core';

/** Délai au-delà duquel on renonce à lire la durée (fichier illisible, navigateur muet). */
export const MEDIA_DURATION_TIMEOUT = 10_000;

/**
 * Lit la durée d'un son ou d'une vidéo avant son import (SON-03, VID-01, TEC-36) : un élément
 * `<audio>` (son) ou `<video>` (vidéo, d'après le type MIME du fichier) charge seulement les
 * métadonnées (`preload="metadata"`), sans lire le fichier en entier ni le jouer.
 */
@Service()
export class MediaDuration {
  private readonly document = inject(DOCUMENT);

  /**
   * @returns la durée en millisecondes, ou `null` si elle n'a pas pu être lue (format illisible
   * par le navigateur, durée inconnue, délai dépassé). Ne rejette jamais.
   */
  read(file: Blob): Promise<number | null> {
    const url = URL.createObjectURL(file);
    const media = this.document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');
    media.preload = 'metadata';

    return new Promise<number | null>((resolve) => {
      const done = (value: number | null) => {
        clearTimeout(timer);
        media.removeEventListener('loadedmetadata', onLoaded);
        media.removeEventListener('error', onError);
        media.removeAttribute('src');
        URL.revokeObjectURL(url);
        resolve(value);
      };
      const onLoaded = () =>
        done(
          Number.isFinite(media.duration) && media.duration >= 0
            ? Math.round(media.duration * 1000)
            : null,
        );
      const onError = () => done(null);
      const timer = setTimeout(() => done(null), MEDIA_DURATION_TIMEOUT);

      media.addEventListener('loadedmetadata', onLoaded);
      media.addEventListener('error', onError);
      media.src = url;
    });
  }
}
