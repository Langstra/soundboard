import { Route } from '@angular/router';

export const songChoiceRoutes: Route[] = [
  {
    path: ':token',
    loadComponent: () => import('./song-choice-page/song-choice-page').then((module) => module.SongChoicePage),
  },
];
