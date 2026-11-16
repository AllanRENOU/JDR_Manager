import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { Id } from '../../core/models';

/** Navigation du mode Édition d'un projet : Scènes / Fiches / Bibliothèque (Brief §7.1, §7.2). */
@Component({
  selector: 'app-project-nav',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
  templateUrl: './project-nav.html',
  styleUrl: './project-nav.scss',
})
export class ProjectNav {
  readonly projectId = input.required<Id>();
}
