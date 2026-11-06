import { Component, input } from '@angular/core';

/**
 * En-tête d'écran (Brief §7.1) : zone de gauche (logo ou retour), titre / fil d'Ariane, actions
 * à droite. 64 px en Édition et à l'accueil, 60 px en Présentation (`variant="play"`).
 *
 * ```html
 * <app-header>
 *   <a headerStart …>Retour</a>
 *   <h1>La crypte</h1>
 *   <button headerEnd appButton>Présenter</button>
 * </app-header>
 * ```
 */
@Component({
  selector: 'app-header',
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  host: { role: 'banner', '[class.app-header--play]': 'variant() === "play"' },
})
export class AppHeader {
  readonly variant = input<'default' | 'play'>('default');
}
