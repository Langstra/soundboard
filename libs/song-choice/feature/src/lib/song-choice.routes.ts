import { Route } from '@angular/router';
import { playerGuard } from './player.guard';

export const personalLinkRoutes: Route[] = [
  {
    path: ':token',
    title: 'Persoonlijke link – Soundboard',
    loadComponent: () => import('./personal-link-page/personal-link-page').then((module) => module.PersonalLinkPage),
  },
];

export const playerRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [playerGuard],
    title: 'Mijn nummer – Soundboard',
    loadComponent: () => import('./song-choice-page/song-choice-page').then((module) => module.SongChoicePage),
  },
  {
    path: 'inloggen',
    title: 'Inloggen – Soundboard',
    loadComponent: () => import('./player-sign-in/player-sign-in').then((module) => module.PlayerSignIn),
  },
];
