import { CdkMenuTrigger } from '@angular/cdk/menu';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Component, inject, viewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideArrowRight, LucideChevronUp } from '@lucide/angular';

import { Button } from '../../../../shared/ui/button/button';
import { Menu } from '../../../../shared/ui/menu/menu';
import { MenuItem } from '../../../../shared/ui/menu/menu-item';
import { Notifications } from '../../../../shared/ui/notification-host/notifications';
import { PresentationEngine } from '../../engine/presentation-engine';

/**
 * Bouton flottant « Scène suivante » (CTL-04, Brief §6.11) : ouvre directement la seule scène
 * suivante, ou une liste au-dessus du bouton s'il y en a plusieurs. Masqué s'il n'y en a aucune.
 */
@Component({
  selector: 'app-next-scene-button',
  imports: [
    Button,
    CdkMenuTrigger,
    Menu,
    MenuItem,
    TranslocoPipe,
    LucideArrowRight,
    LucideChevronUp,
  ],
  templateUrl: './next-scene-button.html',
  styleUrl: './next-scene-button.scss',
})
export class NextSceneButton {
  protected readonly engine = inject(PresentationEngine);
  private readonly notifications = inject(Notifications);

  /** La liste s'ouvre au-dessus du bouton, alignée à droite. */
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
  ];

  private readonly menu = viewChild(CdkMenuTrigger);

  /** Raccourci « S » : ouvre la seule scène suivante, ou la liste s'il y en a plusieurs. */
  activate(): void {
    const next = this.engine.nextScenes();
    if (next.length === 1) {
      this.go(next[0].id);
    } else if (next.length > 1) {
      this.menu()?.open();
    }
  }

  protected go(sceneId: string): void {
    this.engine.openScene(sceneId).catch((error) => this.notifications.fromError(error));
  }
}
