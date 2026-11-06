import { Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucidePlay, LucideSquare } from '@lucide/angular';

/** Bouton rond de pré-écoute d'un son (maquette « Sons ») : ▶ au repos, ■ pendant la lecture. */
@Component({
  selector: 'app-listen-button',
  imports: [TranslocoPipe, LucidePlay, LucideSquare],
  templateUrl: './listen-button.html',
  styleUrl: './listen-button.scss',
  host: { '[class.playing]': 'playing()' },
})
export class ListenButton {
  /** Nom du son (libellé d'accessibilité). */
  readonly name = input.required<string>();
  readonly playing = input(false);
  readonly disabled = input(false);

  readonly toggled = output<void>();
}
