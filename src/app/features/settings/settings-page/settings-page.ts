import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideArrowLeft } from '@lucide/angular';

import { AppHeader } from '../../../shared/ui/app-header/app-header';
import { Button } from '../../../shared/ui/button/button';
import { SettingsContent } from '../settings-content/settings-content';

/** Paramètres de l'application, ouverts depuis l'en-tête de l'accueil (NF-33, Brief §11.1). */
@Component({
  selector: 'app-settings-page',
  imports: [AppHeader, Button, SettingsContent, RouterLink, TranslocoPipe, LucideArrowLeft],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {}
