import { CdkMenuTrigger } from '@angular/cdk/menu';
import { DatePipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideEllipsis, LucidePencil, LucidePlay, LucideTrash2 } from '@lucide/angular';

import { pluralKey } from '../../../core/i18n/plural';
import { MediaUrls } from '../../../core/media/media-urls';
import { Button } from '../../../shared/ui/button/button';
import { Menu } from '../../../shared/ui/menu/menu';
import { MenuItem } from '../../../shared/ui/menu/menu-item';
import { Pill } from '../../../shared/ui/pill/pill';
import { Placeholder } from '../../../shared/ui/placeholder/placeholder';
import { ProjectSummary } from '../project-summary';

/** Carte d'un projet sur l'accueil (Brief §6.4, PRJ-01). */
@Component({
  selector: 'app-project-card',
  imports: [
    Button,
    CdkMenuTrigger,
    Menu,
    MenuItem,
    Pill,
    Placeholder,
    RouterLink,
    DatePipe,
    TranslocoPipe,
    LucideEllipsis,
    LucidePencil,
    LucidePlay,
    LucideTrash2,
  ],
  templateUrl: './project-card.html',
  styleUrl: './project-card.scss',
})
export class ProjectCard {
  readonly summary = input.required<ProjectSummary>();
  /** Variante du visuel de remplacement, pour varier les cartes. */
  readonly alt = input(false);

  /** Menu « ⋯ » › Renommer. */
  readonly rename = output<void>();
  /** Menu « ⋯ » › Supprimer (la confirmation est demandée par la page). */
  readonly remove = output<void>();

  protected readonly thumbnail = inject(MediaUrls).track(() => this.summary().thumbnailMediaId);
  protected readonly pluralKey = pluralKey;
}
