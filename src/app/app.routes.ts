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
    path: 'sounds',
    loadComponent: () =>
      import('./features/sound-library/sound-library-page/sound-library-page').then(
        (m) => m.SoundLibraryPage,
      ),
  },
  {
    path: 'projects/:projectId/edit',
    loadComponent: () =>
      import('./features/editor/editor-page/editor-page').then((m) => m.EditorPage),
  },
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
  // Page temporaire du lot 1 (démonstration des thèmes) : à supprimer avec la page.
  {
    path: 'dev/themes',
    loadComponent: () =>
      import('./features/dev/theme-demo-page/theme-demo-page').then((m) => m.ThemeDemoPage),
  },
  { path: '**', redirectTo: 'projects' },
];
