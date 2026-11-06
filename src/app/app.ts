import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NotificationHost } from './shared/ui/notification-host/notification-host';

@Component({
  imports: [RouterOutlet, NotificationHost],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
