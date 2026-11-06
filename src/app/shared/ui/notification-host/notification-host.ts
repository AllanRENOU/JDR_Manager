import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideX } from '@lucide/angular';

import { Alert } from '../alert/alert';
import { Button } from '../button/button';
import { Notifications } from './notifications';

/** Zone d'affichage des notifications, en bas à droite (à placer une fois, dans `app.html`). */
@Component({
  selector: 'app-notification-host',
  imports: [Alert, Button, TranslocoPipe, LucideX],
  templateUrl: './notification-host.html',
  styleUrl: './notification-host.scss',
})
export class NotificationHost {
  protected readonly notifications = inject(Notifications);
}
