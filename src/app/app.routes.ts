import { Routes } from '@angular/router';

/** Routes de l'application (TRD §2.3). Chaque écran est chargé à la demande (TEC-10). */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'projects' },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/projects/projects-page/projects-page').then((m) => m.ProjectsPage),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings-page/settings-page').then((m) => m.SettingsPage),
  },
  {
    path: 'library',
    loadComponent: () =>
      import('./features/library/library-page/library-page').then((m) => m.LibraryPage),
  },
  // Anciennes adresses de la bibliothèque de sons (avant le lot 12 ter : favoris, historique).
  { path: 'sounds', redirectTo: 'library' },
  {
    path: 'projects/:projectId/edit',
    loadComponent: () =>
      import('./features/editor/editor-page/editor-page').then((m) => m.EditorPage),
  },
  {
    path: 'projects/:projectId/library',
    loadComponent: () =>
      import('./features/library/library-page/library-page').then((m) => m.LibraryPage),
  },
  { path: 'projects/:projectId/sounds', redirectTo: 'projects/:projectId/library' },
  {
    path: 'projects/:projectId/play',
    loadComponent: () =>
      import('./features/presentation/gm-screen/gm-screen-page/gm-screen-page').then(
        (m) => m.GmScreenPage,
      ),
  },
  {
    path: 'projects/:projectId/player',
    loadComponent: () =>
      import('./features/presentation/player-screen/player-screen-page/player-screen-page').then(
        (m) => m.PlayerScreenPage,
      ),
  },
  // Pages temporaires de démonstration (lots 1 et 3) : à supprimer avec les pages.
  {
    path: 'dev/themes',
    loadComponent: () =>
      import('./features/dev/theme-demo-page/theme-demo-page').then((m) => m.ThemeDemoPage),
  },
  {
    path: 'dev/components',
    loadComponent: () =>
      import('./features/dev/components-demo-page/components-demo-page').then(
        (m) => m.ComponentsDemoPage,
      ),
  },
  { path: '**', redirectTo: 'projects' },
];
