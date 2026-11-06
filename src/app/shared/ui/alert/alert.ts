import { Component, input } from '@angular/core';
import { LucideCircleExclamationPoint, LucideInfo } from '@lucide/angular';

/**
 * Message dans la page (Brief §6.14) : erreur (média manquant, format refusé…) aux couleurs
 * Danger, ou information neutre. Le texte dit quoi faire ; une action peut être projetée
 * avec l'attribut `alertAction`.
 */
@Component({
  selector: 'app-alert',
  imports: [LucideCircleExclamationPoint, LucideInfo],
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
  host: {
    '[class]': '"tone-" + tone()',
    '[attr.role]': 'tone() === "danger" ? "alert" : "status"',
  },
})
export class Alert {
  readonly tone = input<'danger' | 'info'>('danger');
}
