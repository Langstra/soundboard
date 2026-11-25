import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'p',
    loadChildren: () => import('@soundboard/song-choice/feature').then((module) => module.personalLinkRoutes),
  },
  {
    path: 'speler',
    loadChildren: () => import('@soundboard/song-choice/feature').then((module) => module.playerRoutes),
  },
  {
    path: '',
    loadChildren: () => import('@soundboard/soundboard/feature').then((module) => module.soundboardRoutes),
  },
];
